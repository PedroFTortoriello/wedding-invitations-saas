"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 8) {
      setError("A senha precisa ter ao menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } }
    });

    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes("already")
          ? "Já existe uma conta com esse email. Tente entrar."
          : "Não foi possível criar a conta. Tente novamente."
      );
      setLoading(false);
      return;
    }

    // Confirmação de email habilitada: ainda não há sessão.
    if (!data.session) {
      setNotice("Conta criada! Confirme o email que enviamos para continuar.");
      setLoading(false);
      return;
    }

    // Há sessão: cria o perfil (RLS exige id = auth.uid()).
    if (data.user) {
      await supabase
        .from("profiles")
        .upsert(
          { id: data.user.id, email: data.user.email ?? null, name: name.trim() || null },
          { onConflict: "id", ignoreDuplicates: true }
        );
    }

    router.replace("/onboarding");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f0e5] px-4 text-ink">
      <section className="w-full max-w-md card card-accent p-7">
        <Link href="/" className="t-h2 italic">
          Noivar
        </Link>
        <h1 className="mt-8 t-h1 italic">Criar conta</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Crie sua conta para montar e publicar o site do casamento.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
          <label className="grid gap-2 text-sm font-bold text-ink-soft">
            Nome do casal
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4 text-ink"
            />
          </label>

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
              autoComplete="new-password"
              minLength={8}
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

          {notice ? (
            <p role="status" className="rounded-2xl bg-forest/10 px-4 py-3 text-sm font-bold text-forest">
              {notice}
            </p>
          ) : null}

          <button type="submit" disabled={loading} className="btn btn-primary w-full text-sm disabled:opacity-60">
            {loading ? "Criando…" : "Começar meu site"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-soft">
          Já tem conta?{" "}
          <Link href="/login" className="font-bold text-ink underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
