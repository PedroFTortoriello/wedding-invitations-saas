// Bot do Threads da Noivar: fila em public.threads_posts (Supabase) e publicação de
// um post por dia pela API oficial (graph.threads.net). Zero dependências, Node >= 20.
//
// Uso: node scripts/threads-bot.mjs ajuda
// No VPS: token, teste, publicar (cron diário). No PC: fila, enfileirar, aprovar, descartar.
// Lê as variáveis do ambiente ou do .env na pasta acima de scripts/ (mesmo esquema de
// scripts/abacatepay-create-product.mjs). Nunca imprime o token nem a chave do Supabase.
//
// As regras de conteúdo (funções exportadas) são puras e testadas em tests/threads-bot.test.ts.

import { readFileSync, realpathSync } from "node:fs";
import { open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const GRAPH = "https://graph.threads.net";
const TZ = "America/Sao_Paulo";
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MAX_LENGTH = 500;
const STUCK_ERROR = "execução interrompida: confira no perfil se o post saiu antes de reaprovar";

// ---- Regras de conteúdo (puras) -------------------------------------------------

// A API conta emoji pelos bytes UTF-8. Além de Extended_Pictographic, ZWJ, FE0F e tons
// de pele, contam assim os indicadores regionais (bandeiras), o keycap e as tags.
const BYTE_COUNTED = /\p{Extended_Pictographic}|[\u200D\uFE0F\u20E3\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}\u{E0020}-\u{E007F}]/u;
const EMOJI = /\p{Extended_Pictographic}|[\uFE0F\u20E3\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}]/u;
const utf8 = new TextEncoder();

export function threadsLength(text) {
  let length = 0;
  for (const char of String(text)) length += BYTE_COUNTED.test(char) ? utf8.encode(char).length : 1;
  return length;
}

export function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// http(s)://, www. ou domínio solto (noivar.vercel.app, x.com.br). Menção (@perfil.x) e e-mail não contam.
const URL_IN_TEXT =
  /https?:\/\/|www\.|(?<![\p{L}\p{N}@._-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24}(?![\p{L}\p{N}_-])/iu;

export function containsUrl(text) {
  return URL_IN_TEXT.test(String(text));
}

const LINK_HOST = "noivar.vercel.app";
const LINK_FRAGMENTS = ["#presentes", "#preco", "#modelos", "#duvidas", "#ia"];
const LINK_MODELS = ["jardim-romantico", "editorial-luxury", "garden-classico", "cinema-noir"];
const UTM_VALUE = /^[a-z0-9-]+$/;

export function validateLink(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return ["não é uma URL válida"];
  }
  const issues = [];
  const params = parsed.searchParams;
  if (parsed.protocol !== "https:") issues.push("precisa ser https");
  if (parsed.host !== LINK_HOST || parsed.username || parsed.password) {
    issues.push(`o domínio precisa ser exatamente ${LINK_HOST}`);
  }
  if (parsed.pathname !== "/" && parsed.pathname !== "/cadastro") issues.push("caminho liberado: só / ou /cadastro");
  if (parsed.hash && (parsed.pathname !== "/" || !LINK_FRAGMENTS.includes(parsed.hash))) {
    issues.push(`âncora só na home e só ${LINK_FRAGMENTS.join(", ")}`);
  }
  const allowed = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
  if (parsed.pathname === "/cadastro") allowed.push("modelo", "ia");
  for (const key of new Set(params.keys())) {
    if (!allowed.includes(key)) issues.push(`parâmetro não permitido: ${key}`);
    else if (params.getAll(key).length > 1) issues.push(`parâmetro repetido: ${key}`);
  }
  if (params.get("utm_source") !== "threads") issues.push("utm_source precisa ser threads");
  if (params.get("utm_medium") !== "organic_social") issues.push("utm_medium precisa ser organic_social");
  if (!UTM_VALUE.test(params.get("utm_campaign") ?? "")) issues.push("utm_campaign obrigatório, só a-z, 0-9 e hífen");
  if (!UTM_VALUE.test(params.get("utm_content") ?? "")) issues.push("utm_content obrigatório, só a-z, 0-9 e hífen");
  if (params.has("modelo") && !LINK_MODELS.includes(params.get("modelo"))) {
    issues.push(`modelo precisa ser um destes: ${LINK_MODELS.join(", ")}`);
  }
  if (params.has("ia") && params.get("ia") !== "1") issues.push("ia só com o valor 1");
  if (params.has("ia") && params.has("modelo")) issues.push("ia=1 não vai junto com modelo: a IA escolhe o modelo");
  return issues;
}

const POST_KEYS = ["scheduled_for", "pillar", "topic", "text", "link_url", "topic_tag", "facts"];
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BANNED = [
  "transforme", "descubra", "o dia mais importante da sua vida", "sem dor de cabeça", "o melhor", "o mais barato",
  "o único", "garantido", "garantia total", "todo mundo usa", "aprovado por noivas", "seguro 100%", "premium",
  "comenta aqui", "comente aqui", "marque uma amiga", "marca uma amiga", "sorteio", "só hoje", "promoção",
  "imperdível", "corre que", "gerações ilimitadas", "edições ilimitadas", "4 modelos", "quatro modelos"
];
const MONEY_OK = ["R$89,90", "R$149,90", "R$0", "R$10.000", "R$389"];
const PERCENT_OK = ["0%", "3,89%", "100%"];
// "Noivar" com N maiúsculo é a marca; "noivar" minúsculo é o verbo e passa.
const MASCULINE_BRAND = /(?<![\p{L}\p{N}])(?:[Oo]|[AaDdNn][Oo]|[Pp]elo)\s+Noivar(?![\p{L}\p{N}])/u;

/** Regras do lote semanal. mode "hard" = só o que a API e a política de link exigem (vale na hora de publicar). */
export function validatePost(post, { history = [], today = todaySaoPaulo(), mode = "full" } = {}) {
  if (!post || typeof post !== "object" || Array.isArray(post)) return ["o post precisa ser um objeto JSON"];
  const { text, link_url: link, topic_tag: tag } = post;
  const hasText = typeof text === "string" && text.trim() !== "";
  const issues = [];

  if (!hasText) issues.push("text vazio ou ausente");
  else {
    const length = threadsLength(text);
    if (length > MAX_LENGTH) issues.push(`text com ${length} caracteres na contagem do Threads (máximo ${MAX_LENGTH})`);
    if (containsUrl(text)) issues.push("text tem URL ou domínio: o link vai só em link_url");
  }
  if (link != null) {
    const linkIssues = typeof link === "string" ? validateLink(link) : ["precisa ser texto ou null"];
    issues.push(...linkIssues.map((issue) => `link_url: ${issue}`));
  }
  if (tag != null && (typeof tag !== "string" || !/^[^.&]{1,50}$/u.test(tag))) {
    issues.push("topic_tag: de 1 a 50 caracteres, sem ponto (.) nem &");
  }
  if (mode === "hard") return issues;

  for (const key of Object.keys(post)) if (!POST_KEYS.includes(key)) issues.push(`campo desconhecido: ${key}`);
  if (!/^P[1-6]$/.test(post.pillar)) issues.push("pillar precisa ser P1 a P6");
  if (typeof post.topic !== "string" || post.topic.length > 120 || !KEBAB.test(post.topic)) {
    issues.push("topic precisa ser kebab-case com até 120 caracteres (ex.: confirmacao-prazo)");
  }
  if (!isIsoDate(post.scheduled_for)) issues.push("scheduled_for precisa ser uma data AAAA-MM-DD");
  else if (post.scheduled_for < today) issues.push(`scheduled_for ${post.scheduled_for} já passou (hoje é ${today})`);
  if (!Array.isArray(post.facts) || !post.facts.every((id) => typeof id === "string" && KEBAB.test(id))) {
    issues.push("facts precisa ser uma lista de ids kebab-case da fatos.md");
  }
  if (hasText) issues.push(...contentIssues(text), ...repetitionIssues(text, history));
  return issues;
}

/** Valida o lote inteiro: cada item também é comparado com os itens anteriores do mesmo lote. */
export function validateBatch(items, { history = [], today = todaySaoPaulo() } = {}) {
  return items.map((item, index) =>
    validatePost(item, { history: [...items.slice(0, index).reverse(), ...history], today })
  );
}

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function contentIssues(text) {
  const norm = ` ${normalize(text)} `;
  const has = (phrase) => norm.includes(` ${normalize(phrase)} `);
  const issues = [];
  if (EMOJI.test(text)) issues.push("sem emoji");
  if (text.includes("!")) issues.push("sem exclamação (!)");
  if (/#[\p{L}\p{N}_]/u.test(text)) issues.push("sem hashtag no texto (use topic_tag)");
  if (MASCULINE_BRAND.test(text)) issues.push('a marca é feminina: "a Noivar", "da Noivar", "na Noivar" (nunca "o Noivar")');
  if (has("vows")) issues.push('"Vows" é nome interno: não aparece em post');
  if (has("mural")) issues.push('não existe "mural": os recados ficam no painel do casal');
  for (const phrase of BANNED) if (has(phrase)) issues.push(`expressão proibida: "${phrase}"`);

  const money = [...text.matchAll(/R\$\s*\d[\d.,]*/gi)].map((m) =>
    m[0].replace(/\s+/g, "").replace(/[.,]+$/, "").toUpperCase()
  );
  const percents = [...text.matchAll(/\d[\d.,]*\s*%/g)].map((m) => m[0].replace(/\s+/g, ""));
  for (const value of money) if (!MONEY_OK.includes(value)) issues.push(`valor fora da ficha de fatos: ${value}`);
  for (const value of percents) if (!PERCENT_OK.includes(value)) issues.push(`percentual fora da ficha de fatos: ${value}`);
  if (money.includes("R$149,90") && !has("ia")) {
    issues.push("R$ 149,90 é só o preço do site feito pela IA: diga IA no texto (publicar no editor custa R$ 89,90)");
  }
  if ((percents.includes("0%") || / sem taxas? | taxa zero /.test(norm)) && !has("pix")) {
    issues.push('"0%", "sem taxa" e "taxa zero" valem só no Pix: diga Pix no texto');
  }
  if (percents.includes("3,89%") && !has("varia por plano") && !has("consultada em setembro de 2026")) {
    issues.push('3,89% exige a ressalva "varia por plano" ou "consultada em setembro de 2026"');
  }
  return issues;
}

// history: mais recente primeiro; itens são linhas {id?, text} ou strings.
function repetitionIssues(text, history) {
  const words = normalize(text).split(" ");
  const opening = words.slice(0, 5).join(" ");
  const grams = trigrams(words);
  const issues = [];
  history.forEach((entry, index) => {
    const other = typeof entry === "string" ? entry : entry?.text;
    if (typeof other !== "string") return;
    const otherWords = normalize(other).split(" ");
    const ref = `${entry?.id ? `#${entry.id} ` : ""}"${snippet(other)}"`;
    if (otherWords.join(" ") === words.join(" ")) issues.push(`texto igual a ${ref}`);
    else if (index < 30 && otherWords.slice(0, 5).join(" ") === opening) issues.push(`mesmas 5 primeiras palavras de ${ref}`);
    else if (index < 60) {
      const similarity = jaccard(grams, trigrams(otherWords));
      if (similarity > 0.5) issues.push(`parecido demais com ${ref} (similaridade ${similarity.toFixed(2)})`);
    }
  });
  return issues;
}

const trigrams = (words) => new Set(words.slice(2).map((word, i) => `${words[i]} ${words[i + 1]} ${word}`));

function jaccard(a, b) {
  let shared = 0;
  for (const gram of a) if (b.has(gram)) shared++;
  const union = a.size + b.size - shared;
  return union ? shared / union : 0;
}

function snippet(text, max = 50) {
  const line = String(text).split("\n")[0].trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

// ---- Datas e token (puras) --------------------------------------------------------

const SP_DATE = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export function todaySaoPaulo(now = new Date()) {
  const parts = Object.fromEntries(SP_DATE.formatToParts(now).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function startOfTodaySaoPauloISO(now = new Date()) {
  // ponytail: São Paulo está em UTC-03:00 o ano todo desde 2019 (fim do horário de verão);
  // se o horário de verão voltar, calcular o offset do dia pelo Intl.
  return new Date(`${todaySaoPaulo(now)}T00:00:00-03:00`).toISOString();
}

/** Renova quando faltam < 30 dias, o último refresh tem >= 24 h + 5 min e o token ainda vale. */
export function needsRefresh(token, now = new Date()) {
  const time = now.getTime();
  const expires = Date.parse(token?.expires_at);
  const refreshed = Date.parse(token?.refreshed_at);
  const oldEnough = Number.isNaN(refreshed) || time - refreshed >= DAY + 5 * MINUTE; // sem data: tenta
  return expires > time && expires - time < 30 * DAY && oldEnough;
}

// ---- Infra da CLI ----------------------------------------------------------------

const SECRETS = new Set();

function keepSecret(value) {
  if (value) SECRETS.add(value);
  return value;
}

/** Tira qualquer segredo conhecido de mensagens que vão para a tela, o banco ou o ping. */
function scrub(text) {
  let out = String(text);
  for (const secret of SECRETS) if (secret.length >= 8) out = out.split(secret).join("[segredo]");
  return out;
}

function errorText(error) {
  const detail = { message: error.message, status: error.status, graph: error.graph, body: error.body };
  return scrub(JSON.stringify(detail)).slice(0, 4000);
}

const reason = (error) =>
  error?.name === "TimeoutError" ? "tempo esgotado (30 s)" : (error?.cause?.code ?? error?.cause?.message ?? error?.message);

// Carrega o .env (parser simples) quando a var não está no ambiente.
function loadEnv() {
  try {
    const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of env.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // sem .env: usa o que já estiver no ambiente
  }
}

function dbEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (no ambiente ou no .env da pasta acima de scripts/)"
    );
  }
  keepSecret(key);
  return { url: url.replace(/\/+$/, ""), key };
}

/** PostgREST da tabela threads_posts com a chave service_role. */
async function db(method, query, body, prefer) {
  const { url, key } = dbEnv();
  // Chave nova (sb_secret_...) não é JWT e vai só no apikey; a legada (JWT) vai também no Authorization.
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  if (prefer) headers.Prefer = prefer;
  let response;
  try {
    response = await fetch(`${url}/rest/v1/threads_posts${query}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000)
    });
  } catch (error) {
    throw new Error(`falha de rede no Supabase (${method}): ${reason(error)}`);
  }
  const raw = await response.text();
  if (!response.ok) {
    throw Object.assign(new Error(`Supabase ${method} → HTTP ${response.status}: ${raw.slice(0, 500)}`), {
      status: response.status,
      body: raw.slice(0, 2000)
    });
  }
  return raw ? JSON.parse(raw) : null;
}

/** Chamada à API do Threads. GET leva os parâmetros na query; POST, no corpo form-encoded. */
async function graph(method, endpoint, params, { retry = false, versioned = true } = {}) {
  const url = `${GRAPH}${versioned ? "/v1.0" : ""}${endpoint}`;
  const label = `${method} ${endpoint}`; // nunca a URL com query: ela leva o token
  for (let attempt = 1; ; attempt++) {
    const canRetry = retry && attempt === 1;
    let response;
    try {
      response =
        method === "GET"
          ? await fetch(`${url}?${new URLSearchParams(params)}`, { signal: AbortSignal.timeout(30_000) })
          : await fetch(url, { method, body: new URLSearchParams(params), signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      if (canRetry) {
        await sleep(10_000);
        continue;
      }
      throw new Error(`falha de rede em ${label}: ${reason(error)}`);
    }
    const raw = await response.text();
    if (canRetry && response.status >= 500) {
      await sleep(10_000);
      continue;
    }
    let json = null;
    try {
      json = JSON.parse(raw);
    } catch {
      // corpo não-JSON: vai inteiro para o erro abaixo
    }
    // Graph: {error:{message,type,code,error_subcode,fbtrace_id}}; endpoints de token: {error_type,code,error_message}.
    // (O status do container também traz error_message, mas sem error_type: não é erro da chamada.)
    const apiError =
      (json && typeof json.error === "object" && json.error) ||
      (json?.error_type ? { message: json.error_message, type: json.error_type, code: json.code } : null);
    if (!response.ok || apiError || !json) {
      const code = apiError?.code ? ` (code ${apiError.code}${apiError.error_subcode ? `, subcode ${apiError.error_subcode}` : ""})` : "";
      const detail = apiError ? `${apiError.message}${code}` : raw.slice(0, 300);
      throw Object.assign(new Error(`Threads ${label} → HTTP ${response.status}: ${detail}`), {
        status: response.status,
        graph: apiError ?? undefined,
        body: apiError ? undefined : raw.slice(0, 1000)
      });
    }
    return json;
  }
}

async function ping(base, suffix, body = "") {
  if (!base) return;
  try {
    const response = await fetch(`${base}${suffix}`, { method: "POST", body, signal: AbortSignal.timeout(10_000) });
    await response.text();
  } catch {
    // o ping é só alerta: falhar aqui não muda o resultado
  }
}

function tokenFile() {
  return process.env.THREADS_TOKEN_FILE || fileURLToPath(new URL("../threads-token.json", import.meta.url));
}

async function readToken(file) {
  let token;
  try {
    token = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`arquivo de token não encontrado (${file}): rode "node scripts/threads-bot.mjs token <TOKEN>"`);
    }
    throw new Error(`arquivo de token ilegível (${file}): rode token de novo`);
  }
  if (!token?.access_token || !token.user_id || Number.isNaN(Date.parse(token.expires_at))) {
    throw new Error(`arquivo de token incompleto (${file}): rode token de novo`);
  }
  keepSecret(token.access_token);
  if (Date.parse(token.expires_at) <= Date.now()) throw new Error("token expirado: gere outro no painel da Meta e rode token");
  return token;
}

/** Grava com 0600 num temporário e troca de nome: nunca fica um arquivo de token pela metade. */
async function writeToken(file, token) {
  const temp = `${file}.${process.pid}.tmp`;
  await rm(temp, { force: true });
  const handle = await open(temp, "wx", 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(token, null, 2)}\n`);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temp, file);
}

function expiry(token) {
  const expires = Date.parse(token.expires_at);
  const days = Math.floor((expires - Date.now()) / DAY);
  return `expira em ${new Date(expires).toLocaleDateString("pt-BR", { timeZone: TZ })} (${days} dia${days === 1 ? "" : "s"})`;
}

async function refreshToken(file, token) {
  const response = await graph(
    "GET",
    "/refresh_access_token",
    { grant_type: "th_refresh_token", access_token: token.access_token },
    { versioned: false }
  );
  if (!response.access_token || !response.expires_in) throw new Error("o refresh não devolveu access_token/expires_in");
  keepSecret(response.access_token);
  const now = Date.now();
  const next = {
    ...token,
    access_token: response.access_token,
    expires_at: new Date(now + response.expires_in * 1000).toISOString(),
    refreshed_at: new Date(now).toISOString()
  };
  await writeToken(file, next); // antes de qualquer outra coisa: o token antigo pode deixar de valer
  return next;
}

// Fluxo em dois passos (container → FINISHED → publish), nunca auto_publish_text.
async function createContainer(token, post) {
  const params = { media_type: "TEXT", text: post.text, access_token: token.access_token };
  if (post.link_url) params.link_attachment = post.link_url;
  if (post.topic_tag) params.topic_tag = post.topic_tag;
  const { id } = await graph("POST", `/${token.user_id}/threads`, params, { retry: true });
  if (!id) throw new Error("a API não devolveu o id do container");
  return id;
}

async function waitContainer(token, containerId) {
  await sleep(30_000);
  let last = "";
  for (let check = 1; check <= 5; check++) {
    if (check > 1) await sleep(60_000);
    let state;
    try {
      state = await graph("GET", `/${containerId}`, { fields: "status,error_message", access_token: token.access_token });
    } catch (error) {
      last = error.message; // leitura que falha conta como checagem
      continue;
    }
    if (state.status === "FINISHED") return;
    if (state.status === "ERROR" || state.status === "EXPIRED") {
      throw new Error(`container ${state.status}: ${state.error_message || "sem detalhe"}`);
    }
    last = `status ${state.status}`;
  }
  throw new Error(`container ${containerId} não ficou FINISHED em 5 checagens (${last})`);
}

async function publishContainer(token, containerId) {
  try {
    const { id } = await graph("POST", `/${token.user_id}/threads_publish`, {
      creation_id: containerId,
      access_token: token.access_token
    });
    if (!id) throw new Error("a API não devolveu o id do post");
    return id;
  } catch (error) {
    // nunca repetir o publish: o post pode ter saído mesmo com erro
    error.message = `publish falhou (o post pode ter saído mesmo assim: confira no perfil antes de reaprovar): ${error.message}`;
    throw error;
  }
}

async function getPermalink(token, mediaId) {
  try {
    const { permalink } = await graph("GET", `/${mediaId}`, { fields: "permalink", access_token: token.access_token });
    return permalink ?? null;
  } catch (error) {
    console.error(`aviso: o post saiu, mas não consegui ler o permalink (${scrub(error.message)})`);
    return null;
  }
}

function parseFlags(args, spec) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("--")) {
      rest.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (!Object.hasOwn(spec, name)) throw new Error(`opção desconhecida: ${arg} (veja: node scripts/threads-bot.mjs ajuda)`);
    if (spec[name] === "valor") {
      if (i + 1 >= args.length) throw new Error(`${arg} precisa de um valor`);
      flags[name] = args[++i];
    } else flags[name] = true;
  }
  return { flags, rest };
}

function parseIds(list) {
  for (const id of list) if (!/^[1-9]\d{0,15}$/.test(id)) throw new Error(`id inválido: ${id}`);
  return list.join(",");
}

function idList(rows) {
  return rows.map((row) => `#${row.id}`).join(", ");
}

// ---- Comandos ----------------------------------------------------------------------

const HELP = `Bot do Threads da Noivar: fila em public.threads_posts, publicação pela API oficial.

Uso: node scripts/threads-bot.mjs <comando>

No VPS
  token <TOKEN>                     valida o token, troca por um de 60 dias se for curto e grava o arquivo
  teste "<texto>" [--link <url>]    publica UM post agora, sem banco (teste de visibilidade)
  publicar [--simular]              job diário: publica o próximo post aprovado (--simular só lê)

No PC
  fila [--n <N>] [--json]           últimos N posts (padrão 30) e quantos aprovados restam
  enfileirar <arquivo.json> [--checar] [--aprovado]
                                    valida o lote inteiro e insere como draft (ou approved)
  aprovar <id...> | --todos         draft → approved
  descartar <id...>                 apaga posts que ainda estão em draft
  ajuda                             mostra esta ajuda

Variáveis (do ambiente ou do .env na pasta acima de scripts/):
  NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY   fila no Supabase (publicar, fila, enfileirar, aprovar, descartar)
  THREADS_TOKEN_FILE   arquivo do token (padrão: threads-token.json na pasta acima de scripts/)
  THREADS_APP_SECRET   só no token, para trocar um token curto por um de 60 dias
  HEALTHCHECK_URL      só no publicar: ping de início, sucesso e falha`;

const VISIBILITY_TEST = `Teste de visibilidade:
  1. Abra o link numa janela anônima, sem login: o post precisa aparecer.
  2. Abra logado com outra conta do Threads, que não seja tester do app.
  3. Se usou --link, confira se o card do link aparece.
Se o post não aparecer para quem não é tester, veja no THREADS.md o passo de publicar o app no painel da Meta.
Depois do teste, apague o post pelo app do Threads.`;

async function cmdToken(args) {
  const { rest } = parseFlags(args, {});
  if (rest.length !== 1) throw new Error("uso: token <TOKEN>");
  const input = keepSecret(rest[0].trim());
  const me = await graph("GET", "/me", { fields: "id,username", access_token: input });
  if (!me.id) throw new Error("o /me não devolveu o id do perfil");
  const { data: info } = await graph("GET", "/debug_token", { input_token: input, access_token: input });
  if (!info?.is_valid) throw new Error("o debug_token diz que este token não é válido: gere outro no painel da Meta");
  if (!info.expires_at) throw new Error("o debug_token não informou a validade do token");
  if (Array.isArray(info.scopes) && !info.scopes.includes("threads_content_publish")) {
    console.error("aviso: o token não tem a permissão threads_content_publish; publicar vai falhar");
  }
  const now = Date.now();
  let token = {
    access_token: input,
    user_id: String(me.id),
    username: me.username,
    expires_at: new Date(info.expires_at * 1000).toISOString(),
    refreshed_at: new Date(info.issued_at ? info.issued_at * 1000 : now).toISOString()
  };
  if (info.expires_at * 1000 - now < 2 * DAY) {
    const secret = keepSecret(process.env.THREADS_APP_SECRET);
    if (!secret) {
      const hours = Math.max(0, Math.round((info.expires_at * 1000 - now) / HOUR));
      throw new Error(
        `este token é de curta duração (vence em ~${hours} h). Defina THREADS_APP_SECRET (o "Threads App Secret" ` +
          "do painel da Meta, não o App Secret comum) e rode token de novo para trocá-lo por um de 60 dias, " +
          "ou gere um token de longa duração no painel (User Token Generator)."
      );
    }
    const long = await graph(
      "GET",
      "/access_token",
      { grant_type: "th_exchange_token", client_secret: secret, access_token: input },
      { versioned: false }
    );
    if (!long.access_token || !long.expires_in) throw new Error("a troca por token longo não devolveu access_token/expires_in");
    keepSecret(long.access_token);
    token = {
      ...token,
      access_token: long.access_token,
      expires_at: new Date(now + long.expires_in * 1000).toISOString(),
      refreshed_at: new Date(now).toISOString()
    };
  }
  const file = tokenFile();
  await writeToken(file, token);
  console.log(`token de @${token.username} gravado em ${file}: ${expiry(token)}.`);
  return 0;
}

async function cmdTeste(args) {
  const { flags, rest } = parseFlags(args, { link: "valor" });
  if (rest.length !== 1) throw new Error('uso: teste "<texto>" [--link <url>] (o texto vai entre aspas)');
  const post = { text: rest[0], link_url: flags.link ?? null };
  const issues = validatePost(post, { mode: "hard" });
  if (issues.length) throw new Error(`post de teste recusado:\n  - ${issues.join("\n  - ")}`);
  const token = await readToken(tokenFile());
  console.log(`publicando o post de teste como @${token.username} (leva cerca de 30 s)...`);
  const containerId = await createContainer(token, post);
  await waitContainer(token, containerId);
  const mediaId = await publishContainer(token, containerId);
  const permalink = await getPermalink(token, mediaId);
  console.log(`publicado: ${permalink ?? `media ${mediaId} (sem permalink)`}\n\n${VISIBILITY_TEST}`);
  return 0;
}

async function cmdPublicar(args) {
  const { flags, rest } = parseFlags(args, { simular: "flag" });
  if (rest.length) throw new Error("uso: publicar [--simular]");
  const simular = Boolean(flags.simular);
  const healthcheck = process.env.HEALTHCHECK_URL?.replace(/\/+$/, "");
  const warnings = []; // avisos que fazem a execução terminar como falha mesmo publicando
  const end = async (ok, message) => {
    const text = scrub([message, ...warnings].join("\n"));
    const success = ok && !warnings.length;
    (success ? console.log : console.error)(`${simular ? "[simulação] " : ""}${text}`);
    if (!simular) await ping(healthcheck, success ? "" : "/fail", text);
    return success ? 0 : 1;
  };

  console.log(`${new Date().toISOString()} publicar${simular ? " --simular" : ""}`);
  if (!simular) await ping(healthcheck, "/start");
  let claimed = null; // linha reservada e ainda não publicada: em erro, vira failed
  try {
    dbEnv();
    const file = tokenFile();
    let token = await readToken(file);
    console.log(`token de @${token.username} ${expiry(token)}`);
    if (needsRefresh(token)) {
      if (simular) console.log("o token seria renovado agora");
      else {
        try {
          token = await refreshToken(file, token);
          console.log(`token renovado: ${expiry(token)}`);
        } catch (error) {
          warnings.push(`AVISO: não consegui renovar o token (${error.message}). Ele ainda vale: ${expiry(token)}.`);
        }
      }
    }

    // Linha presa em publishing = execução que caiu no meio: não arrisca post duplicado hoje.
    const publishing = await db("GET", "?status=eq.publishing&select=id,updated_at");
    const stuck = publishing.filter((row) => Date.parse(row.updated_at) < Date.now() - 15 * MINUTE);
    if (stuck.length) {
      if (!simular) {
        await db("PATCH", `?id=in.(${stuck.map((row) => row.id).join(",")})&status=eq.publishing`, {
          status: "failed",
          error: STUCK_ERROR
        });
      }
      return end(false, `${idList(stuck)} preso(s) em publishing ${simular ? "seria(m)" : "foi(ram)"} marcado(s) failed (${STUCK_ERROR}); nada sai hoje`);
    }
    if (publishing.length) {
      console.log(`outra execução está publicando ${idList(publishing)}; nada a fazer`);
      return 0;
    }

    const today = todaySaoPaulo();
    const [done] = await db("GET", `?status=eq.published&published_at=gte.${startOfTodaySaoPauloISO()}&select=id,permalink&limit=1`);
    if (done) return end(true, `já publicado hoje (${[`#${done.id}`, done.permalink].filter(Boolean).join(" ")})`);

    const [next] = await db(
      "GET",
      `?status=eq.approved&or=(scheduled_for.is.null,scheduled_for.lte.${today})&order=scheduled_for.asc.nullslast,created_at.asc,id.asc&limit=1`
    );
    if (!next) return end(false, "fila vazia: nenhum post aprovado para hoje");
    const issues = validatePost(next, { mode: "hard" });
    if (simular) {
      if (issues.length) return end(false, `#${next.id} seria marcado failed: ${issues.join("; ")}`);
      const extras = [next.link_url && `link: ${next.link_url}`, next.topic_tag && `tópico: ${next.topic_tag}`].filter(Boolean);
      return end(
        true,
        `publicaria #${next.id} (${next.pillar} ${next.topic}, ${next.scheduled_for ?? "sem data"}, ${threadsLength(next.text)} caracteres):\n${next.text}${extras.length ? `\n${extras.join("\n")}` : ""}`
      );
    }

    const [row] = await db(
      "PATCH",
      `?id=eq.${next.id}&status=eq.approved`,
      { status: "publishing", attempts: next.attempts + 1 },
      "return=representation"
    );
    if (!row) {
      console.log(`#${next.id} foi reservado por outra execução; nada a fazer`);
      return 0;
    }
    claimed = row;
    if (issues.length) throw new Error(`validação: ${issues.join("; ")}`);

    console.log(`publicando #${row.id} (${row.pillar} ${row.topic})...`);
    const containerId = await createContainer(token, row);
    await db("PATCH", `?id=eq.${row.id}`, { container_id: containerId });
    await waitContainer(token, containerId);
    const mediaId = await publishContainer(token, containerId);
    claimed = null; // o post saiu: daqui em diante nada marca a linha como failed

    const permalink = await getPermalink(token, mediaId);
    try {
      await db("PATCH", `?id=eq.${row.id}`, {
        status: "published",
        threads_media_id: mediaId,
        permalink,
        published_at: new Date().toISOString(),
        error: null
      });
    } catch (error) {
      return end(
        false,
        `#${row.id} PUBLICADO (media ${mediaId}, ${permalink ?? "sem permalink"}), mas não consegui gravar no banco: ${error.message}. ` +
          "Marque a linha como published à mão antes da próxima execução."
      );
    }
    const approved = await db("GET", "?status=eq.approved&select=id").catch(() => null);
    return end(
      true,
      `publicado #${row.id}: ${permalink ?? `media ${mediaId} (sem permalink)`} | aprovados na fila: ${approved?.length ?? "?"} | token ${expiry(token)}`
    );
  } catch (error) {
    if (claimed) {
      try {
        await db("PATCH", `?id=eq.${claimed.id}&status=eq.publishing`, { status: "failed", error: errorText(error) });
      } catch (patchError) {
        console.error(`não consegui marcar #${claimed.id} como failed (${scrub(patchError.message)}); a próxima execução trata a linha presa`);
      }
    }
    return end(false, `falhou${claimed ? ` #${claimed.id}` : ""}: ${error.message}`);
  }
}

async function cmdFila(args) {
  const { flags, rest } = parseFlags(args, { n: "valor", json: "flag" });
  if (rest.length) throw new Error("uso: fila [--n <N>] [--json]");
  const limit = Number(flags.n ?? 30);
  if (!/^\d+$/.test(flags.n ?? "30") || limit < 1 || limit > 1000) throw new Error("--n precisa ser um número de 1 a 1000");
  // Um lote inteiro tem o mesmo created_at (insert único): o id desempata.
  const rows = await db("GET", `?select=*&order=created_at.desc,id.desc&limit=${limit}`);
  const approved = await db("GET", "?status=eq.approved&select=scheduled_for");
  const last = approved.map((row) => row.scheduled_for).filter(Boolean).sort().at(-1) ?? null;
  if (flags.json) {
    console.log(JSON.stringify({ approved_remaining: approved.length, last_scheduled_for: last, posts: rows }, null, 2));
    return 0;
  }
  for (const row of rows) {
    const outcome =
      row.status === "published"
        ? ["publicado", new Date(row.published_at).toLocaleString("pt-BR", { timeZone: TZ }), row.permalink].filter(Boolean).join(" ")
        : row.error
          ? `erro: ${snippet(row.error, 120)}`
          : "";
    console.log(`#${row.id}  ${row.status}  ${row.scheduled_for ?? "sem data"}  ${row.pillar}  ${row.topic}${row.link_url ? "  [link]" : ""}`);
    console.log(`    ${snippet(row.text, 80)}`);
    if (outcome) console.log(`    ${outcome}`);
  }
  console.log(`\naprovados na fila: ${approved.length}${last ? ` (último scheduled_for: ${last})` : ""}`);
  return 0;
}

async function cmdEnfileirar(args) {
  const { flags, rest } = parseFlags(args, { checar: "flag", aprovado: "flag" });
  if (rest.length !== 1) throw new Error("uso: enfileirar <arquivo.json> [--checar] [--aprovado]");
  dbEnv();
  let items;
  try {
    items = JSON.parse((await readFile(rest[0], "utf8")).replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error(`não consegui ler ${rest[0]} como JSON: ${error.message}`);
  }
  if (!Array.isArray(items) || !items.length) throw new Error("o arquivo precisa ser uma lista JSON com pelo menos um post");

  const history = await db(
    "GET",
    "?status=in.(draft,approved,publishing,published)&select=id,text&order=created_at.desc,id.desc&limit=60"
  );
  const results = validateBatch(items, { history, today: todaySaoPaulo() });
  results.forEach((issues, index) => {
    const post = items[index] ?? {};
    console.log(`item ${index + 1} (${post.scheduled_for ?? "?"} ${post.pillar ?? "?"} ${post.topic ?? "?"}): ${issues.length ? "" : "ok"}`);
    for (const issue of issues) console.log(`  - ${issue}`);
  });
  const bad = results.filter((issues) => issues.length).length;
  if (bad) {
    console.error(`\n${bad} post(s) com problema: nada foi inserido.`);
    return 1;
  }
  if (flags.checar) {
    console.log(`\nlote válido (${items.length} posts); nada foi inserido (--checar).`);
    return 0;
  }
  const status = flags.aprovado ? "approved" : "draft";
  const rows = items.map((post) => ({
    status,
    scheduled_for: post.scheduled_for,
    pillar: post.pillar,
    topic: post.topic,
    text: post.text,
    link_url: post.link_url ?? null,
    topic_tag: post.topic_tag ?? null,
    facts: post.facts
  }));
  const inserted = await db("POST", "?select=id", rows, "return=representation");
  console.log(`\n${inserted.length} post(s) inserido(s) como ${status}: ${idList(inserted)}`);
  if (status === "draft") console.log(`aprove com: node scripts/threads-bot.mjs aprovar ${inserted.map((row) => row.id).join(" ")}`);
  return 0;
}

async function cmdAprovar(args) {
  const { flags, rest } = parseFlags(args, { todos: "flag" });
  if (flags.todos ? rest.length : !rest.length) throw new Error("uso: aprovar <id...> | aprovar --todos");
  const filter = flags.todos ? "" : `id=in.(${parseIds(rest)})&`;
  const rows = await db("PATCH", `?${filter}status=eq.draft&select=id`, { status: "approved" }, "return=representation");
  console.log(`${rows.length} post(s) aprovado(s)${rows.length ? `: ${idList(rows)}` : ""}`);
  reportUnchanged(rest, rows);
  return 0;
}

async function cmdDescartar(args) {
  const { rest } = parseFlags(args, {});
  if (!rest.length) throw new Error("uso: descartar <id...>");
  const rows = await db("DELETE", `?id=in.(${parseIds(rest)})&status=eq.draft&select=id`, undefined, "return=representation");
  console.log(`${rows.length} post(s) apagado(s)${rows.length ? `: ${idList(rows)}` : ""}`);
  reportUnchanged(rest, rows);
  return 0;
}

function reportUnchanged(ids, rows) {
  const changed = new Set(rows.map((row) => String(row.id)));
  const unchanged = ids.filter((id) => !changed.has(id));
  if (unchanged.length) console.log(`sem mudança (não estão em draft ou não existem): ${unchanged.map((id) => `#${id}`).join(", ")}`);
}

const COMMANDS = {
  token: cmdToken,
  teste: cmdTeste,
  publicar: cmdPublicar,
  fila: cmdFila,
  enfileirar: cmdEnfileirar,
  aprovar: cmdAprovar,
  descartar: cmdDescartar
};

async function main(argv) {
  const [command, ...args] = argv;
  if (!command || ["ajuda", "--help", "-h"].includes(command)) {
    console.log(HELP);
    return 0;
  }
  if (!Object.hasOwn(COMMANDS, command)) {
    console.error(`comando desconhecido: ${command}\n\n${HELP}`);
    return 1;
  }
  loadEnv();
  return COMMANDS[command](args);
}

// Só roda a CLI quando o arquivo é executado direto (os testes importam as funções).
function isDirectRun() {
  if (!process.argv[1]) return false;
  try {
    const self = fileURLToPath(import.meta.url);
    const invoked = realpathSync(path.resolve(process.argv[1]));
    return process.platform === "win32" ? self.toLowerCase() === invoked.toLowerCase() : self === invoked;
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(`erro: ${scrub(error?.message ?? error)}`);
      process.exitCode = 1;
    }
  );
}
