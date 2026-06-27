import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f0e5] px-4 text-ink">
      <section className="w-full max-w-md card card-accent p-7">
        <Link href="/" className="t-h2 italic">
          Vows
        </Link>
        <h1 className="mt-8 t-h1 italic">Entrar</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">Tela visual pronta para conectar ao provedor de autenticacao.</p>
        <div className="mt-6 grid gap-4">
          <input className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4" placeholder="Email" />
          <input className="min-h-12 rounded-2xl border border-[#5b6842]/14 bg-white px-4" placeholder="Senha" type="password" />
          <Link href="/dashboard" className="btn btn-primary w-full text-sm">
            Entrar no painel de demonstração
          </Link>
        </div>
      </section>
    </main>
  );
}
