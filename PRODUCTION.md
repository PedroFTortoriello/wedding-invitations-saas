# Vows — Runbook de produção

Checklist para colocar o SaaS no ar. As Fases 1–9 (código) estão feitas; falta a
infraestrutura (Fase 0), que depende das suas contas.

## 0. Pré-requisitos de infraestrutura (fazer antes do deploy)

### 0.1 Supabase (banco + auth)
1. Crie um projeto em https://supabase.com.
2. No **SQL Editor**, rode as migrations em ordem:
   `supabase/migrations/0001_init.sql`, `0002_profiles_app_side.sql`,
   `0004_publish_fee.sql`, `0005_publish_guard.sql`.
   > Não existe `0003` — é só um salto de numeração; o schema fica completo sem ela.
3. Confira em **Authentication → Providers** que Email está habilitado. Para o fluxo
   sem confirmação de e-mail, desligue "Confirm email" (o cadastro entra direto); se
   mantiver ligado, o usuário confirma pelo e-mail antes de logar (ambos suportados).
4. Em **Project Settings → API**, copie `Project URL`, `anon public key` e
   `service_role key`.

### 0.2 AbacatePay (taxa de publicação — R$ 149,90)
1. **Rotacione** a chave que esteve no `.env` local (trate-a como comprometida).
2. Pegue a `API key` de produção.
3. Configure a URL do webhook no painel:
   `https://SEU-DOMINIO/api/webhooks/abacatepay?webhookSecret=SEGREDO`
   (o `SEGREDO` precisa bater com `ABACATEPAY_WEBHOOK_SECRET`).
4. Opcional: ative o HMAC `X-Webhook-Signature` setando
   `ABACATEPAY_WEBHOOK_SIGNING_SECRET` (deixe vazio até confirmar o digest na doc).

### 0.3 Variáveis de ambiente (Vercel → Project → Settings → Environment Variables)
Veja `.env.example`. Necessárias:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `ABACATEPAY_API_KEY`, `ABACATEPAY_WEBHOOK_SECRET`
- `ABACATEPAY_WEBHOOK_SIGNING_SECRET` (opcional)
- `APP_URL` = URL pública real (ex.: `https://vows.com.br`)

### 0.4 Primeiro admin
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
4. **Publicar** → dashboard → "Publicar site — R$ 149,90" → paga no AbacatePay →
   volta com `?publicacao=paga` → "Publicar agora" → status `published`.
5. **Site público** → `/casamento/SEU-SLUG` renderiza os dados reais.
6. **RSVP** → confirmar presença no site → aparece em `/convidados`.
7. **Presente Pix** → gerar Pix copia-e-cola no site → aparece pendente em
   `/checkout` → "Marcar recebido".
8. **Admin** → `/admin` mostra métricas, usuários e casamentos.

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
- `/api/pix/simulate` é um echo de demonstração (nunca autoritativo) e ficou sem
  uso; pode ser removido.
