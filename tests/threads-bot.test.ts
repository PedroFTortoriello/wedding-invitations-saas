import { describe, expect, it } from "vitest";
import {
  containsUrl,
  needsRefresh,
  normalize,
  startOfTodaySaoPauloISO,
  threadsLength,
  todaySaoPaulo,
  validateBatch,
  validateLink,
  validatePost
} from "../scripts/threads-bot.mjs";

const TODAY = "2026-10-14";
const UTM = "utm_source=threads&utm_medium=organic_social&utm_campaign=p6&utm_content=20261018-preco";
const HOME = `https://noivar.vercel.app/?${UTM}`;
const BASE = {
  scheduled_for: "2026-10-20",
  pillar: "P1",
  topic: "confirmacao-prazo",
  text: "Confirmar presença precisa ser mais fácil do que esquecer. Mandem o link junto com o convite.",
  link_url: null,
  topic_tag: null,
  facts: []
};

/** Valida o post base trocando o texto (e o que mais vier), no modo completo. */
function check(text: string, extra: Record<string, unknown> = {}, history: unknown[] = []) {
  return validatePost({ ...BASE, text, ...extra }, { today: TODAY, history });
}

describe("threadsLength (500 do Threads, emoji por bytes UTF-8)", () => {
  it("conta letras acentuadas como 1", () => {
    expect(threadsLength("ação")).toBe(4);
    expect(threadsLength("Não é")).toBe(5);
    expect(threadsLength("a".repeat(500))).toBe(500);
  });

  it("acento decomposto (NFD) conta cada ponto de código", () => {
    expect(threadsLength("ação".normalize("NFD"))).toBe(6);
  });

  it("emoji conta os bytes UTF-8", () => {
    expect(threadsLength("😀")).toBe(4);
    expect(threadsLength("a😀b")).toBe(6);
    expect(threadsLength("\u2764\uFE0F")).toBe(6); // U+2764 (3) + FE0F (3)
  });

  it("sequências com ZWJ, tom de pele e bandeira somam os bytes de cada parte", () => {
    expect(threadsLength("\u{1F468}\u200D\u{1F469}\u200D\u{1F467}")).toBe(18); // 3 × 4 + 2 ZWJ × 3
    expect(threadsLength("👍🏽")).toBe(8);
    expect(threadsLength("🇧🇷")).toBe(8);
  });
});

describe("normalize", () => {
  it("minúsculas, sem acento, sem pontuação, espaços colapsados", () => {
    expect(normalize("  Ação, É\n ótimo; R$ 149,90!  ")).toBe("acao e otimo r 149 90");
    expect(normalize("Confirmação/RSVP")).toBe("confirmacao rsvp");
  });
});

describe("containsUrl", () => {
  it("acha http(s)://, www. e domínio solto", () => {
    for (const text of [
      "veja https://noivar.vercel.app",
      "http://exemplo.com",
      "entre em www.noivar.com",
      "acesse noivar.vercel.app hoje",
      "o site x.com.br",
      "Noivar.App"
    ]) {
      expect(containsUrl(text), text).toBe(true);
    }
  });

  it("não confunde valor, percentual, abreviação ou menção com link", () => {
    for (const text of [
      "Publicar: R$ 149,90. Sem mensalidade.",
      "Taxa de 3,89%.",
      "Presente via Pix.",
      "Mandem por e-mail.",
      "1.000 convidados",
      "Fim.Começo",
      "Sim.Não",
      "falem com @noivar.app"
    ]) {
      expect(containsUrl(text), text).toBe(false);
    }
  });
});

describe("validateLink", () => {
  it("aceita home e cadastro com UTM, âncora liberada e modelo da vitrine", () => {
    expect(validateLink(HOME)).toEqual([]);
    expect(validateLink(`${HOME}#preco`)).toEqual([]);
    expect(validateLink(`https://noivar.vercel.app/cadastro?${UTM}`)).toEqual([]);
    expect(validateLink(`https://noivar.vercel.app/cadastro?modelo=cinema-noir&${UTM}`)).toEqual([]);
    expect(validateLink(`${HOME}#ia`)).toEqual([]);
    expect(validateLink(`https://noivar.vercel.app/cadastro?ia=1&${UTM}`)).toEqual([]);
  });

  it("ia=1 só no cadastro, só com 1 e sem modelo", () => {
    expect(validateLink(`https://noivar.vercel.app/cadastro?ia=sim&${UTM}`).join()).toMatch(/valor 1/);
    expect(validateLink(`https://noivar.vercel.app/cadastro?ia=1&modelo=cinema-noir&${UTM}`).join()).toMatch(/junto com modelo/);
    expect(validateLink(`https://noivar.vercel.app/?ia=1&${UTM}`).join()).toMatch(/não permitido: ia/);
    expect(validateLink(`https://noivar.vercel.app/cadastro?ia=1&${UTM}#ia`).join()).toMatch(/âncora/);
  });

  it("recusa domínio, protocolo ou porta errados", () => {
    expect(validateLink(`http://noivar.vercel.app/?${UTM}`).join()).toMatch(/https/);
    for (const host of ["www.noivar.vercel.app", "noivar.vercel.app.evil.com", "noivar.vercel.app:8443", "x@noivar.vercel.app"]) {
      expect(validateLink(`https://${host}/?${UTM}`).join(), host).toMatch(/domínio/);
    }
    expect(validateLink("noivar.vercel.app")).toEqual(["não é uma URL válida"]);
  });

  it("exige as quatro UTMs certas e nenhum outro parâmetro", () => {
    expect(validateLink("https://noivar.vercel.app/").join()).toMatch(/utm_source/);
    expect(validateLink(HOME.replace("utm_medium=organic_social", "utm_medium=social")).join()).toMatch(/utm_medium/);
    expect(validateLink(HOME.replace("utm_campaign=p6", "utm_campaign=P6")).join()).toMatch(/utm_campaign/);
    expect(validateLink(HOME.replace("utm_content=20261018-preco", "utm_content=")).join()).toMatch(/utm_content/);
    expect(validateLink(`${HOME}&fbclid=abc`).join()).toMatch(/não permitido: fbclid/);
    expect(validateLink(`${HOME}&utm_source=threads`).join()).toMatch(/repetido: utm_source/);
  });

  it("recusa caminho fora da lista, modelo inventado e âncora fora do lugar", () => {
    for (const pathname of ["/precos", "/cadastro/", "/casamento/helena-e-lucas", "/lp/presentes"]) {
      expect(validateLink(`https://noivar.vercel.app${pathname}?${UTM}`).join(), pathname).toMatch(/caminho/);
    }
    expect(validateLink(`https://noivar.vercel.app/cadastro?modelo=boho&${UTM}`).join()).toMatch(/modelo/);
    expect(validateLink(`https://noivar.vercel.app/?modelo=cinema-noir&${UTM}`).join()).toMatch(/não permitido: modelo/);
    expect(validateLink(`https://noivar.vercel.app/cadastro?${UTM}#preco`).join()).toMatch(/âncora/);
    expect(validateLink(`${HOME}#blog`).join()).toMatch(/âncora/);
  });
});

describe("validatePost — checagens duras (mode hard, as do publicar e do teste)", () => {
  const hard = (post: Record<string, unknown>) => validatePost(post, { mode: "hard" });

  it("aceita só o texto e ignora as regras de marca", () => {
    expect(hard({ text: "Post de teste da Noivar!" })).toEqual([]);
    expect(hard({ text: "Teste com link", link_url: HOME, topic_tag: "casamento" })).toEqual([]);
  });

  it("recusa texto vazio, longo demais ou com URL", () => {
    expect(hard({ text: "  " }).join()).toMatch(/vazio/);
    expect(hard({ text: "a".repeat(501) }).join()).toMatch(/501 caracteres/);
    expect(hard({ text: `${"a".repeat(497)}😀` }).join()).toMatch(/501 caracteres/);
    expect(hard({ text: "Veja em noivar.vercel.app" }).join()).toMatch(/URL/);
  });

  it("valida link_url e topic_tag", () => {
    expect(hard({ text: "Oi", link_url: "https://outro.com/" }).join()).toMatch(/^link_url: /);
    expect(hard({ text: "Oi", topic_tag: "casamento.br" }).join()).toMatch(/topic_tag/);
    expect(hard({ text: "Oi", topic_tag: "noiva & noivo" }).join()).toMatch(/topic_tag/);
    expect(hard({ text: "Oi", topic_tag: "a".repeat(51) }).join()).toMatch(/topic_tag/);
    expect(hard({ text: "Oi", topic_tag: "a".repeat(50) })).toEqual([]);
  });
});

describe("validatePost — estrutura do lote (mode full)", () => {
  it("o post base passa", () => {
    expect(validatePost(BASE, { today: TODAY })).toEqual([]);
    expect(check(BASE.text, { scheduled_for: TODAY })).toEqual([]);
  });

  it("recusa campo desconhecido, pilar, topic, data e facts inválidos", () => {
    expect(check(BASE.text, { image_url: "x" }).join()).toMatch(/campo desconhecido: image_url/);
    expect(check(BASE.text, { pillar: "P7" }).join()).toMatch(/pillar/);
    expect(check(BASE.text, { topic: "Confirmação Prazo" }).join()).toMatch(/topic/);
    expect(check(BASE.text, { scheduled_for: "2026-10-13" }).join()).toMatch(/já passou/);
    expect(check(BASE.text, { scheduled_for: "14/10/2026" }).join()).toMatch(/AAAA-MM-DD/);
    expect(check(BASE.text, { scheduled_for: "2026-02-30" }).join()).toMatch(/AAAA-MM-DD/);
    expect(check(BASE.text, { facts: "preco-publicacao" }).join()).toMatch(/facts/);
    expect(check(BASE.text, { facts: ["Preço"] }).join()).toMatch(/facts/);
    expect(validatePost(null).join()).toMatch(/objeto/);
  });
});

describe("validatePost — voz da marca", () => {
  it("sem emoji, exclamação ou hashtag", () => {
    expect(check("Vocês já mandaram o convite? 💍").join()).toMatch(/emoji/);
    expect(check("Vocês já mandaram o convite? Mandem hoje!").join()).toMatch(/exclamação/);
    expect(check("Vocês já mandaram o convite? #casamento").join()).toMatch(/hashtag/);
  });

  it("a marca é feminina; o verbo noivar passa", () => {
    for (const text of ["Conheçam o Noivar.", "O site do Noivar sai pronto.", "No Noivar vocês montam tudo.", "O Noivar cobra uma vez."]) {
      expect(check(text).join(), text).toMatch(/feminina/);
    }
    for (const text of ["Conheçam a Noivar.", "O site da Noivar sai pronto.", "Na Noivar vocês montam tudo.", "Antes de noivar, ninguém pensa na lista."]) {
      expect(check(text), text).toEqual([]);
    }
  });

  it("nunca Vows nem mural", () => {
    expect(check("Feito com o design system Vows.").join()).toMatch(/Vows/);
    expect(check("Os recados vão para o mural de recados.").join()).toMatch(/mural/);
  });
});

describe("validatePost — expressões proibidas (sem acento e caixa, palavra inteira)", () => {
  it("pega variações de caixa e acento", () => {
    for (const [text, phrase] of [
      ["DESCUBRA como montar a lista.", "descubra"],
      ["Isso é imperdivel para quem casa em dezembro.", "imperdível"],
      ["Só Hoje para quem casa em dezembro.", "só hoje"],
      ["Para o Dia Mais Importante da Sua Vida.", "o dia mais importante da sua vida"],
      ["Lista sem dor de cabeca.", "sem dor de cabeça"],
      ["Comenta aqui qual foi a sua.", "comenta aqui"],
      ["Marque uma amiga que vai casar.", "marque uma amiga"],
      ["A IA faz gerações ilimitadas.", "gerações ilimitadas"],
      ["Edicoes ilimitadas depois de publicar.", "edições ilimitadas"],
      ["Escolham entre 4 modelos.", "4 modelos"],
      ["Escolham entre quatro modelos.", "quatro modelos"]
    ]) {
      expect(check(text).join(), text).toContain(`expressão proibida: "${phrase}"`);
    }
  });

  it("não pega pedaço de outra palavra", () => {
    expect(check("Vocês descubram juntos o que faz sentido.")).toEqual([]);
    expect(check("Eu transformei a planilha em lista.")).toEqual([]);
  });
});

describe("validatePost — valores, percentuais e ressalvas", () => {
  it("aceita os valores da ficha de fatos, com ou sem espaço", () => {
    expect(check("Montar: R$ 0. Publicar: R$ 89,90, uma vez, via Pix.")).toEqual([]);
    expect(check("Publicar custa R$89,90 uma vez.")).toEqual([]);
    expect(check("Se a IA montar o site, publicar custa R$ 149,90 uma vez.")).toEqual([]);
    expect(check("No editor, R$ 89,90. Site feito pela IA: R$149,90.")).toEqual([]);
    expect(check("Presente via Pix: 0% de taxa, 100% para vocês.")).toEqual([]);
  });

  it("R$ 149,90 é só o preço da IA", () => {
    expect(check("Publicar, uma vez: R$ 149,90.").join()).toMatch(/site feito pela IA/);
    expect(check("Publicar custa R$149,90 uma vez, via Pix.").join()).toMatch(/site feito pela IA/);
  });

  it("recusa valor ou percentual inventado", () => {
    expect(check("Dá menos de R$ 1,50 por convidado.").join()).toMatch(/valor fora da ficha de fatos: R\$1,50/);
    expect(check("Publicar custa R$ 99,90.").join()).toMatch(/valor fora da ficha de fatos: R\$99,90/);
    expect(check("Publicar custa R$ 150.").join()).toMatch(/R\$150/);
    expect(check("Publicar custa R$ 0,00.").join()).toMatch(/R\$0,00/);
    expect(check("No cartão a taxa é 4,99%.").join()).toMatch(/percentual fora da ficha de fatos: 4,99%/);
    expect(check("Uns 5 % dos convidados somem.").join()).toMatch(/5%/);
  });

  it("0%, sem taxa e taxa zero exigem a palavra Pix", () => {
    expect(check("Presentes com 0% de taxa.").join()).toMatch(/Pix/);
    expect(check("Presentes sem taxa.").join()).toMatch(/Pix/);
    expect(check("Presentes com taxa zero.").join()).toMatch(/Pix/);
    expect(check("Presentes com taxa zero no Pix.")).toEqual([]);
    expect(check("Vocês recebem 100% do valor.")).toEqual([]); // "100%" não é "0%"
  });

  it("3,89% exige a ressalva", () => {
    const comparison = "Numa lista que cobra 3,89% por presente, R$ 10.000 viram R$ 389 de taxa.";
    expect(check(comparison).join()).toMatch(/ressalva/);
    expect(check(`${comparison} Varia por plano.`)).toEqual([]);
    expect(check(`${comparison} Consultada em setembro de 2026.`)).toEqual([]);
  });
});

describe("validatePost — repetição contra o histórico", () => {
  const BUFFET = "Faltam três semanas, o buffet quer o número final e metade da lista ainda não respondeu. Ninguém fez por mal.";
  const filler = (n: number) => Array.from({ length: n }, (_, i) => `Assunto de número ${i} sem nenhuma relação com buffet`);

  it("texto igual depois de normalizar", () => {
    const issues = check("FALTAM TRES SEMANAS. O buffet quer o numero final; e metade da lista ainda nao respondeu, ninguem fez por mal", {}, [
      { id: 7, text: BUFFET }
    ]);
    expect(issues.join()).toMatch(/texto igual a #7/);
  });

  it("mesmas 5 primeiras palavras de um dos 30 mais recentes", () => {
    const text = "Faltam três semanas, o buffet já confirmou o cardápio e só falta escolher o bolo.";
    expect(check(text, {}, [BUFFET]).join()).toMatch(/5 primeiras palavras/);
    expect(check(text, {}, [...filler(29), BUFFET]).join()).toMatch(/5 primeiras palavras/);
    expect(check(text, {}, [...filler(30), BUFFET])).toEqual([]);
  });

  it("trigramas parecidos demais com um dos 60 mais recentes", () => {
    const text = "Faltando três semanas, o buffet quer o número final e metade da lista ainda não respondeu. Ninguém fez por mal mesmo.";
    expect(check(text, {}, [BUFFET]).join()).toMatch(/parecido demais .*similaridade 0\.85/);
    expect(check(text, {}, [...filler(59), BUFFET]).join()).toMatch(/parecido demais/);
    expect(check(text, {}, [...filler(60), BUFFET])).toEqual([]);
  });

  it("texto claramente diferente passa", () => {
    const text = "Pedir Pix de presente de casamento ainda divide opiniões. Vocês colocaram a chave no convite?";
    expect(check(text, {}, [BUFFET, ...filler(10)])).toEqual([]);
  });

  it("validateBatch compara cada item com os anteriores do mesmo lote", () => {
    const first = { ...BASE, text: BUFFET };
    const second = { ...BASE, scheduled_for: "2026-10-21", text: BUFFET.toUpperCase() };
    const third = { ...BASE, scheduled_for: "2026-10-22", topic: "pix-presente", text: "Pedir Pix de presente ainda divide opiniões." };
    const [a, b, c] = validateBatch([first, second, third], { today: TODAY });
    expect(a).toEqual([]);
    expect(b.join()).toMatch(/texto igual/);
    expect(c).toEqual([]);
  });
});

describe("datas em America/Sao_Paulo", () => {
  it("o dia vira às 03:00 UTC", () => {
    expect(todaySaoPaulo(new Date("2026-10-14T02:59:59Z"))).toBe("2026-10-13");
    expect(todaySaoPaulo(new Date("2026-10-14T03:00:00Z"))).toBe("2026-10-14");
    expect(todaySaoPaulo(new Date("2026-10-14T00:30:00Z"))).toBe("2026-10-13"); // já é dia 14 em UTC
    expect(todaySaoPaulo(new Date("2027-01-01T02:00:00Z"))).toBe("2026-12-31");
  });

  it("início do dia de São Paulo em ISO (UTC)", () => {
    expect(startOfTodaySaoPauloISO(new Date("2026-10-14T02:59:59Z"))).toBe("2026-10-13T03:00:00.000Z");
    expect(startOfTodaySaoPauloISO(new Date("2026-10-14T03:00:00Z"))).toBe("2026-10-14T03:00:00.000Z");
    expect(startOfTodaySaoPauloISO(new Date("2026-10-14T23:59:00Z"))).toBe("2026-10-14T03:00:00.000Z");
  });
});

describe("needsRefresh", () => {
  const NOW = new Date("2026-10-14T11:00:00Z");
  const DAY = 24 * 60 * 60 * 1000;
  const at = (ms: number) => new Date(NOW.getTime() + ms).toISOString();
  const token = (expiresIn: number, refreshedAgo: number) => ({ expires_at: at(expiresIn), refreshed_at: at(-refreshedAgo) });

  it("renova faltando menos de 30 dias e com mais de 24 h desde o último refresh", () => {
    expect(needsRefresh(token(29 * DAY, 25 * 60 * 60 * 1000), NOW)).toBe(true);
    expect(needsRefresh(token(31 * DAY, 25 * 60 * 60 * 1000), NOW)).toBe(false);
  });

  it("respeita as 24 h + 5 min da Meta", () => {
    expect(needsRefresh(token(29 * DAY, 23 * 60 * 60 * 1000), NOW)).toBe(false);
    expect(needsRefresh(token(29 * DAY, DAY), NOW)).toBe(false);
    expect(needsRefresh(token(29 * DAY, DAY + 5 * 60 * 1000), NOW)).toBe(true);
  });

  it("não tenta com token já vencido; sem refreshed_at, tenta", () => {
    expect(needsRefresh(token(-60 * 1000, 40 * DAY), NOW)).toBe(false);
    expect(needsRefresh({ expires_at: at(10 * DAY) }, NOW)).toBe(true);
  });
});
