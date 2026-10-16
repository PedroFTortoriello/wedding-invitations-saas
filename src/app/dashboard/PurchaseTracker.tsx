"use client";

import { useEffect } from "react";
import { getConsent, track } from "@/lib/analytics";
import { purchaseEventId } from "@/lib/tracking-shared";

const POLL_MS = 500;
const MAX_TRIES = 20;

/**
 * Purchase da taxa no navegador, uma vez por navegador. Deduplica com o Purchase
 * que o webhook manda pela Conversions API (mesmo event_id). Só sai com aceite, e os scripts
 * carregam depois da hidratação, então espera ~10s;
 * sem eles não marca como enviado (tenta de novo na próxima visita).
 */
export function PurchaseTracker({ weddingId, value }: { weddingId: string; /** Taxa paga, em reais. */ value: number }) {
  useEffect(() => {
    const key = `noivar_purchase_${weddingId}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return; // sem storage não há como garantir "uma vez"
    }

    let tries = 0;
    const timer = window.setInterval(() => {
      if (getConsent() === "granted" && (window.fbq || window.gtag)) {
        track("purchase", { value }, { eventId: purchaseEventId(weddingId) });
        try {
          localStorage.setItem(key, "1");
        } catch {
          // ignora: no pior caso reenvia, e o event_id deduplica
        }
      } else if (++tries < MAX_TRIES) {
        return;
      }
      window.clearInterval(timer);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [weddingId, value]);

  return null;
}
