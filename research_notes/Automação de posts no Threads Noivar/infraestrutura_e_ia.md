# Infraestrutura gratuita para o job diário de posts no Threads + geração de texto por IA (estado em outubro/2026)

> Notas de pesquisa. Consultas feitas em 13/10/2026. Câmbio usado nas conversões: **PTAX venda de 13/10/2026 = R$ 5,0096/US$** (arredondado para R$ 5,01) — [Banco Central, API Olinda PTAX](https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='10-01-2026'&@dataFinalCotacao='10-13-2026'&$format=json). Atenção: o dólar oscilou de R$ 5,22 (02/10) a R$ 4,97 (06/10) no mesmo mês, segundo a mesma série.
> Fontes locais são citadas como `caminho` + linhas, relativas a `C:/Meus Sites/Noivar Sistema`. Nenhum arquivo do projeto foi alterado; nenhum valor de segredo foi lido para estas notas (só nomes de variáveis).

---

## 1. Projeto existente (Noivar) — o que já existe e pode ser reaproveitado

### Takeaway
O projeto **já contém todas as peças de infraestrutura** que o job do Threads precisa: Vercel Cron com `CRON_SECRET`, cliente Supabase service-role, tabela de tokens OAuth cifrados com renovação automática por cron (Mercado Pago), tabela de log de erros com leitura só para admin, e uma área `/admin` protegida. **Não há nenhum SDK de IA, de e-mail ou de Telegram instalado**, e o repositório no GitHub é **público e está 41 commits atrás do código local**, o que pesa contra qualquer solução baseada em GitHub (Actions, routines que clonam o repo).

### Cited Findings

**Crons declarados**
- `vercel.json` declara dois crons diários: `/api/cron/keep-alive` em `0 6 * * *` e `/api/cron/mercadopago-refresh` em `0 7 * * *` (UTC) — `vercel.json` L3–12.
- O README está desatualizado nesse ponto: afirma "No `vercel.json` overrides exist" — `README.md` L145–146.

**Autenticação das rotas de cron**
- `/api/cron/mercadopago-refresh` exige `Authorization: Bearer <CRON_SECRET>`; falha fechada (401) se a env não existir ou não bater; comparação em tempo constante com `timingSafeEqualStr` — `src/app/api/cron/mercadopago-refresh/route.ts` L14–20; helper em `src/lib/abacatepay.ts` L237–243.
- A rota roda em `runtime = "nodejs"` e `dynamic = "force-dynamic"`; em erro faz apenas `console.error` e devolve 500 (não grava em banco) — `src/app/api/cron/mercadopago-refresh/route.ts` L5–6, L25–29.
- `/api/cron/keep-alive` é **pública para a parte de leitura** (qualquer GET executa o SELECT); só a parte de escrita (purga de identificadores de anúncio) exige o `CRON_SECRET` — `src/app/api/cron/keep-alive/route.ts` L14–32.
- O middleware de sessão **não intercepta `/api`** (matcher exclui `api`), então rotas de cron não passam pelo redirecionamento de login — `src/middleware.ts` L75–80.
- `CRON_SECRET` já está documentado no `.env.example` ("Sem ele, a rota /api/cron/mercadopago-refresh recusa qualquer chamada") e no runbook — `.env.example` L58–60; `PRODUCTION.md` L53–54.

**O que o keep-alive faz**
- Faz um `select("id", { count: "exact", head: true })` em `profiles` com o client service-role, explicitamente "para que o Supabase não considere o projeto inativo e o pause (free tier pausa após ~7 dias sem tráfego)" — `src/app/api/cron/keep-alive/route.ts` L8–19.
- Com o segredo válido, também chama a RPC `purge_funnel_ad_ids` (retenção LGPD de 30 dias) e registra falha via `logServerError` — `src/app/api/cron/keep-alive/route.ts` L25–32; função SQL em `supabase/migrations/0011_funnel_events.sql` L36–49.

**Padrão de token OAuth armazenado e renovado (Mercado Pago) — o mesmo que o token do Threads precisa**
- Tabela `public.mp_connections`: `access_token_enc`, `refresh_token_enc` (texto cifrado), `expires_at timestamptz`, `status` (`active|revoked|error`), `last_error`, `updated_at` com trigger; chave primária é `wedding_id` (FK para `weddings`) — `supabase/migrations/0010_mercadopago_card_gifts.sql` L18–43.
- A tabela é inacessível ao browser: RLS ligada **sem nenhuma policy** + `revoke all ... from anon, authenticated`; só `service_role` lê/escreve — `supabase/migrations/0010_mercadopago_card_gifts.sql` L45–46.
- Cifragem na aplicação com AES-256-GCM, formato `v1.<iv>.<tag>.<ciphertext>`; a chave vem **exclusivamente** de `MERCADOPAGO_TOKEN_ENCRYPTION_KEY` (nome fixo no código) — `src/lib/secret-box.ts` L10–40.
- Renovação em duas camadas: (a) preguiçosa no uso, quando faltam menos de 7 dias (`REFRESH_WINDOW_MS`); (b) cron diário que renova tudo que vence em 30 dias (`CRON_WINDOW_MS`) — `src/lib/mercadopago-server.ts` L34–37, L197–203, L315–343.
- `refreshConnection` grava o novo par **antes** de devolver o token, trata corrida relendo a linha e marca `revoked`/`error` com `last_error` — `src/lib/mercadopago-server.ts` L142–195.
- As chamadas HTTP ao provedor são `fetch` puro, sem SDK, e nunca logam o corpo da resposta (que carrega tokens) — `src/lib/mercadopago.ts` L134–150, L169–177.
- O callback OAuth grava a conexão e sinaliza quando falta `offline_access` (sem ele não há renovação) — `src/app/api/mercadopago/oauth/callback/route.ts` L74–82. Início do fluxo com `state` em cookie httpOnly — `src/app/api/mercadopago/oauth/start/route.ts` L54–68.
- Ações de painel sobre a conexão usam o mesmo admin client após provar posse — `src/app/dashboard/mercadopago-actions.ts` L14–19, L28–31, L46.

**Client Supabase server-side**
- `createAdminClient()` em `src/lib/supabase/admin.ts` L10–23: `createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })`; lança erro se as envs faltarem.
- Os tipos do banco são **escritos à mão** ("Hand-written to match supabase/migrations/0001_init.sql") — `src/lib/supabase/types.ts` L1–3; tabelas tipadas hoje: `profiles`, `weddings`, `guests`, `messages`, `cash_gifts`, `mp_connections`, `publish_payments`, `funnel_events` — `src/lib/supabase/types.ts` L17–288.

**Log e histórico de erros já existentes**
- Tabela `funnel_events` (`event`, `level info|error`, `path`, `detail jsonb`), escrita só pelo servidor e leitura só por admin via policy `is_admin()` — `supabase/migrations/0011_funnel_events.sql` L12–31.
- O comentário da migration registra o motivo: "os logs da Vercel duram ~1h no plano atual" — `supabase/migrations/0011_funnel_events.sql` L1–2.
- `logServerError(scope, error, ctx)` grava console estruturado + evento `level: error`; os nomes de evento são uma união fechada (`FunnelEventName`), com `action_failed` como padrão — `src/lib/funnel.ts` L14–35, L99–117.

**Área admin**
- `/admin/*` é protegido por `requireAdmin()` no layout — `src/app/admin/layout.tsx` L5–8; `src/lib/auth.ts` L26–38. Páginas existentes: `/admin`, `/admin/casamentos`, `/admin/pacotes`, `/admin/templates`, `/admin/usuarios` (com `actions.ts`).
- Admin é semeado por allowlist de e-mail em trigger — `supabase/migrations/0009_admin_allowlist.sql` L11–30; função `public.is_admin()` para policies — `supabase/migrations/0001_init.sql` L39–49.

**Dependências instaladas**
- Runtime: `@supabase/ssr`, `@supabase/supabase-js`, `framer-motion`, `next ^16.1.6`, `qrcode`, `react`, `react-dom`. Dev: eslint, tailwind, typescript, `vitest` — `package.json` L14–35.
- **Nenhum SDK de IA** (`@anthropic-ai/sdk`, `openai`, `@google/generative-ai`, `ai`), nenhum de e-mail (`resend`, `nodemailer`) e nenhuma referência a Telegram: busca por esses termos em `package.json` e `src/**` não retornou nada (verificado por grep em 13/10/2026).

**Variáveis de ambiente já previstas (`.env.example`)**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ABACATEPAY_API_KEY`, `ABACATEPAY_PUBLISH_PRODUCT_ID`, `ABACATEPAY_BASE_URL` (comentada), `ABACATEPAY_WEBHOOK_SECRET`, `ABACATEPAY_WEBHOOK_SIGNING_SECRET`, `APP_URL`, `MERCADOPAGO_CLIENT_ID`, `MERCADOPAGO_CLIENT_SECRET`, `MERCADOPAGO_TOKEN_ENCRYPTION_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_CARD_FEE_PERCENT`, `MERCADOPAGO_MAX_INSTALLMENTS`, `MERCADOPAGO_PKCE`, `CRON_SECRET`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_CAPI_TEST_EVENT_CODE`, `NEXT_PUBLIC_GA_MEASUREMENT_ID` — `.env.example` L5–71. Não existe nenhuma variável de IA, Threads, e-mail ou Telegram.

**Pasta `supabase/`**
- Contém apenas `migrations/0001`…`0014` (sem `0003`) e `.temp/cli-latest`; **não há `config.toml` nem pasta `functions/`** (nenhuma Edge Function no projeto) — listagem do diretório em 13/10/2026.
- Nenhuma migration usa `pg_cron`, `pg_net`, `cron.schedule` ou `vault` (grep sem resultados em `supabase/migrations`).
- As migrations são aplicadas manualmente no SQL Editor, em ordem — `PRODUCTION.md` L10–15 (a lista do runbook para em `0010`; `0011`–`0014` existem na pasta).

**Repositório e deploy**
- `origin` = `github.com/PedroFTortoriello/wedding-invitations-saas`; a API do GitHub informa `visibility: PUBLIC`, branch padrão `main`, `pushedAt: 2026-06-12` (consulta `gh repo view` em 13/10/2026).
- Localmente, `origin/main` tem um único commit ("Initial commit", 2026-06-12) e o HEAD (`feat/saas-production`) está **41 commits à frente** (`git rev-list --left-right --count origin/main...HEAD` → `0 41`).
- Existe `.vercel/project.json` (projeto vinculado por CLI, `projectName: clone-wedding`); o runbook diz "Merge da branch `feat/saas-production` na `main` (a Vercel publica `main`)" — `PRODUCTION.md` L87–89.
- Testes existentes com vitest cobrem o padrão de token: `tests/secret-box.test.ts`, `tests/mercadopago.test.ts`.

### Inferences
- O job do Threads cabe em **uma rota nova** copiando `mercadopago-refresh/route.ts` (mesmo guard de `CRON_SECRET`), mais uma entrada em `vercel.json`. Nenhuma dependência nova é necessária: o padrão do código é `fetch` puro (vale tanto para a API do Threads quanto para uma API de IA via REST).
- O token do Threads **não cabe em `mp_connections`** (a PK é `wedding_id`); precisa de uma tabela pequena própria (uma linha), reaproveitando `encryptSecret`/`decryptSecret`. A chave de cifragem tem nome específico do Mercado Pago; reutilizar a mesma chave funciona sem código novo, só fica com nome enganoso.
- Fila, histórico e status de aprovação cabem numa única tabela nova no mesmo Postgres (ex.: `status draft|approved|published|failed`, texto, `published_at`, id externo, erro). O histórico "para evitar repetição" é o próprio conjunto de linhas `published`.
- Erros do job podem ir para `funnel_events` via `logServerError` (já visível no admin e com retenção própria), contornando a retenção de 1h dos logs da Vercel. Seria preciso aceitar `action_failed` ou acrescentar um nome à união `FunnelEventName`.
- Uma página `/admin/...` de aprovação herda a proteção de `requireAdmin()` sem trabalho extra; `types.ts` teria de ser atualizado à mão para a tabela nova.
- O próprio job diário (lê e grava no Postgres todo dia) já gera atividade de banco, reforçando o keep-alive existente.
- O comentário "logs da Vercel duram ~1h no plano atual" e os crons todos diários são consistentes com o plano **Hobby** (ver seção 2), mas isso não foi confirmado no painel.

### Gaps
- **Não foi possível confirmar o que está em produção** nem o plano da Vercel (sem acesso ao painel). O remoto `origin/main` só tem o commit inicial; se o deploy de produção vem do Git, os crons e rotas locais podem não estar no ar. Crons só rodam contra o deployment de produção (seção 2).
- Não verifiquei se as migrations `0011`–`0014` e a tabela `mp_connections` estão de fato aplicadas no banco de produção.
- Não li o conteúdo de `.env` (só os nomes das 11 variáveis definidas); não sei quais envs estão cadastradas na Vercel.
- O plano do Supabase (Free vs Pro) não foi confirmado; o código assume Free (comentário do keep-alive).

---

## 2. Vercel Cron Jobs — limites por plano (Hobby em especial)

### Takeaway
No Hobby cabem até **100 crons por projeto**, cada um rodando **no máximo 1×/dia** e disparando **em qualquer minuto dentro da hora configurada**; a função pode durar até 300 s. Adicionar o 3º e o 4º cron diário cabe folgado. Os dois pontos de atenção reais são: (1) **o Hobby proíbe uso comercial** e o Noivar cobra R$ 149,90 — isso já é uma não conformidade hoje, independente do Threads; (2) entrega é best-effort, **sem retry**, e o Hobby não tem alertas nem logs além de 1 hora.

### Cited Findings
- Tabela oficial: Hobby = "100 cron jobs" por projeto, intervalo mínimo "Once per day", precisão "Per-hour (±59 min)"; Pro/Enterprise = 100 por projeto, 1×/minuto, precisão por minuto — [Vercel — Usage & Pricing for Cron Jobs](https://vercel.com/docs/cron-jobs/usage-and-pricing) (last_updated 2026-07-15).
- Expressões mais frequentes que 1×/dia **falham no deploy** no Hobby: "Hobby accounts are limited to daily cron jobs. This cron expression would run more than once per day." — [Vercel — Usage & Pricing for Cron Jobs](https://vercel.com/docs/cron-jobs/usage-and-pricing).
- Precisão no Hobby: "a cron job configured as `0 1 * * *` ... will trigger anywhere between 1:00 am and 1:59 am"; "Vercel may invoke these cron jobs at any point within the specified hour to help distribute load" — [Vercel — Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing); [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- O limite subiu em 20/01/2026: "per-project limits were lifted to 100 on all plans"; antes havia limites por time de 2 (Hobby) e 40 (Pro) — [Vercel changelog — Cron jobs now support 100 per project on every plan](https://vercel.com/changelog/cron-jobs-now-support-100-per-project-on-every-plan).
- Crons desabilitados continuam contando para o limite — [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- Como dispara: "Vercel makes an HTTP GET request to your project's **production deployment URL**", user agent `vercel-cron/1.0`, header `x-vercel-cron-schedule` com a expressão; fuso "always UTC"; não aceita `MON`/`JAN` nem dia-do-mês e dia-da-semana juntos — [Vercel — Cron Jobs](https://vercel.com/docs/cron-jobs) (last_updated 2026-09-16).
- O mesmo `path` pode aparecer em mais de uma entrada com horários diferentes (exemplo oficial com `/api/sync` duas vezes) — [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- `CRON_SECRET`: ao criar a env no projeto, "The value of the variable will be automatically sent as an `Authorization` header", com prefixo `Bearer`; recomendação de string aleatória ≥ 16 caracteres — [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- Sem retry: "Vercel will not retry an invocation if a cron job fails." — [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- Entrega best-effort, com execuções perdidas **e duplicadas** possíveis: "your function does not execute, and no runtime log is created for that scheduled run"; "Cron delivery can also occasionally invoke the same scheduled run more than once"; recomendação de operações idempotentes e reconciliação — [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- Crons não seguem redirects (3xx encerra a invocação) e respostas em cache/redirect não aparecem nos logs — [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- Duração: "The duration limits for Cron jobs are identical to those of Vercel Functions"; Hobby = 300 s padrão e máximo (com Fluid compute); Pro até 800 s — [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs); [Vercel — Functions Limits](https://vercel.com/docs/functions/limitations) (last_updated 2026-08-24).
- Memória no Hobby: 2 GB / 1 vCPU; payload máximo de request/response 4,5 MB — [Vercel — Functions Limits](https://vercel.com/docs/functions/limitations).
- "Waiting for I/O (e.g. calling AI models, database queries) does not count towards active CPU time" — [Vercel — Functions Limits](https://vercel.com/docs/functions/limitations).
- Cotas mensais do Hobby: 1.000.000 invocações de função, 4 CPU-horas ativas, 360 GB-h de memória provisionada, 100 deployments/dia, 200 projetos; **Runtime Logs: "1 hour of logs"** (Pro: 1 dia) — [Vercel — Hobby Plan](https://vercel.com/docs/plans/hobby) (last_updated 2026-09-14).
- Ao estourar cotas no Hobby: "you will have to wait until 30 days have passed before you can use the feature again" — [Vercel — Hobby Plan](https://vercel.com/docs/plans/hobby).
- **Uso comercial**: "Hobby teams are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan."; exemplos incluem "Any method of requesting or processing payment from visitors of the site" e "Advertising the sale of a product or service" — [Vercel — Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines) (last_updated 2026-09-14).
- Preço do Pro: "Developer seats cost $20 per user / month" — [Vercel — Hobby Plan](https://vercel.com/docs/plans/hobby).
- Alertas (anomalia de erro/uso por e-mail, Slack ou webhook): "available on Enterprise and Pro plans with Observability Plus" — não existem no Hobby — [Vercel — Alerts](https://vercel.com/docs/alerts) (last_updated 2026-09-09).
- Rollback instantâneo reverte os crons para os do deployment restaurado — [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

### Inferences
- Um 3º e um 4º cron diário cabem no Hobby (2 → 4 de 100). Se quiser mais de um post por dia, basta declarar entradas separadas, cada uma diária (ex.: `0 12 * * *` e `0 21 * * *`); cada expressão isolada roda 1×/dia, que é o que a regra do Hobby checa.
- Como o fuso é sempre UTC e o Brasil está em UTC−3, `0 12 * * *` no Hobby dispara entre 09:00 e 09:59 de Brasília. Para um post social, a janela de ±59 min é irrelevante.
- A renovação do token de 60 dias não precisa de cron próprio: pode rodar dentro do mesmo job diário (checar `expires_at` e renovar quando faltar pouco), exatamente como `refreshExpiringConnections`.
- Por causa de execuções perdidas/duplicadas, o job deve ser idempotente: reservar a linha da fila com um `UPDATE ... WHERE status = 'approved' ... RETURNING` antes de chamar a API e ter um guard "já publiquei hoje?". Um dia perdido se resolve sozinho no dia seguinte (a fila continua).
- Custo do workload em Hobby é desprezível: ~60–120 invocações/mês contra 1.000.000 incluídas; a espera pela IA/HTTP não consome CPU ativa.
- O Noivar processa pagamento (taxa de publicação) e anuncia venda de serviço — enquadra-se nos exemplos de uso comercial. O risco de suspensão existe hoje; publicar posts de marketing pelo mesmo projeto não cria o problema, mas é mais uma atividade comercial pendurada num plano que a proíbe. Regularizar custa US$ 20/mês ≈ **R$ 100/mês**.

### Gaps
- O plano atual do projeto na Vercel não foi confirmado (indício de Hobby: comentário de "logs ~1h" na migration 0011).
- A documentação atual não menciona mais o limite por conta/time de 2 crons no Hobby; assumi que foi removido conforme o changelog de 20/01/2026. O projeto já usa 2; se o deploy do 3º falhar com erro de limite, é isso.
- Não encontrei documentação sobre o que acontece na prática quando a Vercel detecta uso comercial no Hobby (aviso, prazo, pausa); a página de fair use só diz que, quando possível, entra em contato antes de agir.

---

## 3. GitHub Actions (workflows agendados)

### Takeaway
É gratuito e funciona sem computador ligado, mas é a opção com **mais pegadinhas para este caso**: o agendamento atrasa e pode ser descartado, só roda no branch padrão, e em repositório **público** é desativado após 60 dias sem atividade — e o repositório do Noivar é público, está parado no GitHub desde 12/06/2026 e defasado em 41 commits. Persistir um token renovado em secret exige um PAT; é mais simples guardar o token no Supabase.

### Cited Findings
- Minutos incluídos (repos privados): GitHub Free 2.000 min/mês e 500 MB de artefatos; Pro 3.000 min e 1 GB; Team 3.000 min e 2 GB — [GitHub Docs — Billing for GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
- Repos públicos: "GitHub Actions usage is free for self-hosted runners and for public repositories that use standard GitHub-hosted runners." — [GitHub Docs — Billing for GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
- Preço por minuto além da franquia: Linux 2-core x64 US$ 0,006; Linux 1-core US$ 0,002; Windows 2-core US$ 0,010; macOS US$ 0,062. Sem meio de pagamento, "usage is blocked once you use up your quota" — [GitHub Docs — Billing for GitHub Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
- Atrasos e descarte: "The `schedule` event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour. If the load is sufficiently high enough, some queued jobs may be dropped." — [GitHub Docs — Events that trigger workflows (schedule)](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
- Intervalo mínimo de 5 minutos; "Scheduled workflows will only run on the default branch" — [GitHub Docs — Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
- Regra dos 60 dias, redação atual: "**In a public repository**, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days." A documentação não estende a regra a repositórios privados — [GitHub Docs — Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows); [GitHub Docs — Disable and enable workflows](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows).
- Fuso: padrão UTC, mas hoje aceita um fuso IANA opcional (`timezone: "America/New_York"` no exemplo) — [GitHub Docs — Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
- Atualizar um secret via API (`PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}`): "OAuth tokens and personal access tokens (classic) need the `repo` scope"; o valor precisa ser cifrado com LibSodium usando a chave pública do repositório. A página não menciona o `GITHUB_TOKEN` embutido como opção — [GitHub Docs — REST API: Actions secrets](https://docs.github.com/en/rest/actions/secrets).
- Notificação de falha: "Notifications for scheduled workflows are sent to the user who initially created the workflow"; é possível receber "only when a workflow run has failed" — [GitHub Docs — Notifications for workflow runs](https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs).
- Confiabilidade observada (evidência anedótica, não medida): resposta de fórum cita atraso típico de 3 a 10 minutos; blogs de fornecedores falam em 15–30 min no topo da hora; um relato descreve job diário em repo novo com 8–14 h de atraso e um dia descartado — [GitHub Community #201738](https://github.com/orgs/community/discussions/201738); [GitHub Community #185355](https://github.com/orgs/community/discussions/185355); [Crontap — GitHub Actions cron drift](https://crontap.com/blog/github-actions-cron-drift-problem).
- Um comparativo de 2026 classifica GitHub Actions e Vercel Hobby como "anti-picks" para automação externa de alta frequência, mas declara que "did not run timed cron execution tests" — [merginit — free cron job scheduler comparison](https://merginit.com/blog/26062026-free-cron-job-scheduler-comparison).
- Estado do repositório do Noivar: público, `pushedAt 2026-06-12`, `origin/main` só com o commit inicial — consulta `gh repo view` e `git for-each-ref` em 13/10/2026 (ver seção 1).

### Inferences
- Para **1 execução diária curta** os minutos nunca seriam problema (≈30 min/mês em repo privado; grátis em público).
- No repo atual do Noivar o agendamento seria desativado pela regra dos 60 dias (o repo é público e não recebe push há 4 meses), e o workflow teria de existir na `main` do GitHub, que hoje está 41 commits atrás. Além disso, qualquer fila/histórico guardado em arquivos do repo ficaria **público**.
- Persistir o token do Threads renovado como secret exigiria um PAT guardado como outro secret (e PAT também expira — vira manutenção recorrente). Alternativas mais simples: (a) o workflow só faz `curl` na rota da Vercel com o `CRON_SECRET` (o estado continua no Supabase); (b) o workflow usa a service-role key do Supabase direto. Em ambos os casos o GitHub vira apenas um relógio — e a Vercel já tem relógio.
- O único uso em que o GitHub Actions agrega algo aqui é como **gatilho de horário mais preciso** ou como redundância; não como lugar do estado.

### Gaps
- Não encontrei medição rigorosa e recente (2025–2026) de atraso/descartes do `schedule`; só relatos e posts de fornecedores com interesse comercial.
- A doc de secrets consultada não confirma a permissão exata para fine-grained PAT nem diz explicitamente que o `GITHUB_TOKEN` não pode gravar secrets (só não o lista).
- Não confirmei a regra de arredondamento de minutos por job (a página de billing atual não a cita).

---

## 4. Supabase (Free): limites, pausa, pg_cron/pg_net, Cron, Edge Functions, Vault

### Takeaway
O plano Free comporta com folga o estado do job (token, fila, histórico, logs) e ainda oferece um agendador próprio (Supabase Cron = `pg_cron`) capaz de disparar HTTP via `pg_net`. Tecnicamente `pg_cron + pg_net` conseguem chamar uma API externa, mas `pg_net` é assíncrono e sem retry — encadear chamadas e tratar erro em SQL é frágil; se for usar o Supabase como relógio, o caminho sensato é `pg_cron → Edge Function` ou `pg_cron → rota da Vercel`. O risco estrutural do Free é a **pausa após 1 semana de inatividade**, que o keep-alive do projeto já trata.

### Cited Findings
- Free: "500 MB database size" por projeto; "Limit of 2 active projects"; "paused after 1 week of inactivity"; 5 GB de egress (+5 GB em cache); 1 GB de storage; 50.000 MAU; 500.000 invocações de Edge Functions; retenção de logs de 1 dia; backups automáticos não incluídos. Pro "from $25/month" — [Supabase — Pricing](https://supabase.com/pricing).
- Regra de pausa: projeto é "considered inactive if it does not receive sufficient user database activity over the past week"; a doc diz que algumas requisições de usuário ao banco por dia costumam bastar; há e-mail de aviso cerca de uma semana antes e outro na pausa; "Paid projects cannot be paused" — [Supabase Docs — Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing).
- Restauração: o texto diz "for up to 1 year after it was paused", mas um título da mesma página fala em janela de 90 dias (a página é inconsistente) — [Supabase Docs — Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing).
- Supabase Cron: "uses the pg_cron Postgres database extension"; cada job pode rodar SQL/funções ou "make an HTTP request, such as invoking a Supabase Edge Function"; de "every second to once a year"; "we recommend no more than 8 Jobs run concurrently"; "Each Job should run no more than 10 minutes"; histórico em `cron.job_run_details` — [Supabase Docs — Cron](https://supabase.com/docs/guides/cron).
- Alvos de job: "SQL statements, database functions, Edge Functions, HTTP endpoints"; histórico de execução "with status, duration, and error details" — [Supabase — Cron module](https://supabase.com/modules/cron.md).
- Disponibilidade no Free: as páginas oficiais consultadas **não dizem** em quais planos o Cron está disponível; guias de terceiros afirmam que `pg_cron` vem habilitável em todos os planos, inclusive Free — [RapidDev — How to schedule cron jobs with Supabase](https://www.rapidevelopers.com/md/supabase-tutorial/how-to-schedule-cron-jobs-with-supabase); [Crontap — Supabase cron jobs](https://crontap.com/guides/supabase-cron-jobs).
- `pg_net`: "async networking extension for Postgres"; funções `net.http_get`, `net.http_post`, `net.http_delete`; POST com corpo `jsonb` e `headers` customizados; "Does not have support for PATCH/PUT requests"; respostas ficam "for 6 hours in the `net._http_response` table"; timeout padrão `timeout_milliseconds int default 2000`; as requisições "are not started until the transaction is committed"; "The pg_net API is in beta"; pensado para até 200 req/s — [Supabase Docs — pg_net](https://supabase.com/docs/guides/database/extensions/pg_net).
- Chamadas via `pg_net` são "fire-and-forget", sem retry em 5xx (fonte de terceiro) — [Crontap — Supabase cron jobs](https://crontap.com/guides/supabase-cron-jobs).
- Agendar Edge Function: exemplo oficial com `cron.schedule(...)` + `net.http_post(url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/function-name', headers := jsonb_build_object('Content-type','application/json','apikey', ...))`; os segredos são criados com `vault.create_secret(...)` — [Supabase Docs — Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions).
- Edge Functions: memória máx. 256 MB; duração de relógio "Free plan: 150s" (pagos 400 s); CPU máx. 2 s por requisição; 100 funções por projeto no Free; até 100 secrets por projeto — [Supabase Docs — Edge Functions limits](https://supabase.com/docs/guides/functions/limits).
- Vault: "Postgres extension ... to store encrypted secrets"; cifragem autenticada em disco; "the encryption key is never stored in the database alongside the encrypted data"; `vault.create_secret()`, `vault.update_secret()`, leitura pela view `vault.decrypted_secrets`; "anyone that has access to the view has access to decrypted secrets"; migração manual por `pg_dump` para outro projeto não consegue decifrar os segredos — [Supabase Docs — Vault](https://supabase.com/docs/guides/database/vault).
- Durante a pausa o `pg_cron` para e execuções perdidas não são recuperadas (fonte de terceiro) — [Runhooks — Preventing Supabase free tier pausing](https://runhooks.app/blog/preventing-supabase-free-tier-pausing/).

### Inferences
- Tamanho do estado: uma fila de posts de texto + histórico de anos ocupa poucos MB; o limite de 500 MB não é restrição.
- **`pg_cron` + `pg_net` sozinhos conseguem publicar?** Para uma única chamada POST com JSON, sim. Para um fluxo em que a 2ª chamada depende da resposta da 1ª, só com dois jobs (um dispara, outro lê `net._http_response` depois) ou lógica PL/pgSQL equivalente — sem retry, com timeout padrão de 2 s, API em beta e log de erro em tabelas internas. Funciona no papel, é o pior lugar para depurar. Se o Supabase for o relógio, melhor `pg_cron → Edge Function` (código TypeScript/Deno) ou `pg_cron → net.http_get` na rota da Vercel.
- Usar o Supabase como relógio em vez da Vercel dá **horário exato** (pg_cron dispara no minuto) sem conta nova, mas cria um segundo runtime (Deno) ou um acoplamento `pg_net` → Vercel com segredo guardado no Vault. Só compensa se a janela de ±59 min do Hobby incomodar.
- Dois lugares possíveis para o token do Threads: (a) coluna cifrada na aplicação com `secret-box.ts` (padrão já existente, testado, a chave fica fora do banco); (b) Supabase Vault (chave gerida pela Supabase). O (a) não exige nada novo.
- A aprovação de posts pelo **Table Editor do painel do Supabase** funciona sem escrever tela nenhuma, porque o painel opera com privilégio de dono do projeto e ignora RLS — útil como versão zero da fila.
- Risco circular: se o Supabase pausar, param juntos o estado e (se usado) o `pg_cron`. O keep-alive da Vercel e o próprio job diário mantêm atividade; convém não depender só do `pg_cron` interno para isso.

### Gaps
- Não achei afirmação oficial de que Supabase Cron/`pg_cron`, `pg_net` e Vault estão disponíveis no plano Free (as páginas oficiais não citam plano; só terceiros).
- A documentação não define "sufficient user database activity": não ficou claro se atividade gerada apenas por jobs internos de `pg_cron` conta para evitar a pausa.
- O limite de projetos Free citado na página de preços é "2 active projects"; não confirmei em fonte oficial se projetos pausados contam.
- Não verifiquei se a página de limites trata a contagem de invocações de Edge Function disparadas por `pg_net`.

---

## 5. n8n (Cloud e self-hosted) e hospedagem gratuita 24/7

### Takeaway
**Não existe plano gratuito permanente do n8n Cloud** em outubro/2026 — só trial; o mais barato é €20/mês. A Community Edition self-hosted é gratuita para uso interno do próprio negócio, mas precisa de um servidor ligado 24/7, e as opções realmente gratuitas encolheram em 2026 (Oracle reduziu a franquia ARM, Fly.io e Koyeb deixaram de ter free tier claro, Hugging Face passou a exigir plano pago para Spaces com Docker). Para uma chamada HTTP por dia, n8n é excesso: adiciona um servidor para manter em troca de algo que 30 linhas na rota de cron existente resolvem.

### Cited Findings
- Planos Cloud (preços mostrados com cobrança anual): Starter "20€/mo, billed annually" com 2,5 mil execuções/mês e 5 execuções concorrentes; Pro "50€/mo, billed annually" com 10 mil execuções; Business "667€/mo" (só self-hosted); Enterprise sob consulta — [n8n — Pricing](https://n8n.io/pricing/).
- Sem plano Cloud gratuito permanente: o único ponto de entrada é "Start free trial — No credit card required"; limites do trial incluem 1.000 execuções, 5 concorrentes e timeout de 180 s; a página não informa a duração — [n8n — Pricing](https://n8n.io/pricing/).
- Edição comunitária: "A standard, self-hosted version of n8n is available on GitHub." — [n8n — Pricing](https://n8n.io/pricing/).
- Licença (Sustainable Use License): "You may use or modify the software only for your own internal business purposes or for non-commercial or personal use."; "You may distribute the software or provide it to others only if you do so free of charge for non-commercial purposes."; arquivos `.ee` exigem licença Enterprise — [n8n — LICENSE.md](https://github.com/n8n-io/n8n/blob/master/LICENSE.md).
- Schedule Trigger: "Use the Schedule Trigger node to run workflows at fixed intervals and times"; intervalos de segundos a meses e cron customizado; é preciso "save and publish the workflow"; fuso padrão de instâncias self-hosted é `America/New York` — [n8n Docs — Schedule Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/).
- HTTP Request: credenciais genéricas incluem Header auth, Bearer auth, Query auth e "OAuth2 (generic credential type)" com grant types "Authorization Code", "Client Credentials" e "PKCE" (campos Authorization URL, Access Token URL, Client ID, Client Secret, Scope). A página **não documenta** a renovação automática de token — [n8n Docs — HTTP Request credentials](https://docs.n8n.io/integrations/builtin/credentials/httprequest/).
- Requisitos mínimos: a página oficial de server setups não declara RAM/CPU mínimos — [n8n Docs — Server setups](https://docs.n8n.io/hosting/installation/server-setups/). Fontes de terceiros indicam 1 vCPU, 2 GB de RAM e 20 GB de SSD como mínimo — [Hostinger — VPS requirements for n8n](https://www.hostinger.com/tutorials/?p=135411); [is*hosting — self host n8n requirements](https://blog.ishosting.com/en/self-host-n8n-requirements).
- Perder a `N8N_ENCRYPTION_KEY` significa perder todas as credenciais salvas (fonte de terceiro) — [Appliplus — Self-hosting n8n guide](https://appliplus.com/blog/complete-guide-to-self-hosting-n8n-installation-setup-and-best-practices).

**Hospedagem "gratuita" 24/7 — o que ainda vale em 2026**
- **Oracle Cloud Always Free**: até 2 VMs AMD `VM.Standard.E2.1.Micro`; Ampere A1: "first 1,500 OCPU hours and 9,000 GB hours per month ... equivalent to 2 OCPUs and 12 GB of memory" (a franquia documentada hoje é metade dos 4 OCPU/24 GB citados em guias antigos); 200 GB de block volume — [Oracle — Always Free Resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm).
- Oracle — recuperação de instâncias ociosas: instância é considerada ociosa se, em 7 dias, "CPU utilization for the 95th percentile is less than 20%", "Network utilization is less than 20%" e "Memory utilization is less than 20% (applies to A1 shapes only)"; instâncias Always Free precisam ser criadas na home region e podem dar "out of host capacity" — [Oracle — Always Free Resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm).
- **Google Cloud**: "1 non-preemptible e2-micro VM instance per month" apenas em us-west1, us-central1 ou us-east1; 30 GB-mês de disco padrão; 1 GB de saída/mês; "A Google Cloud billing account is required to access the Google Cloud Free Tier" — [Google Cloud — Free cloud features](https://docs.cloud.google.com/free/docs/free-cloud-features).
- **Render (free)**: "spins down a Free web service that goes 15 minutes without receiving any inbound traffic"; subir de novo "takes about one minute"; 750 horas grátis/mês por workspace; sem disco persistente; "might restart a Free web service at any time"; Postgres grátis expira 30 dias após a criação — [Render — Free instances](https://render.com/docs/free).
- **Fly.io**: fontes de terceiros indicam que contas novas não têm free tier, só trial (até 2 h de máquina ou 7 dias), com cartão obrigatório; contas legadas mantêm franquias antigas — [agentdeals — Fly.io free tier 2026](https://agentdeals.dev/vendor/fly-io); [Render — Platforms with a real free tier in 2026](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026.md) (concorrente; a página oficial de preços não pôde ser lida).
- **Railway**: trial com "$5 one-time credit (30 days)"; plano Free de US$ 0 com "$1 of monthly usage credits", limite de 0,5 GB de RAM por serviço; Hobby US$ 5/mês com US$ 5 de uso — [Railway — Pricing](https://railway.com/pricing).
- **Koyeb**: a página de preços lista só Pro (US$ 29/mês + computação), Scale (US$ 299) e Enterprise; o único item gratuito é um Postgres "Free 5h" — [Koyeb — Pricing](https://www.koyeb.com/pricing). Fontes de terceiros divergem sobre ainda existir um web service gratuito e citam cartão obrigatório com pré-autorização de US$ 29 — [agentdeals — Koyeb](https://agentdeals.dev/vendor/koyeb); [Render — Platforms with a real free tier in 2026](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026.md).
- **Hugging Face Spaces**: "Gradio and Docker Spaces run on compute and require a paid plan to create: PRO for personal accounts"; em hardware gratuito o Space "will 'go to sleep' and stop executing after a period of time if unused"; disco de 50 GB não persistente — [Hugging Face — Spaces Overview](https://huggingface.co/docs/hub/spaces-overview).

### Inferences
- Automatizar os posts do próprio Noivar é "internal business purposes": a licença da Community Edition permite sem custo.
- Sim, n8n faz o serviço (Schedule Trigger + HTTP Request). Porém o Schedule Trigger só dispara com o processo **no ar**: hospedagens que dormem (Render free, HF Spaces) não servem para cron interno do n8n.
- A e2-micro do Google tem pouca memória para o mínimo de 2 GB citado por terceiros; a única opção gratuita com folga de RAM é a Oracle A1 (12 GB) — que exige cadastro com cartão, sofre com falta de capacidade e pode recuperar a VM por ociosidade (um n8n que roda 1 job por dia é exatamente o perfil "ocioso").
- Custo real de n8n self-hosted para um fundador solo: uma conta nova (Oracle/Google), um servidor para atualizar e proteger, backup da chave de cifragem e um segundo lugar de estado (credenciais dentro do n8n) além do Supabase. Para um POST diário, é excesso; faria sentido só se houvesse dezenas de automações heterogêneas.
- n8n Cloud Starter (€20/mês) custa mais do que regularizar a Vercel no Pro (US$ 20/mês), que resolveria o mesmo problema e a questão do uso comercial.

### Gaps
- Duração do trial do n8n Cloud não aparece na página de preços; preços com cobrança mensal também não.
- Não confirmei em fonte oficial se a credencial OAuth2 genérica do n8n renova tokens sozinha, nem se o esquema de token de longa duração do Threads é compatível com ela (a mecânica do token do Threads está fora do meu escopo).
- Requisito de cartão de crédito no cadastro da Oracle não consta na página consultada; página oficial de preços do Fly.io deu erro de conexão em duas tentativas.
- Câmbio EUR/BRL não foi consultado; não converti os preços em euro.

---

## 6. Outros agendadores e runtimes gratuitos

### Takeaway
Há várias alternativas de custo zero, mas todas adicionam uma conta e, quase sempre, um segundo lugar de estado. As duas que mais agregam ao stack atual são as que funcionam só como **relógio externo chamando a rota da Vercel**: cron-job.org (grátis, minuto exato, e-mail de falha) e Upstash QStash (retries). Cloudflare Workers é a alternativa completa mais sólida se algum dia for preciso sair da Vercel.

### Cited Findings
- **Cloudflare Workers (Free)**: 100.000 requisições/dia; "CPU time per HTTP request 10 ms"; "CPU time per Cron Trigger 10 ms"; "Number of Cron Triggers per account 5"; 50 subrequests por requisição; 128 MB; 100 Workers; 64 variáveis/segredos por Worker; duração de Cron Trigger até 15 min — [Cloudflare — Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
- **Cloudflare KV (Free)**: 100.000 leituras/dia, 1.000 escritas/dia, 1 GB por conta, 1 escrita/s na mesma chave — [Cloudflare — KV limits](https://developers.cloudflare.com/kv/platform/limits/).
- **Cloudflare D1 (Free)**: 5 milhões de linhas lidas/dia, 100.000 linhas escritas/dia, 5 GB; ao estourar, a API retorna erro até o reset às 00:00 UTC — [Cloudflare — D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).
- Cron Triggers rodam em UTC, mudanças podem levar até 15 min para propagar e não há retry nativo (fonte de terceiro) — [merginit — free cron job scheduler comparison](https://merginit.com/blog/26062026-free-cron-job-scheduler-comparison).
- **Deno Deploy (Free)**: 1 milhão de requisições/mês, 20 GiB de saída, 10 h de CPU, KV com 1 GiB, 1.000.000 de unidades de leitura e 500.000 de escrita por mês, 10 apps; Pro US$ 20/mês. A página de preços não menciona cron — [Deno Deploy — Pricing](https://deno.com/deploy/pricing).
- **cron-job.org**: "Our service is entirely free of charge"; cada job pode rodar "up to 60 times an hour"; timeout de 30 s; sem limite fixo de jobs (uso justo); job é desativado quando "subsequently fails more than 25 times"; há "email notification feature in case of failed cronjobs"; headers customizados e POST/PUT com corpo; lê só os primeiros 64 KB da resposta — [cron-job.org — FAQ](https://cron-job.org/en/faq/).
- **Upstash QStash (Free)**: 1.000 mensagens/dia; 10 schedules ativos; 1 MB por mensagem; resposta HTTP de até 15 min; logs por 3 dias; pago a US$ 1 por 100 mil mensagens — [Upstash — QStash pricing](https://upstash.com/pricing/qstash). Suporta `CRON_TZ` (terceiro) — [merginit](https://merginit.com/blog/26062026-free-cron-job-scheduler-comparison).
- **Google Apps Script (conta gmail.com)**: UrlFetch 20.000 chamadas/dia; 6 min por execução; tempo total de triggers 90 min/dia; 20 triggers por usuário por script; 100 destinatários de e-mail/dia; Properties com 9 KB por valor e 500 KB no total — [Google — Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas).
- **Google Cloud Scheduler**: 3 jobs gratuitos por mês por conta de faturamento, depois US$ 0,10 por job-mês (via terceiro; a página oficial não pôde ser lida por inteiro) — [merginit](https://merginit.com/blog/26062026-free-cron-job-scheduler-comparison). Exige conta de faturamento, como todo o Free Tier — [Google Cloud — Free cloud features](https://docs.cloud.google.com/free/docs/free-cloud-features).
- **Google Cloud Run / Run functions / Firestore / Secret Manager (free tier)**: 2 milhões de requisições/mês; Firestore 1 GiB e 50 mil leituras + 20 mil escritas/dia; Secret Manager 6 versões ativas e 10 mil acessos/mês — [Google Cloud — Free cloud features](https://docs.cloud.google.com/free/docs/free-cloud-features).
- **Pipedream**: a tabela de preços lista os créditos do Free como "Development only"; primeiro plano pago (Startup) a US$ 99/mês anual ou US$ 150 mensal — [Pipedream — Pricing](https://pipedream.com/pricing). Um comparativo cita 25 créditos diários no Free — [merginit](https://merginit.com/blog/26062026-free-cron-job-scheduler-comparison).
- **Val Town (Free)**: cron com intervalo mínimo de 15 min (1 min só no Pro), timeout de 1 min, 100 mil execuções/dia, retenção de logs de 3 dias; vals novos de contas Free são públicos (resumo de busca sobre val.town/limits e val.town/pricing; a página oficial respondeu 403 ao acesso direto) — [Val Town — Limits](https://val.town/limits); [Val Town Docs — Cron](https://docs.val.town/vals/cron.md).

### Inferences
- **Relógio externo + rota da Vercel** é a forma mais barata de ganhar horário exato e aviso de falha sem mover nada: cron-job.org chama `GET /api/cron/...` com header `Authorization: Bearer <CRON_SECRET>` (aceita headers customizados) e manda e-mail se a rota responder erro. O timeout de 30 s exige que a rota termine rápido (publicar da fila pré-aprovada é rápido; gerar com IA na mesma chamada pode não ser).
- Cloudflare Workers Free comporta o job inteiro (o limite de 10 ms é de CPU, não de espera de rede; 5 cron triggers; estado em D1/KV), mas duplicaria estado e segredos que já vivem no Supabase/Vercel e introduz outro runtime.
- Apps Script + Google Sheets é a única opção que entrega **fila de revisão pronta para leigo** (a planilha) e relógio no mesmo lugar, sem servidor. Em troca, o token fica em Script Properties (limite de 9 KB por valor é suficiente) e o código vive fora do repositório e do fluxo de trabalho com Claude Code.
- Val Town Free expõe o código publicamente; Pipedream Free parece restrito a desenvolvimento; Deno Deploy e Cloud Scheduler não trazem vantagem sobre o que já existe. Não compensam aqui.

### Gaps
- Precisão de horário dos triggers por tempo do Apps Script não consta na página de cotas consultada.
- Suporte a `Deno.cron` no plano Free do Deno Deploy não foi confirmado.
- Limites exatos do plano Free do Pipedream (créditos, workflows ativos) não aparecem com clareza na página oficial.
- Página oficial de preços do Cloud Scheduler não pôde ser lida; os números vêm de um comparativo de terceiros.
- QStash: a página não informa se o plano Free exige cartão.

---

## 7. Geração de texto por IA — opções gratuitas e custo das pagas

### Takeaway
Para ~30 gerações/mês, **o custo de qualquer API paga é centavos**: de R$ 0,04 a R$ 2,70 por mês, dependendo do modelo. A opção gratuita mais sólida é o free tier do Gemini (disponível no Brasil), com a contrapartida de que o conteúdo enviado é usado para melhorar os produtos do Google. O GitHub Models foi **descontinuado em 30/07/2026**. Não encontrei evidência comparativa confiável de qualidade em português do Brasil entre os modelos atuais — isso precisa de teste próprio.

### Cited Findings

**Gratuitas**
- **Gemini API**: têm free tier ("Free of charge" para entrada e saída), entre outros, `gemini-3.8-flash`, `gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3-flash-preview`, `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.5-flash-lite` e Gemma 4; **não** têm free tier `gemini-4-argon` e `gemini-3.1-pro-preview` — [Google — Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).
- Uso de dados no free tier: linha "Used to improve our products" = **Yes** no gratuito e **No** no pago — [Google — Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).
- Termos: nos serviços não pagos, "Google uses the content you submit to the Services and any generated responses to provide, improve, and develop" produtos e tecnologias de machine learning; "human reviewers may read, annotate, and process your API input and output"; "Do not submit sensitive, confidential, or personal information to the Unpaid Services." No pago: "Google doesn't use your prompts … or responses to improve our products." — [Google — Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms).
- Limites do free tier não são publicados por modelo na doc: são medidos em RPM, TPM e RPD e "can be viewed in Google AI Studio"; "Rate limits are applied per project, not per API key"; RPD "reset at midnight Pacific time"; Tier 1 exige vincular conta de faturamento — [Google — Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).
- Ordem de grandeza por terceiro: Google AI Studio com 5–15 RPM e 20–1.500 requisições/dia conforme o modelo, sem cartão — [OpenRouter blog — Free LLM APIs Compared (atualizado em 24/09/2026)](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/).
- **Brasil** consta na lista de regiões disponíveis da Gemini API e do AI Studio — [Google — Available regions](https://ai.google.dev/gemini-api/docs/available-regions).
- **Groq**: a página de limites tem abas "Free Plan Limits" e "Developer Plan Limits"; a tabela lida mostra `openai/gpt-oss-120b`, `openai/gpt-oss-20b` e `qwen/qwen3.8-27b` com 30 RPM, 1.000 requisições/dia, 8.000 TPM e 200.000 tokens/dia; "Rate limits apply at the organization level" — [Groq — Rate limits](https://console.groq.com/docs/rate-limits). Terceiros dizem que o plano gratuito não exige cartão e não treina com os dados — [OpenRouter blog — Free LLM APIs Compared](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/).
- **OpenRouter** (modelos `:free`): 20 requisições/minuto; **50/dia** para quem comprou menos de 10 créditos na vida da conta, **1.000/dia** a partir de 10 créditos; saldo negativo gera erro 402 inclusive em modelos gratuitos — [OpenRouter — API limits](https://openrouter.ai/docs/api-reference/limits).
- A lista de modelos gratuitos do OpenRouter muda com frequência; um post de 05/10/2026 contou 17 modelos `:free` + 2 a preço zero — [TrueFoundry — OpenRouter free models](https://www.truefoundry.com/es/blog/openrouter-free-models-whats-actually-free-and-what-it-costs-you).
- **GitHub Models**: "GitHub Models has been fully retired" em 30/07/2026 — playground, catálogo, API de inferência e BYOK indisponíveis; a página aponta Azure AI Foundry e GitHub Copilot como alternativas — [GitHub Docs — Prototyping with AI models](https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models).
- **Cloudflare Workers AI**: "free allocation allows anyone to use a total of 10,000 Neurons per day"; no plano Free, ao exceder, "further operations will fail with an error"; reset às 00:00 UTC; acima disso (só Workers Paid) US$ 0,011 por 1.000 neurons. Preços: `llama-3.3-70b-instruct-fp8-fast` 26.668 neurons/M de entrada e 204.805/M de saída; `gpt-oss-120b` 31.818 e 68.182 — [Cloudflare — Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).
- **Mistral**: sem fonte oficial acessível (a URL da doc de tiers retornou 404). Terceiros descrevem um tier "Experiment" gratuito com cerca de 1 bilhão de tokens/mês e teto de requisições muito baixo (1 req/s ou 2 req/min, conforme a fonte), **condicionado a aceitar uso dos dados para treino** — [OpenRouter blog — Free LLM APIs Compared](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/); [free-llm-api-resources — Mistral La Plateforme](https://mintlify.com/cheahjs/free-llm-api-resources/providers/free/mistral-plateforme).
- **Cerebras** (não pedido, mas aparece no mesmo comparativo): 30 RPM e ~1 milhão de tokens/dia, sem cartão — [OpenRouter blog — Free LLM APIs Compared](https://openrouter.ai/blog/tutorials/free-llm-apis-compared/).

**Pagas — preços por milhão de tokens (entrada / saída)**
- **Anthropic**: Claude Haiku 5.5 US$ 0,10 / US$ 0,50 (prompts até 100 mil tokens); Claude Haiku 4.5 US$ 1 / US$ 5; Claude Sonnet 5.5 US$ 2 / US$ 10; Claude Sonnet 5 US$ 2 / US$ 10 (preço de lançamento virou definitivo); Claude Opus 5.5 US$ 4 / US$ 20; Batch API com 50% de desconto — [Anthropic — Pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- Anthropic, tokenizador: "Claude 4.7 and later models ... use a newer tokenizer ... produces approximately 30% more tokens for the same text" — [Anthropic — Pricing](https://platform.claude.com/docs/en/about-claude/pricing).
- **OpenAI**: `gpt-5-nano` US$ 0,05 / US$ 0,40; `gpt-5-mini` US$ 0,25 / US$ 2,00; `gpt-5.4-nano` US$ 0,20 / US$ 1,25; `gpt-5.4-mini` US$ 0,75 / US$ 4,50; `gpt-4o-mini` US$ 0,15 / US$ 0,60; `gpt-4.1-mini` US$ 0,40 / US$ 1,60; topo de linha `gpt-6-astra` US$ 10 / US$ 50; tarifas de batch são metade das padrão — [OpenAI — API pricing](https://developers.openai.com/api/docs/pricing).
- **Gemini pago**: `gemini-2.5-flash-lite` US$ 0,10 / US$ 0,40; `gemini-3.1-flash-lite` US$ 0,25 / US$ 1,50; `gemini-2.5-flash` e `gemini-3.5-flash-lite` US$ 0,30 / US$ 2,50; `gemini-3-flash-preview` US$ 0,50 / US$ 3,00; `gemini-3.8-flash` US$ 0,75 / US$ 3,75; `gemini-2.5-pro` US$ 1,25 / US$ 10. Vários preços valem "through December 31, 2026" (ou 30/11/2026), com aumento previsto depois — [Google — Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).

**Português do Brasil — evidência**
- Existem benchmarks específicos recentes, mas a busca não trouxe um ranking comparando diretamente os modelos comerciais atuais em geração de texto pt-BR: CAPITU (março/2026, seguimento de instruções em pt-BR) — [arXiv 2603.22576 via Emergent Mind](https://www.emergentmind.com/papers/2603.22576); CLARIN-PT-LDB (março/2026, leaderboard com ENEM, BLUEX, OAB) — [alphaXiv 2603.12872](https://www.alphaxiv.org/abs/2603.12872); estudo de geração em pt-BR que afirma que as avaliações em larga escala continuam enviesadas para o inglês — [JBCS — Exploring Brazil's LLM Fauna](https://journals-sol.sbc.org.br/index.php/jbcs/article/view/5814).

### Inferences

**Custo mensal calculado para o workload** (câmbio R$ 5,01/US$; cálculo próprio a partir dos preços acima)
Cenário A = 30 chamadas × (3.000 tokens de entrada + 300 de saída) = 90 mil de entrada + 9 mil de saída por mês.
Cenário B = ~4,35 chamadas semanais × (3.000 de entrada + 2.100 de saída, 7 posts por chamada) ≈ 13 mil de entrada + 9,1 mil de saída por mês.

| Modelo | Cenário A (US$) | Cenário A (R$) | Cenário B (US$) | Cenário B (R$) |
|---|---|---|---|---|
| Claude Haiku 5.5 | 0,0135 | 0,07 | 0,006 | 0,03 |
| Claude Haiku 4.5 | 0,135 | 0,68 | 0,059 | 0,29 |
| Claude Sonnet 5.5 / Sonnet 5 | 0,27 | 1,35 | 0,117 | 0,59 |
| Claude Opus 5.5 | 0,54 | 2,71 | 0,235 | 1,18 |
| OpenAI gpt-5-nano | 0,008 | 0,04 | 0,004 | 0,02 |
| OpenAI gpt-5-mini | 0,041 | 0,20 | 0,021 | 0,11 |
| OpenAI gpt-5.4-mini | 0,108 | 0,54 | 0,051 | 0,26 |
| Gemini 2.5 Flash-Lite (pago) | 0,013 | 0,06 | 0,005 | 0,02 |
| Gemini 2.5 Flash (pago) | 0,050 | 0,25 | 0,027 | 0,13 |
| Gemini 3.8 Flash (pago) | 0,101 | 0,51 | 0,044 | 0,22 |

- Para os modelos Claude recentes, some ~30% se a estimativa de 3.000/300 tokens foi feita com contagem de tokenizador antigo (ex.: Sonnet 5.5 no cenário A ≈ US$ 0,35 ≈ R$ 1,76). Mesmo assim fica abaixo de R$ 3/mês no pior caso.
- Conclusão de custo: a diferença entre "grátis" e "o melhor modelo pago" é da ordem de **R$ 1 a R$ 3 por mês**. O critério de escolha deve ser qualidade do texto em pt-BR e privacidade, não preço.
- Todos os limites gratuitos comportam o workload com enorme folga: 1 chamada/dia contra 50/dia (OpenRouter sem créditos), 1.000/dia (Groq), 20–1.500/dia (Gemini). No Workers AI, uma chamada de 3.000 + 300 tokens custa ~141 neurons no Llama 3.3 70B (3.000 × 26.668/1M + 300 × 204.805/1M), contra 10.000 neurons/dia.
- O contexto enviado (descrição do produto + histórico de posts públicos) não é dado pessoal nem segredo; o uso para treino no free tier do Gemini é um custo aceitável aqui, desde que nunca se inclua dado de casais/clientes no prompt.
- Riscos próprios do "grátis": limites e modelos mudam sem aviso (o GitHub Models sumiu inteiro em julho/2026; a lista `:free` do OpenRouter muda mês a mês). Um job desassistido que depende de free tier precisa tratar erro 429/404 de modelo como falha esperada — ou, mais simples, **não gerar em tempo de execução**: gerar em lote, revisar e publicar da fila.
- Se a geração for feita em lote pelo Claude Code (seção 8), o job diário não chama IA nenhuma e nenhuma chave de API precisa existir em produção.

### Gaps
- **Qualidade em pt-BR**: não encontrei comparação direta e confiável entre Gemini, Claude, GPT e modelos abertos atuais para copy curta em português do Brasil. Recomenda-se teste cego com 10–20 posts reais do Noivar antes de fixar o modelo.
- Limites exatos (RPM/RPD) do free tier do Gemini por modelo só aparecem dentro do AI Studio; não foram verificados.
- A extração da página da Groq não deixou claro se a tabela lida corresponde à aba Free ou Developer; os valores (30 RPM / 1.000 RPD) coincidem com o que terceiros atribuem ao gratuito.
- Tier gratuito do Mistral sem confirmação em fonte oficial.
- Não verifiquei valor mínimo de compra de créditos pré-pagos (Anthropic, OpenAI, OpenRouter) nem IOF/spread do cartão em compras internacionais — o custo efetivo de entrada pode ser um depósito mínimo de alguns dólares, não os centavos da tabela.
- Os modelos "luna" da OpenAI (`gpt-6-luna` US$ 0,10 / US$ 0,50; `gpt-5.6-luna` US$ 0,20 / US$ 1,20) aparecem na tabela de preços, mas não confirmei o posicionamento deles; ficaram fora do cálculo.

---

## 8. Claude Code como gerador (routines, tarefas agendadas, `claude -p`, GitHub Action)

### Takeaway
A documentação oficial confirma que uma **routine** (agente agendado na nuvem da Anthropic, em research preview) pode rodar semanalmente sem o computador ligado, em planos Pro, Max, Team e Enterprise, consumindo o uso da assinatura existente — ou seja, gerar o lote semanal de posts custaria R$ 0 adicional. Limitações documentadas que importam aqui: a routine trabalha sobre **repositórios do GitHub clonados** e conectores, a rede padrão só alcança uma allowlist (o Supabase não está nela) e o status "verde" não garante que a tarefa deu certo. Não serve como executor do post diário em si; serve como gerador do lote para a fila de revisão.

### Cited Findings
- Definição e onde roda: "A routine is a saved Claude Code configuration: a prompt, one or more repositories, and a set of connectors"; "Routines execute on Anthropic-managed cloud infrastructure ... so they keep working when your laptop is closed." — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md).
- Estágio: "Routines are in research preview. Behavior, limits, and the API surface may change." — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md).
- Planos: "Routines are available on Pro, Max, Team, and Enterprise plans"; exige login de assinatura claude.ai (com API key do Console, `/schedule` não aparece) — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md); tabela por plano em [Claude Code Docs — Feature availability](https://code.claude.com/docs/en/feature-availability.md).
- Gatilhos: agendado (presets "hourly, daily, weekdays, or weekly", ou cron customizado via `/schedule update`), API (POST em endpoint `/fire` com bearer token) e eventos do GitHub; "The minimum interval is one hour" — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md).
- Horário: informado no fuso local e convertido; execução marcada exatamente na hora cheia "can start several minutes late" — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md).
- Uso e limites: "Routines draw down subscription usage the same way interactive sessions do"; limite separado de 100 execuções agendadas por hora por conta; ao atingir o limite da assinatura, sem créditos de uso ativados, "additional runs are rejected until your usage window resets"; com assinatura pausada as routines param — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md).
- Repositórios: "Each repository you add is cloned on every run"; parte do branch padrão; "Claude pushes its work to a branch prefixed with `claude/` unless your prompt directs it to push to another branch"; se a conexão com o GitHub expirar, pula execuções por até 72 h e depois se desliga — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md).
- Autonomia: roda como sessão completa sem pedir aprovação; todos os conectores MCP da conta entram por padrão e "Claude can use every tool from an included connector, including writes, without asking for permission during a run" — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md).
- Rede: o ambiente Default usa acesso "Trusted" (só allowlist de registries, GitHub, SDKs de nuvem); outros hosts retornam 403 `host_not_allowed`; é possível mudar para "Custom" com domínios próprios ou "Full" — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md); níveis descritos em [Claude Code Docs — Cloud environments](https://code.claude.com/docs/en/cloud-environments.md).
- A lista padrão de domínios permitidos não contém `supabase` nem `vercel` (busca textual na página em 13/10/2026) — [Claude Code Docs — Cloud environments](https://code.claude.com/docs/en/cloud-environments.md).
- Segredos: variáveis de ambiente são visíveis a quem usa o ambiente; "on Pro and Max plans, store keys for the APIs Claude calls during a run as network secrets"; o proxy anexa o segredo quando o host da requisição coincide com o cadastrado, e a sessão alcança esses hosts mesmo fora do nível de rede — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md); [Claude Code Docs — Cloud environments](https://code.claude.com/docs/en/cloud-environments.md).
- Observabilidade: "A green status in the run list means the session started and exited without an infrastructure error. It does not mean the task in your prompt succeeded." — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md).
- Comparação oficial dos três agendamentos: Cloud = não exige máquina ligada, intervalo mínimo 1 h, sem acesso a arquivos locais (clone novo); Desktop = roda na máquina, exige máquina ligada, mínimo 1 min; `/loop` = exige sessão aberta — [Claude Code Docs — Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks.md).
- Tarefas agendadas do Desktop: "Tasks only run while the desktop app is running and your computer is awake"; ao acordar, roda **uma** execução de recuperação para o horário perdido mais recente dos últimos 7 dias — [Claude Code Docs — Desktop scheduled tasks](https://code.claude.com/docs/en/desktop-scheduled-tasks.md).
- `/loop` e `CronCreate`: escopo de sessão; "Recurring tasks automatically expire 7 days after creation"; só disparam com o Claude Code rodando — [Claude Code Docs — Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks.md).
- Modo headless: `claude -p "<prompt>"` roda de forma não interativa, com `--output-format json` e `--json-schema` para saída estruturada; `--bare` "doesn't use your subscription login" e exige `ANTHROPIC_API_KEY`; sem `--bare`, a sessão `-p` carrega o mesmo contexto de uma sessão interativa — [Claude Code Docs — Run Claude Code programmatically](https://code.claude.com/docs/en/headless.md).
- GitHub Action (`anthropics/claude-code-action@v1`): com o input `prompt` roda em modo automação "on any GitHub event, including a cron schedule" (exemplo oficial com `cron: "0 9 * * *"`); autentica com `ANTHROPIC_API_KEY` ou `CLAUDE_CODE_OAUTH_TOKEN` — "an OAuth token that authenticates with your Claude subscription, available on Pro, Max, Team, and Enterprise plans. Generate one by running `claude setup-token`" — [Claude Code Docs — GitHub Actions](https://code.claude.com/docs/en/github-actions.md).
- Custo da Action: minutos do GitHub Actions + tokens; "If you authenticate with an OAuth token, runs use your Claude subscription instead of API billing." — [Claude Code Docs — GitHub Actions](https://code.claude.com/docs/en/github-actions.md).
- A própria doc lembra: o GitHub só roda agendados do branch padrão e, "in public repositories, disables the schedule after 60 days without repository activity" — [Claude Code Docs — GitHub Actions](https://code.claude.com/docs/en/github-actions.md).

### Inferences
- **Viável**: uma routine semanal, sob a assinatura existente, que gera 7 posts e os deposita numa fila de revisão. Duas formas de depositar, pela doc: (a) commit/PR em branch `claude/…` de um repositório (a fila vira arquivo JSON/Markdown aprovado por merge); (b) `INSERT` na tabela do Supabase com status `draft`, o que exige liberar `*.supabase.co` na rede do ambiente (Custom) e guardar a chave como network secret.
- O repositório atual do Noivar é público e está defasado em relação ao código local (seção 1). Para a routine, o caminho mais limpo é um repositório **privado e pequeno só de conteúdo** (contexto do produto, tom de voz, fila), em vez de apontá-la para o repo do SaaS.
- A routine não deve ser o publicador diário: é preview, o sucesso não é sinalizado pelo status, consome a cota de uso que o fundador usa para trabalhar, e publicar exigiria entregar o token do Threads a uma sessão autônoma. Publicar é determinístico e barato na rota de cron.
- Alternativa ainda mais simples, sem nenhuma automação nova: uma vez por semana, numa sessão normal do Claude Code, pedir "gere os posts da semana e insira como rascunho". Custa 5 minutos e nenhuma configuração; a routine só automatiza esse gesto. Uma tarefa agendada do Desktop com recuperação de execução perdida faria o mesmo sem depender do GitHub, mas roda apenas com o computador ligado — aceitável para geração semanal, não para o post diário.
- `claude -p` com token de assinatura dentro de GitHub Actions também gera o lote, mas herda todos os problemas da seção 3 (repo público, 60 dias, branch padrão defasado).

### Gaps
- Não sei qual plano Claude o usuário tem; a doc exige Pro, Max, Team ou Enterprise para routines.
- A documentação não quantifica quanto de cota uma execução consome; um lote de 7 posts é uma sessão curta, mas o impacto na janela de uso não está documentado em números.
- Não confirmei se existe um conector (MCP) de Supabase ou Google Sheets disponível na conta que dispense a configuração de rede; a doc só descreve o mecanismo geral.
- Não consultei preços atuais das assinaturas Claude (irrelevante se a assinatura já existe).

---

## 9. Revisão humana antes de automatizar por completo — fila de aprovação

### Takeaway
A forma mais barata é uma **coluna `status` numa tabela do Supabase**, editada primeiro pelo próprio painel do Supabase (zero código) e depois, se valer a pena, por uma página em `/admin`. Tudo o mais (planilha, arquivo no repo, link por Telegram/e-mail) acrescenta um serviço ou um segundo lugar de estado.

### Cited Findings
- O projeto já tem área admin protegida por `requireAdmin()` e padrão de server actions com client service-role — `src/app/admin/layout.tsx` L5–8; `src/lib/auth.ts` L26–38; `src/app/dashboard/mercadopago-actions.ts` L22–38.
- Tabelas service-role-only já são o padrão do projeto (RLS ligada sem policy + revoke) — `supabase/migrations/0010_mercadopago_card_gifts.sql` L45–46; leitura por admin via policy `is_admin()` também existe — `supabase/migrations/0011_funnel_events.sql` L27–31.
- Apps Script em conta gmail.com permite 20.000 chamadas UrlFetch/dia, 90 min/dia de triggers e 6 min por execução — [Google — Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas).
- Routines do Claude Code gravam em branches `claude/…` e podem abrir PR; o repo do Noivar no GitHub é público — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md); consulta `gh repo view` em 13/10/2026.
- A Bot API do Telegram é "an HTTP-based interface" chamada em `https://api.telegram.org/bot<token>/METHOD_NAME` — [Telegram — Bot API](https://core.telegram.org/bots/api).
- Resend Free: 3.000 e-mails/mês, limite de 100/dia — [Resend — Pricing](https://resend.com/pricing).

### Inferences
Comparação das opções para um fundador solo (análise própria):

| Opção | Custo / serviços novos | Prós | Contras |
|---|---|---|---|
| **Tabela Supabase + Table Editor do painel** | R$ 0 / nenhum | Zero código de UI; mesmo banco do job; histórico e fila na mesma tabela; funciona hoje | Editar pelo painel do Supabase no celular é ruim; sem validação (ex.: limite de caracteres) além de constraints SQL; exige login no Supabase |
| **Página `/admin/...` no Noivar** | R$ 0 / nenhum | Mesma autenticação já existente; dá para pôr contador de caracteres, botão aprovar/rejeitar, prévia; usável no celular | É código e UI para escrever e manter (e segue o design system do projeto); só vale depois de validar o fluxo |
| **Google Sheets (+ Apps Script)** | R$ 0 / conta Google | Edição confortável em qualquer aparelho; qualquer pessoa sabe usar; cotas folgadas | Segundo lugar de estado; para o job da Vercel ler a planilha é preciso credencial do Google (service account) ou mover o job para o Apps Script; sem tipos nem constraints |
| **Arquivo JSON/Markdown no repo, aprovado por commit/PR** | R$ 0 / GitHub (já existe) | Casa com routine do Claude Code (PR semanal para revisar); histórico por git; diff legível | O job na Vercel só enxerga o arquivo após deploy (ou teria de ler via API do GitHub); repo atual é público; marcar "publicado" exigiria commit do job ou estado duplicado no banco |
| **Link de aprovação por Telegram ou e-mail** | R$ 0 / bot do Telegram ou Resend | Aprovação em um toque, onde o fundador já está; serve também de alerta | Precisa de rota pública com token assinado, bot/domínio de e-mail configurado e ainda uma tabela por trás; é um extra sobre a opção 1, não um substituto |

- Sequência de menor esforço: começar com tabela + painel do Supabase; lote semanal gerado pelo Claude Code entra como `draft`; o fundador troca para `approved`; o cron publica o próximo `approved` e grava `published`. Se não houver nada aprovado, o job não publica e registra o fato — isso é o próprio mecanismo de segurança.
- "Totalmente automático" depois é só uma mudança de regra (inserir já como `approved`), sem trocar infraestrutura.
- Constraints simples no banco evitam erros de revisão sem UI: `check (status in (...))` e `check (char_length(texto) <= N)`.

### Gaps
- Não medi o esforço real de uma página `/admin` nos padrões de design do projeto.
- Não confirmei em fonte oficial os limites de envio nem o custo da Bot API do Telegram (a página de FAQ deu erro de conexão; a referência da API é longa demais e não trata de preço no trecho lido).
- Não avaliei editores de terceiros sobre o Supabase (fora do escopo).

---

## 10. Falhas e alertas sem custo

### Takeaway
No Hobby a Vercel **não avisa** quando um cron falha, não tenta de novo e guarda logs por apenas 1 hora. O alerta precisa ser construído: gravar o resultado no banco (já existe `funnel_events`) e usar um "dead man's switch" externo gratuito — o Healthchecks.io avisa tanto em falha explícita quanto quando o job simplesmente não roda, que é o caso que nenhum `try/catch` pega.

### Cited Findings
- Vercel não refaz invocação de cron que falhou; os logs ficam acessíveis pelo botão "View Log" — [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- Uma execução perdida por erro transitório de rede **não gera log nenhum** ("no runtime log is created for that scheduled run") — [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- Retenção de Runtime Logs no Hobby: 1 hora (Pro: 1 dia); Log Drains não existem no Hobby — [Vercel — Hobby Plan](https://vercel.com/docs/plans/hobby).
- Alertas da Vercel (e-mail, Slack, webhook) só em "Enterprise and Pro plans with Observability Plus" — [Vercel — Alerts](https://vercel.com/docs/alerts).
- O projeto já persiste erros de servidor em `funnel_events` com `logServerError` e exibe para admin — `src/lib/funnel.ts` L99–117; `supabase/migrations/0011_funnel_events.sql` L12–31. A rota `mercadopago-refresh` hoje só faz `console.error` — `src/app/api/cron/mercadopago-refresh/route.ts` L25–28.
- **Healthchecks.io**: "listens for HTTP requests ('pings') from your cron jobs and scheduled tasks" e "raises an alert as soon as a ping does not arrive on time"; falha explícita anexando `/fail` à URL de ping; suporta agenda em cron e "Grace Time"; integrações citadas: "email, webhooks, SMS, Slack, PagerDuty, etc." — [Healthchecks.io — Docs](https://healthchecks.io/docs/).
- Healthchecks.io plano gratuito (Hobbyist): US$ 0/mês, "Monitor 20 jobs", "100 log entries per job"; plano seguinte US$ 5/mês — [Healthchecks.io — Pricing](https://healthchecks.io/pricing/).
- **cron-job.org**: notificação por e-mail em caso de job com falha; desativa o job após mais de 25 falhas — [cron-job.org — FAQ](https://cron-job.org/en/faq/).
- **GitHub Actions**: notificações de workflows agendados vão para quem criou o workflow (ou para quem alterou o cron por último); dá para receber "only when a workflow run has failed" — [GitHub Docs — Notifications for workflow runs](https://docs.github.com/en/actions/concepts/workflows-and-actions/notifications-for-workflow-runs).
- **Resend Free**: 3.000 e-mails/mês, "limited to 100 emails per day", 30 dias de retenção; Pro US$ 20/mês — [Resend — Pricing](https://resend.com/pricing).
- **Telegram**: envio por HTTP simples em `https://api.telegram.org/bot<token>/METHOD_NAME` — [Telegram — Bot API](https://core.telegram.org/bots/api).
- **Supabase**: quem usa Supabase Cron tem histórico de execuções com status e erro em `cron.job_run_details` — [Supabase Docs — Cron](https://supabase.com/docs/guides/cron).
- **Claude Code routines**: status verde não significa sucesso da tarefa; é preciso abrir a execução para conferir — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md).

### Inferences
- Camadas, da mais barata para a mais completa, todas a R$ 0:
  1. **Registrar no banco**: cada execução grava sucesso/erro na linha do post e em `funnel_events`. Custa nada e resolve a retenção de 1 h. Sozinho, porém, só informa se o fundador olhar.
  2. **Ping de dead man's switch**: no fim do job, um `fetch` na URL do Healthchecks.io (ou `/fail` no catch). Cobre os dois modos de falha — erro explícito e "o cron não disparou" — e manda e-mail. Uma conta nova, uma env nova, duas linhas de código.
  3. **Mensagem ativa** (Telegram ou e-mail via Resend) no catch. Mais imediato, mas não detecta execução que nem começou; exige bot/domínio configurado. Redundante se a camada 2 existir.
- Token prestes a expirar é uma falha previsível: vale tratar "renovação falhou" como erro que dispara o mesmo alerta, com dias de antecedência (janela folgada, como os 30 dias do Mercado Pago).
- Fila vazia (nada aprovado) deve gerar aviso, não erro silencioso — é o modo de falha mais provável de um fluxo com revisão humana.
- Se o relógio for o cron-job.org (seção 6), o e-mail de falha dele já cobre o caso "a rota respondeu erro", sem código.

### Gaps
- A página de preços do Healthchecks.io não lista as integrações incluídas no plano gratuito, e a de docs não cita Telegram explicitamente; não confirmei se Telegram está disponível no Hobbyist.
- Limites de envio e gratuidade da Bot API do Telegram não confirmados em fonte oficial nesta pesquisa.
- Não verifiquei se a Vercel envia algum e-mail padrão de falha de cron no Hobby; a documentação de alertas indica que não.

---

## 11. Comparação das combinações candidatas

### Takeaway
A combinação que reaproveita o stack existente — **Vercel Cron (rota nova) + Supabase (tabela de fila/histórico + token cifrado) + lote de posts gerado pelo Claude Code + revisão pela coluna `status`** — é a única com custo R$ 0, **zero contas novas** e zero runtime novo. As demais só se justificam para resolver um problema específico: horário exato (relógio externo), alerta (Healthchecks.io) ou conformidade comercial (Vercel Pro, ~R$ 100/mês).

### Cited Findings
- O stack atual já cobre relógio, autenticação de cron, estado, cifragem de token, log e admin — ver seção 1 (`vercel.json` L3–12; `src/app/api/cron/mercadopago-refresh/route.ts`; `src/lib/mercadopago-server.ts`; `src/lib/secret-box.ts`; `src/lib/funnel.ts`; `src/app/admin/layout.tsx`).
- Vercel Hobby: 100 crons/projeto, 1×/dia, ±59 min, sem retry, logs de 1 h, uso comercial proibido; Pro a US$ 20/assento/mês — [Vercel — Usage & Pricing for Cron Jobs](https://vercel.com/docs/cron-jobs/usage-and-pricing); [Vercel — Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines); [Vercel — Hobby Plan](https://vercel.com/docs/plans/hobby).
- Supabase Free: 500 MB, pausa após 1 semana de inatividade — [Supabase — Pricing](https://supabase.com/pricing).
- GitHub Actions: atrasos/descartes de `schedule`, regra de 60 dias em repo público — [GitHub Docs — Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
- n8n Cloud sem plano gratuito, a partir de €20/mês — [n8n — Pricing](https://n8n.io/pricing/).
- Cloudflare Workers Free: 5 cron triggers, 10 ms de CPU, D1/KV gratuitos — [Cloudflare — Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
- Routines do Claude Code: nuvem, planos pagos de assinatura, research preview — [Claude Code Docs — Routines](https://code.claude.com/docs/en/routines.md).
- Custos de IA por modelo — ver tabela da seção 7, calculada a partir de [Anthropic — Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [OpenAI — API pricing](https://developers.openai.com/api/docs/pricing) e [Google — Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).

### Inferences

**Tabela comparativa** (avaliação própria; "contas novas" = cadastros que o fundador ainda não tem)

| # | Combinação | Custo mensal | Confiabilidade | Contas/serviços novos | Manutenção | Extensão a outras redes |
|---|---|---|---|---|---|---|
| A | **Vercel Cron + Supabase + fila pré-aprovada (lote gerado pelo Claude Code em sessão ou routine)** | R$ 0 | Boa para post diário; sem retry, janela de 1 h, possível dia perdido; sem dependência de IA em tempo de execução | **0** | Baixa: 1 rota, 1–2 tabelas, tudo no repo e nos padrões já testados | Alta: nova rede = nova função de publicação + coluna `rede` na mesma fila |
| B | A + IA em tempo de execução via **Gemini free tier** | R$ 0 | Como A, mais a fragilidade de limites/modelos gratuitos que mudam | 1 (chave do AI Studio) | Baixa–média: tratar 429/modelo removido; dados usados pelo Google | Alta |
| C | A + IA em tempo de execução via **API paga** (Haiku 5.5, gpt-5-nano, Flash-Lite, ou Sonnet 5.5) | R$ 0,04 a R$ 1,35 (até ~R$ 2,71 com Opus 5.5) | Melhor que B (sem cota gratuita volátil) | 1 (console do provedor + crédito pré-pago) | Baixa | Alta |
| D | A + **relógio externo** (cron-job.org ou QStash) chamando a rota | R$ 0 | Horário exato; cron-job.org avisa falha por e-mail; QStash faz retry | 1 | Baixa | Igual a A |
| E | A + **Healthchecks.io** como alerta | R$ 0 | Detecta falha e ausência de execução | 1 | Mínima | Igual a A |
| F | **Supabase pg_cron → Edge Function** (sem Vercel no caminho) | R$ 0 | Horário exato; sem retry; para junto se o projeto pausar | 0 | Média: segundo runtime (Deno), deploy de função, segredos duplicados | Média |
| G | **Supabase pg_cron + pg_net puro (SQL)** | R$ 0 | Baixa: assíncrono, timeout de 2 s, sem retry, depuração em tabelas internas | 0 | Alta relativa (lógica em PL/pgSQL) | Baixa |
| H | **GitHub Actions** como relógio/executor | R$ 0 | A pior entre as gratuitas: atraso, descarte, desativação em 60 dias no repo público | 0 (já tem GitHub), mas exige arrumar o repo | Média: secrets duplicados, PAT para persistir token, repo defasado | Média |
| I | **Cloudflare Workers Cron + D1/KV (+ Workers AI)** | R$ 0 | Boa | 1 | Média: outro runtime e outro estado | Média–alta |
| J | **Google Apps Script + Sheets** | R$ 0 | Boa para 1×/dia | 0–1 (conta Google) | Média: código fora do repo; token em Script Properties | Média |
| K | **n8n self-hosted** em VM gratuita (Oracle) | R$ 0 nominal | Depende da VM: risco de recuperação por ociosidade e de capacidade | 1–2 (Oracle + domínio/SSL) | Alta: servidor para atualizar, proteger e fazer backup | Alta em nós prontos, mas com todo o custo operacional |
| L | **n8n Cloud** | a partir de €20/mês | Boa | 1 | Baixa | Alta |
| M | Qualquer das anteriores com **Vercel Pro** | + US$ 20 ≈ R$ 100/mês | Cron por minuto, logs de 1 dia, alertas disponíveis (com Observability Plus) e uso comercial permitido | 0 | Baixa | — |

**Leitura da tabela**
- **A** resolve o pedido inteiro com o que já existe. A geração de texto sai do caminho crítico: quem publica é um job determinístico que lê uma linha aprovada; quem escreve é o Claude Code, sob a assinatura que o fundador já paga. Nenhuma chave de IA em produção, nenhum SDK novo.
- **E** é o complemento de melhor custo-benefício (uma conta, duas linhas), porque o Hobby não alerta nada. **D** só se o horário exato passar a importar.
- **B/C** só fazem sentido quando a etapa de revisão humana for removida e se quiser texto novo todo dia sem lote. Nesse ponto, C com um modelo barato custa centavos e é mais previsível que qualquer free tier.
- **F–L** trocam ou duplicam infraestrutura sem ganho proporcional para um POST por dia.
- **M** não é sobre o Threads: é a pendência de conformidade do Noivar como SaaS comercial em plano Hobby. Vale decidir separadamente; se for feita, vários limites desta pesquisa deixam de existir.

**Onde cada coisa vive, na combinação A**
- Onde roda: função da Vercel disparada por cron diário (UTC), autenticada por `CRON_SECRET`.
- Token do Threads (60 dias): linha em tabela service-role-only no Supabase, cifrada com `secret-box.ts`, com `expires_at`; renovação dentro do próprio job diário.
- Fila, histórico e status de revisão: uma tabela no Supabase.
- Logs: a própria linha do post (resultado/erro) + `funnel_events`.
- Geração: lote semanal pelo Claude Code (sessão manual, tarefa do Desktop ou routine), inserido como rascunho.
- Alerta: Healthchecks.io (opcional, recomendado).

### Gaps
- A comparação de confiabilidade é qualitativa: nenhuma das fontes traz taxa medida de execuções perdidas para Vercel Cron Hobby, GitHub Actions `schedule` ou `pg_cron` no Free.
- O ponto mais importante a confirmar antes de implementar não é de pesquisa, é de ambiente: **qual código está em produção na Vercel e em qual plano** (o remoto do GitHub está 41 commits atrás do local).
- Não avaliei agendadores sociais de terceiros (Buffer, Postiz etc.) nem a API do Threads em si — fora do escopo, cobertos por outros pesquisadores. A compatibilidade do fluxo de publicação e de renovação de token com cada runtime depende desses achados.
- Câmbio EUR/BRL não consultado; preços em euro (n8n) não foram convertidos.
