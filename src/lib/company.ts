import { supportWhatsApp } from "@/lib/platform-data";

/**
 * Identificação pública da empresa (Decreto 7.962/2013, art. 2): rodapé, Termos e
 * Política de privacidade. Campo `null` = ainda não fornecido pelo dono.
 *
 * GATE DE LANÇAMENTO: não rodar anúncio enquanto `companyIsComplete()` for false.
 * Nenhuma tela inventa valor: o que é null simplesmente não aparece.
 */
export const COMPANY = {
  brand: "Noivar",
  legalName: "62.518.367 Pedro Gabriel de Freitas Tortoriello" as string | null, // razão social (MEI)
  cnpj: "62.518.367/0001-59" as string | null,
  address: "Rua Professor Álvaro Roberto Rigolin, 209, Reserva Central Parque, Salto/SP, CEP 13325-079" as string | null,
  email: "pedrooofreitas@gmail.com" as string | null,
  instagram: null as string | null, // @ sem a arroba
  whatsapp: supportWhatsApp, // E.164 sem "+"
  whatsappHours: "segunda a sexta, das 9h às 18h",
  /** Reembolso integral se pedido até N dias após o pagamento (CDC art. 49). */
  refundDays: 7,
  /** O site fica no ar por no mínimo N meses após a data do casamento. */
  siteMonthsAfterWedding: 12
};

export function companyIsComplete(): boolean {
  return Boolean(COMPANY.legalName && COMPANY.cnpj && COMPANY.address && COMPANY.email);
}

export const whatsappLink = (text: string) => `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`;
