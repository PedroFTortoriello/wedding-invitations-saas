import crypto from "node:crypto";
import type { CashGiftStatus } from "@/lib/supabase/types";

/**
 * Cliente do Mercado Pago para presentes no cartão (modelo marketplace "Split 1:1").
 *
 * Regra de ouro: a cobrança é criada com o ACCESS TOKEN DO CASAL, obtido por OAuth.
 * O casal é o recebedor (collector), o dinheiro cai na conta dele e a plataforma
 * nunca custodia valor — o que evita o enquadramento como subcredenciador. Não
 * enviamos marketplace_fee: a Noivar fica com 0% dos presentes.
 */
const MP_API_BASE = "https://api.mercadopago.com";
/** Host de autorização é .com (sem .br) — o .com.br não existe na doc do MP. */
const MP_AUTH_BASE = "https://auth.mercadopago.com";

/** Caminho fixo do callback: precisa bater EXATAMENTE com a Redirect URI da aplicação. */
export const MP_OAUTH_CALLBACK_PATH = "/api/mercadopago/oauth/callback";

/** Cookie de ida-e-volta do OAuth: state (anti-CSRF), casamento e verifier do PKCE. */
export const MP_OAUTH_COOKIE = "mp_oauth";

/** Até 13 caracteres (limite do MP) — é o que aparece na fatura do convidado. */
const STATEMENT_DESCRIPTOR = "NOIVAR";

export type MercadoPagoConfig = {
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
};

/** Erro da API do MP com o código original, para a rota traduzir em pt-BR. */
export class MercadoPagoApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "MercadoPagoApiError";
    this.status = status;
    this.code = code;
  }
}

/** true quando a plataforma tem credenciais — sem isso o cartão nem é oferecido. */
export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_CLIENT_ID && process.env.MERCADOPAGO_CLIENT_SECRET);
}

/** Lê a config na hora do uso (nunca no topo do módulo: quebra o stub nos testes). */
export function getMercadoPagoConfig(): MercadoPagoConfig {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Mercado Pago não configurado: defina MERCADOPAGO_CLIENT_ID e MERCADOPAGO_CLIENT_SECRET no .env."
    );
  }

  return { clientId, clientSecret, webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "" };
}

/** URL pública da aplicação, sem barra no fim (o redirect_uri precisa ser exato). */
export function getAppUrl(): string {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new Error("APP_URL não definida: o Mercado Pago exige um redirect_uri fixo e público.");
  }
  return appUrl.replace(/\/+$/, "");
}

export function getOAuthRedirectUri(): string {
  return `${getAppUrl()}${MP_OAUTH_CALLBACK_PATH}`;
}

/**
 * PKCE só é enviado quando ligado na aplicação do MP (Detalhes da aplicação →
 * fluxo authorization code com PKCE). Com a opção ligada lá, o MP passa a EXIGIR
 * code_challenge; desligada, mandar o parâmetro é inócuo mas não documentado —
 * por isso a flag, para os dois lados combinarem.
 */
export function isPkceEnabled(): boolean {
  return ["1", "true", "on"].includes((process.env.MERCADOPAGO_PKCE ?? "").trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// PKCE (RFC 7636) — protege a troca do code caso ele vaze no caminho de volta.
// ---------------------------------------------------------------------------
export type PkcePair = { verifier: string; challenge: string };

export function createPkcePair(): PkcePair {
  const verifier = crypto.randomBytes(48).toString("base64url"); // 64 chars, dentro de 43–128
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** Valor aleatório para o parâmetro `state` (anti-CSRF no callback). */
export function createOAuthState(): string {
  return crypto.randomBytes(24).toString("base64url");
}

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------
export type MercadoPagoTokens = {
  access_token: string;
  token_type: string;
  /** Segundos até expirar — 15552000 (180 dias) hoje. */
  expires_in: number;
  /** Precisa conter "offline_access", senão a renovação não funciona. */
  scope: string;
  user_id: number;
  refresh_token: string;
  public_key: string;
  live_mode: boolean;
};

export function buildAuthorizationUrl({ state, codeChallenge }: { state: string; codeChallenge?: string }): string {
  const { clientId } = getMercadoPagoConfig();
  const url = new URL(`${MP_AUTH_BASE}/authorization`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("state", state);
  // Dados extras vão no `state`: o MP exige redirect_uri idêntico ao cadastrado.
  url.searchParams.set("redirect_uri", getOAuthRedirectUri());
  if (codeChallenge) {
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url.toString();
}

async function postOAuthToken(body: Record<string, string>): Promise<MercadoPagoTokens> {
  const response = await fetch(`${MP_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body)
  });

  const json = (await response.json().catch(() => null)) as (Partial<MercadoPagoTokens> & { error?: string }) | null;

  if (!response.ok || !json?.access_token || !json.refresh_token) {
    // Nunca logar o corpo: ele carrega tokens. Só o código do erro.
    const code = typeof json?.error === "string" ? json.error : `http_${response.status}`;
    throw new MercadoPagoApiError(`Mercado Pago recusou a autorização (${code}).`, response.status, code);
  }

  return json as MercadoPagoTokens;
}

/** Troca o `code` do callback pelos tokens do casal. O code vale 10 minutos. */
export function exchangeOAuthCode({ code, codeVerifier }: { code: string; codeVerifier?: string }) {
  const { clientId, clientSecret } = getMercadoPagoConfig();
  return postOAuthToken({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: getOAuthRedirectUri(),
    ...(codeVerifier ? { code_verifier: codeVerifier } : {})
  });
}

/**
 * Renova o access_token. ATENÇÃO: o refresh_token é de uso único e vem trocado na
 * resposta — quem chamar PRECISA gravar o novo par, ou o casal é desconectado.
 */
export function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getMercadoPagoConfig();
  return postOAuthToken({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken
  });
}

export type MercadoPagoUser = {
  id: number;
  nickname?: string | null;
  email?: string | null;
  site_id?: string | null;
};

/** Dados da conta conectada — usados só para mostrar "conectado como ..." no painel. */
export async function fetchMercadoPagoUser(accessToken: string): Promise<MercadoPagoUser | null> {
  const response = await fetch(`${MP_API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as MercadoPagoUser | null;
}

// ---------------------------------------------------------------------------
// Checkout Pro — preferência criada com o token do CASAL
// ---------------------------------------------------------------------------
export type GiftPreferenceInput = {
  accessToken: string;
  /** id da cota no site (content.gifts[].id) — vira items[0].id. */
  giftId?: string;
  title: string;
  description?: string;
  /** Total cobrado do convidado (presente + taxa, quando o convidado paga a taxa). */
  amount: number;
  /** cash_gifts.id — máximo 64 chars, só [A-Za-z0-9_-]. É o identificador confiável. */
  externalReference: string;
  notificationUrl: string;
  backUrl: string;
  maxInstallments: number;
  metadata?: Record<string, string | number>;
};

export type GiftPreference = { id: string; initPoint: string };

export async function createGiftPreference(input: GiftPreferenceInput): Promise<GiftPreference> {
  const response = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`
    },
    body: JSON.stringify({
      items: [
        {
          id: input.giftId ?? "presente",
          title: input.title.slice(0, 250),
          description: input.description?.slice(0, 250),
          category_id: "others",
          quantity: 1,
          currency_id: "BRL",
          unit_price: input.amount
        }
      ],
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      back_urls: { success: input.backUrl, pending: input.backUrl, failure: input.backUrl },
      // "all": o convidado volta para o site em qualquer desfecho, não só aprovado.
      auto_return: "all",
      payment_methods: {
        // Pix (bank_transfer) e boleto (ticket) ficam de fora: o Pix do site é o
        // estático, 0% de taxa. account_money não pode ser excluído pelo MP.
        excluded_payment_types: [{ id: "ticket" }, { id: "bank_transfer" }],
        installments: input.maxInstallments
      },
      statement_descriptor: STATEMENT_DESCRIPTOR,
      metadata: input.metadata
    })
  });

  const json = (await response.json().catch(() => null)) as
    | { id?: string; init_point?: string; error?: string; message?: string; cause?: { code?: string }[] }
    | null;

  if (!response.ok || !json?.id || !json.init_point) {
    const code = json?.error || json?.cause?.[0]?.code || `http_${response.status}`;
    console.error("Mercado Pago: preferência recusada", response.status, code);
    throw new MercadoPagoApiError(json?.message || "Mercado Pago recusou a cobrança.", response.status, String(code));
  }

  return { id: json.id, initPoint: json.init_point };
}

// ---------------------------------------------------------------------------
// Pagamento
// ---------------------------------------------------------------------------
export type MercadoPagoPayment = {
  id: number;
  status: string;
  status_detail?: string | null;
  transaction_amount?: number | null;
  transaction_details?: { net_received_amount?: number | null; total_paid_amount?: number | null } | null;
  installments?: number | null;
  external_reference?: string | null;
  collector_id?: number | null;
  date_approved?: string | null;
  live_mode?: boolean;
  payment_type_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

/** Busca o pagamento COM O TOKEN DO CASAL — é o recurso dele. null = não encontrado. */
export async function fetchPayment({
  accessToken,
  paymentId
}: {
  accessToken: string;
  paymentId: string;
}): Promise<MercadoPagoPayment | null> {
  const response = await fetch(`${MP_API_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new MercadoPagoApiError(
      "Não foi possível consultar o pagamento no Mercado Pago.",
      response.status,
      `http_${response.status}`
    );
  }

  return (await response.json().catch(() => null)) as MercadoPagoPayment | null;
}

// ---------------------------------------------------------------------------
// Webhook — assinatura x-signature
// ---------------------------------------------------------------------------
/**
 * Valida o header `x-signature` (formato "ts=...,v1=<hex>"). O HMAC-SHA256 é
 * calculado sobre o manifesto "id:<data.id>;request-id:<x-request-id>;ts:<ts>;",
 * com a "assinatura secreta" da aplicação (MERCADOPAGO_WEBHOOK_SECRET). Partes
 * ausentes somem do manifesto; id alfanumérico entra em minúsculas.
 * Falha FECHADA: sem segredo ou sem header, não valida.
 */
export function isMercadoPagoSignatureValid({
  signatureHeader,
  requestId,
  dataId,
  secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
}: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
  secret?: string;
}): boolean {
  if (!secret || !signatureHeader) return false;

  const parts = new Map<string, string>();
  for (const piece of signatureHeader.split(",")) {
    const [key, value] = piece.split("=", 2);
    if (key && value) parts.set(key.trim(), value.trim());
  }

  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1) return false;

  const manifest =
    (dataId ? `id:${/^\d+$/.test(dataId) ? dataId : dataId.toLowerCase()};` : "") +
    (requestId ? `request-id:${requestId};` : "") +
    `ts:${ts};`;

  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return timingSafeEqualHex(expected, v1);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length === 0 || ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// ---------------------------------------------------------------------------
// Status do pagamento -> status do presente
// ---------------------------------------------------------------------------
/**
 * Traduz o status do pagamento do MP para o nosso enum. null = status desconhecido
 * (a rota ignora e responde 200, sem inventar estado).
 */
export function mapPaymentStatus(status: string): CashGiftStatus | null {
  switch (status) {
    case "approved":
      return "paid";
    case "pending":
    case "in_process":
    case "in_mediation":
    case "authorized":
      return "pending";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "rejected":
    case "cancelled":
      return "failed";
    default:
      return null;
  }
}

export { MP_API_BASE, MP_AUTH_BASE };
