"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Botão de <form action={serverAction}> que mostra o envio em andamento. */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  ...props
}: {
  children: ReactNode;
  pendingLabel?: ReactNode;
  className: string;
  "aria-label"?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`${className} disabled:opacity-60`} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
