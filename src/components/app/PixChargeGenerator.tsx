"use client";

import { useState, useTransition } from "react";
import type { WeddingGift, WeddingSite } from "@/types/wedding";
import type { PixChargeResponse, PixSimulationResponse } from "@/types/pix";

type PixChargeGeneratorProps = {
  wedding: WeddingSite;
  gifts: WeddingGift[];
  compact?: boolean;
};

function parseGiftAmount(price: string) {
  const normalized = price.replace(/[^\d,]/g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : 150;
}

export function PixChargeGenerator({ wedding, gifts, compact = false }: PixChargeGeneratorProps) {
  const [selectedGiftId, setSelectedGiftId] = useState(gifts[0]?.id ?? "");
  const selectedGift = gifts.find((gift) => gift.id === selectedGiftId) ?? gifts[0];
  const [guestName, setGuestName] = useState("");
  const [amount, setAmount] = useState(parseGiftAmount(selectedGift?.price ?? "150"));
  const [message, setMessage] = useState("");
  const [charge, setCharge] = useState<PixChargeResponse | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleGiftChange(giftId: string) {
    const gift = gifts.find((item) => item.id === giftId);
    setSelectedGiftId(giftId);
    setAmount(parseGiftAmount(gift?.price ?? "150"));
    setCharge(null);
    setError("");
  }

  function createCharge() {
    setError("");
    setCopied(false);
    startTransition(async () => {
      const response = await fetch("/api/pix/charge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          weddingSiteId: wedding.id,
          guestName,
          amount,
          message,
          giftId: selectedGiftId
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setCharge(null);
        setError(data.error ?? "Nao foi possivel gerar a cobranca Pix.");
        return;
      }

      setCharge(data as PixChargeResponse);
    });
  }

  async function simulatePayment() {
    if (!charge) return;
    setError("");
    setSimulating(true);

    try {
      const response = await fetch("/api/pix/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ charge })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Nao foi possivel simular o pagamento.");
        return;
      }

      setCharge(data as PixSimulationResponse);
    } finally {
      setSimulating(false);
    }
  }

  async function copyPayload() {
    if (!charge) return;
    await navigator.clipboard.writeText(charge.payload);
    setCopied(true);
  }

  return (
    <section className="mt-6 grid gap-6 rounded-[1.8rem] border border-[#5b6842]/12 bg-[#fffaf1] p-6 shadow-[0_18px_52px_rgba(53,64,34,0.08)] xl:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-ink-soft">Gerar cobranca Pix</p>
        <h2 className="mt-3 font-serif text-5xl italic leading-none">{compact ? "Gerar Pix" : "Presenteie em dinheiro"}</h2>
        <p className="mt-4 text-sm leading-6 text-ink-soft">
          Escolha uma cota simbolica, gere o Pix copia-e-cola e mostre o QR Code para pagamento.
        </p>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-ink-soft">
            Cota
            <select
              value={selectedGiftId}
              onChange={(event) => handleGiftChange(event.target.value)}
              className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4"
            >
              {gifts.map((gift) => (
                <option key={gift.id} value={gift.id}>
                  {gift.title} - {gift.price}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink-soft">
            Seu nome
            <input
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4"
              placeholder="Nome de quem está presenteando"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink-soft">
            Valor
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
              className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-ink-soft">
            Mensagem opcional
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              className="rounded-2xl border border-[#5b6842]/14 bg-white p-4"
              placeholder="Um recado carinhoso para os noivos"
            />
          </label>
          {error ? <p className="rounded-2xl bg-[#8d3d33]/10 p-3 text-sm font-bold text-[#8d3d33]">{error}</p> : null}
          <button
            type="button"
            onClick={createCharge}
            disabled={isPending}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#354022] px-6 text-sm font-black text-white disabled:opacity-60"
          >
            {isPending ? "Gerando Pix..." : "Gerar cobranca Pix"}
          </button>
        </div>
      </div>

      <div className="rounded-[1.4rem] bg-[#f7f0e5] p-5">
        {charge ? (
          <div className="grid gap-4">
            <div
              className={`rounded-3xl p-4 text-sm font-black ${
                charge.status === "paid" ? "bg-[#5b6842]/14 text-forest" : "bg-[#d6a85f]/18 text-[#7a5220]"
              }`}
            >
              {charge.status === "paid"
                ? `Pagamento aprovado no simulador${charge.paidAt ? ` em ${new Date(charge.paidAt).toLocaleString("pt-BR")}` : ""}.`
                : "Cobranca Pix pendente. Use o simulador para marcar como paga."}
            </div>
            <div className="mx-auto w-fit rounded-3xl bg-[#fffaf1] p-4" dangerouslySetInnerHTML={{ __html: charge.qrCodeSvg }} />
            <div className="grid gap-3 rounded-3xl bg-[#fffaf1] p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-ink-soft">Valor</span>
                  <strong className="block text-lg">R$ {charge.grossAmount.toFixed(2).replace(".", ",")}</strong>
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-ink-soft">Para o casal</span>
                  <strong className="block text-lg">100% via Pix</strong>
                </div>
              </div>
              <textarea
                readOnly
                value={charge.payload}
                className="min-h-28 rounded-2xl border border-[#5b6842]/14 bg-white p-3 text-xs text-ink-soft"
              />
              <button
                type="button"
                onClick={copyPayload}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#354022] px-5 text-sm font-black text-white"
              >
                {copied ? "Pix copiado" : "Copiar Pix copia-e-cola"}
              </button>
              {charge.status === "pending" ? (
                <button
                  type="button"
                  onClick={simulatePayment}
                  disabled={simulating}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#5b6842]/20 bg-[#5b6842]/10 px-5 text-sm font-black text-forest disabled:opacity-60"
                >
                  {simulating ? "Simulando pagamento..." : "Simular Pix pago"}
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className={`${compact ? "min-h-[22rem]" : "min-h-[28rem]"} grid place-items-center rounded-[1.2rem] border border-dashed border-[#5b6842]/20 text-center`}>
            <div className="max-w-sm p-6">
              <p className="font-serif text-5xl italic leading-none">QR Code Pix</p>
              <p className="mt-4 text-sm leading-6 text-ink-soft">
                A cobranca aparece aqui com QR Code, txid e valor — 100% vai direto para o Pix do casal.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
