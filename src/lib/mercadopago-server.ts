import type { CardGiftConfig } from "@/components/gift/CardGiftContext";
import { cardFeeRateFromEnv, cardMaxInstallmentsFromEnv, type CardFeePayer } from "@/lib/card-pricing";
import {
  MercadoPagoApiError,
  fetchPayment,
  mapPaymentStatus,
  refreshAccessToken,
  type MercadoPagoTokens,
  type MercadoPagoUser
} from "@/lib/mercadopago";
import { decryptSecret, encryptSecret } from "@/lib/secret-box";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CashGiftStatus, Database, MpConnectionStatus } from "@/lib/supabase/types";

/**
 * Conexão Mercado Pago do casal. mp_connections é service-role (RLS sem policy),
 * então tudo aqui passa pelo admin client — sempre depois de provar a posse do
 * casamento (getOwnedWeddingRow) ou a partir de um site já publicado.
 */
export type MpConnectionRow = Database["public"]["Tables"]["mp_connections"]["Row"];

/** Colunas sem segredo: os *_token_enc só são lidos no fluxo de cobrança. */
const SUMMARY_COLUMNS =
  "wedding_id, mp_user_id, status, fee_payer, live_mode, expires_at, mp_nickname, mp_email, last_error, connected_at";

const TOKEN_COLUMNS =
  "wedding_id, mp_user_id, access_token_enc, refresh_token_enc, expires_at, status, fee_payer, live_mode";

type TokenRow = Pick<
  MpConnectionRow,
  "wedding_id" | "mp_user_id" | "access_token_enc" | "refresh_token_enc" | "expires_at" | "status" | "fee_payer" | "live_mode"
>;

/** Renova quando falta menos de 7 dias (o cron diário cuida da janela de 30). */
const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** Janela do cron: renova tudo que vence nos próximos 30 dias. */
const CRON_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type MercadoPagoConnectionSummary = {
  status: MpConnectionStatus;
  feePayer: CardFeePayer;
  /** false = conexão feita com credenciais de teste do Mercado Pago. */
  liveMode: boolean;
  nickname: string | null;
  email: string | null;
  lastError: string | null;
  connectedAt: string;
};

export async function getMercadoPagoConnectionSummary(
  weddingId: string
): Promise<MercadoPagoConnectionSummary | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("mp_connections")
    .select(SUMMARY_COLUMNS)
    .eq("wedding_id", weddingId)
    .maybeSingle();

  if (!data) return null;

  return {
    status: data.status,
    feePayer: data.fee_payer,
    liveMode: data.live_mode,
    nickname: data.mp_nickname,
    email: data.mp_email,
    lastError: data.last_error,
    connectedAt: data.connected_at
  };
}

/**
 * Configuração do cartão para o site público. null = o cartão não aparece para o
 * convidado (plataforma sem credenciais, casal sem conexão ou conexão revogada).
 */
export async function getCardGiftConfig(weddingId: string): Promise<CardGiftConfig | null> {
  if (!process.env.MERCADOPAGO_CLIENT_ID || !process.env.MERCADOPAGO_CLIENT_SECRET) return null;

  const connection = await getMercadoPagoConnectionSummary(weddingId);
  if (!connection || connection.status !== "active") return null;

  return {
    feePayer: connection.feePayer,
    feeRate: cardFeeRateFromEnv(process.env.MERCADOPAGO_CARD_FEE_PERCENT),
    maxInstallments: cardMaxInstallmentsFromEnv(process.env.MERCADOPAGO_MAX_INSTALLMENTS),
    testMode: !connection.liveMode
  };
}

/** Grava (ou substitui) a conexão do casal. fee_payer não vai no payload de propósito:
 *  reconectar não pode apagar a escolha de quem paga a taxa. */
export async function saveMercadoPagoConnection({
  weddingId,
  tokens,
  user
}: {
  weddingId: string;
  tokens: MercadoPagoTokens;
  user: MercadoPagoUser | null;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("mp_connections").upsert(
    {
      wedding_id: weddingId,
      mp_user_id: String(tokens.user_id),
      access_token_enc: encryptSecret(tokens.access_token),
      refresh_token_enc: encryptSecret(tokens.refresh_token),
      public_key: tokens.public_key ?? null,
      scope: tokens.scope ?? null,
      live_mode: tokens.live_mode ?? true,
      expires_at: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000).toISOString(),
      mp_nickname: user?.nickname ?? null,
      mp_email: user?.email ?? null,
      status: "active",
      last_error: null,
      connected_at: new Date().toISOString()
    },
    { onConflict: "wedding_id" }
  );

  if (error) {
    console.error("mp_connections upsert falhou", error);
    throw new Error("Não foi possível salvar a conexão com o Mercado Pago.");
  }
}

/** Marca um problema na conexão para o casal ver no painel (não apaga a conexão). */
export async function flagConnectionError(weddingId: string, reason: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("mp_connections").update({ last_error: reason }).eq("wedding_id", weddingId);
}

async function loadTokenRow(where: { weddingId?: string; mpUserId?: string }): Promise<TokenRow | null> {
  const admin = createAdminClient();
  let query = admin.from("mp_connections").select(TOKEN_COLUMNS);
  query = where.weddingId ? query.eq("wedding_id", where.weddingId) : query.eq("mp_user_id", where.mpUserId ?? "");
  const { data } = await query.limit(1).maybeSingle();
  return data ?? null;
}

/**
 * Renova o par de tokens. O refresh_token do MP é de USO ÚNICO e vem trocado na
 * resposta: gravamos o novo par antes de devolver o access_token. Se duas
 * requisições renovarem ao mesmo tempo, a perdedora releia a linha em vez de
 * marcar a conexão como revogada por engano.
 */
async function refreshConnection(row: TokenRow): Promise<string> {
  const admin = createAdminClient();

  try {
    const tokens = await refreshAccessToken(decryptSecret(row.refresh_token_enc));

    const { error } = await admin
      .from("mp_connections")
      .update({
        access_token_enc: encryptSecret(tokens.access_token),
        refresh_token_enc: encryptSecret(tokens.refresh_token),
        expires_at: new Date(Date.now() + (tokens.expires_in ?? 0) * 1000).toISOString(),
        scope: tokens.scope ?? null,
        status: "active",
        last_error: null
      })
      .eq("wedding_id", row.wedding_id);

    if (error) {
      // O refresh_token antigo já morreu no MP: sem gravar o novo, a conexão cai.
      console.error("mp_connections: falha ao gravar token renovado", error);
      await admin
        .from("mp_connections")
        .update({ status: "error", last_error: "falha ao gravar o token renovado" })
        .eq("wedding_id", row.wedding_id);
      throw new Error("Não foi possível renovar o acesso ao Mercado Pago.");
    }

    return tokens.access_token;
  } catch (err) {
    if (err instanceof MercadoPagoApiError) {
      // Corrida: outra requisição pode ter renovado no meio. Relê antes de condenar.
      const fresh = await loadTokenRow({ weddingId: row.wedding_id });
      if (fresh && fresh.access_token_enc !== row.access_token_enc && fresh.status === "active") {
        return decryptSecret(fresh.access_token_enc);
      }

      await admin
        .from("mp_connections")
        .update({
          status: err.code === "invalid_grant" ? "revoked" : "error",
          last_error: err.code
        })
        .eq("wedding_id", row.wedding_id);
    }
    throw err;
  }
}

async function accessTokenFor(row: TokenRow): Promise<string> {
  const expiresAt = new Date(row.expires_at).getTime();
  if (Number.isFinite(expiresAt) && expiresAt - Date.now() > REFRESH_WINDOW_MS) {
    return decryptSecret(row.access_token_enc);
  }
  return refreshConnection(row);
}

export type ChargeContext = {
  weddingId: string;
  mpUserId: string;
  accessToken: string;
  feePayer: CardFeePayer;
  liveMode: boolean;
};

/** Contexto para criar a cobrança: token válido + preferências do casal. */
export async function getChargeContext(weddingId: string): Promise<ChargeContext | null> {
  const row = await loadTokenRow({ weddingId });
  if (!row || row.status !== "active") return null;

  return {
    weddingId: row.wedding_id,
    mpUserId: row.mp_user_id,
    accessToken: await accessTokenFor(row),
    feePayer: row.fee_payer,
    liveMode: row.live_mode
  };
}

export type SyncResult = {
  /** true quando o pagamento casou com um presente nosso e foi gravado. */
  matched: boolean;
  giftStatus?: CashGiftStatus;
  weddingId?: string;
};

/**
 * Fonte da verdade do presente no cartão: busca o pagamento NO MERCADO PAGO com o
 * token do casal e grava o resultado. O webhook e a volta do checkout chamam a
 * mesma função — nada é gravado a partir do que chega na requisição.
 */
export async function syncMercadoPagoPayment({
  paymentId,
  weddingId,
  mpUserId
}: {
  paymentId: string;
  weddingId?: string;
  mpUserId?: string;
}): Promise<SyncResult> {
  const row = await loadTokenRow(weddingId ? { weddingId } : { mpUserId });
  if (!row) return { matched: false };

  const accessToken = await accessTokenFor(row);
  const payment = await fetchPayment({ accessToken, paymentId });
  if (!payment) return { matched: false };

  // O pagamento precisa ser DESTA conta e ter a nossa referência externa.
  if (String(payment.collector_id ?? "") !== row.mp_user_id) return { matched: false };
  if (payment.live_mode === false && process.env.NODE_ENV === "production") return { matched: false };

  const reference = payment.external_reference ?? "";
  if (!reference) return { matched: false };

  const giftStatus = mapPaymentStatus(payment.status);
  if (!giftStatus) return { matched: false };

  const admin = createAdminClient();
  const { data: gift } = await admin
    .from("cash_gifts")
    .select("id, wedding_id, guest_name, message, gross_amount, gift_id, provider_payment_id")
    .eq("id", reference)
    .maybeSingle();

  if (!gift || gift.wedding_id !== row.wedding_id) return { matched: false };

  const paymentIdText = String(payment.id);
  const fields = {
    provider: "mercadopago",
    provider_payment_id: paymentIdText,
    provider_status: [payment.status, payment.status_detail].filter(Boolean).join("/"),
    charged_amount: payment.transaction_amount ?? null,
    net_amount: payment.transaction_details?.net_received_amount ?? null,
    installments: payment.installments ?? null,
    status: giftStatus,
    paid_at: giftStatus === "paid" ? (payment.date_approved ?? new Date().toISOString()) : null
  };

  // A mesma preferência pode receber um 2º pagamento: vira um presente separado.
  if (gift.provider_payment_id && gift.provider_payment_id !== paymentIdText) {
    const { error } = await admin.from("cash_gifts").insert({
      wedding_id: gift.wedding_id,
      guest_name: gift.guest_name,
      message: gift.message,
      gross_amount: gift.gross_amount,
      currency: "BRL",
      payment_method: "card",
      gift_id: gift.gift_id,
      ...fields
    });
    // 23505 = esse pagamento já virou presente (webhook repetido). Idempotente.
    if (error && error.code !== "23505") {
      console.error("cash_gifts insert (2º pagamento) falhou", error);
      throw new Error("Não foi possível registrar o presente no cartão.");
    }
    return { matched: true, giftStatus, weddingId: gift.wedding_id };
  }

  const { error } = await admin.from("cash_gifts").update(fields).eq("id", gift.id);
  if (error) {
    console.error("cash_gifts update falhou", error);
    throw new Error("Não foi possível registrar o presente no cartão.");
  }

  return { matched: true, giftStatus, weddingId: gift.wedding_id };
}

/** Cron diário: renova o que vence nos próximos 30 dias (token dura 180). */
export async function refreshExpiringConnections(): Promise<{ checked: number; refreshed: number; failed: number }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("mp_connections")
    .select(TOKEN_COLUMNS)
    .eq("status", "active")
    .lt("expires_at", new Date(Date.now() + CRON_WINDOW_MS).toISOString());

  const rows = (data ?? []) as TokenRow[];
  let refreshed = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await refreshConnection(row);
      refreshed += 1;
    } catch (err) {
      failed += 1;
      console.error(
        "mp_connections: renovação falhou",
        row.wedding_id,
        err instanceof MercadoPagoApiError ? err.code : "erro"
      );
    }
  }

  return { checked: rows.length, refreshed, failed };
}
