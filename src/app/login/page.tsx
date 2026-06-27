"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f0e5] px-4 text-ink">
      <section className="w-full max-w-md card card-accent p-7">
        <Link href="/" className="t-h2 italic">
          Vows
        </Link>
        <h1 className="mt-8 t-h1 italic">Entrar</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Acesse o painel para editar e publicar o site do seu casamento.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
          <label className="grid gap-2 text-sm font-bold text-ink-soft">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4 text-ink"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-ink-soft">
            Senha
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4 text-ink"
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-2xl bg-[#8d3d33]/10 px-4 py-3 text-sm font-bold text-[#8d3d33]">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={loading} className="btn btn-primary w-full text-sm disabled:opacity-60">
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-soft">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-bold text-ink underline underline-offset-4">
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}
