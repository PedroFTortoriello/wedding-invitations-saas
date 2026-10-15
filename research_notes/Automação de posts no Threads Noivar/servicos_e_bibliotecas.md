# Serviços de terceiros, bibliotecas open-source e projetos do GitHub que publicam no Threads (alternativas à API oficial direta)

> Estado verificado em **13/10/2026**. Toda página de preço foi buscada nessa data, salvo indicação contrária. Onde a página oficial não carregou (renderização só em JavaScript, 404 ou loop de redirecionamento), isso está dito no item e o dado vem marcado como **fonte secundária**.
> Câmbio usado nas conversões (aproximado): **US$ 1 ≈ R$ 5,02** e **€ 1 ≈ R$ 5,61** (derivado de USD→BRL 5,015 e USD→EUR 0,893, atualização de 14/10/2026 00:02 UTC) — [open.er-api.com](https://open.er-api.com/v6/latest/USD). Todos os valores em R$ abaixo são aproximados.
> Dados de repositórios (stars, último push, licença, arquivado) foram lidos da API do GitHub em 13/10/2026; os links apontam para o repositório.

## 1. Agendadores de redes sociais com plano gratuito PERMANENTE: quais existem em outubro/2026, incluem Threads, quantos posts/canais, e têm API?

### Takeaway
Só quatro agendadores comerciais confirmaram, na página oficial, plano grátis permanente **com Threads** e sem teto mensal abaixo de 30 posts: **Buffer** (3 canais, fila de 10 posts por canal, **API incluída no Free**), **Publer** (3 contas, 10 agendados por conta, API é recurso pago), **Fedica** (limite de 10 posts no calendário, sem API encontrada) e o open-source com versão hospedada grátis **BrightBean Studio** (REST API + MCP). Metricool (20 posts/mês), Pallyy (15/mês, só imagem) e Publora (15/mês) têm plano grátis com Threads, mas o teto mensal não cobre 1 post/dia; Later, Postiz Cloud, SocialBee, Vista Social, Planable, Hootsuite e Postfa.st **não têm** plano grátis permanente, e Zoho Social e Mixpost Lite têm plano grátis **sem Threads**.

### Cited Findings

#### Buffer — https://buffer.com/pricing
- Plano **Free** descrito como "Free forever", conecta "up to 3 channels"; planos pagos: Essentials US$ 5/mês por canal (~R$ 25) e Team US$ 10/mês por canal (~R$ 50) — [Buffer Pricing](https://buffer.com/pricing)
- Limite do Free: **10 posts agendados por canal**, e a vaga é liberada quando o post é publicado (é um teto de fila, não um teto mensal); 1 usuário; 1 "threaded post"; 100 ideias; histórico de Insights de 30 dias — [Buffer Pricing](https://buffer.com/pricing)
- **Threads está incluído**: a tabela de canais lista "Threads profiles" com publicação automática, sem restrição declarada para o Free — [Buffer Pricing](https://buffer.com/pricing)
- **API incluída no plano Free**: 1 API key e 1 app client; limites por cliente de 100 requisições/15 min, 250/24 h e 3.000/30 dias (Essentials: 3 keys, 7.500/30 dias; Team: 5 keys, 500/24 h, 15.000/30 dias) — [Buffer API limits](https://developers.buffer.com/guides/api-limits.md)
- A API é **GraphQL**, com POST em `https://api.buffer.com` e autenticação `Authorization: Bearer ${apiKey}`; janelas de limite são rolantes e estourar devolve HTTP 429 — [Buffer API limits](https://developers.buffer.com/guides/api-limits.md); [Troubleshooting Buffer's API](https://support.buffer.com/articles/troubleshooting-buffers-api-VgBuQXUCDI.md)
- Posts são criados com a mutation `createPost`; agendamento usa o modo `customScheduled` com timestamp `dueAt`; mídia entra pelo argumento `assets` (cada item é `image`, `video` ou `document`), anexada **por URL**; a documentação cita threads em "Bluesky, Threads, or Mastodon" — [Buffer developers llms.txt](https://developers.buffer.com/llms.txt)
- Um rastreador de mudanças de preço registra "API access added to all plans" no 2º trimestre de 2026 e o aumento do limite de 24 h do Free de 100 para 250 (fonte secundária) — [PricingSaaS – Buffer 2026Q2](https://pricingsaas.com/companies/buffer/diffs/2026Q2)
- Recursos de Threads suportados: texto, links, imagens, vídeo e threads de vários posts (até 25); carrossel só de imagens (2 a 10 fotos); **não** suporta GIFs, enquetes, alt text nem citações/reposts agendados — [Using Threads with Buffer](https://support.buffer.com/article/857-using-threads-with-buffer)
- Limites de Threads no Buffer: 500 caracteres por mensagem (contados em bytes UTF-8), até 5 links por post, 250 posts por 24 h, imagens JPG/PNG de até 8 MB — [Using Threads with Buffer](https://support.buffer.com/article/857-using-threads-with-buffer)
- Requisitos de conta: "your Threads account will need to be linked to an Instagram account to connect it to Buffer" e "Your Threads account must be public"; a conexão usa a conta de Threads ativa na sessão do navegador (login com Instagram em threads.net e depois conectar o canal no Buffer) — [Using Threads with Buffer](https://support.buffer.com/article/857-using-threads-with-buffer)
- Renovação de conexão: o mesmo artigo diz "If your Threads channel is set to private, the access token we use will expire in 90 days, which will require you to refresh your channel"; para perfil público não há prazo declarado, apenas "refresh" quando o Buffer pedir; canais desconectados sobem para o topo da página Channels com botão Refresh e exigem novo login — [Using Threads with Buffer](https://support.buffer.com/articles/using-threads-with-buffer-HN9ZUFnVZv); [Refreshing a channel in Buffer](https://support.buffer.com/article/573-refreshing-a-channel-in-buffer)
- Houve incidente de conexão/refresh de canais Threads no Buffer em 23/09/2026, resolvido no mesmo dia após correção do lado do Threads (fonte secundária, agregador de status) — [IsDown – Buffer incident 659418](https://isdown.app/status/buffer/incidents/659418-issue-connecting-and-refreshing-threads)

#### Metricool — https://metricool.com/pricing/
- Plano **Free** a €0/US$ 0: "Manage 1 brand" e "**Schedule up to 20 posts per month**"; Threads aparece com 1 conexão no Free, junto com Facebook, Instagram, Bluesky, Pinterest, TikTok, YouTube, Twitch e Google Business Profile — [Metricool Pricing](https://metricool.com/pricing/)
- O Free **exclui LinkedIn e X**: "Manage all your brands' social networks (except LinkedIn and Twitter)" — [Metricool Pricing](https://metricool.com/pricing/)
- **API não está no Free**: "Metricool API (Zapier, Make)" aparece só em Advanced e Custom; as linhas de Zapier e Make.com mostram "no" na coluna Free — [Metricool Pricing](https://metricool.com/pricing/)
- Pagos: Starter a partir de US$ 25/mês mensal ou US$ 20/mês anual (~R$ 125 / ~R$ 100); Advanced a partir de US$ 67/mês mensal (~R$ 336); preços sem IVA — [Metricool Pricing](https://metricool.com/pricing/)

#### Publer — https://publer.com/plans
- A URL `publer.com/pricing` entrou em loop de redirecionamento no fetch automático; o conteúdo abaixo foi lido baixando `publer.com/plans` diretamente (HTML bruto, 13/10/2026) — [Publer Plans](https://publer.com/plans)
- Plano **Free** rotulado "Free forever": 1 usuário, 1 workspace, **3 contas sociais (exceto X)** — "You cannot connect Twitter / X accounts in the free version" — [Publer Plans](https://publer.com/plans)
- Limites do Free: "**10 scheduled posts per account**" ("Once a scheduled post is published or deleted, you can schedule another one for that social account. No such limitation when publishing right away"), 25 rascunhos salvos e histórico de posts de apenas 24 horas — [Publer Plans](https://publer.com/plans)
- Threads é plataforma suportada ("Threads — Schedule posts and threads"); a tabela de limites diários por perfil mostra "Threads App Posts" 150 / 200 / 250 / Unlimited conforme o nível do plano — [Publer Plans](https://publer.com/plans)
- "Publer API" ("Programmatically create & schedule new content...") e "Publer MCP" aparecem na lista de recursos pagos, no bloco que segue os recursos do plano Business (analytics, best times, competitor analysis); a página lida em texto bruto não permite atribuir a coluna com certeza — [Publer Plans](https://publer.com/plans)
- Fontes secundárias afirmam que a Publer API é recurso do plano **Business** e divergem no preço (US$ 10/mês; US$ 8/mês anual; US$ 10 por conta/mês) — [socialk.it](https://socialk.it/en/pricing/publer); [SocialChamp](https://www.socialchamp.com/blog/publer-pricing/); [CostBench](https://costbench.com/software/social-media-management/publer/free-plan/)

#### Fedica — https://fedica.com/threads/tools
- A página de preços `fedica.com/pricing` devolveu **404** em 13/10/2026; os limites abaixo vêm de páginas de produto e do blog da própria Fedica.
- "Thread scheduling is available on every Fedica plan, including free" e "Pipelines and bulk upload are included free" — [Fedica Threads tools](https://fedica.com/threads/tools)
- O blog da Fedica descreve agendamento ilimitado de posts no Threads no plano Free com o limite de **10 posts no calendário a qualquer momento** (lido via resumo de busca, não via fetch da página) — [Fedica blog](https://fedica.com/blog/schedule-threads-posts-across-platforms/)
- A página de ferramentas de Threads não menciona API, RSS nem Zapier — [Fedica Threads tools](https://fedica.com/threads/tools)
- Preços pagos divergem entre fontes secundárias (Publish US$ 15/mês ou US$ 10/mês anual; Grow US$ 29/mês) — [TikTok App Center – Fedica](https://ads.tiktok.com/apps_and_agents/app-center/detail/7358618666587619329); [Nubia review](https://nubiapage.com/fedica-review-2026-free-plan-login-sign-up-pricing-app-user-experience-and-faqs/)

#### BrightBean Studio (open-source com versão hospedada grátis) — https://brightbean.xyz/studio/
- Candidato não listado no pedido. Repositório `brightbeanxyz/brightbean-studio`: **2.463 stars**, licença **AGPL-3.0**, Python/Django, criado em 25/03/2026, último push em 13/10/2026 — [GitHub](https://github.com/brightbeanxyz/brightbean-studio)
- Versão hospedada: "has been free since day one and will stay that way", "Not a trial, not a freemium tier. Just free.", "No per-channel limits"; modelo de receita declarado: "We make money from BrightBean's API products, not from Studio" — [BrightBean Studio](https://brightbean.xyz/studio/)
- Threads na tabela de plataformas do README: Publish ✓, Comments ✓, DMs —, Insights ✓; também cobre Instagram, Facebook, LinkedIn, entre outras — [GitHub README](https://github.com/brightbeanxyz/brightbean-studio)
- Tem **REST API e servidor MCP** ("so agents and scripts can read analytics, manage media, and create or schedule posts"), com API keys emitidas em Organization → API Keys e enviadas como Bearer token; endpoint MCP em `{APP_URL}/api/v1/mcp` — [GitHub README](https://github.com/brightbeanxyz/brightbean-studio)
- No self-host, as credenciais de plataforma são do usuário: "To connect social media accounts, you need API credentials from each platform's developer portal"; Threads usa "a separate app identity — its own App ID, App Secret, and redirect URI list" dentro do app Meta, com permissões `threads_basic` e `threads_content_publish` — [GitHub README](https://github.com/brightbeanxyz/brightbean-studio)

#### Publora — https://publora.com/pricing
- Candidato não listado no pedido. Plano **Starter** a US$ 0, "Free forever, no credit card": **15 posts por mês**, 3 contas sociais, 3 posts agendados por vez, agendamento com até 7 dias de antecedência, "All platforms (except X)" e "**API & MCP access**" incluído — [Publora Pricing](https://publora.com/pricing)
- Pro: US$ 29,95/mês para 5 contas (~R$ 150), posts ilimitados — [Publora Pricing](https://publora.com/pricing)

#### Pallyy — https://pallyy.com/pricing
- "Free plan. One social set, 15 scheduled posts a month, **image posts only**"; a página não usa a palavra "forever" — [Pallyy Pricing](https://pallyy.com/pricing)
- "API access" listado em Pro (US$ 25/mês, ~R$ 125), Agency (US$ 99/mês) e Scale (US$ 199/mês); não listado no Free — [Pallyy Pricing](https://pallyy.com/pricing)

#### Zoho Social — https://www.zoho.com/social/pricing.html
- Existe edição gratuita vitalícia ("plano Gratuito vitalício com recursos limitados" após o teste de 15 dias): 1 marca, 1 membro, 6 canais (X, Instagram, Facebook, LinkedIn e Google), com agendamento incluído — [Zoho Social Pricing](https://www.zoho.com/social/pricing.html)
- **Threads não está na edição gratuita**; aparece a partir do plano Padrão (Standard). Os valores dos planos não foram renderizados no fetch — [Zoho Social Pricing](https://www.zoho.com/social/pricing.html)

#### Mixpost — https://mixpost.app/pricing
- **Lite**: grátis e open-source ("Mixpost Lite is completely free and open source"); **Pro**: US$ 299 pagamento único (~R$ 1.500), "Pay once, own forever"; **Enterprise**: US$ 1.199 pagamento único (~R$ 6.000); licenças pagas são "source-available" — [Mixpost Pricing](https://mixpost.app/pricing)
- **Lite não publica no Threads**: "Lite package does not support this social platform"; Threads é Pro/Enterprise — [Mixpost docs – Threads](https://docs.mixpost.app/services/social/threads/)
- API, MCP e Webhooks estão na lista do Pro, não do Lite — [Mixpost Pricing](https://mixpost.app/pricing)

#### Sem plano grátis permanente (só teste) ou com teto único
- **Later**: sem plano grátis; "Start 14-day free trial"; Starter US$ 18,75/mês no anual (~R$ 94), 30 posts por perfil/mês; suporta Threads; a página não menciona API — [Later Pricing](https://later.com/pricing/)
- **Postiz Cloud**: sem plano grátis, apenas teste de 7 dias; Standard US$ 29/mês (~R$ 145) com 5 canais e posts ilimitados; API, MCP e CLI em todos os planos pagos; Threads suportado — [Postiz Pricing](https://postiz.com/pricing)
- **SocialBee**: sem plano grátis; "Free 14-day trial", "Posting stops automatically once your trial expires"; Bootstrap US$ 29/mês (~R$ 145); lista "Threads (profiles)" — [SocialBee Pricing](https://socialbee.com/pricing/)
- **Vista Social**: sem plano grátis; teste de 14 dias; Professional US$ 99/mês (~R$ 497); Threads nos planos pagos; menciona MCP e integrações Zapier/Make (esta última no Advanced) — [Vista Social Pricing](https://vistasocial.com/pricing/)
- **Planable**: sem plano grátis permanente; "The first 50 posts are free", "50 created posts total", "no time limit", "The 50 posts don't reset monthly"; Basic US$ 33/workspace/mês (~R$ 166); Public API só em Pro (US$ 49) e Enterprise; agenda Threads — [Planable Pricing](https://planable.io/pricing/)
- **Hootsuite**: sem plano grátis; "Free 14-day trial"; planos a partir de US$ 99 (~R$ 497); a página de planos não menciona Threads — [Hootsuite Plans](https://www.hootsuite.com/plans)
- **Postfa.st**: sem plano grátis; "7-day free trial"; Starter €10/mês no anual ou €12/mês mensal (~R$ 56 / ~R$ 67), 4 contas, 150 posts agendados; Threads entre as 11 plataformas; "the REST API and the MCP server on every plan" — [Postfa.st Pricing](https://postfa.st/pricing)

#### Páginas de preço que NÃO puderam ser lidas
- **Typefully**: `typefully.com/pricing` devolve apenas navegação (conteúdo renderizado em JavaScript). Agregadores citam plano grátis limitado a 15 posts/mês e 1 social set e divergem nos preços pagos (US$ 8, US$ 10, US$ 12,50) — fonte secundária — [aiproductivity.ai](https://aiproductivity.ai/pricing/typefully/); [toolradar](https://toolradar.com/tools/typefully/pricing)
- A documentação da API do Typefully confirma autenticação por Bearer API key, Threads como plataforma suportada, e respostas 402 "Account is paused or requires a paid plan before creating drafts" — [Typefully API docs](https://typefully.com/docs/api)
- **Postpone**: `postpone.app/pricing` devolve só o título (renderizado em JavaScript). A central de ajuda confirma que existe plano grátis ("schedule posts and most Postpone features on the free plan") e teste de 14 dias de todos os planos, mas não dá limites de posts — [Postpone Help – free trial](https://help.postpone.app/account-and-billing/billing/free-trial)
- Capterra lista preço inicial de US$ 25 com "free version available" para o Postpone (fonte secundária) — [Capterra](https://www.capterra.com/p/10027268/Postpone/)

### Inferences
- Para 1 post/dia (30–31 por mês), os tetos mensais de Metricool (20), Publora (15), Pallyy (15) são insuficientes; os tetos de **fila** de Buffer (10 por canal), Publer (10 por conta) e Fedica (10 no calendário) não limitam o total mensal, só quantos posts ficam pendentes — basta reabastecer a fila pelo menos a cada 10 dias, ou criar 1 post por dia.
- **Buffer Free é o único agendador comercial confirmado em página oficial que junta: grátis permanente + Threads + API no plano grátis.** Um script chamando `createPost` uma vez por dia consome ~30 das 3.000 requisições/30 dias.
- Com Buffer, Publer, Fedica, Metricool e a versão hospedada do BrightBean, o usuário não cria app Meta: a conexão é feita por login OAuth no app do próprio fornecedor (o artigo do Buffer descreve apenas login com Instagram/Threads). Isso é inferência do fluxo descrito — nenhuma das páginas diz textualmente "no Meta developer app needed".
- O artigo do Buffer contém uma tensão: exige conta pública ("must be public") e, ao mesmo tempo, descreve expiração de 90 dias para canal privado. A leitura mais segura é manter o perfil público e esperar reconexão manual esporádica, não em calendário fixo.
- Pallyy Free ("image posts only") provavelmente não serve para posts só de texto no Threads.
- Mixpost Lite e Zoho Social Free podem ser descartados para este caso: são grátis, mas sem Threads.

### Gaps
- **Typefully e Postpone**: limites e preços do plano grátis não confirmados em fonte primária (páginas renderizadas só em JavaScript); não foi possível confirmar se a API do Typefully funciona no plano grátis.
- **Fedica**: página de preços oficial indisponível (404); não confirmei se existe API pública nem os preços pagos atuais.
- **Publer**: não confirmei em fonte primária em qual plano a Publer API entra nem o preço atual dos planos pagos (o HTML bruto não trouxe os valores).
- **Metricool**: status do "Metricool MCP" no plano Free ficou ambíguo (uma leitura indicou incluído, outra indicou "Limits may apply" sem coluna identificável).
- **BrightBean (versão hospedada)**: a página não diz se o usuário precisa cadastrar o próprio app Meta para conectar Threads na versão hospedada, nem publica SLA; projeto tem ~7 meses de vida.
- Não testei na prática nenhuma chamada de API (Buffer `createPost` para canal Threads, por exemplo); tudo acima é leitura de documentação.
- Não encontrei política de inatividade/expurgo de contas grátis em nenhum fornecedor.
- Não verifiquei se a exigência do Buffer de "Threads ligado a uma conta Instagram" aceita Instagram pessoal ou exige Business/Creator — o artigo não diz.

## 2. Produtos de "social posting API" para desenvolvedores: quais têm free tier real com Threads, quais os limites mensais, e usam a API oficial com app Meta próprio do fornecedor?

### Takeaway
**Zernio (ex-Late)** é o único cuja página oficial mostra free tier sem teto de posts: as 2 primeiras contas conectadas são grátis, com "unlimited posts" e API completa. Os demais free tiers são pequenos demais para 1 post/dia — bundle.social (20/mês), Upload-Post (10/mês), Postproxy (10) — e Ayrshare, Outstand e Blotato não têm plano grátis utilizável. Vários afirmam poupar o usuário do app Meta/app review (Outstand e Upload-Post de forma explícita; Zernio e Postproxy de forma implícita), mas só o bundle.social diz textualmente que chama a "Meta Threads API".

### Cited Findings

#### Zernio (antigo Late / getlate.dev) — https://zernio.com/pricing
- Preço por conta social conectada, sem planos: "Every feature is included on every account, nothing is gated behind a plan"; contas 1–2 **grátis** ("The first 2 accounts are free, no credit card required"), contas 3–10 a US$ 6/mês cada (~R$ 30), 11–100 a US$ 3/mês, 101+ a US$ 1/mês — [Zernio Pricing](https://zernio.com/pricing)
- O free tier inclui "unlimited posts" e "the full API" ("full API access" em toda conta conectada) — [Zernio Pricing](https://zernio.com/pricing)
- X (`twitter`) é exceção e exige cartão porque o X cobra cada chamada de API — [Zernio Docs](https://docs.zernio.com/)
- Threads: conexão por `GET /v1/connect/threads` com `profileId`; a conta "connects through Instagram authentication (the same Facebook app)"; tipos suportados: texto, imagem, vídeo, carrossel (até 10 imagens) e sequências de thread; 500 caracteres; 250 posts via API por 24 h — [Zernio Docs – Threads](https://docs.zernio.com/platforms/threads)
- A documentação do Zernio afirma: "**Threads requires an Instagram Business or Creator account with Threads enabled**" — [Zernio Docs – Threads](https://docs.zernio.com/platforms/threads)
- A página de marketing diz que a API do Threads exige "Facebook app review" e que "Zernio skips all of that with one endpoint for text, images, and video posts" — [Zernio Threads API](https://zernio.com/threads-api)
- O guia de conexão de contas não pede credenciais de app do desenvolvedor: o fluxo começa na `authUrl` devolvida pelo Zernio; existe um estado `reconnect_required` para contas que perdem autorização — [Zernio Docs – Connecting accounts](https://docs.zernio.com/guides/connecting-accounts)
- Rebrand: fontes de terceiros informam que Late (getlate.dev) virou Zernio, que getlate.dev redireciona permanentemente para zernio.com (setembro/2026) e que a API e os endpoints `/api/v1` não mudaram; as páginas do próprio Zernio que li não mencionam "Late" — [OpenTweet vs Zernio](https://opentweet.io/vs/zernio); [Ryan Doser review](https://ryandoser.com/zernio-review/)
- **Conflito de fontes sobre o free tier**: um blog de concorrente (PostPeer, 08/07/2026) descreve o Zernio como "20 posts, 2 social sets" grátis e US$ 19/mês por 120 posts no plano Build — [PostPeer blog](https://www.postpeer.dev/blog/best-threads-posting-api); contradito por [Zernio Pricing](https://zernio.com/pricing) lido em 13/10/2026 (por conta, posts ilimitados)
- Uma avaliação de 1 estrela no Trustpilot alega que, após o rebrand, preços e planos mudaram drasticamente (relato único, não verificado) — [Trustpilot – zernio.com](https://dk.trustpilot.com/review/zernio.com)

#### bundle.social — https://bundle.social/pricing
- Plano **Free** permanente a US$ 0 por organização: **20 posts/mês**, 50 comentários/mês, 3 contas sociais; sem DMs nem automações; Pro a US$ 100/mês (~R$ 500) com 10.000 posts/mês — [bundle.social Pricing](https://bundle.social/pricing)
- Usa a API oficial: "bundle.social calls Meta Threads API for you", cuidando de armazenamento e renovação de token, mídia, agendamento e status; conteúdo suportado: texto, imagens, vídeos, carrossel, alt text e respostas — [bundle.social Threads API](https://bundle.social/threads-api)
- A mesma página alerta: "Threads uses Meta's permission and account model, so OAuth and app review still matter" e não diz de quem é o app usado — [bundle.social Threads API](https://bundle.social/threads-api)

#### Upload-Post — https://www.upload-post.com/
- "Free tier: Yes, **10 uploads/month**, no credit card required"; o plano grátis inclui 2 perfis e 1 seat; Basic US$ 24/mês mensal ou US$ 16/mês anual (~R$ 120 / ~R$ 80), 5 perfis — [Upload-Post llms-full.txt](https://www.upload-post.com/llms-full.txt)
- Threads: "Share videos, images and text posts via the Threads (by Meta) API" — [Upload-Post llms-full.txt](https://www.upload-post.com/llms-full.txt)
- Para Instagram o documento diz "no Meta developer app or app review needed"; não descreve o processo de conexão do Threads — [Upload-Post llms-full.txt](https://www.upload-post.com/llms-full.txt)
- Existe app do Upload-Post no Make ("Upload Post by Maxmel Tech") — [Make Apps – Upload Post](https://apps.make.com/upload-post-bbxbx8)

#### Postproxy — https://postproxy.dev/pricing
- "Start free with 10 posts"; o FAQ da mesma página diz "up to 10 posts per month" (as duas frases não são equivalentes); pagos: Agentic US$ 17/mês (~R$ 85) com 5 perfis, Business US$ 49/mês, Enterprise US$ 399/mês — [Postproxy Pricing](https://postproxy.dev/pricing)
- Threads está na lista de plataformas; sobre app review das plataformas: "We already handle that moving target for you"; BYOK é citado só para throughput do X — [Postproxy Pricing](https://postproxy.dev/pricing)

#### Ayrshare — https://www.ayrshare.com/pricing/
- A página de preços **não lista plano grátis**: Premium US$ 149/mês (~R$ 747), Launch US$ 299/mês, Business US$ 599/mês; oferece teste de 28 dias no Launch; não cita Threads nominalmente ("14+ social platforms") — [Ayrshare Pricing](https://www.ayrshare.com/pricing/)
- A central de ajuda (versão em alemão) diz que o plano Basic com 20 posts/mês não está mais disponível para novos cadastros e que clientes antigos o mantêm — [Ayrshare Help (DE)](https://www.ayrshare.com/docs/de/help-center/product/what_is_the_basic_plan_post_limit); contradito pela versão em inglês, que ainda descreve o Basic grátis com 20 posts e marca "sent with free plan" — [Ayrshare Help (EN)](https://www.ayrshare.com/docs/help-center/product/what_is_the_basic_plan_post_limit.md)

#### Outstand — https://www.outstand.so/
- `outstand.so/pricing` devolveu 404; a home lista "Pay as you go" a US$ 19/mês com 3.000 posts incluídos (~R$ 95) e Business a US$ 129/mês; **não menciona free tier** — [Outstand](https://www.outstand.so/)
- Threads é uma das 12 plataformas e está coberto por "Managed Keys": "We run the OAuth app, so you authorize the account and you are connected"; trazer o próprio app Meta é opcional (white-label) — [Outstand](https://www.outstand.so/)
- Um blog de concorrente descreve o Outstand como US$ 5/mês base com 1.000 posts, valor diferente do que a home mostra em 13/10/2026 — [PostPeer blog](https://www.postpeer.dev/blog/best-threads-posting-api)

#### Blotato — https://www.blotato.com/pricing
- Sem plano grátis; "Free 7-day trial on every plan" com acesso a "all features - except the API"; Starter US$ 29/mês (~R$ 145) inclui "Social media API"; a página não nomeia as 9 plataformas — [Blotato Pricing](https://www.blotato.com/pricing)

#### PostPeer — https://www.postpeer.dev/
- Segundo o próprio blog (08/07/2026): "Free tier with 20 posts, no credit card required" e US$ 8,50 por 1.000 posts no plano Starter (fonte do próprio fornecedor em artigo comparativo, não a página de preços) — [PostPeer blog](https://www.postpeer.dev/blog/best-threads-posting-api)

### Inferences
- Para 1 post/dia a R$ 0, o único free tier desta categoria que cobre o volume é o do Zernio (2 contas, posts ilimitados, API incluída). Os outros free tiers (10–20 posts/mês) cobrem no máximo dois terços do mês.
- A afirmação do Zernio de que Threads exige Instagram Business ou Creator é um ponto de atenção para "perfil pessoal": pode obrigar a converter a conta Instagram vinculada (conversão gratuita), o que precisa ser testado antes de adotar.
- O preço do Zernio mudou pelo menos uma vez em 2026 (descrição de julho ≠ página de outubro) e há relato de aumento pós-rebrand. Um free tier de fornecedor pequeno (equipe de sete pessoas, segundo terceiros) é o item mais volátil deste inventário; convém ter plano B.
- "Managed keys" (Outstand), "skips all of that" (Zernio) e "we handle that" (Postproxy) indicam que esses serviços operam um app Meta próprio já aprovado, e o usuário só autoriza via OAuth. Só o Outstand diz isso de forma inequívoca.
- Ayrshare, por muito tempo a referência de "free tier com 20 posts", deve ser tratado como pago para contas novas em outubro/2026.

### Gaps
- Não confirmei em fonte primária do Zernio o histórico do rebrand nem se o free tier de 2 contas é declarado permanente (a página diz "free", não "forever").
- bundle.social: não confirmei se o plano Free dá acesso à API (o produto é uma API, mas a página não afirma) nem de quem é o app Meta; a página `info.bundle.social/api-reference/faq` devolveu 404.
- Upload-Post e Postproxy: não confirmei se o usuário precisa de app Meta próprio especificamente para Threads, nem se os 10 posts do Postproxy são mensais ou únicos.
- PostPeer: não li a página de preços; não sei se os 20 posts são mensais ou um crédito único.
- Nenhum desses fornecedores publica, nas páginas lidas, com que frequência a conta Threads precisa ser reconectada.
- Não avaliei termos de uso de cada fornecedor quanto a contas automatizadas; a conformidade com a Meta depende de usarem a API oficial, o que só o bundle.social e o Upload-Post declaram textualmente.

## 3. Plataformas de automação (Make, Zapier, IFTTT, Pipedream, Activepieces, n8n): existe integração com Threads e o que o plano grátis permite?

### Takeaway
Nenhuma das seis plataformas oferece, no plano grátis, uma ação nativa e oficial para publicar no Threads da Meta: **IFTTT tem o serviço completo, mas toda ação é Pro (US$ 2,99/mês)**; Zapier só tem o app de terceiro "Threads by Unshape"; Make, Pipedream, Activepieces e o núcleo do n8n não têm componente para o Threads da Meta. O caminho viável nessas plataformas é indireto (módulo/peça do Buffer ou requisição HTTP com token próprio da Meta), e **o Pipedream Workflows será desligado em 31/03/2027**.

### Cited Findings

#### Make.com
- Plano Free: "1,000 credits/month" e "**15-minute minimum interval between runs**"; cada ação de módulo consome tipicamente 1 crédito; 1 MB de data storage — [Make Pricing](https://www.make.com/en/pricing)
- Em 13/10/2026, `make.com/en/integrations/threads` devolve a página genérica do site (título "AI Workflow Automation Software & Tools | Make", ~18 KB), enquanto apps existentes devolvem páginas próprias (ex.: "Buffer integration | Workflow automation | Make", ~830 KB); os slugs `threads-meta` e `meta-threads` também caem na página genérica — [Make – /integrations/threads](https://www.make.com/en/integrations/threads); [Make – Buffer integration](https://www.make.com/en/integrations/buffer)
- No fórum oficial, a equipe da Make respondeu que não havia integração com Threads e indicou o Idea Exchange e o módulo genérico HTTP "Make a request" — [Make Community – Threads Module / API](https://community.make.com/t/threads-module-api/22245)
- Um tópico de janeiro/2025 no fórum registra que a Make estaria trabalhando em um app para Threads, sem data de lançamento (lido via resumo de busca) — [Make Community – Threads Module - API](https://community.make.com/t/threads-module-api/65610.md)
- Um tutorial de terceiros descreve a construção de um app customizado no Make contra a API do Threads como caminho de automação — [GrowwStacks](https://growwstacks.com/blog/automate-threads-posts-make-com-custom-app/)
- Apps de terceiros no Make que alcançam o Threads: Postiz e Upload-Post — [Make Apps – Postiz](https://apps.make.com/postiz); [Make Apps – Upload Post](https://apps.make.com/upload-post-bbxbx8)

#### Zapier
- Plano Free: "100 tasks/mo"; apenas Zaps de dois passos ("Two-step Zaps have one trigger and one action"); polling de 15 min; conexões via webhooks **não** disponíveis no Free; plano pago mais barato: Professional com 750 tasks a US$ 19,99/mês anual ou US$ 29,99/mês mensal (~R$ 100 / ~R$ 150) — [Zapier Pricing](https://zapier.com/pricing)
- `zapier.com/apps/threads/integrations` devolveu **404** em 13/10/2026 — [Zapier – apps/threads](https://zapier.com/apps/threads/integrations)
- Existe o app de terceiro "**Threads by Unshape**": "allows users to automate their video, image, or text posts to Threads"; uma única ação, Create Post ("Creates a post in Threads"), com campos `text`, `media_type`, `video_url`, `image_url` e `tag`; conexão por OAuth — [Zapier – Threads by Unshape](https://zapier.com/apps/threads-by-unshape/integrations)

#### IFTTT
- Existe serviço Threads com ações "Create a text post", "Create a link post", "Create an image post", "Create a video post" e "Create a carousel (multiple media) post", além de gatilhos de novos posts — [IFTTT – Threads](https://ifttt.com/threads)
- **Cada gatilho e ação do serviço Threads está marcado com ícone Pro** (a consulta de seguidores é Pro+) — [IFTTT – Threads](https://ifttt.com/threads)
- Planos: Free US$ 0 "forever" com 2 Applets e "Standard Applet speeds"; Pro US$ 2,99/mês ou US$ 35,88/ano (~R$ 15/mês); Pro+ US$ 8,99/mês (~R$ 45) — [IFTTT Plans](https://ifttt.com/plans)
- Verificação de gatilhos: a cada 5 minutos para Pro/Pro+ e a cada hora para Free — [IFTTT – Threads](https://ifttt.com/threads)

#### Pipedream
- "**Workflows and String are shutting down on March 31, 2027.**" (Pipedream Connect não é afetado) — [Pipedream Docs – Pricing](https://pipedream.com/docs/pricing)
- Plano Free: "Free workspaces have a daily limit of free credits that cannot be exceeded" e "Limited number of connected accounts"; a página não informa os números; 1 crédito por 30 s de computação a 256 MB — [Pipedream Docs – Pricing](https://pipedream.com/docs/pricing)
- Na página comercial, o Free aparece como "Development only" e sem ambiente de produção; plano Startup a partir de ~US$ 99/mês anual ou US$ 150/mês mensal com 10.000 créditos — [Pipedream Pricing](https://pipedream.com/pricing)
- O componente `threads` do repositório do Pipedream é do **Threads de comunicação corporativa (threads.com / ThreadsHQ)**, não do Threads da Meta: ações `post-thread`, `post-chat-message`, `delete-thread`, com propriedades "Channel ID" e link para `github.com/ThreadsHQ/api-documentation`; busca de código por `graph.threads.net` no repositório retorna 0 resultados — [PipedreamHQ/pipedream – components/threads](https://github.com/PipedreamHQ/pipedream/tree/master/components/threads)

#### Activepieces
- O diretório de peças da comunidade tem 738 peças e **nenhuma `threads`** (o caminho `packages/pieces/community/threads` devolve 404); existem peças `buffer`, `instagram-business`, `facebook-pages`, `linkedin`, `bluesky` e `mastodon` — [activepieces – pieces/community](https://github.com/activepieces/activepieces/tree/main/packages/pieces/community)
- `activepieces.com/pieces/threads` devolveu 404 em 13/10/2026 — [Activepieces – pieces/threads](https://www.activepieces.com/pieces/threads)

#### n8n (apenas existência e autenticação da integração)
- **Não há nó nativo**: o diretório de nós do núcleo tem `Facebook` e `FacebookLeadAds`, sem Threads, e `n8n.io/integrations/threads/` devolveu 404 — [n8n – nodes-base/nodes](https://github.com/n8n-io/n8n/tree/master/packages/nodes-base/nodes)
- Nó da comunidade `@rizkifirmansyah/n8n-nodes-threads-api` v1.0.9 (publicado em 31/08/2026): "n8n community node for the official Meta Threads API"; autentica por OAuth2 ou por User Access Token; cria texto, imagem, vídeo e carrossel (2–10 itens) e trata o fluxo de 2 passos (container + publish) em uma ação; 108 downloads no último mês — [npm](https://www.npmjs.com/package/@rizkifirmansyah/n8n-nodes-threads-api)
- Nó da comunidade `@nativeship/n8n-nodes-threads` v1.0.1 (publicado em 05/10/2026), gerado a partir de OpenAPI, com credencial OAuth 2.0 e operações `POST /{threadsUserId}/threads` e `POST /{threadsUserId}/threads_publish`; 396 downloads no último mês — [npm](https://www.npmjs.com/package/@nativeship/n8n-nodes-threads)
- Nó da comunidade `n8n-nodes-meta-publisher` v0.17.0 (21/07/2026), MIT, 21 stars, publica em Instagram, Facebook Pages e Threads via Graph API; 189 downloads no último mês — [GitHub](https://github.com/ralphcrisostomo/n8n-nodes-meta-publisher); [npm](https://www.npmjs.com/package/n8n-nodes-meta-publisher)
- O Postiz mantém nó customizado para n8n (`n8n-nodes-postiz`) — [Postiz README](https://github.com/gitroomhq/postiz-app)

### Inferences
- A ausência de página do app em três slugs prováveis do Make e a ausência do termo no fórum além de pedidos indicam que **não existe app nativo de Threads no Make em outubro/2026**, mas isso é evidência indireta: não consegui consultar o diretório de apps de forma autenticada.
- No Make e no Activepieces, a rota grátis seria "módulo Buffer → canal Threads no Buffer Free" ou "HTTP → graph.threads.net com token próprio". A primeira é redundante se o script já pode chamar a API do Buffer direto; a segunda exige o mesmo app Meta que a chamada direta à API oficial, somando uma plataforma como dependência.
- Todos os nós de comunidade do n8n exigem credencial OAuth/token da Meta fornecida pelo usuário, ou seja, não dispensam a criação do app Meta.
- 1 post/dia consome ~30–60 créditos/mês no Make Free (1–2 módulos por execução), bem abaixo dos 1.000; o intervalo mínimo de 15 min não é restrição para um disparo diário.
- IFTTT Pro (~R$ 15/mês) é a opção paga mais barata de todas com ação nativa de Threads, mas não atende ao alvo de R$ 0.
- Pipedream deve ser descartado para um projeto novo: o plano grátis é "development only" e o produto Workflows tem data de desligamento.

### Gaps
- Não confirmei o número máximo de cenários ativos do Make Free (a linha existe na tabela, o valor não foi capturado).
- Não confirmei se o "Threads by Unshape" no Zapier exige assinatura paga da Unshape, se é app premium no Zapier, nem se usa a API oficial.
- Resultados de busca mostram páginas `zapier.com/apps/threads/integrations/<outro-app>` com gatilhos do tipo "comment.created"; não consegui abrir nenhuma (404) para confirmar se esse "Threads" é o da Meta ou o produto corporativo homônimo.
- Não verifiquei o diretório interno de apps do Make nem a existência de app "Threads" lançado após janeiro/2025 sob outro slug.
- Não li o código dos nós de comunidade do n8n para auditar segurança ou tratamento de renovação de token.

## 4. Bibliotecas open-source e projetos do GitHub que integram com o Threads: wrapper da API OFICIAL (graph.threads.net) ou API privada/engenharia reversa?

### Takeaway
Os projetos com tração real e ainda mantidos em 2026 usam a API oficial e são, em geral, servidores MCP e ferramentas completas (Postiz, BrightBean, `mikusnuz/meta-mcp`), todos exigindo app Meta do próprio usuário; os wrappers "puros" da API oficial em Python e Node são pequenos e estão parados desde 2024–2025. Os clientes de engenharia reversa de 2023 (liderados por `junhoyeo/threads-api`) estão arquivados, e o principal deles foi encerrado em 08/09/2023 após comunicação da Meta. Não encontrei nenhuma GitHub Action no Marketplace dedicada a publicar no Threads da Meta.

### Cited Findings

#### (a) Wrappers e ferramentas sobre a API OFICIAL

| Projeto | Linguagem | Stars | Último push | Licença | Situação em 2026 |
|---|---|---|---|---|---|
| [fbsamples/threads_api](https://github.com/fbsamples/threads_api) | JavaScript (Node) | 291 | 24/03/2026 | Meta Platform Policy (não-OSI) | App de exemplo oficial da Meta; atualizado em 2026 |
| [marclove/pythreads](https://github.com/marclove/pythreads) | Python | 73 | 09/09/2025 | MIT | Sem push em 2026 |
| [paulosabayomi/ThreadsPipe-py](https://github.com/paulosabayomi/ThreadsPipe-py) | Python | 9 | 27/03/2025 | MIT | Sem push em 2026 |
| [threadsjs/threads.js](https://github.com/threadsjs/threads.js) | JavaScript | 275 | 18/06/2024 | MIT | Parado desde 2024 |
| [spoolappio/threads-graph-api](https://github.com/spoolappio/threads-graph-api) | TypeScript | 23 | 18/06/2024 | MIT | Parado desde 2024 |
| [Mikescops/node-threads-api](https://github.com/Mikescops/node-threads-api) | TypeScript | 5 | 21/06/2024 | MIT | Parado desde 2024 |
| [tirthpatell/threads-go](https://github.com/tirthpatell/threads-go) | Go | 9 | 13/09/2026 | MIT | Mantido em 2026 |
| [davidcelis/threads-api](https://github.com/davidcelis/threads-api) | Ruby | 10 | 28/10/2024 | MIT | Parado desde 2024 |
| [Trukes/threads-api-php-client](https://github.com/Trukes/threads-api-php-client) | PHP | 9 | 04/09/2024 | MIT | Parado desde 2024 |
| [SmarterQueue/Threads-API-PHP](https://github.com/SmarterQueue/Threads-API-PHP) | PHP | 4 | 16/07/2024 | MIT | Parado desde 2024 |
| [samreyno/Threads-Auto-Uploader](https://github.com/samreyno/Threads-Auto-Uploader) | Python | 5 | 14/01/2026 | MIT | Script pequeno, API oficial |
| [eisenjimmy/autoTHREADS](https://github.com/eisenjimmy/autoTHREADS) | TypeScript (Electron) | 160 | 03/08/2026 | MIT | App desktop, mantido em 2026 |

- `fbsamples/threads_api` é o "Threads Publishing API Sample App" da Meta; exige App ID e Secret próprios do Threads ("These ARE not the same as the regular app ID and app secret"), redirect HTTPS e não aceita `localhost`; os commits mais recentes (24/03/2026) trocam "threads.net -> threads.com"; a licença é "Meta Platform Policy licensed" — [GitHub](https://github.com/fbsamples/threads_api)
- `pythreads` no PyPI: versão 0.2.1 enviada em 15/07/2024, "A Python wrapper of Meta's Threads API", 381 downloads no último mês; o último commit no repositório é de 02/09/2025 — [PyPI](https://pypi.org/project/pythreads/); [pypistats](https://pypistats.org/api/packages/pythreads/recent); [GitHub](https://github.com/marclove/pythreads)
- `threadspipepy` no PyPI: versão 0.4.5 enviada em 27/03/2025, "using the official Meta's Threads API", 156 downloads no último mês — [PyPI](https://pypi.org/project/threadspipepy/); [pypistats](https://pypistats.org/api/packages/threadspipepy/recent)
- `@threadsjs/threads.js` no npm: versão 2.0.0 publicada em 18/06/2024, 322 downloads no último mês; o código atual referencia `graph.threads.net` e não tem ocorrências de `i.instagram.com` (o pacote foi criado em 06/07/2023, antes da API oficial) — [npm](https://www.npmjs.com/package/@threadsjs/threads.js); [GitHub](https://github.com/threadsjs/threads.js)
- `threads-graph-api` no npm: versão 0.1.0 de 18/06/2024, "A library to interface with the official Instagram Threads API", 87 downloads no último mês — [npm](https://www.npmjs.com/package/threads-graph-api)
- `autoTHREADS`: "Publishing, replies, mentions, and optional discover use the official Threads API"; fluxo "token-first" em que o usuário cria/seleciona o app na Meta, adiciona a própria conta como Threads Tester e cola o access token — [GitHub](https://github.com/eisenjimmy/autoTHREADS)
- Exemplo do caso de uso exato: `jehchoi0221/threads-daily-post`, "daily auto post (GitHub Actions + Threads API)", Python, 0 stars, sem licença, push em 09/10/2026 — [GitHub](https://github.com/jehchoi0221/threads-daily-post)

#### Servidores MCP para Threads (todos sobre a API oficial, com credenciais do usuário)

| Projeto | Stars | Último push | Licença | Observação |
|---|---|---|---|---|
| [mikusnuz/meta-mcp](https://github.com/mikusnuz/meta-mcp) | 29 | 08/10/2026 | MIT | 66 ferramentas (Instagram 33, Threads 27, Meta 6) |
| [oliverames/meta-mcp-server](https://github.com/oliverames/meta-mcp-server) | 52 | 08/10/2026 | MIT | "200+ tools" para a plataforma de negócios da Meta |
| [quinnjr/threads-mcp](https://github.com/quinnjr/threads-mcp) | 16 | 15/04/2026 | MIT | Só Threads |
| [exileum/meta-mcp](https://github.com/exileum/meta-mcp) | 12 | 10/09/2026 | MIT | Instagram + Threads |
| [sergekostenchuk/mlllm-threads-mcp](https://github.com/sergekostenchuk/mlllm-threads-mcp) | 6 | 14/10/2025 | sem licença | Sem push em 2026 |

- `@mikusnuz/meta-mcp`: versão 2.2.0 publicada em 08/10/2026, 1.934 downloads no último mês; publica texto, imagens, vídeos e carrosséis no Threads com enquetes, GIFs, topic tags e link attachments; inclui ferramentas de "Token exchange/refresh/debug"; alvo Graph API v26.0 — [npm](https://www.npmjs.com/package/@mikusnuz/meta-mcp); [GitHub](https://github.com/mikusnuz/meta-mcp)
- `quinnjr/threads-mcp` lista como pré-requisitos "Meta Developer Account", "Your personal Threads account" e "OAuth 2.0 Credentials", e avisa: "Threads uses OAuth 2.0 authentication. You cannot use simple API keys"; ferramenta `threads_create_thread` cria posts com texto, imagens ou vídeos — [GitHub](https://github.com/quinnjr/threads-mcp)
- Existem também MCPs que são fachada de SaaS, não da API da Meta: `publora/skills` (52 stars, MIT, push em 13/10/2026) e `postbasehq/mcp` (7 stars, AGPL-3.0) — [publora/skills](https://github.com/publora/skills); [postbasehq/mcp](https://github.com/postbasehq/mcp)

#### GitHub Actions no Marketplace
- Buscas no Marketplace (tipo "actions") por `threads`, `threads api`, `meta threads`, `post to threads` e `threads.net`, em 13/10/2026, **não retornaram nenhuma action para publicar no Threads da Meta**; os resultados são sobre threads de revisão/issues (ex.: `lock-threads`, `git-status-threads-on-slack`) — [GitHub Marketplace – threads](https://github.com/marketplace?query=threads&type=actions); [GitHub Marketplace – post to threads](https://github.com/marketplace?query=post+to+threads&type=actions)
- Fora do Marketplace, a busca de repositórios encontrou `posteverywhere/announce-action` (0 stars, MIT, push em 29/09/2026), que anuncia releases em várias redes, incluindo Threads, por meio do SaaS PostEverywhere — [GitHub](https://github.com/posteverywhere/announce-action)

#### Agendadores self-hosted
- **Postiz** (`gitroomhq/postiz-app`): **37.151 stars**, AGPL-3.0, TypeScript, push em 13/10/2026, release v2.25.1 em 11/10/2026 — [GitHub](https://github.com/gitroomhq/postiz-app)
- Postiz self-hosted **exige app Meta do usuário**: "This integration requires that you have setup a Meta for Developers account already"; as variáveis `THREADS_APP_ID` e `THREADS_APP_SECRET` são obrigatórias no backend ("If either is missing... Threads will not appear in the channel list at all"); a própria doc chama de "a complex integration" — [Postiz docs – Threads provider](https://github.com/gitroomhq/postiz-docs/blob/main/self-host/providers/threads.mdx)
- O passo a passo do Postiz pede criar o app com "Access the Threads API", adicionar `threads_content_publish` e `threads_basic`, registrar o redirect `https://seu-dominio/integrations/social/threads` e **adicionar a conta como "Threads Tester"** em App roles — [Postiz docs – Threads provider](https://github.com/gitroomhq/postiz-docs/blob/main/self-host/providers/threads.mdx)
- O `docker-compose.yaml` do Postiz sobe: `postiz` (app), `postiz-postgres` (postgres:17-alpine), `postiz-redis` (redis:7.2), `temporal` (temporalio/auto-setup:1.28.1), `temporal-postgresql` (postgres:16), `temporal-elasticsearch` (elasticsearch:7.17.27), `temporal-ui`, `temporal-admin-tools` e `spotlight` — [postiz-app – docker-compose.yaml](https://github.com/gitroomhq/postiz-app/blob/main/docker-compose.yaml)
- A doc de instalação diz que o setup Docker Compose "has been tested with; Virtual Machine, Ubuntu 24.04, 2Gb RAM, 2 vCPUs" — [Postiz docs – Docker Compose](https://github.com/gitroomhq/postiz-docs/blob/main/self-host/installation/docker-compose.mdx)
- No self-hosted, "Public API & webhooks" e as superfícies agênticas (MCP, CLI) estão incluídas; "We do not 'gate' features or limit the license" — [Postiz README](https://github.com/gitroomhq/postiz-app)
- **Mixpost Lite** (`inovector/mixpost`): 3.809 stars, MIT, Vue/PHP (Laravel), push em 16/03/2026, release 2.6.0 em 16/03/2026; os provedores sociais no código do Lite são apenas `Mastodon`, `Meta` e `Twitter` — [GitHub](https://github.com/inovector/mixpost); [SocialProviders](https://github.com/inovector/mixpost/tree/main/src/SocialProviders)
- **Mixpost Pro** (US$ 299, único) suporta Threads, e o usuário cria o próprio app Meta com o caso de uso "Access the Threads API", copia Threads App ID e App secret para o Mixpost, adiciona as permissões `threads_content_publish`, `threads_manage_insights`, `threads_manage_replies`, `threads_read_replies` e `threads_delete`, e cadastra testers — [Mixpost docs – Threads](https://docs.mixpost.app/services/social/threads/); [Mixpost Pricing](https://mixpost.app/pricing)
- **BrightBean Studio** self-hosted: Docker de produção sobe 5 contêineres (app Gunicorn, worker, PostgreSQL, Caddy e um contêiner de migração); "fits a 512 MB dyno"; SQLite serve para desenvolvimento e pequenos deploys; o blueprint do Render "Must use paid tier" — [GitHub README](https://github.com/brightbeanxyz/brightbean-studio)

#### (b) Engenharia reversa / API privada / scraping (documentados apenas para exclusão)

| Projeto | Linguagem | Stars | Último push | Licença | Situação |
|---|---|---|---|---|---|
| [junhoyeo/threads-api](https://github.com/junhoyeo/threads-api) | TypeScript | 1.617 | 08/09/2023 | MIT | **Arquivado** |
| [junhoyeo/threads-py](https://github.com/junhoyeo/threads-py) | Python | 68 | 08/09/2023 | MIT | **Arquivado** |
| [dmytrostriletskyi/threads-net](https://github.com/dmytrostriletskyi/threads-net) | Python | 425 | 12/10/2023 | sem licença | Parado desde 2023 |
| [m1guelpf/threads-re](https://github.com/m1guelpf/threads-re) | — | 367 | 09/07/2023 | sem licença | Parado desde 2023 |
| [Danie1/threads-api](https://github.com/Danie1/threads-api) | Python | 157 | 01/10/2023 | MIT | **Arquivado** |
| [midudev/threads-api](https://github.com/midudev/threads-api) | TypeScript | 92 | 15/07/2023 | sem licença | Parado desde 2023 |
| [iSarabjitDhiman/MetaThreads](https://github.com/iSarabjitDhiman/MetaThreads) | Python | 32 | 18/07/2023 | MIT | Parado desde 2023 |
| [tidusjar/Threads.Api](https://github.com/tidusjar/Threads.Api) | C# | 15 | 13/07/2023 | GPL-3.0 | **Arquivado** |
| [jeizzon/yarn-threads-cli](https://github.com/jeizzon/yarn-threads-cli) | TypeScript | 28 | 01/02/2026 | MIT | Ativo em 2026, usa cookies |
| [wongedyan/ckelepel-threads](https://github.com/wongedyan/ckelepel-threads) | JavaScript | 30 | 26/09/2026 | sem licença | Scraper ativo |
| [Zeeshanahmad4/Threads-Scraper](https://github.com/Zeeshanahmad4/Threads-Scraper) | Python | 136 | 21/08/2026 | não-padrão | Scraper ativo |

- `junhoyeo/threads-api` se descreve como "Unofficial, Reverse-Engineered Node.js/TypeScript client for Meta's Threads" e traz o aviso: "**As of September 8, 2023, the development of the "threads-api" project have been halted and discontinued due to communication received from Meta Platforms, Inc.** ... This repository, along with related projects threads-py and react-threads, has been archived and will no longer receive updates or maintenance" — [GitHub](https://github.com/junhoyeo/threads-api)
- O mesmo README acrescenta: "Based on the notification from Meta, it's clear that using or distributing the code might violate the terms of service of Meta Platforms, Inc."; a imagem anexada ao aviso chama-se `c_d_scraping.jpg` — [GitHub](https://github.com/junhoyeo/threads-api)
- O pacote npm `threads-api` (o de `junhoyeo`) teve a última versão, 1.6.3, publicada em 27/07/2023 e ainda registra 920 downloads no último mês — [npm](https://www.npmjs.com/package/threads-api); [npm downloads API](https://api.npmjs.org/downloads/point/last-month/threads-api)
- `dmytrostriletskyi/threads-net`: "Unofficial and reverse-engineered Threads (threads.net) Python API wrapper. Created for academic purposes and is not intended to be used in real software" — [GitHub](https://github.com/dmytrostriletskyi/threads-net)
- `m1guelpf/threads-re`: "Reverse-engineering Instagram's Threads private APIs" — [GitHub](https://github.com/m1guelpf/threads-re)
- `jeizzon/yarn-threads-cli` posta, responde e cita usando "**Cookie-based auth — Uses your existing browser session (no OAuth needed)**", lendo cookies do perfil do Chrome — [GitHub](https://github.com/jeizzon/yarn-threads-cli)
- `wongedyan/ckelepel-threads` se descreve como "Open-source, self-hosted Meta Threads scraper" — [GitHub](https://github.com/wongedyan/ckelepel-threads)
- `metathreads` no PyPI: versão 0.0.4 de 18/07/2023, sem atualização desde então — [PyPI](https://pypi.org/project/metathreads/)

### Inferences
- A classificação (a)/(b) acima se apoia na descrição dos próprios repositórios e, para `threads.js`, `pythreads`, `meta-mcp` e `threads-mcp`, em busca de código por `graph.threads.net`. Não auditei o código linha a linha.
- Os wrappers oficiais em Python e Node têm entre 5 e 275 stars e estão sem push desde 2024–2025. Como a publicação no Threads se resume a duas chamadas HTTP (criar container e publicar), a dependência traz pouco ganho e algum risco de defasagem em relação ao changelog da Meta.
- `mikusnuz/meta-mcp` é o projeto mais vivo para o cenário "um agente de IA publica": push e release em 08/10/2026, ~1,9 mil downloads/mês e ferramentas de refresh de token. Ainda assim exige app Meta e token do usuário.
- A ausência de uma GitHub Action dedicada no Marketplace não bloqueia nada: um workflow com `schedule:` e duas chamadas `curl` cumpre o mesmo papel (como faz o repositório-exemplo `threads-daily-post`).
- O fato de `threads-api` (arquivado, 2023) ainda ter ~900 downloads/mês indica que continua sendo instalado por engano por quem busca "threads api" no npm.

### Gaps
- Não encontrei registro público de processo judicial da Meta contra autores dessas bibliotecas; a única evidência documental é o aviso no README de `junhoyeo/threads-api` (comunicação da Meta, imagem `c_d_scraping.jpg`), cujo conteúdo integral não li.
- Não verifiquei se as bibliotecas de engenharia reversa ainda funcionam tecnicamente em 2026; nenhuma teve push desde 2023 e não foram testadas.
- Não confirmei a cobertura de Threads em `oliverames/meta-mcp-server` além da descrição do repositório.
- Não levantei downloads de `threads-go`, das gems Ruby nem dos pacotes PHP.
- A busca no Marketplace foi feita por termos em inglês e lendo o HTML da primeira página de resultados; uma action com nome pouco óbvio pode ter escapado.

## 5. Para cada opção open-source self-hosted, qual o custo e o esforço reais em comparação com ~100 linhas de código chamando a API oficial?

### Takeaway
Nenhuma opção self-hosted elimina o passo mais trabalhoso da API oficial — criar o app na Meta e obter o token —, porque Postiz, Mixpost Pro, BrightBean e os nós/MCPs de comunidade exigem App ID/Secret ou access token do próprio usuário. Elas apenas somam infraestrutura (de 512 MB a 2 GB de RAM, bancos e filas) e manutenção a um trabalho que, feito direto, são duas chamadas HTTP e uma renovação de token a cada até 60 dias.

### Cited Findings
- Tokens da API oficial: "Threads user access tokens are short-lived and are valid for one hour"; "Long-lived tokens are valid for 60 days" — [Meta – Long-lived tokens](https://developers.facebook.com/docs/threads/get-started/long-lived-tokens)
- Renovação: `GET /refresh_access_token` com `grant_type=th_refresh_token`; o token precisa ter "at least 24 hours old", não estar expirado e o usuário ter concedido `threads_basic`; "Refreshed tokens are valid for 60 days from the date at which they are refreshed"; "Tokens that have not been refreshed in 60 days will expire" — [Meta – Long-lived tokens](https://developers.facebook.com/docs/threads/get-started/long-lived-tokens)
- A publicação é um fluxo de dois passos, `POST /{threadsUserId}/threads` (criar container) e `POST /{threadsUserId}/threads_publish` (publicar), como expõe o nó de comunidade gerado a partir do OpenAPI — [npm – @nativeship/n8n-nodes-threads](https://www.npmjs.com/package/@nativeship/n8n-nodes-threads)
- **Postiz self-hosted**: licença AGPL-3.0 sem custo; exige app Meta próprio (`THREADS_APP_ID`/`THREADS_APP_SECRET`), conta adicionada como Threads Tester e domínio com redirect OAuth — [Postiz docs – Threads provider](https://github.com/gitroomhq/postiz-docs/blob/main/self-host/providers/threads.mdx)
- Postiz roda com Docker Compose em nove serviços, incluindo dois PostgreSQL, Redis, Temporal e Elasticsearch, testado em VM Ubuntu 24.04 com 2 GB de RAM e 2 vCPUs — [postiz-app – docker-compose.yaml](https://github.com/gitroomhq/postiz-app/blob/main/docker-compose.yaml); [Postiz docs – Docker Compose](https://github.com/gitroomhq/postiz-docs/blob/main/self-host/installation/docker-compose.mdx)
- A doc do Postiz alerta para guia de migração obrigatório ao subir de v2.11.2 para v2.12.0+ por causa do Temporal — [Postiz docs – Docker Compose](https://github.com/gitroomhq/postiz-docs/blob/main/self-host/installation/docker-compose.mdx)
- **Mixpost**: a edição grátis (Lite) não publica no Threads; a edição que publica custa US$ 299 (~R$ 1.500) em pagamento único e ainda exige app Meta próprio com cinco permissões de Threads — [Mixpost docs – Threads](https://docs.mixpost.app/services/social/threads/); [Mixpost Pricing](https://mixpost.app/pricing)
- **BrightBean Studio self-hosted**: AGPL-3.0 sem custo; exige credenciais de app Meta do usuário (Threads App ID/Secret e redirect próprio); 5 contêineres em produção; dimensionado para caber em 512 MB — [GitHub README](https://github.com/brightbeanxyz/brightbean-studio)
- **BrightBean Studio hospedado**: gratuito, "No per-channel limits", sem instalação — [BrightBean Studio](https://brightbean.xyz/studio/)
- **MCPs e nós de comunidade** (`mikusnuz/meta-mcp`, `quinnjr/threads-mcp`, nós n8n): todos pedem conta de desenvolvedor Meta e credenciais OAuth/token do usuário — [quinnjr/threads-mcp](https://github.com/quinnjr/threads-mcp); [npm – @rizkifirmansyah/n8n-nodes-threads-api](https://www.npmjs.com/package/@rizkifirmansyah/n8n-nodes-threads-api)
- O app de exemplo oficial da Meta exige HTTPS no redirect e não aceita `localhost`, o que obriga a mapear um domínio e gerar certificado para o primeiro login OAuth — [fbsamples/threads_api](https://github.com/fbsamples/threads_api)
- Um repositório público já implementa exatamente "post diário via GitHub Actions + Threads API" em Python — [jehchoi0221/threads-daily-post](https://github.com/jehchoi0221/threads-daily-post)

### Inferences
- Comparação de esforço (estimativa minha, não medida):

| Opção | App Meta próprio? | Infra adicional | Custo mensal provável | Esforço de manutenção |
|---|---|---|---|---|
| ~100 linhas + cron (ex.: GitHub Actions) | Sim | Nenhuma | R$ 0 | Renovar token antes de 60 dias (automatizável) |
| Postiz self-hosted | Sim | VM ≥ 2 GB, 9 contêineres | Preço de uma VPS de 2 GB | Atualizações frequentes (release a cada poucos dias), migrações |
| Mixpost Pro | Sim | Servidor PHP + banco + fila | US$ 299 único + servidor | Média |
| BrightBean self-hosted | Sim | ~512 MB + PostgreSQL | Baixo, mas raramente R$ 0 | Projeto novo, muda rápido |
| MCP local (`meta-mcp`) | Sim | Nenhuma (roda na máquina) | R$ 0 | Não é "unattended": depende de um cliente MCP ligado |
| n8n + nó de comunidade | Sim | Instância n8n | Depende da hospedagem (pesquisada à parte) | Média |

- Como todas as linhas exigem o app Meta, a única coisa que o self-hosted compra é interface gráfica, calendário e multi-rede. Para 1 post/dia em 1 perfil, isso não justifica uma VM de 2 GB com Elasticsearch e Temporal.
- O argumento a favor do Postiz/BrightBean aparece só na expansão futura para várias redes (Instagram, LinkedIn, X, TikTok, Bluesky, Pinterest), e mesmo aí cada rede exige o próprio app de desenvolvedor no self-hosted.
- As únicas opções que realmente dispensam o app Meta são as hospedadas por terceiros: Buffer Free (com API), Zernio (2 contas grátis, com API), Publer/Fedica (sem API confirmada no grátis) e, possivelmente, a versão hospedada do BrightBean.
- A renovação do token de 60 dias é o único ponto de falha "silenciosa" da chamada direta; uma chamada de refresh semanal no mesmo cron resolve, desde que o novo token seja persistido.

### Gaps
- Não medi consumo real de RAM/CPU do Postiz nem do BrightBean; os números são os declarados na documentação.
- Não levantei preço de VPS de 2 GB no Brasil nem limites de free tier de nuvem (hospedagem está sendo pesquisada por outra frente).
- Não verifiquei requisitos de servidor do Mixpost Pro (PHP, banco, Redis) na documentação.
- Não confirmei, nesta frente, se um app Meta em modo de desenvolvimento com a própria conta como Tester consegue publicar indefinidamente sem App Review; as docs do Postiz e do Mixpost descrevem o fluxo de tester, mas a regra oficial cabe à pesquisa da API da Meta.
- Não confirmei onde persistir o token renovado em um cron do GitHub Actions (secrets não são graváveis pelo próprio job sem um PAT) — detalhe de implementação fora do escopo.

## 6. Quais opções são explicitamente arriscadas (endpoints privados, login por senha, automação de navegador, cookies) e devem ser descartadas?

### Takeaway
Devem ser descartados todos os clientes de engenharia reversa, CLIs baseados em cookies de sessão e scrapers: o maior deles foi encerrado em setembro/2023 depois de comunicação da Meta, e o próprio autor reconhece que usar o código "might violate the terms of service". Opções que usam a API oficial via OAuth — seja com app próprio, seja pelo app aprovado de um fornecedor — são as únicas compatíveis com os termos.

### Cited Findings
- `junhoyeo/threads-api` (1.617 stars, arquivado): desenvolvimento "halted and discontinued due to communication received from Meta Platforms, Inc." em 08/09/2023; o README afirma que "using or distributing the code might violate the terms of service of Meta Platforms, Inc. and its associated services, including but not limited to Instagram and Threads" — [GitHub](https://github.com/junhoyeo/threads-api)
- Os projetos irmãos `threads-py` e `react-threads` foram arquivados na mesma data — [junhoyeo/threads-py](https://github.com/junhoyeo/threads-py); [junhoyeo/react-threads](https://github.com/junhoyeo/react-threads)
- `dmytrostriletskyi/threads-net` declara que é "reverse-engineered" e "not intended to be used in real software" — [GitHub](https://github.com/dmytrostriletskyi/threads-net)
- `Danie1/threads-api` ("Unofficial Python API for Meta's Threads App") e `tidusjar/Threads.Api` ("Unofficial .NET client") estão arquivados — [Danie1/threads-api](https://github.com/Danie1/threads-api); [tidusjar/Threads.Api](https://github.com/tidusjar/Threads.Api)
- `jeizzon/yarn-threads-cli` (push em 01/02/2026) autentica com cookies do navegador: "Uses your existing browser session (no OAuth needed)" e lê o diretório de perfil do Chrome — [GitHub](https://github.com/jeizzon/yarn-threads-cli)
- `wongedyan/ckelepel-threads` e `Zeeshanahmad4/Threads-Scraper` são scrapers declarados — [ckelepel-threads](https://github.com/wongedyan/ckelepel-threads); [Threads-Scraper](https://github.com/Zeeshanahmad4/Threads-Scraper)
- Existem repositórios dedicados a contornar proteções do app, como `0xSHAK1B/Threads-SSL-Pinning-Bypass` ("Bypass Threads (Instagram) SSL/TLS certificate pinning on Android") — [GitHub](https://github.com/0xSHAK1B/Threads-SSL-Pinning-Bypass)
- `flam-ing/meta-api-automation` se descreve como "Graph API & Headless Automation Suite", misturando API oficial com automação headless — [GitHub](https://github.com/flam-ing/meta-api-automation)
- `sunmughan/meta-automation` (77 stars, push em 01/10/2026) se descreve como "Autonomous AI Lead Generation, Social Discovery & Smart Conversational Growth Agent for Threads & In[stagram]" — [GitHub](https://github.com/sunmughan/meta-automation)
- A licença do app de exemplo oficial lembra que o uso está "subject to the Facebook Platform Policy" — [fbsamples/threads_api – LICENSE](https://github.com/fbsamples/threads_api/blob/main/LICENSE)
- Do lado seguro, os fornecedores que declaram usar a API oficial: bundle.social ("calls Meta Threads API for you") e Upload-Post ("via the Threads (by Meta) API") — [bundle.social Threads API](https://bundle.social/threads-api); [Upload-Post llms-full.txt](https://www.upload-post.com/llms-full.txt)

### Inferences
- Lista de exclusão recomendada: `junhoyeo/threads-api` e o pacote npm `threads-api`, `junhoyeo/threads-py`, `Danie1/threads-api`, `dmytrostriletskyi/threads-net`, `m1guelpf/threads-re`, `midudev/threads-api`, `iSarabjitDhiman/MetaThreads` (PyPI `metathreads`), `tidusjar/Threads.Api`, `linkfy/threadspy`, `jeizzon/yarn-threads-cli`, `wongedyan/ckelepel-threads`, `Zeeshanahmad4/Threads-Scraper`, `flam-ing/meta-api-automation` e `sunmughan/meta-automation`.
- Critério prático para qualquer ferramenta nova: se pede **usuário e senha do Instagram/Threads, cookies de sessão, ou roda um navegador headless**, está fora; se pede **OAuth na tela oficial da Meta** ou um **access token gerado no painel de desenvolvedor**, está dentro.
- O risco das opções excluídas recai sobre a **conta pessoal** do fundador (bloqueio ou restrição do perfil Threads/Instagram vinculado), que é justamente o ativo que a automação quer promover; o benefício de evitar a criação do app Meta não compensa.
- Mesmo usando a API oficial, serviços que publicam por um app compartilhado de terceiro (Buffer, Zernio, Outstand, Postproxy) concentram risco operacional no fornecedor: se o app dele for suspenso pela Meta ou o free tier mudar, a automação para. É risco de disponibilidade, não de banimento da conta.
- Um agente de IA publicando 1 post/dia por API oficial fica muito abaixo do limite de 250 posts por 24 h citado por Buffer e Zernio, então volume não é fator de risco.

### Gaps
- Não li os Termos de Uso do Threads/Instagram nem a Platform Policy da Meta nesta frente para citar a cláusula exata sobre automação não autorizada; a evidência usada é a declaração do autor de `threads-api` e a licença do sample app.
- Não encontrei dados públicos e confiáveis sobre taxa de bloqueio de contas que usaram clientes não oficiais do Threads.
- Não verifiquei os métodos internos de `sunmughan/meta-automation` nem de `oliverames/meta-mcp-server`; a inclusão do primeiro na lista de exclusão é por precaução, baseada na descrição.
- Não avaliei a política de cada fornecedor (Buffer, Zernio etc.) sobre conteúdo gerado por IA ou contas operadas por agentes.
