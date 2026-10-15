import { COMPANY } from "@/lib/company";

/**
 * CNPJ sem quebrar no hífen ("…/0001-" + "59"). Com nowrap (CSS), não com caractere
 * invisível: quem copia o CNPJ para consultar na Receita cola exatamente o que vê.
 */
export function Cnpj({ value }: { value: string }) {
  return <span className="whitespace-nowrap">{value}</span>;
}

/**
 * "A Noivar é operada por <razão social>, CNPJ <..>, com endereço em <..>." só com o que
 * existe em COMPANY; sem nenhum dado, a frase sai sem eles (nunca placeholder).
 */
export function CompanyIdentity() {
  const { brand, legalName, cnpj, address } = COMPANY;
  return (
    <>
      {legalName ? `A ${brand} é operada por ${legalName}` : `A ${brand} é a responsável por este serviço`}
      {cnpj ? (
        <>
          , CNPJ <Cnpj value={cnpj} />
        </>
      ) : null}
      {address ? `, com endereço em ${address}` : null}.
    </>
  );
}
