import { Icon } from "@/components/app/icons";
import { Notice } from "@/components/app/Notice";
import { StatusBadge } from "@/components/app/StatusBadge";
import { SupportBlockedButton, SupportBlockedNote } from "@/components/app/SupportBar";
import type { MercadoPagoConnectionSummary } from "@/lib/mercadopago-server";
import { disconnectMercadoPagoAction, setCardFeePayerAction } from "./mercadopago-actions";

type CardGiftsPanelProps = {
  /** false quando a plataforma ainda não tem credenciais do Mercado Pago no ambiente. */
  configured: boolean;
  connection: MercadoPagoConnectionSummary | null;
  /** Modo suporte: conectar, desconectar e mudar a taxa ficam só com o casal. */
  blocked?: boolean;
};

/**
 * "Receber presentes no cartão": o casal conecta a PRÓPRIA conta Mercado Pago por
 * OAuth (um login e um "Autorizar" — nada de chave ou token), e o dinheiro do cartão
 * cai direto na conta dele. O Pix segue igual, 0% de taxa.
 */
export function CardGiftsPanel({ configured, connection, blocked = false }: CardGiftsPanelProps) {
  if (!configured) return null;

  const connected = connection?.status === "active";
  const account = connection?.nickname || connection?.email;

  return (
    <section id="cartao" className={`panel p-5 ${blocked ? "scroll-mt-28" : "scroll-mt-20"}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-forest/8 text-forest">
          <Icon name="card" size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold">Presentes no cartão</h3>
            {connected ? <StatusBadge status="connected" /> : null}
          </div>
          <p className="mt-1 text-sm leading-5 text-ink-soft">
            Convidados presenteiam em até 12x e o dinheiro cai direto na sua conta do Mercado Pago. A Noivar não fica
            com nada.
          </p>
        </div>
      </div>

      {connected ? (
        <div className="mt-5 grid gap-4">
          <p className="text-sm text-ink">
            Conectado{account ? <> como <strong className="font-semibold">{account}</strong></> : null}.
            {connection?.liveMode === false ? " Conta de teste: nenhuma cobrança é real." : ""}
          </p>

          {connection?.lastError ? <Notice tone="warn">Atenção: {connection.lastError}.</Notice> : null}

          <form action={blocked ? undefined : setCardFeePayerAction} className="grid gap-3">
            <fieldset disabled={blocked} className="grid gap-2 disabled:opacity-70">
              <legend className="mb-2 text-sm font-semibold text-ink">Quem paga a taxa do cartão?</legend>
              {[
                {
                  value: "guest",
                  title: "O convidado",
                  text: "A taxa soma no total dele e vocês recebem 100% do presente.",
                  checked: connection?.feePayer !== "couple"
                },
                {
                  value: "couple",
                  title: "Nós",
                  text: "A taxa do Mercado Pago sai do valor recebido.",
                  checked: connection?.feePayer === "couple"
                }
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-field p-3 transition-colors duration-150 hover:border-line-strong has-checked:border-forest has-checked:shadow-[0_0_0_1px_var(--color-forest)]"
                >
                  <input
                    type="radio"
                    name="feePayer"
                    value={option.value}
                    defaultChecked={option.checked}
                    className="mt-0.5 size-4 accent-forest"
                  />
                  <span className="grid gap-0.5">
                    <span className="text-sm font-semibold text-ink">{option.title}</span>
                    <span className="text-[0.8125rem] leading-5 text-ink-soft">{option.text}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <details className="group text-[0.8125rem] leading-5 text-ink-soft">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-semibold text-ink hover:underline">
                E o parcelamento?
                <Icon name="chevronDown" size={14} className="transition-transform duration-150 group-open:rotate-180" />
              </summary>
              <p className="mt-2">
                A escolha acima vale com o parcelamento no modo padrão do Mercado Pago, em que os juros das parcelas são
                pagos pelo convidado. Se vocês ativarem o parcelamento sem juros na conta de vocês, esses juros passam a
                sair do valor recebido.
              </p>
            </details>
            <div className="flex flex-wrap items-center gap-2">
              {blocked ? (
                <SupportBlockedButton className="btn btn-sm btn-secondary">Salvar escolha</SupportBlockedButton>
              ) : (
                <button type="submit" className="btn btn-sm btn-secondary">
                  Salvar escolha
                </button>
              )}
            </div>
          </form>

          {blocked ? (
            <div className="grid gap-2 border-t border-line pt-3">
              <SupportBlockedButton className="btn btn-sm btn-ghost -ml-3 justify-self-start text-danger">
                Desconectar o Mercado Pago
              </SupportBlockedButton>
              <SupportBlockedNote />
            </div>
          ) : (
            <form action={disconnectMercadoPagoAction} className="border-t border-line pt-3">
              <button type="submit" className="btn btn-sm btn-ghost -ml-3 text-danger">
                Desconectar o Mercado Pago
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {connection ? (
            <Notice tone="error">A conexão com o Mercado Pago caiu. Conecte de novo para voltar a aceitar cartão.</Notice>
          ) : null}
          <ol className="grid gap-2.5">
            {[
              "Clique em conectar: você vai para a página do Mercado Pago.",
              "Entre na sua conta. Quem compra no Mercado Livre já tem uma.",
              "Toque em “Autorizar” e volte para cá com o cartão ativo."
            ].map((text, index) => (
              <li key={text} className="flex items-start gap-3 text-sm leading-5 text-ink">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line-strong text-xs font-semibold text-ink-soft">
                  {index + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
          {blocked ? (
            <div className="grid justify-items-start gap-2">
              <SupportBlockedButton className="btn btn-sm btn-primary">Conectar Mercado Pago</SupportBlockedButton>
              <SupportBlockedNote />
            </div>
          ) : (
            <div>
              <a href="/api/mercadopago/oauth/start" className="btn btn-sm btn-primary">
                Conectar Mercado Pago
              </a>
            </div>
          )}
          <p className="text-[0.8125rem] leading-5 text-ink-soft">
            É opcional: sem conectar, o site segue recebendo por Pix, com 0% de taxa. Se sua conta do Mercado Pago ainda
            não tiver a identidade confirmada, faça isso no app dele antes.
          </p>
        </div>
      )}
    </section>
  );
}
