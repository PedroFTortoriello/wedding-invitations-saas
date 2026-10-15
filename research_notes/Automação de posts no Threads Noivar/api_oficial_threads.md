# API oficial do Threads (Meta) — estado em outubro de 2026, para 1 post automático por dia no perfil próprio

Pesquisa feita em 13/10/2026. Legenda usada em todos os achados:
**[OFICIAL]** = documentação/termos da Meta ou funcionário da Meta respondendo em canal oficial;
**[RELATO]** = blog, fórum, issue ou doc de fornecedor (não é a Meta falando);
o que não consegui confirmar está sempre em **Gaps**.
Aviso de método: as citações em inglês foram extraídas das páginas por leitura automatizada; antes de reproduzir alguma literalmente em documento público, conferir na URL indicada. A documentação é servida em dois caminhos equivalentes (`/docs/threads/...` e `/documentation/threads/...`, este com versão `.md`); o índice completo está em [llms.txt](https://developers.facebook.com/documentation/threads/llms.txt).

## 1. Capacidades de publicação (endpoints, parâmetros, limites, fluxo)

### Takeaway
A API publica texto, imagem, vídeo e carrossel (2 a 20 itens) em `graph.threads.net/v1.0`, com limite de 500 caracteres e 5 links únicos por post. O fluxo padrão é em dois passos (container + publish), mas para post só de texto existe publicação em um passo com `auto_publish_text=true`.

### Cited Findings
- **[OFICIAL]** Endpoints: `POST /{threads-user-id}/threads` (cria o container) e `POST /{threads-user-id}/threads_publish` (publica, parâmetro obrigatório `creation_id`). Base dos exemplos: `https://graph.threads.net/v1.0/`. — [Posts](https://developers.facebook.com/docs/threads/posts)
- **[OFICIAL]** Versão: todos os exemplos usam `v1.0`; não há outra versão documentada. Desde 6/jun/2025 a API responde tanto em `graph.threads.com` quanto em `graph.threads.net`. — [Changelog](https://developers.facebook.com/docs/threads/changelog)
- **[OFICIAL]** Tabela completa de parâmetros de `POST /{threads-user-id}/threads`: `media_type` (obrigatório: `TEXT`, `IMAGE`, `VIDEO`, `CAROUSEL`), `text`, `image_url` (obrigatório se `IMAGE`), `video_url` (obrigatório se `VIDEO`), `is_carousel_item` (default `false`), `children` (obrigatório se `CAROUSEL`), `reply_to_id`, `reply_control` (`everyone`, `accounts_you_follow`, `mentioned_only`, `parent_post_author_only`, `followers_only`), `allowlisted_country_codes`, `alt_text` (máx. 1.000 caracteres), `link_attachment`, `quote_post_id`, `poll_attachment`, `auto_publish_text`, `topic_tag`, `is_spoiler_media`, `text_entities`, `text_attachment`, `gif_attachment` (`gif_id` + `provider`), `is_ghost_post`, `enable_reply_approvals`, `crossreshare_to_ig`, `crossreshare_to_ig_dark_mode`, `location_id`. — [Reference: Publishing](https://developers.facebook.com/documentation/threads/reference/publishing.md)
- **[OFICIAL]** Publicação em um passo para texto: `auto_publish_text` — "When this optional flag is passed, a Threads post is published automatically when a Threads media container is created without needing to go through the extra publish step." / "This only works for text posts." — [Reference: Publishing](https://developers.facebook.com/documentation/threads/reference/publishing.md); anunciado em 4/jun/2025 ("Text posts can be published automatically") — [Changelog](https://developers.facebook.com/docs/threads/changelog)
- **[OFICIAL]** No app de exemplo da Meta, com `auto_publish_text` ligado, o `id` retornado já é o do post publicado (comentário no código: "If auto_publish_text is on, the returned ID is the published Threads ID."). — [fbsamples/threads_api src/index.js](https://github.com/fbsamples/threads_api/blob/main/src/index.js)
- **[OFICIAL]** Limite de texto: "Text posts are limited to 500 characters."; emojis contam pelo número de bytes UTF-8. — [Overview](https://developers.facebook.com/docs/threads/overview), [Reference: Publishing](https://developers.facebook.com/documentation/threads/reference/publishing.md)
- **[OFICIAL]** Links: "The number of links is restricted to 5 or less." / "All unique URLs found in the text field are counted as links." Desde 22/dez/2025, passar do limite falha na criação do container com `THREADS_API__LINK_LIMIT_EXCEEDED`. — [Posts](https://developers.facebook.com/documentation/threads/posts.md), [Changelog](https://developers.facebook.com/docs/threads/changelog)
- **[OFICIAL]** Preview de link: "If any URLs are included, the first URL in the `text` field will be used as the link preview for the post." O parâmetro `link_attachment` define o link explicitamente e só vale para posts de texto ("only available for text-only posts"); se omitido, o primeiro link do texto vira o anexo. O valor pode ser lido depois no campo `link_attachment_url` de `GET /{threads_media_id}`. — [Posts](https://developers.facebook.com/documentation/threads/posts.md)
- **[OFICIAL]** Topic tag: parâmetro `topic_tag` com 1 a 50 caracteres, sem ponto (.) nem "e" comercial (&); a forma `#tag` no texto é aceita por compatibilidade mas "not preferred"; só a primeira tag válida do post é usada. — [Posts](https://developers.facebook.com/docs/threads/posts)
- **[OFICIAL]** Espera entre criar e publicar: "It is recommended to wait on average 30 seconds before publishing a Threads media container". — [Posts](https://developers.facebook.com/documentation/threads/posts.md)
- **[OFICIAL]** Status do container: `GET /{threads-container-id}?fields=status,error_message`; valores `EXPIRED` (não publicado em 24 h), `ERROR`, `FINISHED`, `IN_PROGRESS`, `PUBLISHED`; recomendação de consultar uma vez por minuto por no máximo 5 minutos. — [Troubleshooting](https://developers.facebook.com/docs/threads/troubleshooting)
- **[OFICIAL]** Carrossel: um container por item com `is_carousel_item=true`, depois um container `media_type=CAROUSEL` com `children`; "Carousel posts must have a maximum of 20 children and a minimum of 2 children." Conta como um único post no limite diário. — [Posts](https://developers.facebook.com/docs/threads/posts), [Overview](https://developers.facebook.com/docs/threads/overview)
- **[OFICIAL]** Posts elegíveis publicados via API também vão para o fediverso (desde 28/ago/2024) quando o usuário ativou esse compartilhamento. — [Create Posts](https://developers.facebook.com/documentation/threads/create-posts.md)
- **[RELATO]** Com imagem ou vídeo no post, o card de preview do link não aparece: "unless there is an image or video included" / "Removing the image will cause the link preview to show." (doc de fornecedor, sem data). — [Ayrshare](https://www.ayrshare.com/apis/post/social-networks/threads)
- **[RELATO]** A imagem/título do preview vêm das meta tags Open Graph da página de destino; preview errado ou vazio se resolve corrigindo `og:image` (URL absoluta) e forçando novo scrape no Sharing Debugger da Meta. — [True Anthem](https://support.trueanthem.com/hc/en-us/articles/47073083161876--Threads-Missing-or-Incorrect-Image)

### Inferences
- Para o caso "1 post de texto com link por dia", uma única chamada `POST /{id}/threads` com `media_type=TEXT`, `text`, `link_attachment` e `auto_publish_text=true` basta; o fluxo em dois passos só é obrigatório quando houver imagem, vídeo ou carrossel.
- Post com imagem + URL no texto: a URL continua clicável no texto, mas não se deve esperar o card de preview (documentação oficial restringe `link_attachment` a texto; fornecedor confirma o comportamento).
- A contagem de 500 caracteres precisa ser feita em bytes UTF-8 para emojis; contar `string.length` em JavaScript pode aprovar um texto que a API rejeita.

### Gaps
- A página-guia de Posts não tem exemplo oficial em curl de `auto_publish_text`; o parâmetro está só na referência, no changelog e no app de exemplo. O formato exato da resposta (id do post) vem do comentário no código de exemplo, não de um JSON documentado.
- Não encontrei afirmação oficial sobre o comportamento do preview quando o post tem mídia; só relato de fornecedor.
- Não confirmei se o limite de 500 conta a URL inteira ou uma forma encurtada.

## 2. Custo

### Takeaway
Não existe página de preço, plano pago nem exigência de cobrança na documentação da Threads API; o acesso é controlado por permissões e App Review, não por pagamento. A Meta, porém, não promete gratuidade permanente.

### Cited Findings
- **[OFICIAL]** As páginas Overview, Get Started e o índice da documentação não mencionam custo, cobrança ou tiers pagos; os únicos limites descritos são de quota (ver seção 5). — [Overview](https://developers.facebook.com/docs/threads/overview), [Get Started](https://developers.facebook.com/docs/threads/get-started), [índice llms.txt](https://developers.facebook.com/documentation/threads/llms.txt)
- **[OFICIAL]** Meta Platform Terms, seção 11.f (versão pt-BR, atualizada em 3/fev/2026): "Nós não podemos garantir que a Plataforma será sempre gratuita." A seção 11.e permite impor limites a recursos e serviços. — [Platform Terms](https://developers.facebook.com/terms/)
- **[RELATO]** "has no pricing or billing section" — o acesso é barrado por App Review, não por pagamento (15/ago/2026). — [bundle.social](https://bundle.social/blog/threads-posting-api)
- **[RELATO]** A Meta "publishes no paid tier, no per-call fee, and no pricing page" (blog de fornecedor concorrente, 1/jul/2026, atualizado 10/set/2026). — [Blotato](https://www.blotato.com/blog/threads-api-pricing)
- **[RELATO]** Guia japonês de 30/mai/2026 afirma que a Threads API é gratuita naquela data. — [note.com/kazu_t](https://note.com/kazu_t/n/n6d1df495dde8?hl=en)
- **[RELATO]** Armadilha: existe um console "Meta Model API" que mostra "No payment method on file. Add one to make API requests." — é o serviço pago de inferência Llama, não a Threads API. — [DEV Community](https://dev.to/hyojunlim/the-7-errors-everyone-hits-setting-up-the-threads-api-and-the-exact-fixes-2bl1)

### Inferences
- Custo em dinheiro da API: zero hoje. O custo real é hospedar a imagem em URL pública e manter um job de renovação de token.

### Gaps
- Não há frase oficial dizendo "a Threads API é gratuita"; a conclusão vem da ausência de qualquer seção de preço mais relatos de terceiros.

## 3. Requisitos de acesso (app, permissões, App Review, modo de desenvolvimento, tipo de conta, Brasil)

### Takeaway
Para postar no próprio perfil não é preciso App Review: sem acesso avançado, o app só publica na conta do dono e nas contas de testers — que é exatamente o caso de uso. O que não consegui confirmar em fonte da Meta é se posts feitos por app não publicado são vistos pelo público como posts normais; isso precisa de um teste real antes de confiar.

### Cited Findings
- **[OFICIAL]** Criar um app com o caso de uso do Threads: "To access the Threads API, create an app and pick the Threads Use Case."; usar o par específico do Threads: "For Threads API implementation purposes, use the Threads app ID and its corresponding app secret." — [Get Started](https://developers.facebook.com/docs/threads/get-started)
- **[OFICIAL]** Permissões: `threads_basic` ("Required for all Threads endpoints."), `threads_content_publish` ("Required for Threads publishing endpoints only."), `threads_manage_replies`, `threads_read_replies`, `threads_manage_insights` ("Required for making GET calls to insights endpoints."). — [Get Started](https://developers.facebook.com/docs/threads/get-started)
- **[OFICIAL]** No painel, `threads_basic` é obrigatória e não pode ser removida; opcionais: `threads_content_publish`, `threads_delete`, `threads_keyword_search`, `threads_location_tagging`, `threads_manage_insights`, `threads_manage_mentions`, `threads_manage_replies`, `threads_profile_discovery`, `threads_read_replies`. Em Settings ficam o Threads app ID, o Threads app secret, as Redirect/OAuth URIs, a Deauthorize callback URL e a Data Deletion Requests URL. — [Create an app](https://developers.facebook.com/documentation/threads/get-started/create-an-app.md)
- **[OFICIAL]** Ponto central: "If your app has not been approved for advanced access for the `threads_content_publish` permission," "you can only post to Threads for your account and your app's tester accounts." Após aprovação, o app pode postar por outros usuários públicos. — [Create Posts](https://developers.facebook.com/documentation/threads/create-posts.md)
- **[OFICIAL]** App Review só é exigido para usuários sem papel no app: "each permission must first be approved through the App Review process, and your app must be published." — [Get Started](https://developers.facebook.com/docs/threads/get-started)
- **[OFICIAL]** Tester: "In order to test your app with a Threads user, you must first send an invitation to the Threads user's profile and accept the invitation."; o convite é enviado em App Dashboard > App roles > Roles > Add People > Threads Tester e aceito na seção "Website permissions" das configurações de conta do Threads. — [Get Started](https://developers.facebook.com/docs/threads/get-started)
- **[OFICIAL]** Funcionário da Meta (contributor do repositório oficial, 6/abr/2026) a um dev que queria "personal use and local access only": "By default, you are given standard access"; acesso avançado (via App Review) só é necessário para agir sobre contas públicas de terceiros. — [fbsamples/threads_api issue #72](https://github.com/fbsamples/threads_api/issues/72)
- **[OFICIAL]** Doc genérico de níveis de acesso (versão pt-BR): acesso padrão é aprovado automaticamente e só vale para usuários com função no app; "a verificação da empresa é necessária para obter acesso avançado". A própria página diz que vale apenas para apps criados com "tipo de app" (o app do Threads é criado por caso de uso). — [Access Levels](https://developers.facebook.com/docs/graph-api/overview/access-levels)
- **[OFICIAL]** Publicar o app (menu Publish) exige ícone, Privacy Policy URL e URL/callback de exclusão de dados; o passo "Prepare and submit for App Review" é descrito para Tech Providers (apps que atendem clientes/outros portfólios); "Testing is only required if you're submitting for App Review and your app will access data you don't own or manage". — [Create an app](https://developers.facebook.com/documentation/threads/get-started/create-an-app.md)
- **[OFICIAL]** Doc genérico de modos de app: "Apps in Development mode can only request permissions from role users" e "Any data generated while an app is in Development mode, such as test posts, can only be seen by role users." Esta página não cita o Threads. — [App Modes](https://developers.facebook.com/docs/development/build-and-test/app-modes)
- **[OFICIAL]** Vínculo com Instagram deixou de ser exigido: desde 23/set/2025 a API está disponível para perfis sem conta do Instagram vinculada (em 30/jan/2026 esses perfis ganharam também `followers_count` e `follower_demographics`). — [Changelog](https://developers.facebook.com/docs/threads/changelog)
- **[OFICIAL]** Perfil privado é aceito, com diferença na validade das permissões: concessões de perfis públicos valem 90 dias e são estendidas a cada refresh do token; para perfis privados a página Get Started diz "the permission grant cannot be extended and the app user must grant the expired permission to your app again." — [Get Started](https://developers.facebook.com/docs/threads/get-started); a página de tokens diz que "Long-lived access tokens for private Threads profiles can now be refreshed." — [Long-Lived Tokens](https://developers.facebook.com/documentation/threads/get-started/long-lived-tokens.md)
- **[OFICIAL]** Nenhuma restrição geográfica é mencionada em Get Started nem em Overview. A página de termos da Meta foi servida em pt-BR durante a pesquisa. — [Get Started](https://developers.facebook.com/docs/threads/get-started), [Platform Terms](https://developers.facebook.com/terms/)
- **[RELATO]** Guia de 30/mai/2026: criar o app com o caso de uso "Access Threads API" marcando "Do not link a business portfolio"; funciona com conta pessoal; a alteração de tester pode levar algumas horas para refletir. — [note.com/kazu_t](https://note.com/kazu_t/n/n6d1df495dde8?hl=en)
- **[RELATO]** "tester mode" basta para postar na própria conta e o app pode ficar não publicado; enquanto o app não passa em review, só contas adicionadas como Threads testers conseguem autorizá-lo (ago/2026). — [DEV Community](https://dev.to/hyojunlim/the-7-errors-everyone-hits-setting-up-the-threads-api-and-the-exact-fixes-2bl1)
- **[RELATO]** Em modo Development só contas com papel (Admin, Developer, Tester) autorizam o app; erro típico: "The user has not accepted the invite to test the app". — [Nango](https://nango.dev/docs/api-integrations/threads/how-to-register-your-own-threads-api-oauth-app)
- **[RELATO]** Setup de produto open-source: adicionar `threads_content_publish`, preencher as URLs de Uninstall/Delete (o formulário não salva sem elas), clicar em "Finish customization" ("The API may not work until you've done this."), adicionar o perfil como Threads Tester usando o @ do Threads (não o da conta de desenvolvedor); se não houver portfólio de negócios disponível, ativar 2FA no Meta Business Suite. — [Postiz](https://docs.postiz.com/providers/threads)
- **[RELATO]** No app do Threads não há o toggle Development/Live nas configurações básicas; um dev relatou em 2024 que o botão "Become a tech provider" foi o que habilitou o Publish (sem confirmação da Meta no tópico). — [Meta Developer Community](https://developers.secure.facebook.com/community/threads/402735785468514)
- **[RELATO]** Para servir terceiros: App Review por permissão com screencast; estimativas divergentes — a Blotato cita a Meta dizendo que o processamento "typically takes less than one week, often only 2 to 3 days" e ao mesmo tempo estima 2 a 6 semanas; a Postproxy fala em 2 a 4 semanas por permissão e em Tech Provider Verification de cerca de uma semana. Não se aplica ao caso de perfil próprio. — [Blotato](https://www.blotato.com/blog/threads-api-pricing), [Postproxy](https://postproxy.dev/blog/how-to-post-to-threads-via-api/)

### Inferences
- Caminho mínimo para o fundador: app com caso de uso "Access the Threads API" + permissões `threads_basic` e `threads_content_publish` (e `threads_manage_insights` se for medir desempenho) + o próprio perfil como Threads Tester com convite aceito. Sem App Review, sem verificação de empresa, sem Tech Provider.
- Passos que são **AÇÃO MANUAL** do fundador (não automatizáveis): (1) criar conta de desenvolvedor Meta e o app; (2) adicionar as permissões no caso de uso; (3) preencher Redirect Callback URL (HTTPS), Deauthorize e Data Deletion URLs; (4) adicionar o próprio @ como Threads Tester; (5) aceitar o convite no Threads em Settings > Account > Website permissions; (6) gerar o primeiro token (ver seção 4) e guardá-lo como segredo no servidor. Só seriam necessários, e apenas para servir terceiros: verificação de empresa, App Review e publicação do app.
- A dúvida sobre visibilidade tem evidência dos dois lados: a favor de "post normal e público", a frase oficial fala em "post to Threads for your account" sem ressalva de visibilidade e vários guias de 2026 operam automações reais só com token de tester; contra, o doc genérico de modos de app diz que dados gerados em Development "can only be seen by role users" (texto escrito para apps do Facebook, sem citar Threads). Se o teste mostrar posts invisíveis, o remédio provável é publicar o app pelo menu Publish (exige URL de política de privacidade), o que a doc descreve como separado do App Review para quem não é Tech Provider.

### Gaps
- **Não verificado:** se um post publicado por app não publicado (só tester) aparece para o público em geral. Nenhuma página da Threads API afirma isso de forma explícita e nenhum relato que li testou com conta de terceiro. Teste recomendado antes de ligar a automação: publicar um post e abrir o permalink em janela anônima e a partir de outra conta.
- Não confirmei se a conta dona/admin do app precisa mesmo assim ser adicionada como Threads Tester; a doc fala "your account and your app's tester accounts" e os guias sempre adicionam o próprio perfil.
- Não encontrei declaração oficial sobre Brasil (nem restrição, nem liberação explícita).
- O blog da Meta lista um post de 9/out/2026 intitulado "Retiring Access Verification for Tech Provider Apps" ([visto na listagem desta página](https://developers.facebook.com/blog/post/2026/04/14/whats-new-in-the-threads-api/)); não consegui abrir o conteúdo. Parece afetar só Tech Providers, mas não está confirmado.
- A doc de níveis de acesso se declara válida só para apps com "tipo de app"; a aplicação literal ao app de caso de uso do Threads é presumida, apoiada pela resposta do funcionário da Meta na issue #72.

## 4. Ciclo de vida do token

### Takeaway
O token de longa duração vale 60 dias e pode ser renovado por `th_refresh_token` desde que tenha pelo menos 24 horas e ainda não tenha expirado; se expirar, a única recuperação documentada é refazer a autorização manualmente. O painel do app tem um gerador de token para testers, mas as fontes divergem sobre ele já entregar token de longa duração.

### Cited Findings
- **[OFICIAL]** Janela de autorização: `https://threads.com/oauth/authorize?client_id=<THREADS_APP_ID>&redirect_uri=<REDIRECT_URI>&scope=<SCOPE>&response_type=code&state=<STATE>`; `scope` separado por vírgula; `threads_basic` é obrigatório. O código de autorização vale 1 hora e é de uso único. — [Get Access Tokens](https://developers.facebook.com/docs/threads/get-started/get-access-tokens-and-permissions)
- **[OFICIAL]** Troca do código: `POST https://graph.threads.com/oauth/access_token` com `client_id`, `client_secret`, `grant_type=authorization_code`, `redirect_uri`, `code`; resposta `{"access_token": "THQVJ...", "token_type": "bearer", "user_id": 17841405793187218}`. O campo `token_type` passou a vir nessa resposta em 12/ago/2026. — [Get Access Tokens](https://developers.facebook.com/docs/threads/get-started/get-access-tokens-and-permissions), [Changelog](https://developers.facebook.com/docs/threads/changelog)
- **[OFICIAL]** Token curto: "By default, Threads user access tokens are short-lived and are valid for one hour." — [Long-Lived Tokens](https://developers.facebook.com/documentation/threads/get-started/long-lived-tokens.md)
- **[OFICIAL]** Troca por longa duração: `GET https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=<THREADS_APP_SECRET>&access_token=<SHORT_LIVED_ACCESS_TOKEN>`; resposta com `access_token`, `token_type: "bearer"`, `expires_in: 5183944`. Deve ser feita no servidor porque leva o app secret. "Expired short-lived tokens cannot be exchanged for long-lived tokens." — [Long-Lived Tokens](https://developers.facebook.com/docs/threads/get-started/long-lived-tokens)
- **[OFICIAL]** Refresh: `GET https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=<LONG_LIVED_ACCESS_TOKEN>` (não usa app secret). Condições: "Long-lived tokens are valid for 60 days and can be refreshed" "as long as they are at least 24 hours old but have not expired" e "the app user has granted your app the `threads_basic` permission." Efeito: "Refreshed tokens are valid for 60 days from the date at which they are refreshed." — [Long-Lived Tokens](https://developers.facebook.com/documentation/threads/get-started/long-lived-tokens.md)
- **[OFICIAL]** Expiração: "Tokens that have not been refreshed in 60 days will expire" "and can no longer be refreshed." — [Long-Lived Tokens](https://developers.facebook.com/documentation/threads/get-started/long-lived-tokens.md)
- **[OFICIAL]** A resposta do refresh traz um campo `access_token`; a doc não diz se a string é igual à enviada. — [Long-Lived Tokens](https://developers.facebook.com/docs/threads/get-started/long-lived-tokens)
- **[OFICIAL]** Inspeção programática: `GET /debug_token` (v1.0) com `access_token` (token de um Threads tester do mesmo app) e `input_token`; retorna `type`, `application`, `user_id`, `issued_at`, `expires_at`, `data_access_expires_at`, `is_valid`, `scopes`. — [Debug Access Token](https://developers.facebook.com/documentation/threads/troubleshooting/debug-access-token.md)
- **[OFICIAL]** Para testes, a Meta indica o Graph API Explorer: "While you are testing, you can easily generate tokens and grant your app permissions by using the Graph API Explorer." — [Create Posts](https://developers.facebook.com/documentation/threads/create-posts.md)
- **[OFICIAL]** O app de exemplo da Meta faz a troca `th_exchange_token`, lê `debug_token` e `me/threads_publishing_limit`; a busca no código não encontrou chamada de refresh. Último commit em 24/mar/2026; repositório não arquivado. O README avisa: "OAuth redirects are only supported over HTTPS" e que apps do Threads não aceitam redirect para `localhost`. — [src/index.js](https://github.com/fbsamples/threads_api/blob/main/src/index.js), [commit 854fc14](https://github.com/fbsamples/threads_api/commit/854fc140a37e20f6a7086cf3ee0065f99d41f646), [README](https://github.com/fbsamples/threads_api)
- **[RELATO]** Existe um "User Token Generator" na página Settings do caso de uso do Threads, com botão "Generate Access Token" ao lado de cada tester aceito; o token é exibido uma única vez. Divergência sobre a duração: "issues long-lived tokens directly" e tentar trocar esse token gera erro 452 — [DEV Community](https://dev.to/hyojunlim/the-7-errors-everyone-hits-setting-up-the-threads-api-and-the-exact-fixes-2bl1); contradito por "what you get here is a short-lived token", com troca posterior via `th_exchange_token` — [note.com/kazu_t](https://note.com/kazu_t/n/n6d1df495dde8?hl=en)
- **[RELATO]** Em issue de 23/set/2026, um serviço em produção descreve "a long-lived token generated directly in the Meta dashboard" que passou em `/me` e `/debug_token`. — [fbsamples/threads_api issue #75](https://github.com/fbsamples/threads_api/issues/75)
- **[RELATO]** Alternativa pelo Graph API Explorer: trocar o domínio para threads.net, escolher o app e clicar em "Generate Threads Access Token" (set/2026). — [GenApe](https://genape.ai/blog/threads-autopost-api-guide), [Postiz](https://docs.postiz.com/providers/threads)
- **[RELATO]** Incidente de 23/set/2026: tokens recém-emitidos falhavam com HTTP 500 em `/me` e em `th_exchange_token`, enquanto tokens antigos seguiam funcionando; contributor da Meta respondeu "we did have an issue that was affecting the Threads API authorization process, which is now resolved"; alguns só normalizaram removendo e reconectando o app em `threads.com/settings/website_permissions`. — [fbsamples/threads_api issue #75](https://github.com/fbsamples/threads_api/issues/75)
- **[RELATO]** Causas de invalidação citadas por fornecedores: revogação do acesso, troca de senha, checagens de segurança (mensagens `revoked_access_token`, `token is invalid`, `session has been invalidated`); correção indicada: reconectar a conta. — [bundle.social errors](https://bundle.social/threads-api/errors)
- **[RELATO]** "If you miss the window, the user needs to re-authenticate." (mar/2026) — [Postproxy](https://postproxy.dev/blog/how-to-post-to-threads-via-api/)

### Inferences
- Para rodar sem humano: guardar o token de longa duração no servidor, renová-lo por cron bem antes do dia 60 (por exemplo semanalmente; a única restrição é ter mais de 24 h) e sempre persistir o `access_token` devolvido pelo refresh, já que a doc não garante que a string se mantém.
- Como o perfil é público, cada refresh também renova a concessão de permissão de 90 dias; em perfil privado isso é incerto, pois as duas páginas oficiais se contradizem em parte.
- O fluxo OAuth com redirect pode ser evitado no setup inicial usando o gerador do painel ou o Graph API Explorer; conferir a duração real com `debug_token` (`expires_at`) e, se for curto (1 h), fazer a troca `th_exchange_token` na mesma hora.
- Vale ter alerta quando `expires_at` estiver a menos de 15 dias ou quando o refresh falhar: a recuperação de token expirado é manual.
- O incidente de setembro/2026 mostra que renovar um token existente é mais robusto do que depender de reautorização.

### Gaps
- A documentação da Threads API não lista os eventos que invalidam um token (troca de senha, remoção em Website permissions, mudança no app); só há relatos de fornecedores.
- "User Token Generator" não aparece em nenhuma página oficial que li; existência e comportamento vêm de relatos, e a duração do token gerado é contraditória entre as fontes.
- Não confirmei se o refresh devolve uma string nova ou a mesma.
- Não achei regra oficial sobre o `data_access_expires_at` para contas com papel no app.

## 5. Limites de taxa e quotas

### Takeaway
O limite é de 250 posts publicados via API por perfil em janela móvel de 24 horas (1.000 respostas, 100 exclusões), além de um teto de chamadas proporcional às impressões da conta. Um post por dia usa 0,4% da quota de publicação.

### Cited Findings
- **[OFICIAL]** "Threads profiles are limited to 250 API-published posts within a 24-hour moving period."; carrossel conta como um post; o limite é aplicado no endpoint de publish. — [Overview](https://developers.facebook.com/docs/threads/overview)
- **[OFICIAL]** "Threads profiles are limited to 1,000 replies within a 24-hour moving period."; 100 exclusões e 500 buscas de localização na mesma janela. — [Overview](https://developers.facebook.com/docs/threads/overview)
- **[OFICIAL]** Teto de chamadas: "Calls within 24 hours = 4800 * Number of Impressions"; "The minimum value for impressions is 10."; há também limites de CPU (`720000 * number_of_impressions` para `total_cputime` e `2880000 * Number of Impressions` para `total_time`). — [Overview](https://developers.facebook.com/docs/threads/overview)
- **[OFICIAL]** Consulta de quota: `GET /{threads-user-id}/threads_publishing_limit` com campos `quota_usage`, `config` (`quota_total`, `quota_duration`), `reply_quota_usage`, `reply_config`, `delete_quota_usage`, `delete_config`, `location_search_quota_usage`, `location_search_config`. Publicação exige `threads_basic` + `threads_content_publish`. — [Overview](https://developers.facebook.com/docs/threads/overview), [Troubleshooting](https://developers.facebook.com/docs/threads/troubleshooting)
- **[OFICIAL]** Platform Terms 7.e.iii: a Meta pode suspender o acesso de um app a qualquer API, permissão ou recurso não usado por 28 dias, "com ou sem aviso prévio a você". — [Platform Terms](https://developers.facebook.com/terms/)

### Inferences
- Com o piso de 10 impressões, o mínimo é 48.000 chamadas por 24 h; o volume de uma automação diária (publicar, checar status, ler insights, renovar token) fica ordens de grandeza abaixo.
- Postagem diária mantém o app em uso e afasta a regra dos 28 dias de inatividade.

### Gaps
- Nenhuma lacuna relevante para o caso de uso.

## 6. Requisitos de mídia

### Takeaway
A mídia precisa estar em URL pública no momento da chamada, porque a Meta baixa o arquivo; imagens em JPEG ou PNG de até 8 MB, largura de 320 a 1440 px e proporção de até 10:1.

### Cited Findings
- **[OFICIAL]** "We will cURL your image using the URL provided so it must be on a public server." — [Posts](https://developers.facebook.com/documentation/threads/posts.md); "the media must be hosted on a publicly accessible server at the time of the attempt." — [Get Started](https://developers.facebook.com/docs/threads/get-started)
- **[OFICIAL]** Imagem: "JPEG and PNG image types are the officially supported formats for image posts."; "8 MB maximum."; proporção máxima 10:1; largura mínima 320 (ampliada se menor) e máxima 1440 (reduzida se maior); espaço de cor sRGB (outros são convertidos). — [Overview](https://developers.facebook.com/docs/threads/overview)
- **[OFICIAL]** Vídeo: MOV ou MP4, "moov atom at the front of the file"; HEVC ou H264; áudio AAC até 48 kHz; 23 a 60 FPS; largura máxima 1920; proporção entre 0.01:1 e 10:1 (9:16 recomendado); "300 seconds (5 minutes) maximum"; "1 GB maximum". — [Overview](https://developers.facebook.com/docs/threads/overview)
- **[OFICIAL]** `alt_text`: "The maximum length of `alt_text` is 1,000 characters." — [Reference: Publishing](https://developers.facebook.com/documentation/threads/reference/publishing.md)
- **[RELATO]** Falha intermitente ao baixar imagem válida: code 1, `error_subcode` 2207052, "Media download has failed"; resolvido repetindo a criação do container com URL assinada nova (10/set/2026). — [deepakness.com](https://deepakness.com/raw/threads-api-publishing-fix/)
- **[RELATO]** A publicação busca a mídia por crawler da Meta no servidor; bloqueio de crawler (firewall, hotlink protection) causa falha. — [Ayrshare](https://www.ayrshare.com/apis/post/social-networks/threads)

### Inferences
- Imagens servidas pelo domínio do próprio SaaS funcionam, desde que a rota seja pública, sem autenticação e sem bloqueio de bots; URLs assinadas precisam continuar válidas até o publish.
- WebP e AVIF não estão entre os formatos oficialmente suportados: converter para JPEG ou PNG antes de enviar.

### Gaps
- Não encontrei lista oficial de user-agent ou faixas de IP do crawler de mídia do Threads.

## 7. Política e conformidade (automação, conteúdo promocional, IA, spam, risco)

### Takeaway
Nenhum termo consultado proíbe publicar automaticamente, via API oficial, conteúdo próprio e promocional no próprio perfil; o que a Meta trata como spam é frequência "very high", conteúdo repetitivo e links enganosos. Não achei obrigação de rotular post automatizado nem parâmetro de rótulo de IA na API, mas não consegui ler os Termos de Uso do Threads.

### Cited Findings
- **[OFICIAL]** Meta Platform Terms (pt-BR, "Última atualização em 3 de fevereiro de 2026"): não há regra geral contra bots ou postagem automatizada; não há cláusula sobre conteúdo gerado por IA; a seção 3.a lista práticas proibidas ligadas a uso de dados (discriminação, vigilância, venda de Platform Data). — [Platform Terms](https://developers.facebook.com/terms/)
- **[OFICIAL]** Platform Terms 7.e: a Meta pode agir contra o app "segundo nossos próprios critérios", a qualquer momento, com ou sem aviso, inclusive com suspensão ou remoção permanente de apps e conta; o monitoramento "pode ser automatizado ou manual". — [Platform Terms](https://developers.facebook.com/terms/)
- **[OFICIAL]** Developer Policies (pt-BR, atualizadas em 3/fev/2026): "Não confunda, engane, defraude, iluda, surpreenda ou envie spam aos usuários."; "Obtenha o consentimento das pessoas para publicar conteúdo ou realizar qualquer outra ação em nome delas."; "Enviar spam conforme definido nos Padrões da Comunidade não é permitido."; a página não traz política específica do Threads nem regra de divulgação de IA. — [Developer Policies](https://developers.facebook.com/devpolicy/)
- **[OFICIAL]** Padrão da Comunidade sobre spam: "We do not allow content that is designed to deceive, mislead, or overwhelm users"; é proibido "Posting, sharing, engaging with content or creating accounts, Groups, Pages, Events or other assets, either manually or automatically, at very high frequencies."; "posting repetitive content" aparece como sinal que leva a restrição mesmo em frequência menor; "Misleading Links": "Content containing a link that promises one type of content but delivers something substantially different."; também são vedados exigir engajamento e oferecer valor monetário em troca de engajamento. A página não cita o Threads nem dá limiar numérico. — [Meta Transparency Center: Spam](https://transparency.meta.com/en-us/policies/community-standards/spam/)
- **[OFICIAL]** A tabela de parâmetros de criação de post não tem campo de divulgação ou rótulo de IA. — [Reference: Publishing](https://developers.facebook.com/documentation/threads/reference/publishing.md)
- **[RELATO]** Cobertura de 2024 sobre a política de rótulos: a Meta aplica rótulo de IA em Facebook, Instagram e Threads quando detecta indicadores padrão da indústria ou quando o usuário declara; a obrigação de declarar foi anunciada para vídeo fotorrealista e áudio realista criados ou alterados digitalmente. Fontes antigas (fev e abr/2024). — [PetaPixel](https://petapixel.com/2024/04/09/meta-will-add-made-with-ai-labels-on-images-and-videos-next-month), [Gigazine](https://www.gigazine.net/gsc_news/en/20240207-meta-ai-generated-image-labeling)
- **[RELATO]** Fornecedor afirma que o Threads armazena o metadado de divulgação de IA de imagens mas não exibe rótulo. — [Ayrshare](https://www.ayrshare.com/apis/post/social-networks/threads)
- **[RELATO]** Bloqueio por suspeita de spam: bot que postava 2 imagens a cada hora em conta recém-criada e com poucos seguidores, após 2 dias funcionando, passou a receber `code: 1`, `error_subcode: 2207051`, `error_user_title: 'action is blocked'`, `error_user_msg: 'We restrict certain activity to protect our community. Tell us if you think we made a mistake.'`; tópico de cerca de 2024, sem resposta da Meta. — [Meta Developer Community](https://developers.secure.facebook.com/community/threads/495634376325323)
- **[RELATO]** Subcódigo 4279013 ("Threads account restricted") é tratado como falha permanente, sem retry; a restrição se resolve no app, pelo próprio usuário. — [bundle.social](https://bundle.social/blog/threads-posting-api), [bundle.social errors](https://bundle.social/threads-api/errors)

### Inferences
- Um post por dia pela API oficial está muito longe de "very high frequencies" (o próprio teto oficial é 250/dia). O risco realista vem do conteúdo: textos quase idênticos todo dia, sempre o mesmo link, conta nova com pouca atividade orgânica e chamadas que parecem engagement bait.
- Mitigações coerentes com a política: variar texto e formato, alternar posts sem link, garantir que o link entrega o que o texto promete e tratar 2207051 e 4279013 como "parar e avisar o dono", sem retry automático.
- Imagens geradas por IA podem receber rótulo automático se o arquivo carregar metadados C2PA/IPTC; texto gerado por IA não tem exigência de rótulo localizada.

### Gaps
- Não consegui carregar os Termos de Uso do Threads ([help.instagram.com/769983657850450](https://help.instagram.com/769983657850450) devolveu só o cabeçalho "Help Center") nem as Diretrizes da Comunidade do Instagram; não sei se há cláusula própria sobre automação ou uso comercial.
- Não achei texto oficial atual (2026) sobre obrigação de rotular conteúdo de IA no Threads; as fontes são de 2024.
- A página de spam não menciona o Threads; a aplicação ao Threads é presumida.
- Não há número oficial de frequência "segura"; os limiares que circulam em blogs não têm fonte e foram descartados.
- Não li regras sobre conteúdo de marca e divulgação de parceria paga (não se aplica a promover o próprio produto).

## 8. Mudanças recentes (changelog 2025–2026)

### Takeaway
A API segue em evolução ativa e nenhuma mudança de 2025–2026 restringiu o acesso para uso no próprio perfil; as relevantes para este caso são a publicação automática de texto (jun/2025), o limite de 5 links com erro explícito (dez/2025), o fim da exigência de Instagram vinculado (set/2025) e o `token_type` na troca de código (ago/2026).

### Cited Findings
- **[OFICIAL]** 2026 — 12/ago: "The short-lived access token response from the `POST /oauth/access_token` endpoint now includes `token_type`."; 21/abr: contas do Threads vinculadas a Página podem criar Threads ads; 25/mar: cross-share de post para Stories do Instagram (permissão `threads_share_to_instagram`); 19/mar e 22/jan: novos parâmetros de Post Intents; 3/mar: oEmbed sem access token; 27/fev: publicação de GIF via GIPHY, com suporte ao Tenor encerrado até 31/mar/2026; 13/fev: posts com aprovação de respostas; 30/jan: perfis sem Instagram vinculado acessam `followers_count` e `follower_demographics`; 26/jan: webhooks de reply/mention com `is_verified` e `profile_picture_url`; 20/jan: filtro por autor na busca. — [Changelog](https://developers.facebook.com/docs/threads/changelog)
- **[OFICIAL]** 2025 — 22/dez: posts com mais de 5 links falham com `THREADS_API__LINK_LIMIT_EXCEEDED` (aviso em 8/dez); 15/dez: ghost posts; 20/nov: limite de seguidores para profile discovery caiu de 1.000 para 100; 17/out: GIFs; 3/out: spoilers e text attachments; 23/set: API disponível para perfis sem Instagram vinculado; 15/ago: webhooks de publish; 1/ago: webhooks de delete; 15/jul: webhooks de menções; 14/jul: `topic_tag`, profile discovery e quotas de exclusão/localização no endpoint de limite; 7/jul: `reply_control` ganhou `parent_post_author_only` e `followers_only`; 2/jul: métrica `clicks`; 6/jun: `graph.threads.com` além de `graph.threads.net`; 4/jun: debug programático de token e publicação automática de posts de texto; 27/mai: localização; 14/abr: enquetes; 6/mar: exclusão de posts. — [Changelog](https://developers.facebook.com/docs/threads/changelog)
- **[OFICIAL]** Marcos de 2024 ainda vigentes: 18/jun: API aberta a todos os desenvolvedores; 7/jun: `graph.threads.net` exige `v1.0` e token do Threads; 21/ago: alt text; 12/set: anexo de link simplificado; 19/set: carrossel com até 20 itens; 9/dez: coleção Postman. — [Changelog](https://developers.facebook.com/docs/threads/changelog)
- **[OFICIAL]** Resumo da Meta em 14/abr/2026: text attachments de "up to 10,000 characters", ghost posts, spoilers, GIFs, oEmbed sem token, reply approvals e webhooks; nenhuma depreciação nem permissão nova anunciada no post. — [Meta for Developers blog](https://developers.facebook.com/blog/post/2026/04/14/whats-new-in-the-threads-api/)
- **[OFICIAL]** Coleção Postman oficial em [postman.com/meta/threads](https://www.postman.com/meta/threads/overview), com as áreas Authorization, Posting to Threads, Reading and managing, Discovering, Displaying e Troubleshooting; a Meta avisa que pode não cobrir os recursos mais recentes. — [Postman Collection](https://developers.facebook.com/documentation/threads/tools-and-resources/postman-collection.md)

### Inferences
- A entrada mais recente do changelog que li é de 12/ago/2026: dois meses sem entrada nova até a data da pesquisa.
- Se o post diário um dia exceder 500 caracteres, `text_attachment` (até 10.000) é a saída oficial; se quiser confirmação assíncrona de publicação, existe webhook de publish, mas a doc diz que o app precisa estar publicado para receber webhooks.

### Gaps
- Não abri as páginas de polls, spoilers, text attachments, ghost posts e webhooks (fora do caso de uso imediato).
- Conteúdo do post "Retiring Access Verification for Tech Provider Apps" (9/out/2026) não lido.

## 9. Exemplo funcional (curl), respostas e erros a tratar

### Takeaway
Os cinco exemplos abaixo seguem a documentação oficial com placeholders; o mínimo viável para texto com link é uma chamada só. Os erros com tratamento obrigatório são link excedido, container em `ERROR`/`EXPIRED`, token inválido e conta restrita.

### Cited Findings
- **[OFICIAL]** (1) Post de texto com link — criar o container. O exemplo oficial tem um erro de digitação (falta fechar a aspa depois de `<URL>`); abaixo está corrigido. — [Posts](https://developers.facebook.com/documentation/threads/posts.md)

```bash
curl -i -X POST \
  -d "media_type=TEXT" \
  -d "text=<TEXT>" \
  -d "link_attachment=<URL>" \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads"
# resposta: { "id": "<THREADS_MEDIA_CONTAINER_ID>" }
```

- **[OFICIAL]** (2) Post de imagem — criar o container. — [Posts](https://developers.facebook.com/documentation/threads/posts.md)

```bash
curl -i -X POST \
  -d "media_type=IMAGE" \
  -d "image_url=<IMAGE_URL>" \
  -d "text=<TEXT>" \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads"
# resposta: { "id": "<THREADS_MEDIA_CONTAINER_ID>" }
```

- **[OFICIAL]** Checagem de status antes de publicar (recomendada para mídia). — [Troubleshooting](https://developers.facebook.com/docs/threads/troubleshooting)

```bash
curl -s -X GET \
  "https://graph.threads.net/v1.0/<MEDIA_CONTAINER_ID>?fields=status,error_message&access_token=<THREADS_ACCESS_TOKEN>"
# pronto: { "status": "FINISHED", "id": "17889615691921648" }
# falha:  { "status": "ERROR", "id": "17889615691921648", "error_message": "FAILED_DOWNLOADING_VIDEO" }
```

- **[OFICIAL]** (3) Publicar o container. — [Posts](https://developers.facebook.com/documentation/threads/posts.md)

```bash
curl -i -X POST \
  -d "creation_id=<MEDIA_CONTAINER_ID>" \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads_publish"
# resposta: { "id": "<THREADS_MEDIA_ID>" }
```

- **[OFICIAL]** (4) Renovar o token de longa duração. — [Long-Lived Tokens](https://developers.facebook.com/docs/threads/get-started/long-lived-tokens)

```bash
curl -i -X GET "https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=<LONG_LIVED_ACCESS_TOKEN>"
# resposta:
# { "access_token": "<LONG_LIVED_USER_ACCESS_TOKEN>", "token_type": "bearer", "expires_in": 5183944 }
```

- **[OFICIAL]** (5) Ler a quota de publicação. O exemplo da página Overview traz a URL malformada (`https:graph.threads.net`); a forma abaixo é a da página Troubleshooting. — [Troubleshooting](https://developers.facebook.com/docs/threads/troubleshooting), [Overview](https://developers.facebook.com/docs/threads/overview)

```bash
curl -s -X GET \
  "https://graph.threads.net/v1.0/<THREADS_USER_ID>/threads_publishing_limit?fields=quota_usage,config,reply_quota_usage,reply_config,delete_quota_usage,delete_config,location_search_quota_usage,location_search_config&access_token=<THREADS_ACCESS_TOKEN>"
# resposta:
# { "data": [ { "quota_usage": 0, "config": { "quota_total": 250, "quota_duration": 86400 },
#   "reply_quota_usage": 0, "reply_config": { "quota_total": 1000, "quota_duration": 86400 },
#   "delete_quota_usage": 0, "delete_config": { "quota_total": 100, "quota_duration": 86400 },
#   "location_search_quota_usage": 0, "location_search_config": { "quota_total": 500, "quota_duration": 86400 } } ] }
```

- **[OFICIAL]** Erros de container (campo `error_message` quando `status=ERROR`): `FAILED_DOWNLOADING_VIDEO`, `FAILED_PROCESSING_AUDIO`, `FAILED_PROCESSING_VIDEO`, `INVALID_ASPEC_RATIO`, `INVALID_BIT_RATE`, `INVALID_DURATION`, `INVALID_FRAME_RATE`, `INVALID_AUDIO_CHANNELS`, `INVALID_AUDIO_CHANNEL_LAYOUT`, `UNKNOWN`. — [Troubleshooting](https://developers.facebook.com/docs/threads/troubleshooting)
- **[OFICIAL]** Erro de limite de links na criação do container: `THREADS_API__LINK_LIMIT_EXCEEDED`. — [Changelog](https://developers.facebook.com/docs/threads/changelog)
- **[OFICIAL]** Erro do endpoint de token (formato plano, sem o envelope `error`): `{"error_type": "OAuthException", "code": 400, "error_message": "Matching code was not found or was already used"}`; se o usuário cancela a autorização, o redirect traz `error_reason=user_denied`. — [Get Access Tokens](https://developers.facebook.com/docs/threads/get-started/get-access-tokens-and-permissions)
- **[OFICIAL]** Funcionário da Meta: publicar antes de o container estar `FINISHED` gera "The requested resource does not exist" (`code` 24, `error_subcode` 4279009, `is_transient: false`); a orientação é consultar o status e só então chamar `POST /me/threads_publish`. — [fbsamples/threads_api issue #70](https://github.com/fbsamples/threads_api/issues/70)
- **[RELATO]** Erros vistos na prática: `code` 100 / `error_subcode` 33 "Object with ID ... does not exist" (ID errado; usar o `id` de `/me`); `code` 1 / `error_subcode` 2207052 "Media download has failed" (retry com URL nova); `code` 190 "Invalid OAuth access token - Cannot parse access token" (token colado com chaves ou quebra de linha); `code` 452 / `error_subcode` 4279019 "Session key invalid..." na troca de token (uso do app secret comum em vez do Threads app secret, ou tentativa de trocar token que já é longo). — [deepakness.com](https://deepakness.com/raw/threads-api-publishing-fix/), [DEV Community](https://dev.to/hyojunlim/the-7-errors-everyone-hits-setting-up-the-threads-api-and-the-exact-fixes-2bl1)
- **[RELATO]** Envelope de erro no estilo Graph observado em produção: `{"error":{"message":"An unknown error has occurred.","type":"OAuthException","code":1,"fbtrace_id":"..."}}`. — [fbsamples/threads_api issue #75](https://github.com/fbsamples/threads_api/issues/75)
- **[RELATO]** "Meta can publish a container and still hand you a 500."; antes de repetir o publish, reler o status do container e parar se já estiver `PUBLISHED`, senão o post sai duplicado. — [bundle.social](https://bundle.social/blog/threads-posting-api), [Outstand](https://www.outstand.so/blog/threads-api)

### Inferences
- Variante em um passo para texto, montada a partir da tabela de parâmetros (não é exemplo literal da doc): acrescentar `-d "auto_publish_text=true"` ao exemplo (1) e dispensar o (3); segundo o app de exemplo, o `id` devolvido já é o do post.
- O alias `me` funciona no lugar do ID numérico: o app de exemplo chama `me/threads_publishing_limit` e o funcionário da Meta cita `POST /me/threads_publish`. Isso evita a armadilha do `user_id` devolvido na troca de código.
- Com `auto_publish_text` não há container para consultar antes de repetir; em caso de timeout ou 500, verificar os posts recentes do perfil (endpoint de leitura dos próprios posts) antes de tentar de novo.
- Sempre registrar o corpo completo da resposta de erro (`code`, `error_subcode`, `fbtrace_id`): os relatos mostram que a mensagem curta engana.
- Preferir enviar o token no corpo (`-d`) ou em header quando possível, para não deixá-lo em logs de URL; os exemplos oficiais de GET usam query string.

### Gaps
- A Meta não publica uma tabela oficial de códigos e subcódigos de erro da Threads API; os números acima (33, 2207051, 2207052, 4279009, 4279013, 4279019) vêm de relatos e de uma resposta de funcionário, sem referência oficial consolidada.
- Não executei nenhuma chamada real; os exemplos são reprodução da documentação.
- Não há exemplo oficial de sucesso para `auto_publish_text`.

## 10. Insights (métricas por post)

### Takeaway
Sim: com `threads_manage_insights` a API lê por post `views`, `likes`, `replies`, `reposts`, `quotes` e `shares`. Cliques em link não existem por post; a métrica `clicks` é do nível do perfil e vem quebrada por URL.

### Cited Findings
- **[OFICIAL]** Por post: `GET /{threads-media-id}/insights` com `metric` em lista separada por vírgula; "Values: `views`, `likes`, `replies`, `reposts`, `quotes`, `shares`."; `views` e `shares` aparecem marcadas como "in development"; as métricas não incluem respostas aninhadas; reposts de terceiros (`REPOST_FACADE`) retornam array vazio. — [Insights](https://developers.facebook.com/docs/threads/insights), [Reference: Insights](https://developers.facebook.com/documentation/threads/reference/insights.md)
- **[OFICIAL]** Por perfil: `GET /{threads-user-id}/threads_insights` com `metric` obrigatório e `since`/`until` opcionais (timestamps Unix); métricas `views`, `likes`, `replies`, `reposts`, `quotes`, `clicks`, `followers_count`, `follower_demographics` (esta exige ao menos 100 seguidores e um `breakdown`). Sem `since`/`until`, o intervalo padrão é de ontem até hoje. — [Insights](https://developers.facebook.com/docs/threads/insights)
- **[OFICIAL]** `clicks` é devolvida como `link_total_values`, um array com `value` e `link_url`. — [Insights](https://developers.facebook.com/docs/threads/insights)
- **[OFICIAL]** Permissões: `threads_basic` + `threads_manage_insights` ("Required for making GET calls to insights endpoints."). — [Get Started](https://developers.facebook.com/docs/threads/get-started)
- **[OFICIAL]** Limites: `since`/`until` não aceitam datas anteriores a 13/abr/2024 (timestamp 1712991600); insights de usuário não são garantidos antes de 1/jun/2024. — [Insights](https://developers.facebook.com/docs/threads/insights)
- **[OFICIAL]** Changelog de 2/jul/2025 descreve `clicks` como contagem de cliques em URLs de posts; a referência a lista apenas nos insights de usuário. — [Changelog](https://developers.facebook.com/docs/threads/changelog), [Reference: Insights](https://developers.facebook.com/documentation/threads/reference/insights.md)
- **[OFICIAL]** Formato da resposta de mídia: array `data` em que cada item tem `name`, `period`, `values`, `title`, `description`, `id`. — [Insights](https://developers.facebook.com/docs/threads/insights)

### Inferences
- Para atribuir cliques a cada post, usar uma URL distinta por post (por exemplo, parâmetro UTM diferente): como `clicks` vem agregada por `link_url`, a URL única funciona como chave do post. A medição no próprio site via UTM é a fonte mais confiável.
- Guardar o `id` retornado na publicação é pré-requisito para consultar insights por post depois.

### Gaps
- Não reproduzi o JSON completo de exemplo de insights de mídia (a referência não traz bloco de código).
- Não confirmei a latência nem a janela de retenção das métricas por post.
- "in development" para `views` e `shares` não vem com explicação sobre confiabilidade.

## 11. Armadilhas relatadas por desenvolvedores (2025–2026)

### Takeaway
Os problemas recorrentes são de configuração (par de credenciais errado, convite de tester não aceito, ID de usuário errado, formulário de redirect que não salva) e de tempo (publicar antes de o container ficar pronto, esquecer o refresh de 60 dias). Não encontrei relato de app desativado por postar uma vez por dia.

### Cited Findings
- **[RELATO]** Dois pares de credenciais: os endpoints do Threads só aceitam Threads App ID e Threads App Secret, que não são o App ID/secret comuns do app; usar o par errado gera erro 452 na troca. — [DEV Community](https://dev.to/hyojunlim/the-7-errors-everyone-hits-setting-up-the-threads-api-and-the-exact-fixes-2bl1); o README oficial confirma que as credenciais do Threads "ARE not the same as the regular app ID and app secret" — [fbsamples/threads_api](https://github.com/fbsamples/threads_api)
- **[RELATO]** Host errado: usar `graph.facebook.com` é "a common early mistake"; o correto é `graph.threads.net`. — [Postproxy](https://postproxy.dev/blog/how-to-post-to-threads-via-api/)
- **[RELATO]** O `user_id` devolvido na troca do código pode não ser aceito como alvo de publicação (code 100 / subcode 33); consultar `/me?fields=id,username` e usar esse `id`. A mensagem de "missing permissions" que acompanha o code 100 é texto padrão e engana. — [deepakness.com](https://deepakness.com/raw/threads-api-publishing-fix/)
- **[RELATO]** O gerador de token não lista a conta enquanto o convite de tester não for aceito em Settings > Account > Website permissions; outros erros de setup: "Does not match tester profile" (logado no Threads com a conta errada) e "Suspicious login attempt detected" (desligar VPN e aprovar o login no celular). — [DEV Community](https://dev.to/hyojunlim/the-7-errors-everyone-hits-setting-up-the-threads-api-and-the-exact-fixes-2bl1), [note.com/kazu_t](https://note.com/kazu_t/n/n6d1df495dde8?hl=en)
- **[RELATO]** Duas issues abertas e sem resposta em mai/2026: o formulário "Redirect Callback URLs" das configurações do Threads devolve "Form can't be saved" com qualquer URL. — [issue #73](https://github.com/fbsamples/threads_api/issues/73), [issue #74](https://github.com/fbsamples/threads_api/issues/74)
- **[RELATO]** O mesmo formulário só salva se as URLs de Uninstall/Delete estiverem preenchidas e se a redirect URI for "ativada" com um clique. — [Postiz](https://docs.postiz.com/providers/threads)
- **[RELATO]** Token esquecido: o bot "dies quietly on day 61"; sugestão de lembrete por volta do dia 55 ou refresh automático. — [DEV Community](https://dev.to/hyojunlim/the-7-errors-everyone-hits-setting-up-the-threads-api-and-the-exact-fixes-2bl1)
- **[RELATO]** Código reaproveitado do Instagram envia `caption`, que o Threads ignora; o campo certo é `text`. — [bundle.social](https://bundle.social/blog/threads-posting-api)
- **[RELATO]** A primeira leitura de status logo após criar o container pode dar 404 por propagação; falhar só depois de várias tentativas seguidas. — [Outstand](https://www.outstand.so/blog/threads-api)
- **[RELATO]** O limite de 5 links quebrou integrações que funcionavam, sem mudança do lado do desenvolvedor. — [Blotato](https://www.blotato.com/blog/threads-api-pricing)
- **[RELATO]** Instabilidade do lado da Meta em 23/set/2026 (HTTP 500 para tokens novos), confirmada e depois dada como resolvida por contributor da Meta; relatos de persistência por horas, inclusive na Europa; a ferramenta de bugs da Meta não aceita mais relatos do Threads, segundo um dos afetados. — [fbsamples/threads_api issue #75](https://github.com/fbsamples/threads_api/issues/75)
- **[RELATO]** Em automações n8n: fixar um `creation_id` em vez de usar o retorno da etapa anterior, usar @ ou URL do perfil em vez do ID numérico, e usar token curto em produção. — [GenApe](https://genape.ai/blog/threads-autopost-api-guide)
- **[OFICIAL]** O app de exemplo oficial avisa que "all of the latest features may not be demonstrated in the sample app"; tinha 4 issues abertas na data da consulta. — [fbsamples/threads_api](https://github.com/fbsamples/threads_api)

### Inferences
- A parte frágil é o setup manual inicial no painel da Meta, cuja interface muda com frequência; depois de obtido um token de longa duração válido, a operação diária depende de três coisas: refresh em dia, tratamento de erro com log completo e imagem em URL pública estável.
- Existem bibliotecas e serviços que usam endpoints privados ou scrapers do Threads (a Blotato cita RapidAPI, EnsembleData e Data365 como "read-only, unofficial"); ficam fora do escopo por violarem os termos e não foram avaliados.

### Gaps
- Não encontrei perguntas relevantes no Stack Overflow nem tópicos do Reddit sobre a Threads API em 2025–2026; os relatos vieram de GitHub, fórum da Meta e blogs.
- Não achei relato documentado de app do Threads desativado por baixa frequência de postagem, nem estatística de restrição de contas que usam a API oficial.
- A maioria dos blogs citados é de fornecedores que vendem alternativas à API direta; o viés comercial deles puxa para exagerar a dificuldade do caminho oficial.
