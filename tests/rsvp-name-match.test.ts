import { describe, expect, it } from "vitest";
import { normalizeName } from "@/lib/public-forms";

// O RSVP casa o nome digitado com a lista do casal via normalizeName. Se essa
// normalização quebrar, convidado legítimo é barrado (ou estranho passa).
describe("normalizeName — match do RSVP com a lista", () => {
  it("ignora acento, caixa e espaços extras", () => {
    expect(normalizeName("  José   DA Silva ")).toBe("jose da silva");
    expect(normalizeName("JOSÉ DA SILVA")).toBe(normalizeName("josé da silva"));
    expect(normalizeName("Mariana Sóuza")).toBe(normalizeName("mariana souza"));
  });

  it("nomes diferentes não casam", () => {
    expect(normalizeName("Ana Souza")).not.toBe(normalizeName("Ana Souzaa"));
    expect(normalizeName("Lucas")).not.toBe(normalizeName("Lucas Ferreira"));
  });
});
