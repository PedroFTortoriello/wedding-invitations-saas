import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbf7ef] px-6 text-center text-ink">
      <div className="max-w-xl">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-ink-soft">404</p>
        <h1 className="font-serif text-5xl italic leading-none md:text-7xl">Página não encontrada</h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-7 text-ink-soft">
          Essa página ainda não existe ou não está publicada.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#354022] px-7 text-sm font-bold text-white"
        >
          Voltar para a plataforma
        </Link>
      </div>
    </main>
  );
}
