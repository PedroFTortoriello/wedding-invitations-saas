"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Notice } from "@/components/app/Notice";
import { platformName } from "@/lib/platform-data";
import { createClient } from "@/lib/supabase/client";

const labelText = "text-sm font-medium text-ink";
// 16px no input: abaixo disso o iOS (inclusive o navegador do Instagram) dá zoom no foco.
const inputClass = "field min-h-12 text-base";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (signInError) {
      setError("Email ou senha inválidos. Confira os dados e tente novamente.");
      setLoading(false);
      return;
    }

    // Só destino interno. Resolve antes de checar: o parser de URL descarta tab/quebra
    // de linha ("/\t/evil.com" vira "//evil.com"), e "/.//evil.com" normaliza para um
    // pathname "//evil.com". Por isso navega pelo href absoluto já validado, não pelo pathname.
    const next = new URLSearchParams(window.location.search).get("next");
    const target = next?.startsWith("/") ? new URL(next, window.location.origin) : null;
    router.replace(target && target.origin === window.location.origin ? target.href : "/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {/* Conteúdo do cabeçalho na mesma coluna de 6xl do <main>; só a hairline vai de ponta a ponta. */}
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" className="font-serif text-[1.75rem] italic leading-none">
            {platformName}
          </Link>
          <p className="text-sm text-ink-soft">
            Ainda sem conta?{" "}
            <Link
              href="/cadastro"
              className="inline-flex min-h-11 items-center rounded-sm px-1 font-semibold text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-12 pt-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:min-h-[calc(100svh-4rem)] lg:content-center lg:items-center lg:gap-16 lg:py-24">
        <div className="hero-rise">
          <h1 className="font-serif text-[2.25rem] leading-[1.05] tracking-[-0.015em] text-balance md:text-[3.25rem]">
            Que bom ver <em>vocês</em> de novo
          </h1>
          <p className="mt-3 max-w-md text-base leading-7 text-ink-soft">
            Entrem para continuar o site, ver as confirmações e acompanhar os presentes.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="panel hero-rise grid gap-5 p-5 [animation-delay:60ms] sm:p-7">
          <div className="grid gap-1.5">
            <label htmlFor="login-email" className={labelText}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="login-senha" className={labelText}>
              Senha
            </label>
            <input
              id="login-senha"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
          </div>

          {error ? <Notice tone="error">{error}</Notice> : null}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-sm btn-primary min-h-12 w-full text-base disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </main>
    </div>
  );
}
