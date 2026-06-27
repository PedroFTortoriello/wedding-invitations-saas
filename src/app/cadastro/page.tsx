import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f0e5] px-4 text-ink">
      <section className="w-full max-w-md rounded-[1.6rem] border border-[#5b6842]/12 bg-[#fffaf1] p-7 shadow-[0_24px_80px_rgba(53,64,34,0.12)]">
        <Link href="/" className="t-h2 italic">
          Vows
        </Link>
        <h1 className="mt-8 t-h1 italic">Criar conta</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">Cadastro de demonstração para iniciar a configuração do casamento.</p>
        <div className="mt-6 grid gap-4">
          <input className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4" placeholder="Nome do casal" />
          <input className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4" placeholder="Email" />
          <input className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4" placeholder="Senha" type="password" />
          <Link href="/onboarding" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#354022] text-sm font-black text-white">
            Comecar meu site
          </Link>
        </div>
      </section>
    </main>
  );
}
