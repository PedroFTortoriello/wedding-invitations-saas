import { StatusBadge } from "@/components/app/StatusBadge";
import type { MercadoPagoConnectionSummary } from "@/lib/mercadopago-server";
import { disconnectMercadoPagoAction, setCardFeePayerAction } from "./mercadopago-actions";

type CardGiftsPanelProps = {
  /** false quando a plataforma ainda não tem credenciais do Mercado Pago no ambiente. */
  configured: boolean;
  connection: MercadoPagoConnectionSummary | null;
};

/**
 * "Receber presentes no cartão": o casal conecta a PRÓPRIA conta Mercado Pago por
 * OAuth (um login e um "Autorizar" — nada de chave ou token), e o dinheiro do cartão
 * cai direto na conta dele. O Pix segue igual, 0% de taxa.
 */
export function CardGiftsPanel({ configured, connection }: CardGiftsPanelProps) {
  if (!configured) return null;

  const connected = connection?.status === "active";
  const account = connection?.nickname || connection?.email;

  return (
    <section id="cartao" className="mt-6">
      <article className="card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="t-eyebrow text-ink-soft">Cartão de crédito</p>
            <h2 className="mt-3 t-h1">Receber presentes no cartão</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              Além do Pix, seus convidados podem presentear no cartão, em até 12x. O dinheiro cai direto na sua
              conta do Mercado Pago — a Noivar não fica com nada e não encosta no valor.
            </p>
          </div>
          {connected ? <StatusBadge status="connected" /> : null}
        </div>

        {connected ? (
          <div className="mt-6 grid gap-4">
            <p className="text-sm leading-6 text-ink">
              Conectado{account ? ` como ${account}` : ""}.{" "}
              {connection?.liveMode === false ? "Conta de teste: nenhuma cobrança é real." : ""}
            </p>

            {connection?.lastError ? (
              <p role="alert" className="rounded-2xl bg-[#c79a3f]/22 px-4 py-3 text-sm font-bold text-[#5c3f12]">
                Atenção: {connection.lastError}.
              </p>
            ) : null}

            <form action={setCardFeePayerAction} className="grid gap-3 rounded-3xl bg-[#f7f0e5] p-4">
              <fieldset className="grid gap-2">
                <legend className="t-eyebrow text-ink-soft">Quem paga a taxa do cartão</legend>
                <label className="mt-2 flex items-center gap-2 text-sm font-bold text-ink">
                  <input
                    type="radio"
                    name="feePayer"
                    value="guest"
                    defaultChecked={connection?.feePayer !== "couple"}
                    className="size-4 accent-forest"
                  />
                  O convidado (vocês recebem 100% do presente)
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-ink">
                  <input
                    type="radio"
                    name="feePayer"
                    value="couple"
                    defaultChecked={connection?.feePayer === "couple"}
                    className="size-4 accent-forest"
                  />
                  Nós (a taxa do Mercado Pago sai do valor recebido)
                </label>
              </fieldset>
              <p className="text-sm leading-6 text-ink-soft">
                A taxa é do Mercado Pago, não da Noivar. Com a primeira opção, ela aparece somada no total do
                convidado e vocês recebem o valor cheio do presente.
              </p>
              <p className="text-sm leading-6 text-ink-soft">
                <strong className="text-ink">Importante:</strong> isso vale com o parcelamento no modo padrão do
                Mercado Pago, em que os juros das parcelas são pagos pelo convidado. Se vocês ativarem o
                parcelamento sem juros na conta de vocês, esses juros passam a sair do valor recebido.
              </p>
              <button type="submit" className="btn btn-secondary justify-self-start text-sm">
                Salvar
              </button>
            </form>

            <form action={disconnectMercadoPagoAction}>
              <button type="submit" className="text-sm font-bold text-[#8d3d33] underline underline-offset-4">
                Desconectar o Mercado Pago
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {connection ? (
              <p role="alert" className="rounded-2xl bg-[#8d3d33]/10 px-4 py-3 text-sm font-bold text-[#8d3d33]">
                A conexão com o Mercado Pago caiu. Conecte de novo para voltar a aceitar cartão.
              </p>
            ) : null}
            <ol className="grid gap-2 text-sm leading-6 text-ink-soft">
              <li>1. Clique no botão abaixo — você vai para a página do Mercado Pago.</li>
              <li>2. Entre na sua conta. Quem compra no Mercado Livre já tem uma, é o mesmo login.</li>
              <li>3. Toque em “Autorizar” e pronto: você volta para cá com o cartão ativo.</li>
            </ol>
            <a href="/api/mercadopago/oauth/start" className="btn btn-primary !text-on-forest justify-self-start text-sm">
              Conectar Mercado Pago
            </a>
            <p className="text-sm leading-6 text-ink-soft">
              É opcional: sem conectar, seu site segue recebendo presentes por Pix, com 0% de taxa. Se a sua conta
              do Mercado Pago ainda não tiver a identidade confirmada, faça isso no app dele antes.
            </p>
          </div>
        )}
      </article>
    </section>
  );
}
