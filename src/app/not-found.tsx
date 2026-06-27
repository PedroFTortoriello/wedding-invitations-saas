import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbf7ef] px-6 text-center text-ink">
      <div className="max-w-xl">
        <p className="mb-4 t-eyebrow text-ink-soft">404</p>
        <h1 className="t-display italic">Página não encontrada</h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-7 text-ink-soft">
          Essa página ainda não existe ou não está publicada.
        </p>
        <Link
          href="/"
          className="btn btn-primary mt-8 text-sm"
        >
          Voltar para a plataforma
        </Link>
      </div>
    </main>
  );
}
