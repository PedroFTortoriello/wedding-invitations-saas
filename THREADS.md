# Noivar — Bot do Threads (operação)

Guia para pôr no ar e manter o post diário da Noivar no Threads pela API oficial.
**Nada aqui foi executado nem testado ainda**: é o roteiro. O porquê das escolhas está em
`reports/Automação de posts no Threads Noivar.md` (o "relatório").

Legenda: **MANUAL** = só você faz (painel, celular, segredos). *(doc oficial)* = conferido na
documentação da Meta em 14/10/2026. *(relato)* = a doc é omissa; vem de relatos de
desenvolvedores reunidos no relatório.

## 1. O que roda onde

```
PC do dono, 1x por semana                      Supabase (projeto da Noivar)
  Claude Code /threads-lote ──enfileirar──►      public.threads_posts
  você: fila · aprovar · descartar ───────►      draft ──► approved
                                                     │
VPS Linux, cron diário 08:00 (São Paulo)             │  1 post approved por dia;
  flock + node scripts/threads-bot.mjs publicar ◄────┘  grava published ou failed
    ├──► graph.threads.net   container → publish (API oficial)
    └──► hc-ping.com         /start, sucesso ou /fail (Healthchecks.io)
                               sem ping no prazo ou /fail ──► e-mail para você
```

| Peça | Onde fica |
|---|---|
| Fila, aprovação e histórico | tabela `public.threads_posts` (`draft` → `approved` → `publishing` → `published` ou `failed`) |
| Código | `scripts/threads-bot.mjs` (sem dependências); cópia em `/opt/noivar-threads/scripts/` |
| Segredos da VPS | `/opt/noivar-threads/.env` (600) |
| Token do Threads | `/opt/noivar-threads/threads-token.json` (600), só na VPS |
| Log | `/opt/noivar-threads/threads-bot.log` |
| Geração semanal | skill `.claude/skills/threads-lote/` (procedimento + `fatos.md`) |

| `node scripts/threads-bot.mjs …` | Onde | O que faz |
|---|---|---|
| `ajuda` (ou nada) | qualquer | lista os comandos |
| `token <TOKEN>` | VPS | valida o token, troca por longo se preciso e grava o arquivo |
| `teste "<texto>" [--link <url>]` | VPS | publica 1 post na hora, sem banco |
| `publicar [--simular]` | VPS (cron) | o job diário; `--simular` só lê e mostra |
| `fila [--n <N>] [--json]` | PC | últimos N posts (padrão 30) + aprovados restantes |
| `enfileirar <arquivo.json> [--checar] [--aprovado]` | PC | valida o lote inteiro e insere como `draft` |
| `aprovar <id...>` ou `aprovar --todos` | PC | `draft` → `approved` |
| `descartar <id...>` | PC | apaga o que ainda é `draft` |

Saída 0 = ok, 1 = falha. Os comandos que usam a tabela leem `NEXT_PUBLIC_SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY` do `.env` da pasta acima de `scripts/`: no PC, o `.env` do repo
(as mesmas variáveis do app); na VPS, `/opt/noivar-threads/.env`. Variável já definida no
ambiente vence o arquivo.

O `publicar`, em ordem:
1. ping `/start`; lê o token (vencido → falha; faltando menos de 30 dias → renova e grava antes de seguir);
2. linha presa em `publishing` há mais de 15 min → vira `failed` e o dia para, sem publicar;
   há menos de 15 min → outra execução está publicando, sai sem fazer nada;
3. já houve post hoje (dia de São Paulo) → `já publicado hoje`, sucesso;
4. pega o próximo `approved` com `scheduled_for` vazio ou até hoje (menor data primeiro, sem
   data por último) e o reserva (`publishing`, `attempts` + 1);
5. refaz as checagens duras (tamanho, URL no texto, link, `topic_tag`);
6. cria o container, espera 30 s, confere o status (até 5 vezes, de minuto em minuto),
   publica, busca o permalink e grava `published`;
7. ping de sucesso ou `/fail`. Erro depois da reserva grava `failed` com o erro completo na
   coluna `error`. O publish nunca é repetido sozinho.

## 2. Configuração na Meta (MANUAL)

Para publicar no próprio perfil não precisa de App Review, verificação de empresa nem publicar
o app: sem acesso avançado, o app "can only post to Threads for your account and your app's
tester accounts" *(doc oficial: [Create Posts](https://developers.facebook.com/documentation/threads/create-posts.md))*.
O painel muda com frequência; se um nome não bater, procure o equivalente.

1. **MANUAL — Perfil.** Confirme o perfil da Noivar no Threads e mantenha-o **público**: em
   perfil público, cada renovação do token estende a permissão por mais 90 dias; em perfil
   privado, não *(doc oficial: [Get Started](https://developers.facebook.com/docs/threads/get-started))*.
2. **MANUAL — Conta e app.** Em developers.facebook.com, crie a conta de desenvolvedor e um app
   com o caso de uso **Access the Threads API** *(doc oficial)*. Funciona com conta pessoal,
   marcando "Do not link a business portfolio" *(relato)*.
3. **MANUAL — Permissões.** Use cases → Customize: `threads_basic` já vem e não sai; clique
   **Add** em `threads_content_publish`. Opcional: `threads_manage_insights` (métricas no
   futuro; incluir agora evita gerar outro token depois) *(doc oficial:
   [Create an app](https://developers.facebook.com/documentation/threads/get-started/create-an-app.md))*.
4. **MANUAL — Credenciais e URLs.** Em **Settings** ficam o **Threads app ID** e o **Threads
   app secret**. O app tem dois pares de ID/secret, e a API do Threads usa o par do Threads, não
   o App ID/secret comuns *(doc oficial)*. Guarde o secret num cofre de senhas: só o §5 usa, e só
   se o token vier curto. Na mesma tela, preencha e salve:
   - redirect URI do OAuth (Client OAuth Settings / Redirect Callback URLs): `https://noivar.vercel.app/`
   - Deauthorize callback URL e Data Deletion Requests URL: `https://noivar.vercel.app/privacidade`

   O bot não usa esses endereços (não há fluxo OAuth com redirect). A doc não diz quais são
   obrigatórios; relatos dizem que o formulário só salva com as URLs de desinstalação e de
   exclusão preenchidas, que é preciso clicar em **Finish customization**, e há casos de "Form
   can't be saved" sem resposta da Meta desde maio de 2026 *(relato)*.
5. **MANUAL — Tester.** App roles → Roles → **Add People** → **Threads Tester** → o @ do perfil
   da Noivar no Threads *(doc oficial)*. Adicione mesmo sendo dono do app: a doc não esclarece se
   é preciso, e todos os guias fazem *(relato)*.
6. **MANUAL — Aceitar o convite.** No Threads (app ou site), logado no perfil da Noivar:
   **Settings → Account → Website permissions** → convite → aceitar *(doc oficial: seção
   "Website permissions" das configurações da conta)*. O painel pode levar horas para refletir
   *(relato)*.
7. **MANUAL — Gerar o token**, só com a VPS pronta (§4): se ele vier curto, vale 1 hora.
   Caminho relatado: Settings do caso de uso → **User Token Generator** → **Generate Access
   Token** ao lado do perfil tester; o token aparece uma vez só *(relato; a doc oficial não
   descreve esse gerador)*. Se o perfil não aparecer na lista, o convite do passo 6 ainda não foi
   aceito *(relato)*. A alternativa documentada é o Graph API Explorer, que a Meta indica para
   gerar tokens durante testes *(doc oficial: Create Posts)*. Relatos divergem se o token sai
   curto (1 h) ou longo (60 dias); o comando `token` descobre (§5). Não cole o token em arquivo
   do repo nem no chat do Claude Code.

## 3. Aplicar a migration (MANUAL)

1. Supabase → **SQL Editor** → nova query → cole `supabase/migrations/0015_threads_posts.sql`
   → **Run**. É idempotente (pode rodar de novo) e só depende de `public.set_updated_at()`, da `0001`.
2. Confira no mesmo editor:
   ```sql
   -- 17 colunas: id, created_at, updated_at, status, …, attempts, error
   select column_name, data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'threads_posts' order by ordinal_position;

   -- esperado: true, 0, false, false, true
   select c.relrowsecurity as rls,
          (select count(*) from pg_policies
            where schemaname = 'public' and tablename = 'threads_posts') as policies,
          has_table_privilege('anon', c.oid, 'select')          as anon,
          has_table_privilege('authenticated', c.oid, 'select') as authenticated,
          has_table_privilege('service_role', c.oid, 'select')  as service_role
     from pg_class c where c.oid = 'public.threads_posts'::regclass;
   ```
   O `service_role` = `true` vem do `grant` explícito da migration: a partir de 30/10/2026 a
   Supabase deixa de dar essa permissão sozinha a tabela nova do `public`
   ([changelog](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)).
3. No PC, na raiz do repo: `node scripts/threads-bot.mjs fila` deve listar zero posts. Se
   reclamar que a tabela não está no cache do PostgREST, rode `notify pgrst, 'reload schema';`
   no SQL Editor e repita.

## 4. Instalar na VPS

Supõe Debian/Ubuntu com systemd, cron e um usuário admin com `sudo` (logado como root num
Debian sem sudo: `apt install sudo`). A VPS precisa sair por HTTPS para `graph.threads.net`,
`<projeto>.supabase.co` e `hc-ping.com`.

### 4.1 Node 24 LTS (ou 22)

O script roda em Node ≥ 20, mas o **Node 20 chegou ao fim de vida em 30/04/2026** e não recebe
mais correções de segurança. Use o **24 LTS** (suporte até 30/04/2028) ou o **22 LTS** (até
30/04/2027), datas do cronograma oficial ([nodejs/Release](https://github.com/nodejs/Release));
o [nodejs.org](https://nodejs.org/en/about/previous-releases) já lista o 20 como EOL. Pela NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x -o /tmp/nodesource_setup.sh
sudo bash /tmp/nodesource_setup.sh
sudo apt install -y nodejs
node -v                  # v24.x
command -v node flock    # /usr/bin/node e /usr/bin/flock: o cron (§9) usa os caminhos completos
```

### 4.2 Usuário dedicado e pastas

```bash
sudo useradd --system --create-home --home-dir /opt/noivar-threads \
  --shell /usr/sbin/nologin noivar-threads
sudo chmod 700 /opt/noivar-threads
sudo install -d -o noivar-threads -g noivar-threads -m 700 /opt/noivar-threads/scripts
# atalho: todo comando do bot roda como noivar-threads (troque /usr/bin/node se o seu for outro)
echo "alias tbot='sudo -u noivar-threads /usr/bin/node /opt/noivar-threads/scripts/threads-bot.mjs'" >> ~/.bashrc
source ~/.bashrc
```

```
/opt/noivar-threads/          dono noivar-threads, 700
├── .env                      600, segredos do bot (§4.4)
├── threads-token.json        600, criado pelo comando token (§5)
├── threads-bot.log           saída do cron (§9)
├── publicar.lock             trava do flock (§9)
└── scripts/threads-bot.mjs
```

> Rode o bot **sempre** como `noivar-threads` (o `tbot` faz isso). Rodando como root, o
> `threads-token.json` fica do root e o cron não consegue lê-lo.

### 4.3 Copiar o script do Windows

No PowerShell, na raiz do repo:

```powershell
scp .\scripts\threads-bot.mjs usuario@IP-DA-VPS:/tmp/
```

Na VPS:

```bash
sudo install -o noivar-threads -g noivar-threads -m 644 /tmp/threads-bot.mjs /opt/noivar-threads/scripts/
rm /tmp/threads-bot.mjs
tbot ajuda
```

### 4.4 `.env` da VPS

```bash
sudo install -o noivar-threads -g noivar-threads -m 600 /dev/null /opt/noivar-threads/.env
sudo nano /opt/noivar-threads/.env
```

Formato `NOME=valor`, uma por linha, sem `export`:

```dotenv
# Noivar Threads bot — só estas variáveis. Nunca copie o .env do app para cá.
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
# Secret key do Supabase: de preferência uma sb_secret_... só do bot (abaixo).
# A service_role legada (eyJ...) também funciona.
SUPABASE_SERVICE_ROLE_KEY=
# Ping do Healthchecks.io: descomente no §8.
# HEALTHCHECK_URL=https://hc-ping.com/SEU-UUID
# Opcional; padrão: /opt/noivar-threads/threads-token.json
# THREADS_TOKEN_FILE=
```

`THREADS_APP_SECRET` não mora aqui: só o comando `token` usa, e só se o token vier curto (§5).

> **Atenção: `SUPABASE_SERVICE_ROLE_KEY` dá acesso total ao banco de produção** (casais,
> convidados, pagamentos) e ignora RLS. Crie uma secret key **só para o bot** (Supabase →
> Project Settings → API Keys → nova secret key, nome `threads-bot`): se a VPS vazar, você apaga
> só ela. A Supabase recomenda uma secret key por componente e está descontinuando as chaves
> legadas `anon`/`service_role` até o fim de 2026 ([API keys](https://supabase.com/docs/guides/api/api-keys)).
> **Nunca** leve para a VPS `MERCADOPAGO_TOKEN_ENCRYPTION_KEY` nem outro segredo do app
> (`MERCADOPAGO_*`, `ABACATEPAY_*`, `CRON_SECRET`, `META_CAPI_ACCESS_TOKEN`).

Teste de conexão (só leitura): `tbot fila --n 5`.

## 5. Token: primeira vez

Com o token do §2.7 em mãos (se for curto, você tem 1 hora):

```bash
read -rs -p 'Token: ' T; echo
tbot token "$T"; unset T
```

O `read -s` não mostra o token nem o deixa no histórico do shell. O comando valida o token em
`/me`, lê validade e emissão em `debug_token` e grava `/opt/noivar-threads/threads-token.json`
(600, escrita atômica, com `access_token`, `user_id`, `username`, `expires_at` e
`refreshed_at`). Nunca imprime o token. A saída mostra o @ do perfil, a data de expiração e os
dias restantes: **perto de 60 dias = token longo, pronto**. Se avisar que falta a permissão
`threads_content_publish`, volte ao §2.3 e gere outro token.

**`THREADS_APP_SECRET`:** se o token expira em até 2 dias (token curto, de 1 hora), o comando o
troca por um longo, e a troca exige o **Threads app secret** (§2.4). Sem ele, o comando falha e
explica o caminho. Passe o secret só para essa execução:

```bash
read -rs -p 'Token: ' T; echo
read -rs -p 'Threads app secret: ' S; echo
sudo -u noivar-threads env THREADS_APP_SECRET="$S" \
  /usr/bin/node /opt/noivar-threads/scripts/threads-bot.mjs token "$T"
unset T S
```

Confira: `sudo ls -l /opt/noivar-threads/threads-token.json` → `-rw-------`, dono `noivar-threads`.

Daí em diante o `publicar` renova sozinho quando faltar menos de 30 dias (no máximo uma vez a
cada 24 h; na prática, uma vez por mês) e grava o token novo antes de seguir. Token longo
expirado não renova mais *(doc oficial: [Long-Lived Tokens](https://developers.facebook.com/documentation/threads/get-started/long-lived-tokens.md))*:
aí é gerar outro (§2.7) e rodar `token` de novo, o que sobrescreve o arquivo.

Erros comuns *(relato)*: código 190 "Cannot parse access token" = token colado errado (aspas,
chaves, pedaço faltando); código 452 na troca = secret comum do app no lugar do Threads app secret.

## 6. Teste de visibilidade (MANUAL, antes do cron)

Nenhuma página da API do Threads garante que post de app **não publicado** aparece para o
público, e a doc genérica de modos de app diz que dados gerados em modo de desenvolvimento "can
only be seen by role users" ([App Modes](https://developers.facebook.com/docs/development/build-and-test/app-modes)).
Por isso, um post real:

```bash
tbot teste "Teste de publicação da Noivar. Este post sai do ar em instantes." \
  --link "https://noivar.vercel.app/?utm_source=threads&utm_medium=organic_social&utm_campaign=teste&utm_content=visibilidade"
```

O comando publica na hora, sem banco, e imprime o permalink. Então:

1. Abra o permalink numa **janela anônima**, deslogado.
2. Peça para **outra conta** do Threads, que não seja tester do app, abrir o permalink **e** o
   perfil da Noivar.
3. Confira se o card do link aparece.
4. **Apague o post** no app do Threads (menu `…` do post).

**Se não aparecer para o público:** publique o app no painel (menu **Publish**), que exige ícone
(512 a 1024 px), URL de política de privacidade e URL ou callback de exclusão de dados *(doc
oficial: Create an app)*; a doc de modos diz que esses dados passam a ser vistos por todos quando
o app vai para Live. Pelo relatório, `/privacidade` e `/termos` ainda dizem "Versão preliminar,
em revisão jurídica", o que pesa nesse caso. Repita o teste. Se ainda não ficar público, o plano
B do relatório é o Buffer Free com API, que exige trocar a função de publicação (fora desta v1).
**Não ligue o cron antes de passar aqui.**

## 7. Ensaio: `publicar --simular`

```bash
tbot publicar --simular
```

Faz todas as leituras do job (arquivo do token, validade, próximo post elegível, validação) e
mostra o que publicaria, sem gravar nada, sem renovar o token, sem chamar o Threads e sem ping.
Com a fila vazia, o esperado é `fila vazia: nenhum post aprovado para hoje`, o que já prova token
e banco; repita depois de aprovar o primeiro lote (§10).

## 8. Alerta: Healthchecks.io (MANUAL)

1. Crie a conta em healthchecks.io (o plano grátis basta) e um check `noivar-threads`: schedule
   **Simple**, **Period 1 day**, **Grace Time 1 hour** (folga para atraso e para a execução, que
   leva até uns 5 minutos esperando o container).
2. Em **Integrations**, confira que o e-mail está ligado para esse check.
3. Copie a URL de ping (`https://hc-ping.com/<uuid>`), descomente `HEALTHCHECK_URL` no `.env` da
   VPS e cole.

Como o `publicar` usa *([doc](https://healthchecks.io/docs/http_api/))*:

- `<url>/start` no início; `<url>` no fim com sucesso, com um corpo curto (id do post, permalink,
  aprovados restantes); `<url>/fail` na falha, com a mensagem de erro no corpo. O Healthchecks
  guarda os primeiros 100 kB do corpo: veja em **Events** do check, clicando no evento.
- Vai para `/fail`: fila vazia; token ausente ou expirado; renovação que falhou (o post do dia
  sai, mas a execução termina em falha, com os dias restantes); execução anterior interrompida;
  post reprovado nas checagens duras; erro do Threads; erro ou queda do Supabase.
- `já publicado hoje` conta como sucesso. `--simular` e `teste` não fazem ping.
- **Silêncio também alerta:** sem ping em período + tolerância (cron não rodou, VPS fora do ar,
  `node` quebrado), ou `/start` sem sucesso dentro da tolerância, o check vira *down* e você
  recebe o e-mail *([doc](https://healthchecks.io/docs/measuring_script_run_time/))*.

## 9. Cron diário

Fuso da VPS:

```bash
timedatectl | grep 'Time zone'    # Etc/UTC (UTC, +0000) ou America/Sao_Paulo (-03, -0300)
```

O Brasil está sem horário de verão desde 2019 (Decreto nº 9.772/2019,
[MME](https://www.gov.br/mme/pt-br/assuntos/secretarias/energia-eletrica/horario-de-verao)), e em
21/09/2026 o governo descartou a volta neste ano
([Terra](https://www.terra.com.br/noticias/brasil/cidades/governo-bate-martelo-e-descarta-por-mais-um-ano-retorno-do-horario-de-verao,405d939eeb591c2434f47aae055e3c7785furahh.html)).
São Paulo fica em UTC−3 o ano todo: **08:00 em São Paulo = 11:00 UTC**. Se o horário de verão
voltar, ajuste a linha de UTC e o código (`startOfTodaySaoPauloISO` assume −03:00).

`sudo crontab -u noivar-threads -e` e cole **uma** das linhas (se `crontab` não existir:
`sudo apt install -y cron`):

```cron
# VPS em UTC (11:00 UTC = 08:00 em São Paulo)
0 11 * * * /usr/bin/flock -n /opt/noivar-threads/publicar.lock /usr/bin/node /opt/noivar-threads/scripts/threads-bot.mjs publicar >> /opt/noivar-threads/threads-bot.log 2>&1

# VPS já em America/Sao_Paulo
0 8 * * * /usr/bin/flock -n /opt/noivar-threads/publicar.lock /usr/bin/node /opt/noivar-threads/scripts/threads-bot.mjs publicar >> /opt/noivar-threads/threads-bot.log 2>&1
```

- `flock -n`: se outra execução ainda segura a trava, esta desiste na hora. O banco já barra
  quase todo caso de execução dupla, mas sobra uma janela pequena em que duas execuções
  simultâneas publicariam dois posts no mesmo dia; por isso, rode à mão com a mesma trava:
  `sudo -u noivar-threads /usr/bin/flock -n /opt/noivar-threads/publicar.lock /usr/bin/node /opt/noivar-threads/scripts/threads-bot.mjs publicar`
- Cada execução começa com a hora (UTC, ISO) no log. Não há rotação: cresce poucos KB por mês.
- Caminhos absolutos porque o cron roda com `PATH` mínimo.
- **Sem `CRON_TZ`.** O cron padrão do Debian e do Ubuntu (pacote `cron` 3.0pl1) roda num fuso só,
  e `TZ` no crontab muda apenas o ambiente dos comandos, não o horário
  ([crontab(5) do Debian 13](https://manpages.debian.org/trixie/cron/crontab.5.en.html)). O
  `cronie` (RHEL, Alma, Rocky, Fedora) aceita `CRON_TZ`; use só se o `man 5 crontab` da VPS o citar.

Conferir se rodou e ler o log:

```bash
journalctl -u cron --since today --no-pager | grep noivar-threads   # no RHEL: -u crond
grep CRON /var/log/syslog | grep noivar-threads                     # se a VPS tiver rsyslog
sudo tail -n 40 /opt/noivar-threads/threads-bot.log
```

## 10. Rotina semanal

1. **Gerar o lote.** No Claude Code, neste repo: `/threads-lote` ou "gera os posts da semana do
   Threads". A skill gera o lote a partir do histórico (`fila --json`) e da ficha `fatos.md`,
   valida com `enfileirar --checar`, insere como `draft` (se um post tiver problema, nenhum entra)
   e mostra os posts; só aprova ou descarta com o seu "ok" explícito na conversa.
2. **Revisar e aprovar** (você). Fora do Claude Code, no PC:
   ```bash
   node scripts/threads-bot.mjs fila               # rascunhos, aprovados restantes, última data
   node scripts/threads-bot.mjs aprovar 41 42 43   # ou: aprovar --todos
   node scripts/threads-bot.mjs descartar 44       # apaga um rascunho
   ```
   Ou Supabase → **Table Editor** → `threads_posts` → `status` de `draft` para `approved`. Texto
   editado por lá não passa de novo pelas regras de marca e de repetição; só pelas checagens duras
   na hora de publicar (tamanho, URL no texto, link, `topic_tag`).
3. **Antes de a fila acabar.** O resumo do `fila` mostra os aprovados restantes e o último
   `scheduled_for`; gere o próximo lote antes de zerar (fila vazia = dia sem post + alerta).
   `scheduled_for` é a data mínima: um dia perdido só empurra a fila.
4. **Responder aos comentários, à mão, todo dia.** É a alavanca com melhor evidência: no Threads,
   responder está associado a cerca de 42% mais engajamento (Buffer, 2026, citado no relatório;
   os autores avisam que a causalidade pode ir nos dois sentidos). O bot não faz isso.

Nas 4 primeiras semanas, tudo passa por você. Depois, se quiser, o modo automático é
`enfileirar --aprovado` (o lote entra já como `approved`), mantendo a leitura de uma amostra semanal.

Lote para `enfileirar` à mão (chave desconhecida = erro):

```json
[{"scheduled_for": "2026-10-19", "pillar": "P1", "topic": "confirmacao-prazo",
  "text": "…", "link_url": null, "topic_tag": null, "facts": []}]
```

Sessões do Claude Code usam só `fila`, `enfileirar` e, a pedido do dono, `aprovar`/`descartar`;
nunca `token`, `teste` ou `publicar`, e nunca pedem nem leem o token.

## 11. Runbook

| Alerta ou mensagem | O que houve | O que fazer |
|---|---|---|
| `fila vazia: nenhum post aprovado para hoje` | Nenhum `approved` com `scheduled_for` até hoje | Gere e aprove (§10). Para não perder o dia, rode o `publicar` à mão com a trava (§9) |
| `arquivo de token não encontrado` (ou ilegível, ou incompleto) | `token` nunca rodou, rodou como outro usuário, ou `THREADS_TOKEN_FILE` aponta para outro lugar | §5, como `noivar-threads` |
| `token expirado: gere outro no painel da Meta e rode token` (ou erro do Threads com código 190) | Token vencido ou revogado | §2.7 e §5. Posts que viraram `failed` por isso: volte para `approved` no Table Editor |
| `AVISO: não consegui renovar o token` (o post saiu, mas a execução terminou em falha, com os dias restantes) | Refresh recusado; o token atual ainda vale | Leia o erro no log. Causas relatadas: acesso removido em Website permissions, troca de senha, checagem de segurança. O job tenta de novo a cada dia; se os dias seguirem caindo, gere token novo (§2.7, §5) antes de expirar |
| Post `failed` (container `ERROR`/`EXPIRED`, `publish falhou`, checagem dura) | A coluna `error` tem o erro (`code`, `error_subcode`, `fbtrace_id`) | Leia com `fila` ou no Table Editor. **Confira no perfil se o post não saiu.** Corrija texto ou link se preciso e, no Table Editor, volte `status` para `approved` (o `aprovar` só mexe em `draft`), ou ponha o post num lote novo (§10) |
| `execução interrompida: confira no perfil se o post saiu antes de reaprovar`, ou `PUBLICADO …, mas não consegui gravar no banco` | Uma execução morreu no meio (reboot, queda do Supabase) e a linha ficou em `publishing`; com mais de 15 min, o job seguinte a marca `failed` e para sem publicar nesse dia | Saiu: no Table Editor, `status` = `published` e `published_at` = hora do post (e `permalink`), para o histórico e o "já publicado hoje" valerem. Não saiu: `approved` |
| Conta restrita ou bloqueada (`error_subcode` 2207051 "action is blocked" ou 4279013 "Threads account restricted"; códigos de relatos) | Restrição da Meta no perfil | **Pare:** comente a linha do cron (`sudo crontab -u noivar-threads -e`), resolva no app do Threads e só então reaprove |
| `permission denied for table threads_posts` (42501) | `service_role` sem permissão na tabela | Rode a migration de novo (§3): ela traz o `grant` |
| Outro erro do Supabase (401, 5xx, timeout) | Chave errada ou apagada, projeto pausado ou instabilidade | 401: confira a chave no `.env` da VPS. Pausado: reative no painel. Se pegou um post no meio, a próxima execução cai em "execução interrompida" |
| Healthchecks *down* sem `/fail` | Cron não rodou, VPS fora, `node` fora do caminho, execução travada | `systemctl status cron`, `sudo crontab -u noivar-threads -l`, `journalctl -u cron`, `sudo tail` do log |

## 12. Segurança e limites

- **Chave do Supabase na VPS = acesso total ao banco.** Mitigação da v1: secret key só do bot
  (§4.4), `.env` 600, usuário sem login, só as variáveis do bot. Upgrade futuro (não feito): role
  Postgres dedicada com permissão só em `public.threads_posts`, para a VPS deixar de ter uma chave
  de serviço.
- **Token só na VPS**, em `threads-token.json` (600, sem cifragem, por decisão da v1). Não rode
  `token`, `teste` nem `publicar` no PC; o arquivo está no `.gitignore` mesmo assim. Perdeu a VPS:
  gere outro token (§2.7, §5).
- **Gratuidade não garantida.** A API não tem preço publicado, mas os Platform Terms dizem "Nós
  não podemos garantir que a Plataforma será sempre gratuita" (11.f) e permitem cortar o acesso a
  uma API que o app não use por 28 dias (7.e.iii): bot parado por um mês merece atenção.
- **Ainda dependem de teste real** (tabela final do relatório; os itens sobre a Vercel não valem
  mais, porque o bot roda na VPS):

| Ponto em aberto | Como se resolve |
|---|---|
| Post de app não publicado aparece para o público? | §6 |
| O token do painel sai curto ou longo? | saída do `token` (§5) |
| A conta dona do app precisa ser Threads Tester? | adicionada de qualquer forma (§2.5) |
| O refresh devolve um token novo ou o mesmo? | o script grava sempre o devolvido |
| O card do link aparece como esperado? | §6, com `--link` |
| O limite de 500 caracteres conta a URL? | o link vai em `link_attachment`, fora do texto; manter textos bem abaixo de 500 |
| O Threads tem regra sobre conta automatizada ou rótulo de IA em texto? | ler os Termos de Uso do Threads no app antes de lançar |

## 13. Atualizar o script

No PowerShell, na raiz do repo:

```powershell
scp .\scripts\threads-bot.mjs usuario@IP-DA-VPS:/tmp/
```

Na VPS, fora do horário do cron:

```bash
sudo install -o noivar-threads -g noivar-threads -m 644 /tmp/threads-bot.mjs /opt/noivar-threads/scripts/
rm /tmp/threads-bot.mjs
tbot publicar --simular
```

Se vier migration nova junto, aplique antes (§3). `.env`, token e log não mudam.
