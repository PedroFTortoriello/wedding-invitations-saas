# A API oficial do Threads dispensa plataforma paga

A melhor maneira de publicar um post por dia da Noivar no Threads é chamar a API oficial da Meta a partir de uma rota de cron nova no projeto que já roda na Vercel, guardar fila, histórico e token no Supabase que já existe e deixar o Claude Code gerar o lote semanal de textos para o dono aprovar. O custo previsto é **R$ 0 por mês**, a única conta nova obrigatória é a de desenvolvedor da Meta, e tudo roda com o computador desligado. A documentação oficial afirma que, sem App Review, um app publica na conta do dono e nas contas de teste, que é exatamente este caso, e a API não tem página de preço nem plano pago. **Nada foi implementado nem testado: este documento é pesquisa e plano.** O ponto mais importante sem verificação é se um post publicado por um app não publicado aparece para o público em geral, o que se resolve com um post de teste aberto em janela anônima antes de ligar o cron. Se o painel da Meta travar ou esse teste falhar, o plano B é o Buffer Free, único agendador comercial que confirma em página oficial plano gratuito permanente, Threads e API no mesmo plano. n8n, Postiz e IFTTT cobram ou exigem o mesmo app da Meta mais um servidor, então não compram nada para um post diário. À parte do Threads, o setup atual tem uma pendência própria: os indícios apontam para o plano Hobby da Vercel, que proíbe uso comercial.

**Como ler as evidências.** **[OFICIAL]** indica documentação ou termos da Meta (ou a página oficial do fornecedor citado) e respostas de funcionário da Meta em canal oficial. **[RELATO]** indica blog, fórum, issue ou documentação de terceiros. **[NÃO VERIFICADO]** indica algo que a pesquisa não conseguiu confirmar e que pede teste do dono. **[REPO]** indica fato lido no repositório local, sempre com o caminho do arquivo. A pesquisa foi feita em 13/10/2026 e os fatos de produto vêm do site público lido nessa data.

## 1. Resultados da pesquisa: o caminho oficial é gratuito e não pede App Review para o próprio perfil

### A API da Meta publica no próprio perfil sem aprovação, mas a visibilidade pública ainda pede um teste

A Threads API publica texto, imagem, vídeo e carrossel de 2 a 20 itens em `https://graph.threads.net/v1.0/`, com **limite de 500 caracteres e 5 links únicos por post** **[OFICIAL]** ([Posts](https://developers.facebook.com/docs/threads/posts), [Overview](https://developers.facebook.com/docs/threads/overview)). O fluxo padrão tem dois passos: criar um container em `POST /{threads-user-id}/threads` e publicá-lo em `POST /{threads-user-id}/threads_publish`. Para post só de texto, a referência documenta o parâmetro `auto_publish_text`, que publica em uma chamada ([Reference: Publishing](https://developers.facebook.com/documentation/threads/reference/publishing.md)). A quota é de **250 posts por perfil em janela móvel de 24 horas** ([Overview](https://developers.facebook.com/docs/threads/overview)); um post por dia usa 0,4% dela.

O que decide a viabilidade está na página de criação de posts: sem acesso avançado para `threads_content_publish`, "you can only post to Threads for your account and your app's tester accounts" **[OFICIAL]** ([Create Posts](https://developers.facebook.com/documentation/threads/create-posts.md)). O caso da Noivar, portanto, não passa por App Review, verificação de empresa nem publicação do app. Um funcionário da Meta deu a mesma resposta a um desenvolvedor que queria uso pessoal: "By default, you are given standard access" ([fbsamples/threads_api, issue #72](https://github.com/fbsamples/threads_api/issues/72)). Desde 23/09/2025 a API também deixou de exigir conta do Instagram vinculada ([Changelog](https://developers.facebook.com/docs/threads/changelog)).

Sobre custo, a documentação não tem página de preço, plano pago nem exigência de cobrança; o acesso é controlado por permissões ([Get Started](https://developers.facebook.com/docs/threads/get-started)). Não existe, porém, uma frase oficial dizendo que a API é gratuita, e os termos avisam: "Nós não podemos garantir que a Plataforma será sempre gratuita" ([Platform Terms](https://developers.facebook.com/terms/)). A leitura correta é **custo zero hoje, sem promessa de permanência**.

O token é a única peça com prazo. O token curto vale 1 hora; o de longa duração vale **60 dias** e pode ser renovado por `th_refresh_token` desde que tenha pelo menos 24 horas e ainda não tenha expirado. Depois de expirado, não renova mais **[OFICIAL]** ([Long-Lived Tokens](https://developers.facebook.com/documentation/threads/get-started/long-lived-tokens.md)). Desenvolvedores descrevem o que acontece quando isso é esquecido: o bot "dies quietly on day 61" **[RELATO]** ([DEV Community](https://dev.to/hyojunlim/the-7-errors-everyone-hits-setting-up-the-threads-api-and-the-exact-fixes-2bl1)).

Em política, os Platform Terms não trazem regra geral contra postagem automatizada nem cláusula sobre conteúdo gerado por IA, e permitem suspender o acesso de um app a uma API não usada por 28 dias, o que a postagem diária afasta ([Platform Terms](https://developers.facebook.com/terms/)). O padrão de spam da Meta mira frequência "very high", "posting repetitive content" e links enganosos, valendo para atividade manual ou automática **[OFICIAL]** ([Meta Transparency Center](https://transparency.meta.com/en-us/policies/community-standards/spam/)). Duas lacunas ficam registradas: os Termos de Uso do Threads não carregaram durante a pesquisa, e a página de spam não cita o Threads pelo nome.

**[NÃO VERIFICADO]** A dúvida que sobra é se um post publicado por um app não publicado, só com conta de teste, aparece para o público em geral. Nenhuma página da Threads API afirma isso de forma explícita. A favor, a frase oficial fala em postar "for your account" sem ressalva, e guias de 2026 relatam que o modo de teste basta para postar na própria conta ([DEV Community](https://dev.to/hyojunlim/the-7-errors-everyone-hits-setting-up-the-threads-api-and-the-exact-fixes-2bl1)). Contra, o documento genérico de modos de app, escrito para apps do Facebook e sem citar o Threads, diz que dados gerados em modo de desenvolvimento "can only be seen by role users" ([App Modes](https://developers.facebook.com/docs/development/build-and-test/app-modes)). Nenhum relato lido testou com conta de terceiro. Esse é o teste que precisa acontecer antes de qualquer código.

Os tropeços relatados por desenvolvedores são de configuração, não de política: usar o App ID e o secret comuns em vez do par específico do Threads, chamar `graph.facebook.com` em vez de `graph.threads.net`, publicar com o `user_id` devolvido na troca do código em vez do `id` de `/me`, e um formulário de Redirect Callback URLs que devolve "Form can't be saved" em duas issues abertas e sem resposta desde maio de 2026 **[RELATO]** ([DEV Community](https://dev.to/hyojunlim/the-7-errors-everyone-hits-setting-up-the-threads-api-and-the-exact-fixes-2bl1), [Postproxy](https://postproxy.dev/blog/how-to-post-to-threads-via-api/), [deepakness.com](https://deepakness.com/raw/threads-api-publishing-fix/), [issue #73](https://github.com/fbsamples/threads_api/issues/73)). Em 23/09/2026 houve um incidente em que tokens recém-emitidos falhavam com HTTP 500, confirmado e dado como resolvido por um contributor da Meta ([issue #75](https://github.com/fbsamples/threads_api/issues/75)). Vale o desconto: a maioria desses blogs é de fornecedores que vendem alternativas à API direta, o que puxa para exagerar a dificuldade.

### Entre os agendadores comerciais, só o Buffer junta plano grátis permanente, Threads e API

Quatro agendadores confirmam em página oficial um plano grátis permanente com Threads e sem teto mensal abaixo de 30 posts. O **Buffer** é o único agendador comercial que junta as três coisas que importam: "Free forever" com 3 canais, fila de 10 posts agendados por canal (a vaga é liberada quando o post sai, então não é teto mensal) e **API incluída no plano Free**, com 1 chave e limites de 100 requisições por 15 minutos, 250 por 24 horas e 3.000 por 30 dias ([Buffer Pricing](https://buffer.com/pricing), [Buffer API limits](https://developers.buffer.com/guides/api-limits.md)). A API é GraphQL, com a mutation `createPost` ([Buffer developers](https://developers.buffer.com/llms.txt)). O Buffer exige que a conta do Threads seja pública e esteja vinculada a uma conta do Instagram, não suporta alt text, GIFs nem enquetes e pede "refresh" manual do canal quando a conexão cai ([Using Threads with Buffer](https://support.buffer.com/article/857-using-threads-with-buffer)). O **Publer** tem plano "Free forever" com 3 contas e 10 agendados por conta, mas a API aparece entre os recursos pagos ([Publer Plans](https://publer.com/plans)). A **Fedica** declara agendamento no Threads em todos os planos, inclusive o grátis, mas a página de preços devolveu 404 e nenhuma API foi encontrada ([Fedica](https://fedica.com/threads/tools)). O **BrightBean Studio**, open source com versão hospedada, declara-se "free since day one", sem limite por canal e com REST API e servidor MCP; o projeto tem cerca de sete meses, não publica SLA e não diz se a versão hospedada dispensa o app próprio na Meta ([BrightBean Studio](https://brightbean.xyz/studio/), [GitHub](https://github.com/brightbeanxyz/brightbean-studio)).

Os demais planos grátis não cobrem 30 posts por mês: Metricool para em 20, Publora em 15 e Pallyy em 15, só com imagem ([Metricool](https://metricool.com/pricing/), [Publora](https://publora.com/pricing), [Pallyy](https://pallyy.com/pricing)). Later, Postiz Cloud, SocialBee, Vista Social, Planable, Hootsuite e Postfa.st só oferecem teste; Zoho Social e Mixpost Lite são grátis, mas sem Threads ([Later](https://later.com/pricing/), [Postiz](https://postiz.com/pricing), [Zoho Social](https://www.zoho.com/social/pricing.html), [Mixpost docs](https://docs.mixpost.app/services/social/threads/)). As páginas de preço do Typefully e do Postpone são renderizadas em JavaScript e não puderam ser lidas; ficam sem conclusão.

Entre as APIs de postagem para desenvolvedores, o **Zernio** (antigo Late) é o único cuja página oficial mostra plano grátis sem teto de posts: as 2 primeiras contas conectadas são gratuitas, com "unlimited posts" e API completa ([Zernio Pricing](https://zernio.com/pricing)). Três ressalvas pesam. A página diz "free", não "forever". Um blog de concorrente descrevia em julho de 2026 um plano bem diferente, de 20 posts ([PostPeer](https://www.postpeer.dev/blog/best-threads-posting-api)). E a documentação afirma que "Threads requires an Instagram Business or Creator account with Threads enabled" ([Zernio Docs](https://docs.zernio.com/platforms/threads)). bundle.social (20 posts por mês), Upload-Post (10 por mês) e Postproxy (10) ficam abaixo do volume, e a página de preços da Ayrshare não lista plano grátis ([bundle.social](https://bundle.social/pricing), [Upload-Post](https://www.upload-post.com/llms-full.txt), [Postproxy](https://postproxy.dev/pricing), [Ayrshare](https://www.ayrshare.com/pricing/)).

Um fato adicional, verificado pela coordenação desta pesquisa e fora das notas: o conector KanBan da agência do dono anuncia agendamento no Threads, mas hoje não tem nenhuma conta social conectada. Não é um atalho pronto, e nada mais sobre ele foi avaliado aqui.

### n8n, Make, Zapier e IFTTT não oferecem ação nativa de Threads de graça

Nenhuma das seis plataformas de automação pesquisadas oferece, no plano grátis, uma ação nativa e oficial para publicar no Threads. O **IFTTT** tem o serviço completo, mas toda ação do Threads é marcada como Pro, a US$ 2,99 por mês, cerca de R$ 15 ([IFTTT – Threads](https://ifttt.com/threads), [IFTTT Plans](https://ifttt.com/plans)). O **Zapier** só tem o app de terceiro "Threads by Unshape" e limita o plano grátis a 100 tarefas e Zaps de dois passos ([Zapier](https://zapier.com/apps/threads-by-unshape/integrations), [Zapier Pricing](https://zapier.com/pricing)). **Make** e **Activepieces** não têm componente para o Threads da Meta; a equipe da Make indicou no fórum o módulo HTTP genérico, e a conclusão sobre o Make é evidência indireta, porque o diretório de apps não pôde ser consultado de forma autenticada ([Make Community](https://community.make.com/t/threads-module-api/22245), [Activepieces](https://github.com/activepieces/activepieces/tree/main/packages/pieces/community)). O componente `threads` do **Pipedream** é de outro produto, o Threads de comunicação corporativa, e o Pipedream Workflows será desligado em 31/03/2027 ([Pipedream](https://github.com/PipedreamHQ/pipedream/tree/master/components/threads), [Pipedream Docs](https://pipedream.com/docs/pricing)).

O **n8n** merece resposta específica. Não existe plano gratuito permanente do n8n Cloud, só teste, e o plano mais barato custa € 20 por mês com cobrança anual, cerca de R$ 112 ([n8n Pricing](https://n8n.io/pricing/)). A edição self-hosted é gratuita para "your own internal business purposes" ([n8n LICENSE](https://github.com/n8n-io/n8n/blob/master/LICENSE.md)), mas o núcleo não tem nó de Threads ([n8n nodes](https://github.com/n8n-io/n8n/tree/master/packages/nodes-base/nodes)), os nós de comunidade pedem OAuth ou token da Meta fornecido pelo usuário ([npm](https://www.npmjs.com/package/@rizkifirmansyah/n8n-nodes-threads-api)) e o Schedule Trigger só dispara com o processo no ar. As hospedagens gratuitas 24 horas encolheram: o Render gratuito dorme após 15 minutos sem tráfego ([Render](https://render.com/docs/free)), e a Oracle Always Free recupera instâncias ociosas, perfil exato de um n8n que roda um job por dia ([Oracle](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)). Para uma chamada HTTP diária, o n8n acrescenta um servidor a manter e não dispensa o app da Meta.

### No GitHub, os projetos vivos usam a API oficial e pedem o mesmo app da Meta

Os projetos com tração e manutenção em 2026 usam a API oficial e são ferramentas completas ou servidores MCP: **Postiz** (37.151 stars, AGPL-3.0), **BrightBean Studio** (2.463 stars) e `mikusnuz/meta-mcp` (release em 08/10/2026) ([Postiz](https://github.com/gitroomhq/postiz-app), [BrightBean](https://github.com/brightbeanxyz/brightbean-studio), [meta-mcp](https://github.com/mikusnuz/meta-mcp)). Todos exigem app da Meta do próprio usuário. A documentação do Postiz chama a integração do Threads de "a complex integration", e o `docker-compose` dele sobe nove serviços, testados em VM de 2 GB de RAM ([Postiz docs](https://github.com/gitroomhq/postiz-docs/blob/main/self-host/providers/threads.mdx), [docker-compose](https://github.com/gitroomhq/postiz-app/blob/main/docker-compose.yaml)). Os wrappers puros da API oficial em Python e Node (`pythreads`, `threads.js`) estão sem push desde 2024 ou 2025 ([pythreads](https://github.com/marclove/pythreads), [threads.js](https://github.com/threadsjs/threads.js)), enquanto o app de exemplo oficial da Meta recebeu commits em março de 2026 ([fbsamples/threads_api](https://github.com/fbsamples/threads_api)). Não há nenhuma GitHub Action no Marketplace dedicada a publicar no Threads ([Marketplace](https://github.com/marketplace?query=post+to+threads&type=actions)), embora exista um repositório público que faz exatamente o post diário com GitHub Actions e a API oficial ([threads-daily-post](https://github.com/jehchoi0221/threads-daily-post)). Como publicar se resume a duas chamadas HTTP, uma biblioteca traz pouco ganho e algum risco de defasagem em relação ao changelog da Meta.

### O relógio, o banco e o cofre de tokens já existem no projeto da Noivar

O repositório já contém todas as peças de infraestrutura que o job precisa **[REPO]**. O `vercel.json` declara dois crons diários. A rota `src/app/api/cron/mercadopago-refresh/route.ts` exige `Authorization: Bearer <CRON_SECRET>` e falha fechada. O `src/lib/secret-box.ts` cifra tokens com AES-256-GCM, e o `src/lib/mercadopago-server.ts` renova tokens OAuth em duas camadas. O `src/lib/funnel.ts` grava erros na tabela `funnel_events`, e `/admin` é protegido por `requireAdmin()`. O que não existe: nenhum SDK de IA, de e-mail ou de Telegram.

No plano Hobby da Vercel cabem até 100 crons por projeto, cada um no máximo uma vez por dia, com disparo em qualquer minuto dentro da hora configurada e função de até 300 segundos **[OFICIAL]** ([Vercel Cron: Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Functions Limits](https://vercel.com/docs/functions/limitations)). A entrega é best-effort: "Vercel will not retry an invocation if a cron job fails", execuções podem se perder ou duplicar, o Hobby guarda 1 hora de logs e não tem alertas ([Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Hobby Plan](https://vercel.com/docs/plans/hobby), [Alerts](https://vercel.com/docs/alerts)).

O **GitHub Actions** é gratuito, mas é a opção com mais pegadinhas para este caso: o `schedule` "can be delayed", jobs "may be dropped", e em repositório público os workflows agendados são desativados após 60 dias sem atividade **[OFICIAL]** ([GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)). O repositório da Noivar no GitHub é público, está parado desde 12/06/2026 e 41 commits atrás do código local **[REPO]**, e regravar o token renovado em um secret exigiria um PAT ([REST API: Actions secrets](https://docs.github.com/en/rest/actions/secrets)).

O **Supabase Free** comporta o estado com folga (500 MB) e pausa após 1 semana de inatividade, risco que o keep-alive em `src/app/api/cron/keep-alive/route.ts` já trata ([Supabase Pricing](https://supabase.com/pricing)). O Supabase Cron usa `pg_cron` e consegue disparar HTTP ([Supabase Cron](https://supabase.com/docs/guides/cron)), mas o `pg_net` é assíncrono, está em beta e tem timeout padrão de 2 segundos ([pg_net](https://supabase.com/docs/guides/database/extensions/pg_net)); as páginas oficiais não dizem em quais planos o Cron está disponível.

Dois complementos gratuitos agregam sem mover nada. O Healthchecks.io, com plano Hobbyist de US$ 0 e 20 jobs, avisa quando um ping esperado não chega, o que cobre o caso em que o cron nem dispara ([Healthchecks.io Pricing](https://healthchecks.io/pricing/), [Docs](https://healthchecks.io/docs/)). O cron-job.org é gratuito, dispara no minuto exato e avisa falha por e-mail, com timeout de 30 segundos ([cron-job.org FAQ](https://cron-job.org/en/faq/)).

### Gerar o texto custa de zero a R$ 2,71 por mês

Para cerca de 30 gerações por mês, qualquer API paga custa centavos: de **R$ 0,04 a R$ 2,71 por mês** no cálculo das notas, feito a partir das tabelas oficiais de preço com o dólar a R$ 5,01 ([Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [OpenAI API pricing](https://developers.openai.com/api/docs/pricing), [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)). A opção gratuita mais sólida é o free tier da Gemini API, disponível no Brasil, com a contrapartida de que o conteúdo enviado é usado para melhorar os produtos do Google ([Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [Available regions](https://ai.google.dev/gemini-api/docs/available-regions)). Planos grátis mudam sem aviso: o GitHub Models foi descontinuado em 30/07/2026 ([GitHub Docs](https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models)). A pesquisa não encontrou comparação confiável de qualidade em português do Brasil entre os modelos atuais.

A alternativa que tira a IA do caminho crítico é gerar em lote com o próprio Claude Code. A documentação confirma que uma routine roda na nuvem da Anthropic com o computador fechado, em planos Pro, Max, Team e Enterprise, consumindo o uso da assinatura **[OFICIAL]** ([Claude Code: Routines](https://code.claude.com/docs/en/routines.md)). As limitações documentadas importam: é research preview, trabalha sobre repositórios do GitHub clonados, a rede padrão não alcança o Supabase e o status verde "does not mean the task in your prompt succeeded" ([Routines](https://code.claude.com/docs/en/routines.md), [Cloud environments](https://code.claude.com/docs/en/cloud-environments.md)). O plano Claude do dono não é conhecido.

### Fora do plano: engenharia reversa, cookies, scrapers e navegador automatizado

Ficam descartados, e aparecem aqui só para registro, todos os clientes de engenharia reversa, as CLIs que usam cookies de sessão, os scrapers e a automação de navegador. O maior deles, `junhoyeo/threads-api`, foi encerrado em 08/09/2023 "due to communication received from Meta Platforms, Inc.", e o próprio autor escreve que usar o código "might violate the terms of service" ([GitHub](https://github.com/junhoyeo/threads-api)). O `yarn-threads-cli`, ativo em 2026, autentica lendo cookies do Chrome ([GitHub](https://github.com/jeizzon/yarn-threads-cli)). O critério prático: se a ferramenta pede usuário e senha do Instagram ou do Threads, cookies de sessão ou roda um navegador headless, está fora; se pede OAuth na tela oficial da Meta ou um token gerado no painel de desenvolvedor, está dentro. O risco das opções excluídas recai sobre o perfil que a automação quer promover.

## 2. Tabela comparativa: doze alternativas, duas recomendáveis

A comparação está em duas tabelas com as mesmas linhas, para caber na tela. A primeira cobre gratuidade, acesso e capacidades; a segunda cobre operação, custo indireto e risco. Valores em reais são aproximados e usam o câmbio de 13/10/2026, com o dólar a cerca de R$ 5,01 (PTAX, detalhada na seção 8) e o euro a cerca de R$ 5,61 ([open.er-api.com](https://open.er-api.com/v6/latest/USD)).

**Tabela 2A. Gratuidade, acesso e capacidades**

| Alternativa | Gratuita de verdade? Limitações | Publica automaticamente no Threads? | Conta de desenvolvedor, OAuth, aprovação da Meta | Funciona com o próprio perfil? | Texto, imagem e link |
|---|---|---|---|---|---|
| **1. API oficial direta + Vercel Cron + Supabase** ([docs](https://developers.facebook.com/docs/threads/overview)). **Recomendada** | Sem página de preço nem plano pago; a Meta não garante gratuidade permanente. Quota de 250 posts por 24 h | Sim, segundo a documentação. Nenhuma chamada foi executada nesta pesquisa | Conta de desenvolvedor Meta e app com caso de uso Threads; `threads_basic` e `threads_content_publish`; sem App Review para o próprio perfil | Sim: "your account and your app's tester accounts". Visibilidade pública de post de app não publicado: não verificada | Texto até 500 caracteres; imagem JPEG ou PNG por URL pública; vídeo; carrossel; até 5 links; card de link só em post de texto |
| **2. Buffer Free com API** ([buffer.com](https://buffer.com/pricing)). **Plano B** | "Free forever": 3 canais, fila de 10 posts por canal, 1 chave de API, 3.000 requisições por 30 dias | Sim, segundo a tabela de canais. `createPost` para canal Threads não foi testado | Sem app próprio na Meta (inferência do fluxo de login descrito); login OAuth pela conta Buffer | Sim, com Threads público e vinculado a uma conta do Instagram; tipo de conta do Instagram não esclarecido | Texto, links, imagem por URL, vídeo, sequência de posts; sem alt text, GIF ou enquete |
| **3. Zernio** ([zernio.com](https://zernio.com/pricing)) | 2 primeiras contas grátis, "unlimited posts", API completa. A página diz "free", não "forever"; fontes divergem sobre o plano | Sim, segundo a documentação do fornecedor | Sem app próprio; a doc diz exigir Instagram Business ou Creator | Provável, condicionado ao tipo de conta do Instagram; não testado | Texto, imagem, vídeo, carrossel de até 10 imagens |
| **4. BrightBean Studio hospedado** ([brightbean.xyz](https://brightbean.xyz/studio/)) | "Free since day one", sem limite por canal, REST API e MCP. Projeto com cerca de 7 meses, sem SLA | Sim, segundo o README | Não esclarecido na versão hospedada; no self-host exige app Meta próprio | Não verificado | Publicação e insights de Threads listados; detalhes não levantados |
| **5. Publer Free e Fedica Free** ([publer.com](https://publer.com/plans), [fedica.com](https://fedica.com/threads/tools)) | Publer: 3 contas, 10 agendados por conta. Fedica: 10 posts no calendário, página de preços em 404 | Publica o que estiver na fila, mas a fila é preenchida à mão: a API do Publer é paga e a Fedica não mostra API | Sem app próprio; login no fornecedor | Sim | Posts e sequências; detalhes não levantados |
| **6. Planos grátis com teto mensal**: [Metricool](https://metricool.com/pricing/) (20), [bundle.social](https://bundle.social/pricing) (20), [Publora](https://publora.com/pricing) (15), [Pallyy](https://pallyy.com/pricing) (15), [Upload-Post](https://www.upload-post.com/llms-full.txt) (10), [Postproxy](https://postproxy.dev/pricing) (10) | Grátis, mas abaixo de 30 posts por mês | Sim, até o teto | Sem app próprio na maioria; não esclarecido em todos | Sim | Varia; o Pallyy grátis só aceita imagem |
| **7. Postiz self-hosted** ([GitHub](https://github.com/gitroomhq/postiz-app)) e Mixpost ([mixpost.app](https://mixpost.app/pricing)) | Postiz: software grátis. Mixpost Lite não publica no Threads; o Pro custa US$ 299 uma vez, cerca de R$ 1.500 | Sim | App Meta próprio obrigatório e conta cadastrada como Threads Tester | Sim | Sim, pela API oficial |
| **8. n8n** ([n8n.io](https://n8n.io/pricing/)) | Cloud: sem plano grátis permanente, a partir de € 20 por mês. Self-hosted: grátis para uso interno, com servidor ligado 24 h | Sim, com nó de comunidade ou requisição HTTP | App Meta próprio e token ou OAuth do usuário | Sim | Nós de comunidade criam texto, imagem, vídeo e carrossel |
| **9. IFTTT, Zapier, Make, Activepieces, Pipedream** ([ifttt.com](https://ifttt.com/threads)) | IFTTT: ações do Threads só no Pro, US$ 2,99 por mês. Demais: sem ação nativa oficial no grátis; Pipedream Workflows desliga em 31/03/2027 | IFTTT Pro: sim. Demais: só por HTTP genérico ou via Buffer | IFTTT: login OAuth. HTTP genérico: app Meta próprio | Sim, no IFTTT | IFTTT: texto, link, imagem, vídeo, carrossel |
| **10. GitHub Actions + API oficial** ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)) | Grátis em repositório público; 2.000 minutos por mês em privado | Sim, com `curl` | Igual à linha 1 | Igual à linha 1 | Igual à linha 1 |
| **11. Supabase Cron + Edge Function ou `pg_net`** ([docs](https://supabase.com/docs/guides/cron)) | R$ 0 no Free, mas as páginas oficiais não dizem em quais planos o Cron existe | Sim, em tese | Igual à linha 1 | Igual à linha 1 | Igual à linha 1 |
| **12. Bibliotecas não oficiais, cookies, scrapers, navegador headless** ([exemplo](https://github.com/junhoyeo/threads-api)). **Descartadas** | Grátis | Por endpoints privados | Usam senha, cookies ou a sessão do navegador | Não se aplica | Não se aplica |

**Tabela 2B. Operação, custo indireto e risco**

| Alternativa | Roda sem intervenção depois do setup? | Tokens e manutenção | Dificuldade com Claude Code | Custos indiretos | Riscos, limites e conformidade |
|---|---|---|---|---|---|
| **1. API oficial direta** | Sim. O cron do Hobby não tem retry: um dia pode se perder | Token de 60 dias renovado no próprio cron com `th_refresh_token`; se expirar, reautorização manual | Baixa no código: 1 rota, 1 migration, `fetch` puro, padrões já existentes. Média no setup manual do painel da Meta | R$ 0: Vercel e Supabase já em uso | API oficial. O risco vem de conteúdo repetitivo e de erro de setup. Termos de Uso do Threads não lidos |
| **2. Buffer Free com API** | Sim, enquanto o canal estiver conectado | O Buffer guarda o token; "refresh" manual do canal quando ele pedir, sem prazo declarado para perfil público | Baixa: uma mutation GraphQL na mesma rota | R$ 0 | Dependência do plano grátis e da API do fornecedor; incidente de conexão em 23/09/2026. Risco de disponibilidade, não de banimento |
| **3. Zernio** | Sim; existe o estado `reconnect_required` | O fornecedor cuida | Baixa | R$ 0 hoje; US$ 6 por mês por conta a partir da terceira | Item mais volátil do inventário: plano mudou em 2026 e há relato único de alta após o rebrand |
| **4. BrightBean hospedado** | Sim, pela API | Não levantado | Baixa a média | R$ 0 | Projeto novo, sem garantia de continuidade |
| **5. Publer e Fedica** | Não: alguém repõe a fila a cada 10 dias ou menos | O fornecedor cuida | Não se aplica, sem API no grátis | R$ 0 e tempo manual | Baixo para a conta; não atende "automático" |
| **6. Tetos mensais** | Só até o teto | O fornecedor cuida | Baixa | R$ 0, ou plano pago para completar o mês | Cobrem dois terços do mês, no máximo |
| **7. Postiz e Mixpost** | Sim | Igual à API direta, dentro da ferramenta; atualizações frequentes e migrações | Alta: VM de 2 GB e nove contêineres | Servidor ligado 24 h | API oficial; custo operacional sem ganho para um perfil |
| **8. n8n** | Sim, se o processo ficar no ar | Renovação automática da credencial OAuth genérica não documentada; chave de cifragem a guardar | Média a alta | Cloud a cerca de R$ 112 por mês, ou VM gratuita com risco de recuperação por ociosidade | API oficial via nó de comunidade não auditado |
| **9. IFTTT e similares** | IFTTT Pro: sim | O fornecedor cuida | Baixa | IFTTT a cerca de R$ 15 por mês | Não atende R$ 0; "Threads by Unshape" no Zapier não verificado quanto à API usada |
| **10. GitHub Actions** | Sim, com atraso e descarte possíveis | Regravar o token exige PAT, ou o estado vai para o Supabase | Média: repositório público e 41 commits atrás | R$ 0 | Agendamento desativado após 60 dias sem atividade em repositório público; fila em arquivo ficaria pública |
| **11. Supabase Cron** | Sim; para junto se o projeto pausar | Igual à linha 1; segredos no Vault ou duplicados | Média com Deno, alta em PL/pgSQL | R$ 0 | `pg_net` assíncrono, em beta e sem retry; segundo runtime |
| **12. Não oficiais** | Não: a sessão cai e exige novo login | Não se aplica | Não se aplica | Não se aplica | **Risco de bloqueio do perfil e violação dos termos. Fora do plano** |

As linhas 1 e 2 são as que entregam publicação automática diária, custo zero e nenhum servidor novo com menos ressalvas. As linhas 3 e 4 também anunciam custo zero em página oficial, mas uma tem o plano mais volátil do inventário e a outra é um projeto de sete meses sem SLA. As linhas 10 e 11 usam a mesma API da linha 1 e só trocam o relógio por um pior para este projeto. O conector KanBan da agência não entrou na tabela porque está sem conta social conectada e não foi avaliado.

## 3. Solução escolhida: API oficial direta, rodando no stack que a Noivar já tem

**A solução principal é uma só: chamar a API oficial do Threads a partir de uma rota de cron nova no projeto da Noivar na Vercel, com fila, histórico e token cifrado no Supabase, textos gerados em lote pelo Claude Code e aprovados pelo dono numa coluna `status`.** O job que publica é determinístico e não chama IA; quem escreve é o Claude Code, em uma sessão semanal. A tabela resume como ela responde a cada prioridade do dono.

| Prioridade do dono | Como a solução atende | Ressalva |
|---|---|---|
| Gratuita | API sem preço publicado; Vercel e Supabase já em uso; geração pela assinatura Claude que o dono já tem | A Meta não promete gratuidade permanente; o plano Claude não foi confirmado |
| Oficial | Só `graph.threads.net`, com token emitido pelo painel da Meta | Termos de Uso do Threads não puderam ser lidos |
| Confiável | Publicação sem IA em tempo de execução; estado em banco; renovação de token no mesmo job | Cron do Hobby sem retry e com janela de 1 hora; alerta depende do Healthchecks.io |
| 24 h com o computador desligado | O Vercel Cron dispara a rota em produção | A geração semanal pede 5 minutos de Claude Code, ou uma routine na nuvem |
| Custo próximo de R$ 0 | R$ 0 | Nenhuma |
| Configuração simples | Uma rota, uma migration, nenhuma dependência nova | O setup manual no painel da Meta é a parte frágil |
| Baixa manutenção | Token renovado sozinho; fila reposta uma vez por semana | Token expirado ou revogado exige reautorização manual |
| Conteúdo com IA | Claude Code gera, valida e insere o lote | Sem benchmark de qualidade em pt-BR; por isso a revisão humana no início |
| Evoluir para outras redes | Mesma fila com uma coluna de rede e uma função de publicação por rede | Cada rede tem app e token próprios |
| Produção com Claude Code | Todo o código segue padrões que já estão no repositório | Nenhuma |
| Sem plataforma paga | Nenhuma contratada | Nenhuma |

A escolha tem três fundamentos. Primeiro, é o único caminho em que a regra do jogo está escrita pela própria Meta: perfil próprio, acesso padrão, sem revisão. Segundo, todas as alternativas self-hosted e todos os nós de comunidade exigem o mesmo app da Meta, então o passo mais trabalhoso não é evitado por nenhuma delas; elas só acrescentam infraestrutura a duas chamadas HTTP. Terceiro, o repositório já tem relógio, autenticação de cron, cifragem de token, renovação por cron, log de erros e área admin, de modo que o trabalho novo é pequeno e fica sob controle do dono.

A solução tem fraquezas reais. O setup inicial no painel da Meta é manual e a interface muda com frequência. O cron do Hobby pode perder um dia e não avisa. E o plano depende de um teste que ainda não aconteceu, o da visibilidade pública.

**Plano B: Buffer Free com API.** As evidências sustentam um único plano B. O Buffer é o único agendador comercial que confirma em página oficial plano gratuito permanente, Threads e API no mesmo plano, e pelo fluxo de conexão descrito dispensa o app na Meta. Ele entra se o formulário de configuração do app da Meta não salvar, se não for possível obter um token de longa duração, ou se o teste de visibilidade falhar e publicar o app não resolver. A troca é pequena: a fila, a revisão, os logs e o cron continuam iguais, e só a função que publica passa a chamar `createPost` no Buffer. Ele fica em segundo lugar porque acrescenta dependência de um plano grátis de fornecedor, exige Threads vinculado a uma conta do Instagram, pede reconexão manual esporádica e não suporta alt text. Nenhuma chamada à API do Buffer foi testada. O Zernio fica de fora como plano B porque o plano gratuito dele é o item mais volátil encontrado, e o BrightBean hospedado porque é um projeto de sete meses, sem SLA, que não esclarece se dispensa o app da Meta.

## 4. Arquitetura: uma rota, uma migration e uma biblioteca de `fetch`

O desenho reaproveita o que o repositório já tem e acrescenta o mínimo. O fluxo completo cabe neste diagrama.

```
 Claude Code (sessão semanal)                     Dono
   sorteia temas, gera 7 posts, valida  ──draft──►  lê e muda status para approved
                                                    (Table Editor do Supabase)
                                                          │
 Vercel Cron (1x por dia, UTC)                            ▼
   GET + Authorization: Bearer CRON_SECRET ──► /api/cron/threads-post
                                                 1. confere o CRON_SECRET
                                                 2. lê a conexão; renova o token se faltar menos de 30 dias
                                                 3. reserva o próximo post aprovado (no máximo 1 por dia)
                                                 4. cria o container, confere o status, publica
                                                 5. grava published ou failed + funnel_events
                                                 6. ping no Healthchecks.io (sucesso ou /fail)
                                                          │
                                                          ▼
                                              graph.threads.net/v1.0
```

A tabela mostra o que cada peça reaproveita e o que é novo. Os nomes dos arquivos novos são sugestão.

| Peça | Já existe no repositório | O que seria novo |
|---|---|---|
| Relógio | `vercel.json`, com dois crons diários (`0 6 * * *` e `0 7 * * *`) | Uma terceira entrada, por exemplo `0 11 * * *`, que no Hobby dispara entre 08:00 e 08:59 de Brasília |
| Autenticação da rota | Guarda de `CRON_SECRET` com comparação em tempo constante em `src/app/api/cron/mercadopago-refresh/route.ts` e `timingSafeEqualStr` em `src/lib/abacatepay.ts` | `src/app/api/cron/threads-post/route.ts`, copiando o mesmo guarda |
| Chamadas HTTP | Padrão de `fetch` puro, sem SDK e sem logar corpo com token, em `src/lib/mercadopago.ts` | `src/lib/threads.ts` com criar container, ler status, publicar e renovar token |
| Banco | `createAdminClient()` em `src/lib/supabase/admin.ts`; tipos escritos à mão em `src/lib/supabase/types.ts` | Atualizar os tipos para as duas tabelas novas |
| Token | Cifragem AES-256-GCM em `src/lib/secret-box.ts`; tabela só para `service_role` em `supabase/migrations/0010_mercadopago_card_gifts.sql`; renovação em `src/lib/mercadopago-server.ts` | Tabela de uma linha para a conexão do Threads, porque a chave de `mp_connections` é `wedding_id` |
| Fila e histórico | Nada | Tabela de posts na migration `supabase/migrations/0015_threads.sql` |
| Log de erros | `logServerError` em `src/lib/funnel.ts`, gravando em `funnel_events` (`supabase/migrations/0011_funnel_events.sql`) | Aceitar o evento `action_failed` ou acrescentar um nome à união `FunnelEventName` |
| Revisão | Área `/admin` protegida por `requireAdmin()` em `src/app/admin/layout.tsx` | Nada no início: o Table Editor do Supabase serve de tela de aprovação |
| Medição | Leitura de UTM em `src/lib/tracking-shared.ts`, gravação em `src/app/cadastro/actions.ts`, exibição em `src/components/admin/data.ts` | Nada: basta montar os links com UTM |
| Testes | vitest, com `tests/secret-box.test.ts` e `tests/mercadopago.test.ts` | Um teste para o validador de texto |
| Alerta | Nada: o Hobby não alerta | Conta no Healthchecks.io e uma variável de ambiente com a URL de ping |

A chave de cifragem tem nome fixo no código, `MERCADOPAGO_TOKEN_ENCRYPTION_KEY`. Reaproveitá-la para o token do Threads funciona sem código novo; o nome fica enganoso, e renomear é opcional.

A tabela de conexão guardaria `threads_user_id`, `access_token_enc`, `expires_at`, `status` (active, revoked ou error), `last_error` e `updated_at`, repetindo o desenho de `mp_connections`. A tabela de posts guardaria o que a publicação e o controle de repetição precisam.

| Coluna | Para quê |
|---|---|
| `id`, `created_at` | Chave e ordem |
| `status` | `draft`, `approved`, `publishing`, `published` ou `failed`, com `check` no banco |
| `ordem` ou data prevista | Fila em ordem; a regra "no máximo um publicado por dia" fica no job |
| `texto` | Com `check` de tamanho; contar em bytes UTF-8 é a escolha conservadora, porque a API conta emojis assim |
| `link_url`, `posicao_link` | Destino com UTM e se vai no corpo ou na primeira resposta |
| `image_url` | Vazia no início; usada quando entrarem posts com captura de modelo |
| `pilar`, `tipo_gancho`, `tema`, `subtema`, `tag_topico` | Rotação e descanso de temas |
| `fatos_usados` | Auditoria de veracidade e descanso por fato |
| `primeira_linha`, `hash_normalizado` | Detecção de abertura repetida e de duplicata exata |
| `container_id`, `threads_media_id`, `published_at` | Rastro da publicação e base para ler métricas depois |
| `erro` | Corpo completo do erro da API, com `code`, `error_subcode` e `fbtrace_id` |

O plano deixa de fora, de propósito, coisas que as notas descrevem mas que não são necessárias para o primeiro post sair. A tabela diz quando cada uma passa a valer a pena.

| Fica para depois | Acrescentar quando |
|---|---|
| Página `/admin` de aprovação, com contador de caracteres e prévia | Aprovar pelo Table Editor no celular incomodar; a página segue o design system do `CLAUDE.md` |
| IA em tempo de execução, por API paga | O dono dispensar o lote semanal e quiser texto novo todo dia; custa centavos |
| Routine do Claude Code para o lote | O gesto semanal manual virar atrito; pede plano compatível e um repositório privado pequeno só de conteúdo, ou rede customizada para alcançar o Supabase |
| Similaridade semântica por embedding | O histórico passar de algumas dezenas de posts e as checagens lexicais deixarem passar repetição; as notas não avaliaram modelo nem custo |
| Coleta de métricas pela API | Depois de 30 dias de posts; exige a permissão `threads_manage_insights` |
| Relógio externo (cron-job.org) | O horário exato passar a importar |
| Coluna de rede e outras redes | O Threads estiver estável por 60 dias |

## 5. Configuração de contas e permissões: quase tudo é ação manual do dono no painel da Meta

As etapas abaixo seguem a documentação oficial e, onde ela é omissa, relatos marcados como tal. **Toda linha marcada como MANUAL depende do dono e não pode ser feita pelo Claude Code.** Não são necessários, para publicar no próprio perfil, verificação de empresa, App Review, publicação do app nem registro como Tech Provider ([Get Started](https://developers.facebook.com/docs/threads/get-started), [Create an app](https://developers.facebook.com/documentation/threads/get-started/create-an-app.md)).

| # | Etapa | Quem | Evidência e cuidado |
|---|---|---|---|
| 1 | Confirmar o ambiente: plano da Vercel, se as rotas de cron atuais estão em produção, se as migrations 0011 a 0014 estão aplicadas e qual o plano do Supabase | **MANUAL (dono)** | **[NÃO VERIFICADO]** nas notas; o remoto do GitHub está 41 commits atrás do código local |
| 2 | Confirmar ou criar o perfil da Noivar no Threads, mantê-lo público e pôr o link do site na bio com UTM | **MANUAL (dono)** | **[NÃO VERIFICADO]** se o perfil já existe; perfil público renova a concessão de permissão a cada refresh ([Get Started](https://developers.facebook.com/docs/threads/get-started)) |
| 3 | Criar a conta de desenvolvedor Meta e um app com o caso de uso "Access the Threads API" | **MANUAL (dono)** | **[OFICIAL]** ([Get Started](https://developers.facebook.com/docs/threads/get-started)). **[RELATO]**: funciona com conta pessoal, marcando "Do not link a business portfolio" ([note.com](https://note.com/kazu_t/n/n6d1df495dde8?hl=en)) |
| 4 | Adicionar as permissões `threads_basic` (obrigatória) e `threads_content_publish`; incluir `threads_manage_insights` já agora evita gerar outro token depois | **MANUAL (dono)** | **[OFICIAL]** ([Create an app](https://developers.facebook.com/documentation/threads/get-started/create-an-app.md)) |
| 5 | Em Settings do caso de uso, anotar o **Threads App ID e o Threads App Secret** e preencher Redirect Callback URL em HTTPS, Deauthorize callback URL e Data Deletion Requests URL | **MANUAL (dono)** | **[OFICIAL]**: o par do Threads não é o App ID e o secret comuns. **[RELATO]**: o formulário só salva com as URLs de desinstalação e exclusão preenchidas, e é preciso clicar em "Finish customization" ([Postiz](https://docs.postiz.com/providers/threads)); há issues abertas com "Form can't be saved" |
| 6 | Adicionar o próprio @ do Threads em App roles > Roles > Add People > Threads Tester e aceitar o convite no Threads, em Settings > Account > Website permissions | **MANUAL (dono)** | **[OFICIAL]** ([Get Started](https://developers.facebook.com/docs/threads/get-started)). **[NÃO VERIFICADO]** se a conta dona do app precisa mesmo ser tester; todos os guias adicionam |
| 7 | Gerar o primeiro token pelo "User Token Generator" do painel ou pelo Graph API Explorer | **MANUAL (dono)** | Gerador do painel: só **[RELATO]**, com fontes divergindo sobre o token já sair de longa duração; exibido uma única vez. Graph API Explorer: **[OFICIAL]** para testes ([Create Posts](https://developers.facebook.com/documentation/threads/create-posts.md)) |
| 8 | Conferir a validade do token com `debug_token` e, se for curto (1 hora), trocá-lo na hora por `th_exchange_token` | **MANUAL (dono)**, com o Claude Code montando os comandos | **[OFICIAL]** ([Debug Access Token](https://developers.facebook.com/documentation/threads/troubleshooting/debug-access-token.md), [Long-Lived Tokens](https://developers.facebook.com/docs/threads/get-started/long-lived-tokens)). A troca usa o Threads App Secret e deve ser feita fora do navegador |
| 9 | Obter o `id` do perfil em `/me?fields=id,username` | Claude Code, com o token fornecido pelo dono | **[RELATO]**: o `user_id` devolvido na troca do código pode não ser aceito como alvo ([deepakness.com](https://deepakness.com/raw/threads-api-publishing-fix/)) |
| 10 | **Teste de visibilidade**: publicar um post de teste, abrir o permalink em janela anônima e a partir de outra conta, conferir o card do link | **MANUAL (dono)** | É o portão do plano. Se o post não aparecer para o público, o remédio provável é publicar o app pelo menu Publish, que pede ícone, URL de política de privacidade e URL de exclusão de dados ([Create an app](https://developers.facebook.com/documentation/threads/get-started/create-an-app.md)); se não resolver, plano B |
| 11 | Criar a conta no Healthchecks.io e um check diário | **MANUAL (dono)** | Opcional, recomendado ([Healthchecks.io](https://healthchecks.io/docs/)) |
| 12 | Aplicar a migration no SQL Editor do Supabase, gravar o token cifrado na tabela de conexão e cadastrar a variável do Healthchecks na Vercel | **MANUAL (dono)**, com script e SQL preparados pelo Claude Code | As migrations já são aplicadas à mão, segundo o `PRODUCTION.md`; o `CRON_SECRET` já está previsto no `.env.example` |

Dois avisos de setup vêm dos relatos e poupam tempo. Se o gerador de token não listar a conta, o convite de tester ainda não foi aceito; a mudança pode levar algumas horas para refletir ([note.com](https://note.com/kazu_t/n/n6d1df495dde8?hl=en)). E o app de exemplo da Meta avisa que redirects OAuth só funcionam em HTTPS e não aceitam `localhost` ([fbsamples/threads_api](https://github.com/fbsamples/threads_api)), o que torna o gerador do painel o caminho mais curto para o primeiro token.

## 6. Exemplo de publicação via API, conforme a documentação oficial

Os comandos abaixo reproduzem a documentação oficial com placeholders. **Nenhum foi executado nesta pesquisa.** O exemplo oficial de post de texto tem um erro de digitação (falta fechar uma aspa), corrigido aqui ([Posts](https://developers.facebook.com/documentation/threads/posts.md), [Troubleshooting](https://developers.facebook.com/docs/threads/troubleshooting)).

```bash
# 1) Criar o container de um post de texto com link
curl -i -X POST \
  -d "media_type=TEXT" \
  -d "text=<TEXT>" \
  -d "link_attachment=<URL>" \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads"
# resposta: { "id": "<THREADS_MEDIA_CONTAINER_ID>" }

# 2) Conferir o status do container antes de publicar
curl -s -X GET \
  "https://graph.threads.net/v1.0/<MEDIA_CONTAINER_ID>?fields=status,error_message&access_token=<THREADS_ACCESS_TOKEN>"
# pronto: { "status": "FINISHED", "id": "17889615691921648" }
# falha:  { "status": "ERROR", "id": "17889615691921648", "error_message": "FAILED_DOWNLOADING_VIDEO" }

# 3) Publicar o container
curl -i -X POST \
  -d "creation_id=<MEDIA_CONTAINER_ID>" \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads_publish"
# resposta: { "id": "<THREADS_MEDIA_ID>" }
```

O mesmo passo 1 com um post de convite da Noivar ficaria como abaixo. A troca de `-d` por `--data-urlencode` é adaptação minha, porque o texto e a URL têm espaços, `$` e `&`; o texto usa só fatos do site e é rascunho para revisão do dono.

```bash
curl -i -X POST \
  --data-urlencode 'media_type=TEXT' \
  --data-urlencode 'text=Montar e ver o site pronto: R$ 0. Publicar: R$ 149,90, uma vez. Taxa nos presentes via Pix: 0%. Não pedimos cartão para começar.' \
  --data-urlencode 'link_attachment=https://noivar.vercel.app/?utm_source=threads&utm_medium=organic_social&utm_campaign=convite&utm_content=20261018-preco' \
  --data-urlencode "access_token=$THREADS_TOKEN" \
  "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads"
```

Para post com imagem, muda só o container; a imagem precisa estar em URL pública, porque "We will cURL your image using the URL provided so it must be on a public server", em JPEG ou PNG de até 8 MB ([Posts](https://developers.facebook.com/documentation/threads/posts.md), [Overview](https://developers.facebook.com/docs/threads/overview)). A renovação do token é uma chamada sem app secret ([Long-Lived Tokens](https://developers.facebook.com/docs/threads/get-started/long-lived-tokens)).

```bash
# Container de imagem (depois, passos 2 e 3 iguais)
curl -i -X POST \
  -d "media_type=IMAGE" \
  -d "image_url=<IMAGE_URL>" \
  -d "text=<TEXT>" \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads"

# Trocar token curto por token de longa duração (uma vez, no setup)
curl -i -X GET "https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=<THREADS_APP_SECRET>&access_token=<SHORT_LIVED_ACCESS_TOKEN>"

# Renovar o token de longa duração (no cron)
curl -i -X GET "https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=<LONG_LIVED_ACCESS_TOKEN>"
# resposta: { "access_token": "<LONG_LIVED_USER_ACCESS_TOKEN>", "token_type": "bearer", "expires_in": 5183944 }
```

Existe ainda a variante em um passo para texto: acrescentar `-d "auto_publish_text=true"` ao passo 1 e dispensar o passo 3. O parâmetro está na referência e no changelog, mas não há exemplo oficial em `curl` nem JSON de sucesso documentado; o formato da resposta vem de um comentário no app de exemplo da Meta ([Reference: Publishing](https://developers.facebook.com/documentation/threads/reference/publishing.md), [fbsamples/threads_api](https://github.com/fbsamples/threads_api/blob/main/src/index.js)). **A recomendação é começar pelo fluxo em dois passos**: é o que tem exemplo oficial literal, o `container_id` gravado antes de publicar permite repetir sem duplicar, e o mesmo caminho serve para imagem. A variante em um passo fica como atalho a testar depois. As notas também inferem que o alias `me` funciona no lugar do ID numérico, com base no app de exemplo e em resposta de funcionário da Meta; vale confirmar no primeiro teste.

## 7. Fluxo de execução diária: reservar, publicar, registrar e renovar o token

Uma vez por dia, o Vercel Cron faria um GET na rota em produção, em UTC, enviando o `CRON_SECRET` como `Authorization: Bearer` ([Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)). A rota recusaria qualquer chamada sem o segredo, como a rota do Mercado Pago já faz. Em seguida leria a conexão do Threads; se o `status` não for ativo, pararia e avisaria, sem tentar publicar.

**Renovação do token.** No mesmo job, a rota verificaria `expires_at`. Faltando menos de 30 dias, a mesma janela que o projeto já usa no cron do Mercado Pago, chamaria `th_refresh_token`, gravaria o `access_token` devolvido e a nova validade **antes** de seguir, porque a documentação não garante que a string continue igual. Isso dá cerca de 30 tentativas diárias antes do vencimento. Se a renovação falhar, o erro iria para o log e para o alerta no mesmo dia; faltando menos de 15 dias sem renovar, o alerta se repetiria. A única recuperação documentada para token expirado é refazer a autorização à mão ([Long-Lived Tokens](https://developers.facebook.com/documentation/threads/get-started/long-lived-tokens.md)).

**Publicação.** A rota verificaria se já há post publicado no dia e, se não houver, reservaria o próximo `approved` com um `UPDATE ... RETURNING` que muda o status para `publishing`, o que protege contra a invocação duplicada que a Vercel admite poder acontecer. Reexecutaria as checagens baratas do validador (tamanho, número de links, duplicata exata), criaria o container, gravaria o `container_id`, leria o status e publicaria quando estivesse `FINISHED`. A documentação recomenda esperar em média 30 segundos antes de publicar e consultar o status no máximo uma vez por minuto, por até 5 minutos ([Posts](https://developers.facebook.com/documentation/threads/posts.md), [Troubleshooting](https://developers.facebook.com/docs/threads/troubleshooting)). Como a função tem 300 segundos no total, o job faria poucas consultas e, se o container não ficasse pronto a tempo, marcaria o post como `failed` com o motivo, em vez de esperar até o limite. Ao final, gravaria `published`, o id do post e a hora, e faria o ping de sucesso no Healthchecks.io. Uma linha que tenha ficado presa em `publishing` por queda da função seria reconciliada na execução seguinte pela leitura do status do container, antes de qualquer nova publicação.

**Fila vazia.** Se não houver post aprovado, o job não publica, registra o fato e dispara o alerta. É o modo de falha mais provável de um fluxo com revisão humana e é também o mecanismo de segurança: nada sai sem aprovação.

A tabela lista os erros com tratamento previsto. A Meta não publica uma tabela oficial de códigos e subcódigos da Threads API; os números vêm de relatos e de uma resposta de funcionário.

| Situação | Origem | Tratamento previsto |
|---|---|---|
| Chamada sem `CRON_SECRET` válido | **[REPO]** | 401, nada é executado |
| O cron não dispara e não deixa log | **[OFICIAL]** Vercel | O Healthchecks.io avisa pela ausência do ping; a fila segue no dia seguinte |
| Invocação duplicada | **[OFICIAL]** Vercel | Reserva por `UPDATE ... RETURNING` e regra de um post por dia |
| `THREADS_API__LINK_LIMIT_EXCEEDED` | **[OFICIAL]** ([Changelog](https://developers.facebook.com/docs/threads/changelog)) | O validador impede antes; se ocorrer, `failed` |
| Container em `ERROR` ou `EXPIRED` | **[OFICIAL]** ([Troubleshooting](https://developers.facebook.com/docs/threads/troubleshooting)) | `failed`, com `error_message` gravado |
| Publicar antes de `FINISHED`: `code` 24, `error_subcode` 4279009 | Funcionário da Meta ([issue #70](https://github.com/fbsamples/threads_api/issues/70)) | Sempre ler o status antes de publicar |
| Primeira leitura de status devolve 404 | **[RELATO]** ([Outstand](https://www.outstand.so/blog/threads-api)) | Só falhar depois de várias tentativas seguidas |
| HTTP 500 depois do publish | **[RELATO]** ([bundle.social](https://bundle.social/blog/threads-posting-api)) | Reler o status do container; se já estiver `PUBLISHED`, não repetir |
| Imagem: `code` 1, `error_subcode` 2207052, "Media download has failed" | **[RELATO]** ([deepakness.com](https://deepakness.com/raw/threads-api-publishing-fix/)) | Recriar o container uma vez |
| `code` 190, token inválido, ou falha no refresh | **[RELATO]** ([DEV Community](https://dev.to/hyojunlim/the-7-errors-everyone-hits-setting-up-the-threads-api-and-the-exact-fixes-2bl1)) | Marcar a conexão como `error`, alertar; reautorização manual |
| `error_subcode` 2207051, "action is blocked", ou 4279013, "Threads account restricted" | **[RELATO]** ([Meta Developer Community](https://developers.secure.facebook.com/community/threads/495634376325323), [bundle.social](https://bundle.social/threads-api/errors)) | **Parar tudo, sem retry**: conexão em `error`, alerta ao dono; a restrição se resolve no app |

Três regras valem para todos os casos. O corpo completo do erro é gravado, com `code`, `error_subcode` e `fbtrace_id`, porque os relatos mostram que a mensagem curta engana. O token nunca vai para log. E os erros vão para `funnel_events`, porque os logs da Vercel no Hobby duram 1 hora.

## 8. Custo mensal estimado: R$ 0 para o plano, R$ 100 só se a Vercel for regularizada

As conversões usam a PTAX de venda de 13/10/2026, R$ 5,0096 por dólar; no mesmo mês o dólar oscilou entre R$ 4,97 e R$ 5,22 ([Banco Central](https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo%28dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao%29?@dataInicial=%2710-01-2026%27&@dataFinalCotacao=%2710-13-2026%27&$format=json)).

| Item | Custo mensal | Base e ressalva |
|---|---|---|
| Threads API | R$ 0 | Sem página de preço; a Meta não garante gratuidade permanente ([Platform Terms](https://developers.facebook.com/terms/)) |
| Vercel Cron e função | R$ 0 | Da ordem de 60 a 120 invocações por mês contra 1.000.000 incluídas no Hobby ([Hobby Plan](https://vercel.com/docs/plans/hobby)); plano atual não confirmado |
| Supabase | R$ 0 | Poucos MB de estado contra 500 MB do Free ([Supabase Pricing](https://supabase.com/pricing)); plano atual não confirmado |
| Geração de texto pelo Claude Code | R$ 0 adicional | Usa a assinatura que o dono já tem; plano não confirmado |
| Healthchecks.io | R$ 0 | Plano Hobbyist, 20 jobs ([Pricing](https://healthchecks.io/pricing/)) |
| **Total do plano** | **R$ 0** | |
| Plano B, Buffer Free | R$ 0 | "Free forever" ([Buffer Pricing](https://buffer.com/pricing)) |
| Opcional futuro: IA em tempo de execução | R$ 0,04 a R$ 2,71 | Cerca de 30 gerações por mês; depósito mínimo de créditos e IOF não verificados |
| Fora do escopo do Threads: Vercel Pro | cerca de R$ 100 | US$ 20 por assento; ver a nota à parte |

O custo que não aparece em reais é tempo: uma tarde de setup no painel da Meta, cerca de 5 minutos por semana para gerar e aprovar o lote, e o tempo de responder aos comentários, que é a parte do plano com melhor evidência de resultado.

## 9. Etapas para colocar em produção

| Etapa | O que acontece | Quem | Critério para avançar |
|---|---|---|---|
| 0. Conferir o ambiente | Etapa 1 da seção 5; decidir como o código local chega à produção | **MANUAL (dono)** | Plano da Vercel, estado da produção e migrations confirmados |
| 1. Contas e token | Etapas 2 a 9 da seção 5 | **MANUAL (dono)**, com apoio do Claude Code | Token de longa duração válido em `debug_token` |
| 2. Testes reais | Etapa 10: post de teste, visibilidade pública, card do link; apagar o post depois | **MANUAL (dono)** | Post visível em janela anônima e por outra conta. Se falhar e publicar o app não resolver, ir para o plano B |
| 3. Implementação | Migration 0015, `src/lib/threads.ts`, rota de cron, validador com teste, entrada no `vercel.json`, tipos atualizados | Claude Code | Testes, typecheck, lint e build passando |
| 4. Entrada em produção | Etapas 11 e 12; deploy; chamar a rota à mão com o `CRON_SECRET` e um post aprovado | **MANUAL (dono)** aprova e executa os passos com segredo | Uma linha `published` com id do post e ping recebido no Healthchecks.io |
| 5. Operação com revisão | Por 4 semanas: lote semanal em `draft`, dono aprova, cron publica, dono responde aos comentários | Dono e Claude Code | Sugestão: 4 semanas seguidas sem correção factual no lote e sem erro pendente |
| 6. Modo automático | O lote passa a entrar já como `approved`; o dono lê uma amostra semanal | Dono decide | A critério do dono |
| 7. Evolução | Posts com imagem, métricas, página `/admin`, outras redes | Conforme a tabela da seção 4 | Threads estável por 60 dias |

O que o Claude Code consegue fazer sozinho é a etapa 3 e a preparação de comandos, SQL e scripts das demais. Tudo o que envolve painel da Meta, segredos, aplicação de migration e deploy passa pela mão ou pela aprovação do dono.

## Plano de conteúdo: seis pilares, sete posts por semana e link em no máximo dois

### Como a automação gera ideias e textos

A geração aconteceria em uma sessão semanal do Claude Code, não no cron. A sessão parte de três arquivos mantidos no repositório: a ficha de fatos verificados, com um identificador por fato, o texto exato do site, a URL e a data de verificação; o banco de temas por pilar, com a data do último uso; e a lista de padrões proibidos. Para cada dia, a sessão define o pilar, o formato, se há link e um tema sorteado com peso pelo tempo sem uso. Recebe do histórico as primeiras linhas dos últimos 14 a 21 posts, com pilar, tipo de abertura e tema, e não os textos inteiros, porque textos inteiros induzem imitação. Recebe também uma lista de "não usar hoje": tipos de abertura dos últimos 3 posts, temas e fatos dos últimos 7 dias. Gera 3 candidatos por dia, escolhe o mais distante do histórico, passa pelo validador e insere como `draft`.

O banco de temas começa com o que as notas levantaram: confirmação de presença (prazo, convidado que some, número final para o buffet), lista de convidados (cortes, família, lista A e B), presentes (pedir Pix, cotas, taxa, como agradecer), site do casamento (o que precisa ter, quando mandar, convidado mais velho), o dia (programação, mapa, traje, hospedagem) e cerimonialista. Os temas de produto saem só da ficha de fatos: os 16 itens inclusos, as 10 respostas do FAQ, os 4 modelos, os 3 passos, o reembolso em 7 dias e os 12 meses no ar. A sazonalidade ajusta os pesos: dezembro, novembro, setembro e outubro foram os meses com mais casamentos no Brasil em 2023, segundo o IBGE ([Exame](https://exame.com/brasil/saiba-em-quais-meses-mais-acontecem-casamentos-e-nascimentos-no-brasil/)), então agora pesam mais os temas de confirmação e reta final, e de janeiro a março os de início de planejamento. A reposição mensal do banco vem das respostas reais recebidas no Threads.

### A rotação alterna os seis tipos de post pedidos

| Pilar | Tipo pedido pelo dono | Função | Produto aparece? | Link? |
|---|---|---|---|---|
| P1 Dica prática | Dicas úteis | Ensinar algo que serve com ou sem a Noivar | Não | Não |
| P2 Dor nomeada | Problemas do público | Descrever uma situação que a noiva reconhece | Não, ou só na última linha | Não |
| P3 Cena e bastidor | Histórias | Cena típica de organização ou bastidor real do produto | Às vezes | Não |
| P4 Pergunta de verdade | Perguntas | Abrir conversa sobre um dilema com duas respostas defensáveis | Não | Não |
| P5 Demonstração | Demonstração do produto | Mostrar uma coisa que o produto faz | Sim | Opcional |
| P6 Convite | Chamada para ação | Dizer o que é, quanto custa e como começar | Sim | Sim |

A semana sugerida é segunda P1, terça P4, quarta P5, quinta P2, sexta P3, sábado P1 ou P4 em versão curta e domingo P6. Isso dá 5 posts sem produto para 2 com produto. Nas quatro primeiras semanas, as notas sugerem 6 para 1, porque conta nova depende de recomendação e de conversa. Os limites semanais são duros: no máximo 2 posts com link, 2 terminando em pergunta, 1 com a conta de taxa, 2 seguidos no mesmo formato, e nenhum tipo de abertura mais de 2 vezes.

A proporção tem base em dados. No relatório da Buffer com dados de 2025, o engajamento mediano por formato no Threads foi de 5,55% para vídeo, 4,55% para imagem, 2,79% para texto e **2,34% para link, o mais baixo** ([Buffer](https://buffer.com/resources/state-of-social-media-engagement-2026/)). Manhãs de dias úteis, entre 6h e 11h, tiveram a maior mediana ([Buffer](https://buffer.com/resources/the-best-time-to-post-on-threads/)), o que sustenta o disparo entre 08:00 e 08:59. A Meta afirma desde maio de 2025 que posts com link passaram a ser recomendados com mais frequência ([Engadget](https://www.engadget.com/social-media/threads-is-finally-embracing-links-150012499.html)), mas nenhuma declaração oficial de 2026 sobre links foi encontrada, e a série de ranking publicada por Adam Mosseri em setembro de 2026 não pôde ser lida; ela deve ser lida no aplicativo antes de fechar a política de links.

### O link da Noivar entra só quando faz sentido

O link fixo fica na bio. No corpo do post, entra só em P6 e, no máximo uma vez por semana, em P5. O formato de UTM aproveita o que o site já lê e o que o painel admin já exibe.

```
https://noivar.vercel.app/<caminho>?utm_source=threads&utm_medium=organic_social&utm_campaign=<pilar>&utm_content=<AAAAMMDD>-<slug-curto>
```

| Situação | Destinos |
|---|---|
| **Liberados** | `/`, `/#presentes`, `/#preco`, `/#modelos`, `/#duvidas`, `/cadastro` e `/cadastro?modelo=<id>` só para `jardim-romantico`, `editorial-luxury`, `garden-classico` e `cinema-noir` |
| **Bloqueados até o dono liberar** | `/modelo/<id>/helena-e-lucas` (as demos estão no ar, mas a landing não as linka de propósito: `DEMOS_LIVE = false` em `src/components/landing/showcase.ts`) e `/lp/presentes` (página de campanha, `noindex`) |
| **Nunca usar** | `/casamento/helena-e-lucas`, que é só o endereço ilustrativo da landing e **devolve 404**; demos dos quatro modelos fora da vitrine; `/termos`, `/privacidade`, `/login` e áreas logadas |
| **Não existem** | `/precos`, `/modelos` e `/blog` devolvem 404 |

Todas as páginas compartilham o mesmo título, a mesma descrição e a mesma imagem de Open Graph, então o card do link será sempre igual; a variedade precisa vir do texto. A imagem tem o preço escrito ("R$ 149,90 uma vez"): se o preço mudar, a imagem muda junto. Sem encurtador que esconda o domínio, e o texto do post precisa bater com a página de destino, porque link que promete uma coisa e entrega outra é item expresso da política de spam ([Meta Transparency Center](https://transparency.meta.com/policies/community-standards/spam/)).

### Só fatos verificados, com as ressalvas que evitam promessa falsa

O gerador só pode citar fatos da ficha e declara quais usou; o validador recusa qualquer número, percentual ou valor em reais que não esteja nela. Os fatos abaixo foram lidos no site público em 13/10/2026 ([home](https://noivar.vercel.app/), [Termos](https://noivar.vercel.app/termos)).

| Tema | O que o site afirma | Erro fácil de cometer |
|---|---|---|
| Preço | Montar e ver o site pronto: R$ 0. Publicar: R$ 149,90, uma vez, via Pix. Sem mensalidade. "Não pedimos cartão para começar." | Dizer "site grátis" sem dizer que publicar custa R$ 149,90 |
| Taxa nos presentes | **0% vale só para Pix.** No cartão, em até 12x, existe a taxa do Mercado Pago; o percentual não é publicado | Dizer "presentes sem taxa" sem a palavra Pix; citar percentual do cartão |
| Caminho do Pix | Vai do banco do convidado direto para a chave do casal. "A Noivar não toca no dinheiro." | Dizer que a Noivar guarda, repassa ou protege o dinheiro |
| Conferência | Manual: "Vocês conferem no extrato e marcam como recebido." | Dizer "a Noivar avisa quando o Pix cai" |
| Recados | Ficam no painel, visíveis só para o casal e no link da cerimonialista | Dizer "mural" ou "recados aparecem no site" |
| Confirmação | Só confirma quem está na lista de convidados | Prometer algo sobre acompanhantes ou restrição alimentar |
| Comparação de taxa | "Numa lista que cobra 3,89% por presente, R$ 10.000 em presentes pagam R$ 389 de taxa", com a nota "consultada em setembro de 2026. Varia por plano." | Omitir a ressalva; citar concorrente pelo nome |
| Modelos | Quatro na vitrine: Jardim Romântico, Editorial Luxury, Jardim Clássico e Cinema Noir; troca sem perder textos e fotos | Citar modelos que só existem no código |
| Garantias | Reembolso integral em até 7 dias; site no ar por pelo menos 12 meses depois da data do casamento | Arredondar para "sempre no ar" ou "garantia total" |
| Provas | **O site não tem depoimentos, número de casais nem avaliações** | Inventar depoimento, "uma noiva me contou" ou qualquer número de tração |
| Marca | "Noivar", no feminino: "a Noivar" | Escrever "o Noivar"; usar "Vows", que é só o nome interno do design system |

Ficam bloqueados, até o dono liberar item a item, os fatos que só existem no repositório e não aparecem no site: taxa de 4,99% no cartão, valores mínimo e máximo de presente no cartão, acompanhantes, restrição alimentar, "edições ilimitadas", "mural de recados", modelos fora da vitrine e domínio próprio. O `README.md` descreve um protótipo antigo e não serve de fonte. O número de 3,89% bate com os planos de entrada de três concorrentes consultados na mesma data ([Casar.com](https://www.casar.com/), [iCasei](https://www.icasei.com.br/planos), [Lejour](https://lejour.com.br/)), que também cobram menos nos planos pagos; daí a ressalva obrigatória. A Noivar não pode alegar mais modelos, aplicativo, lembretes automáticos, escala ou tradição. A ficha deve ser reverificada contra o site uma vez por mês: a própria nota "consultada em setembro de 2026" envelhece.

### Voz da marca e padrões proibidos

A voz segue a landing: frases curtas, "vocês" para o casal, respostas que começam com sim ou não, números concretos, nenhuma exclamação e nenhum emoji. A maioria dos posts fica entre 150 e 350 caracteres, com uma ideia por post e uma primeira linha que se sustenta sozinha. Sem hashtags; no máximo uma tag de tópico, de uma lista curta.

O validador recusa quatro famílias de texto. Clichês de marketing como "transforme", "descubra", "o dia mais importante da sua vida" e "sem dor de cabeça". Promessas não verificáveis como "o melhor", "o mais barato", "garantido" e autoelogios como "premium". Isca de engajamento como "comenta aqui", "marque uma amiga noiva", sorteio em troca de seguir e pergunta genérica no fim de todo post. E urgência falsa como "só hoje" ou "promoção", porque o preço é fixo. Entram ainda os sinais de texto automático: numeração em todo post, mesma abertura repetida, lista de três adjetivos e fecho com moral.

Três esqueletos mostram o registro. **São exemplos para revisão do dono, não texto final.**

> **P2, dor nomeada.** Faltam três semanas, o buffet quer o número final e metade da lista ainda não respondeu. Ninguém fez por mal. O convite ficou na geladeira, a resposta ficou para depois. Confirmar presença precisa ser mais fácil do que esquecer.

> **P4, pergunta de verdade.** Pedir Pix de presente de casamento ainda divide opiniões. Tem quem ache prático e honesto. Tem quem ache deselegante. Vocês colocaram a chave no convite, numa lista com cotas, ou preferiram não pedir?

> **P6, convite.** Numa lista que cobra 3,89% por presente, R$ 10.000 em presentes viram R$ 389 de taxa. Na Noivar, o presente via Pix cai inteiro na conta de vocês. Vocês pagam R$ 149,90 uma vez para publicar o site. (3,89%: taxa publicada por plataformas brasileiras de lista de casamento, consultada em setembro de 2026. Varia por plano.)

No primeiro, "três semanas" e "metade da lista" são cena ilustrativa, não estatística, e devem ser reescritas se soarem como dado. O pilar de histórias não tem casos reais de casais: enquanto o dono não fornecer casos autorizados, fica restrito a bastidor verdadeiro do produto e a cenas genéricas que não são atribuídas a ninguém.

### Histórico, repetição e registros

Repetição é o maior risco de qualidade e também um sinal explícito na política de spam da Meta, mesmo em baixa frequência ([Meta Transparency Center](https://transparency.meta.com/policies/community-standards/spam/)). O histórico é a própria tabela de posts publicados. Antes de entrar na fila, cada texto passa por três checagens feitas em código, sem dependência nova: o `hash_normalizado` não pode existir no histórico; as 5 primeiras palavras não podem coincidir com nenhum dos últimos 30 posts; e a similaridade de Jaccard sobre trigramas de palavras contra os últimos 60 posts não pode passar de 0,5, limiar inicial a calibrar com casos reais. Os temas têm descanso mínimo de 21 dias para o mesmo subtema e de 7 dias para o mesmo tema e para o mesmo fato de produto; o "0% no Pix" é o mais tentador e o que mais cansa. Esses números são pontos de partida sem validação nesta conta e devem ser ajustados depois de 60 dias de histórico.

Cada execução deixa rastro em três lugares: a linha do post, com status, id publicado, hora ou erro completo; a tabela `funnel_events`, para erros; e o Healthchecks.io, que avisa por e-mail tanto na falha quanto na ausência de execução.

### Revisão antes do modo automático, e o que a automação não faz

Nas quatro primeiras semanas nada sai sem o dono mudar o status para `approved`. Cada frase rejeitada entra na lista de padrões proibidos. A passagem para o automático é só uma mudança de regra, inserir o lote já como `approved`, sem trocar infraestrutura; mesmo assim, a leitura de uma amostra semanal continua.

Duas expectativas precisam ficar calibradas. O Threads é fraco como fonte de tráfego direto: o link é o formato de menor engajamento mediano, e a meta inicial realista é resposta e seguidor qualificado, não cadastro por post. E o comportamento com melhor evidência não é automatizável: responder aos comentários está associado a **42% mais engajamento** no Threads, com a ressalva dos autores de que a causalidade pode correr nos dois sentidos ([Buffer](https://buffer.com/resources/state-of-social-media-engagement-2026/)). Um perfil que publica todo dia e não conversa perde a principal alavanca; alguém precisa responder, e as notas não sabem quem será. Também não há número confiável de usuários do Threads no Brasil nem fonte sobre a conversa de casamento na rede, o que pede uma verificação manual no aplicativo antes de fechar as tags de tópico.

## Nota à parte: o plano Hobby da Vercel proíbe uso comercial

Este ponto não é sobre o Threads e não bloqueia o plano, mas afeta o chão em que ele pisa. As diretrizes da Vercel dizem que "Hobby teams are restricted to non-commercial personal use only" e citam como uso comercial qualquer forma de solicitar ou processar pagamento de visitantes e a divulgação da venda de um produto ou serviço ([Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)). A Noivar cobra R$ 149,90 pela publicação. Os indícios de que o projeto está no Hobby são indiretos (um comentário em `supabase/migrations/0011_funnel_events.sql` diz que os logs duram cerca de 1 hora no plano atual, e todos os crons são diários), e o plano não foi confirmado no painel. Se for Hobby, a não conformidade já existe hoje, independentemente do Threads; publicar posts de marketing pelo mesmo projeto apenas acrescenta mais uma atividade comercial. Regularizar custa US$ 20 por assento por mês, cerca de R$ 100, e de quebra traria cron por minuto e logs de 1 dia ([Hobby Plan](https://vercel.com/docs/plans/hobby)). A documentação não descreve o que acontece na prática quando a Vercel detecta uso comercial no Hobby. É uma decisão para tomar separadamente.

Outros dois achados do setup atual entram como pré-requisito, não como risco novo. O remoto do GitHub só tem o commit inicial e o código local está 41 commits à frente, então não se sabe qual código está em produção; crons só rodam contra o deployment de produção. E os Termos e a Política de privacidade do site exibem o aviso "Versão preliminar, em revisão jurídica", o que só importa se o teste de visibilidade obrigar a publicar o app da Meta, que pede URL de política de privacidade.

## O que ainda depende de teste real do dono

| Ponto | Por que está em aberto | Como testar |
|---|---|---|
| Post de app não publicado aparece para o público? | Nenhuma página da Threads API afirma; doc genérico de modos de app sugere o contrário | Post de teste; abrir o permalink em janela anônima e por outra conta |
| O token do gerador do painel é curto ou longo? | Relatos se contradizem | `debug_token`, campo `expires_at` |
| A conta dona do app precisa ser Threads Tester? | A doc fala em "your account and your app's tester accounts" | Adicionar de qualquer forma; é o que todos os guias fazem |
| O refresh devolve um token novo ou o mesmo? | A doc não diz | Persistir sempre o valor devolvido |
| O card do link aparece como esperado? | Depende do cache do Threads; não testado | Mesmo post de teste, com `link_attachment` |
| O limite de 500 conta a URL inteira? | Não confirmado | Manter os textos bem abaixo do limite |
| O terceiro cron diário passa no Hobby? | O limite antigo de 2 crons por time saiu do changelog, mas o projeto já usa 2 | Observar o deploy; erro de limite indica isso |
| O que está em produção, e em qual plano? | Sem acesso aos painéis | Painel da Vercel e do Supabase |
| O plano Claude permite routines? | Plano do dono desconhecido | Só importa se o lote semanal for automatizado |
| Existe regra do Threads sobre contas automatizadas ou rótulo de IA para texto? | Termos de Uso do Threads não carregaram; fontes sobre rótulo de IA são de 2024 | Ler os termos vigentes no aplicativo antes de lançar |
| A API do Buffer publica no Threads como documentado? | Só leitura de documentação | Testar apenas se o plano B for acionado |

## Conclusão

A recomendação objetiva é implementar a API oficial do Threads dentro do projeto que já existe, com fila aprovada pelo dono e lote semanal gerado pelo Claude Code, e não contratar nenhuma plataforma. A pesquisa mudou a pergunta de lugar: a decisão difícil não é qual ferramenta escolher, porque todas as ferramentas sérias desembocam no mesmo app da Meta ou num plano grátis de terceiro. O que decide o resultado são três coisas que nenhuma plataforma resolve: um teste de visibilidade de dez minutos, um token que não pode ser esquecido e uma pessoa respondendo aos comentários.

O plano executável começa por essa ordem. Nesta semana, o dono confirma o plano da Vercel e o que está em produção, cria o app na Meta, obtém o token e faz o post de teste; se o post aparecer para o público, o caminho principal está validado, e se não aparecer nem depois de publicar o app, o Buffer Free assume. Em seguida, o Claude Code implementa a migration, a biblioteca de `fetch`, a rota de cron e o validador com teste, e o dono aplica a migration, grava o token e faz o deploy. Depois vêm quatro semanas com revisão, medindo por UTM e pelas respostas, antes de qualquer decisão sobre modo automático, imagens ou outras redes. A pendência do plano Hobby corre em paralelo e merece decisão própria, porque ela é anterior ao Threads e maior do que ele.
