# Noivar — Runbook de produção

Checklist para colocar o SaaS no ar. As Fases 1–9 (código) estão feitas; falta a
infraestrutura (Fase 0), que depende das suas contas.

## 0. Pré-requisitos de infraestrutura (fazer antes do deploy)

### 0.1 Supabase (banco + auth)
1. Crie um projeto em https://supabase.com.
2. No **SQL Editor**, rode as migrations em ordem:
   `0001_init.sql`, `0002_profiles_app_side.sql`, `0004_publish_fee.sql`,
   `0005_publish_guard.sql`, `0006_photos_bucket.sql`, `0007_security_hardening.sql`,
   `0008_coordinator_token.sql`, `0009_admin_allowlist.sql`,
   `0010_mercadopago_card_gifts.sql`.
   > Não existe `0003` — é só um salto de numeração; o schema fica completo sem ela.
3. Confira em **Authentication → Providers** que Email está habilitado. Para o fluxo
   sem confirmação de e-mail, desligue "Confirm email" (o cadastro entra direto); se
   mantiver ligado, o usuário confirma pelo e-mail antes de logar (ambos suportados).
4. Em **Project Settings → API**, copie `Project URL`, `anon public key` e
   `service_role key`.

### 0.2 AbacatePay (taxa de publicação — R$ 89,90 padrão / R$ 149,90 site feito pela IA, API v2)
1. **Rotacione** a chave que esteve no `.env` local (trate-a como comprometida).
2. Pegue a `API key` de produção (v2).
3. **Produtos da taxa** (a v2 cobra a partir de um produto; são dois). Se deixar
   `ABACATEPAY_PUBLISH_PRODUCT_ID` / `ABACATEPAY_AI_PRODUCT_ID` em branco, o app cria o
   produto automaticamente no 1º pagamento e loga o id. Recomendado, porém, criá-los uma
   vez e fixar os ids (com `ABACATEPAY_API_KEY` no `.env`):
   `node scripts/abacatepay-create-product.mjs padrao` (R$ 89,90) e
   `node scripts/abacatepay-create-product.mjs ia` (R$ 149,90).
   O preço do produto tem que bater com `src/lib/platform-data.ts`, senão o checkout recusa.
   > Migração de preço (out/2026): o produto antigo de R$ 149,90 que estava em
   > `ABACATEPAY_PUBLISH_PRODUCT_ID` pode virar o `ABACATEPAY_AI_PRODUCT_ID`; crie um
   > novo de R$ 89,90 para o padrão.
4. Configure a URL do webhook no painel:
   `https://SEU-DOMINIO/api/webhooks/abacatepay?webhookSecret=SEGREDO`
   (o `SEGREDO` precisa bater com `ABACATEPAY_WEBHOOK_SECRET`).
5. Opcional: ative o HMAC `X-Webhook-Signature` setando
   `ABACATEPAY_WEBHOOK_SIGNING_SECRET` (deixe vazio até confirmar o digest na doc).

### 0.2.1 Site feito pela IA (Claude)
1. Rode a migration `0016_ai_generations.sql` no SQL Editor.
2. Crie uma chave em https://platform.claude.com/settings/keys → `ANTHROPIC_API_KEY`.
   Cada geração usa o Claude Opus 5.5 (até 12 fotos + briefing), limitada a 3 por casamento.
3. A geração roda numa server action com `maxDuration = 300` (precisa do Fluid Compute,
   padrão em projetos novos da Vercel).

### 0.3 Mercado Pago (presentes no cartão — opcional, sem custódia)
O casal conecta a **própria** conta Mercado Pago por OAuth; a cobrança do cartão é
criada com o token dele, então o dinheiro cai direto na conta do casal e a Noivar
nunca custodia valor. Sem estas variáveis, o bloco do cartão nem aparece no painel
e o site segue só com Pix.
1. Crie uma aplicação em https://www.mercadopago.com.br/developers/panel/app —
   produto **Pagamentos online → Checkout Pro**, modelo de integração **Marketplace**.
   A conta da plataforma precisa estar com o cadastro (KYC) completo.
2. Copie **Client ID** e **Client Secret** → `MERCADOPAGO_CLIENT_ID` e
   `MERCADOPAGO_CLIENT_SECRET`.
3. Cadastre a **Redirect URI** da aplicação, exatamente igual (sem barra no fim):
   `https://SEU-DOMINIO/api/mercadopago/oauth/callback`
4. Em **Webhooks**, aponte a URL de notificação para
   `https://SEU-DOMINIO/api/webhooks/mercadopago`, assine os eventos de **pagamentos**
   e de **vínculo de aplicações**, e copie a **assinatura secreta** →
   `MERCADOPAGO_WEBHOOK_SECRET` (notificação sem assinatura válida é recusada).
5. Gere a chave que cifra os tokens no banco: `openssl rand -hex 32` →
   `MERCADOPAGO_TOKEN_ENCRYPTION_KEY`.
6. Defina `CRON_SECRET` (o Vercel manda `Authorization: Bearer` nos crons) — é o que
   protege `/api/cron/mercadopago-refresh`, que renova os tokens dos casais.
7. Opcional: se ativar **PKCE** em Detalhes da aplicação, defina também
   `MERCADOPAGO_PKCE=true` — os dois lados precisam combinar.

> Teste: pagamento feito com credenciais de teste **não dispara webhook**. Para
> exercitar o recebimento, use o botão **Simular** no painel de webhooks do MP.
> O token do casal dura 180 dias e o cron renova sozinho a partir de 30 dias.

### 0.4 Variáveis de ambiente (Vercel → Project → Settings → Environment Variables)
Veja `.env.example`. Necessárias:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `ABACATEPAY_API_KEY`, `ABACATEPAY_PUBLISH_PRODUCT_ID`, `ABACATEPAY_WEBHOOK_SECRET`
- `ABACATEPAY_WEBHOOK_SIGNING_SECRET` (opcional)
- `APP_URL` = URL pública real (ex.: `https://noivar.com.br`)
- Cartão (opcional): `MERCADOPAGO_CLIENT_ID`, `MERCADOPAGO_CLIENT_SECRET`,
  `MERCADOPAGO_TOKEN_ENCRYPTION_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`, `CRON_SECRET`,
  `MERCADOPAGO_CARD_FEE_PERCENT` (padrão 4.99), `MERCADOPAGO_MAX_INSTALLMENTS`
  (padrão 12), `MERCADOPAGO_PKCE` (só se ativado no painel do MP)

> **Quem paga os juros do parcelamento.** O repasse calculado pelo app cobre a taxa
> de processamento do Mercado Pago. Os juros das parcelas são pagos pelo convidado
> enquanto a conta do casal estiver no modo padrão ("parcelado comprador"). Se o
> casal ativar o parcelamento sem juros, esses juros passam a sair do valor dele —
> não existe API para ler essa configuração, então o painel avisa o casal e, se
> preferir eliminar o risco, use `MERCADOPAGO_MAX_INSTALLMENTS=1`.

### 0.5 Primeiro admin
Depois de criar sua conta no app, promova-a no SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'voce@exemplo.com';
```

## 1. Deploy
Merge da branch `feat/saas-production` na `main` (a Vercel publica `main`).
Gates locais antes do merge: `npm run typecheck && npm run lint && npm run test && npm run build`.

## 2. Smoke test (após o deploy)
1. **Cadastro** → cria conta e cai no onboarding.
2. **Onboarding** → cria o casamento (slug único) e vai ao editor.
3. **Editor** → edita nomes/mensagem/cor/chave Pix e **salva**.
4. **Publicar** → dashboard → "Publicar site — R$ 89,90" (R$ 149,90 se gerou pela IA em `/ia`) → paga no AbacatePay →
   volta com `?publicacao=paga` → "Publicar agora" → status `published`.
5. **Site público** → `/casamento/SEU-SLUG` renderiza os dados reais.
6. **RSVP** → confirmar presença no site → aparece em `/convidados`.
7. **Presente Pix** → gerar Pix copia-e-cola no site → aparece pendente em
   `/checkout` → "Marcar recebido".
8. **Presente no cartão** (se configurou o Mercado Pago) → painel → "Conectar
   Mercado Pago" → autorizar → volta com `?mp=conectado` → no site público,
   "Presentear" → aba "Cartão" → pagar → volta com `?presente=aprovado` e o
   presente aparece **pago** em `/checkout` (confirmado pelo webhook, sem clique).
9. **Admin** → `/admin` mostra métricas, usuários e casamentos.

## 3. Follow-ups conhecidos (pós-MVP)
- **Rate-limiting** das rotas públicas (`/api/rsvp`, `/api/messages`,
  `/api/pix/charge`) — hoje sem limite; um convidado mal-intencionado pode gerar
  registros pendentes em excesso. Requer infra (ex.: Upstash) na Vercel.
- **RSVP/recados nos 4 templates**: só o `classico-romantico` (rota de produção)
  está com RSVP ligado; os outros precisam do mesmo wiring (use a skill
  `propagar-template` com a prévia ao vivo).
- **Importador de presentes** (`GiftLinkImporter` + `/api/gifts/extract`): a rota
  já valida host (anti-SSRF) e exige login, mas o `redirect: follow` ainda pode
  seguir para IP privado num 3xx malicioso — endurecer com `redirect: manual` e
  revalidar cada hop antes de religar o componente ao editor.
- **Rate-limit do cartão**: `/api/gifts/card/checkout` cria uma preferência na conta
  do casal a cada clique. Tem valor mínimo (R$10), máximo (R$10.000) e exige site
  publicado + conexão ativa, mas ainda não tem limite por IP.
- **Estorno/chargeback no cartão**: o webhook marca o presente como `refunded`, mas
  quem resolve a disputa é o casal, direto no Mercado Pago (a conta é dele).
