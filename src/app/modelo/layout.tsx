import { DemoBar } from "@/components/templates/DemoBar";

/**
 * Demos dos modelos: barra fixa de demonstração + respiro no fim da página para ela
 * não cobrir o rodapé do modelo. O respiro é um pouco MENOR que a barra de propósito:
 * ela sobrepõe só o padding do rodapé e nunca sobra uma faixa sem o fundo do modelo.
 */
export default function ModeloLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {/* --demo-bar-h: os heróis dos modelos descontam a barra para a data/local não ficarem por baixo dela. */}
      <div className="pb-(--demo-bar-h) [--demo-bar-h:calc(6rem+env(safe-area-inset-bottom))] md:[--demo-bar-h:calc(3.75rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <DemoBar />
    </>
  );
}
