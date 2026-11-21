# Voa Leve

Alertas de passagens aéreas baratas com preço comparado a 90 dias de histórico.
Monorepo Node/TypeScript com Next.js, worker de coleta, PostgreSQL/PGlite,
e-mail transacional e Telegram.

> **Status:** MVP funcional em ambiente local. O site público, o painel admin, o
> motor de coleta/detecção/publicação e o fluxo de alertas já rodam de ponta a
> ponta com dados de demonstração.

---

## Stack

| Camada | Escolha |
| --- | --- |
| Web | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Linguagem | TypeScript 5.9 |
| Banco | PostgreSQL em produção / PGlite (WASM) em desenvolvimento |
| ORM | Drizzle ORM + drizzle-kit |
| Worker | Node + croner |
| E-mail | Resend (HTTP direto, sem SDK) |
| Telegram | Bot API (HTTP direto) |
| Validação | Zod |
| Testes | Vitest (regras de detecção, estatística e qualidade) |

## Estrutura

```
apps/
  web/        site público, APIs, painel admin
  worker/     scheduler cron e CLI de demonstração
packages/
  core/       estatística robusta, percentis, níveis, slugs, tokens
  db/         schema Drizzle, cliente PGlite/Postgres, migrações, seeds
  sources/    adaptadores Travelpayouts e mock, deep link de afiliado
  jobs/       coleta, estatísticas, detecção, publicação, notificação, expiração
```

## Começando

Pré-requisitos: **Node 20.9+** (testado com Node 24) e npm. Docker e Postgres
não são necessários para desenvolver.

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run db:generate         # gera packages/db/drizzle/*.sql
npm run demo                # cria o banco local e popula 75 dias de histórico
npm run dev                 # http://localhost:3000
```

O comando `npm run demo`:

1. aplica as migrações;
2. insere aeroportos e rotas do seed;
3. gera ~10 mil snapshots sintéticos determinísticos (75 dias);
4. calcula os buckets de 90 dias;
5. roda a detecção real e publica as ofertas;
6. enfileira/processa notificações (simuladas sem `RESEND_API_KEY`).

Para recriar a demonstração apagando ofertas, cliques e snapshots:

```bash
npm run demo -- --reset
```

### Painel admin

- URL: `http://localhost:3000/admin`
- Senha padrão de desenvolvimento: `admin123` (definida em `.env`)
- O painel permite publicar/rejeitar/expirar ofertas, editar teto e prioridade
  das rotas, rodar o pipeline e recriar a demonstração.

### Worker

```bash
npm run worker:dev    # scheduler contínuo
npm run worker        # equivalente a `tsx apps/worker/src/index.ts`
# execução única:
npm run worker -- --once
```

Crons configurados: coleta a cada 3h, estatísticas diárias, detecção a cada
30min, notificações a cada minuto, expiração a cada 15min e revalidação a cada
6h.

> **PGlite é single-process.** Não rode `npm run dev` e `npm run worker` ao
> mesmo tempo usando o mesmo banco local. Para produção, use `DATABASE_URL`
> apontando para um Postgres gerenciado (Neon, Railway, Supabase etc.). Em
> desenvolvimento, o painel admin permite disparar o pipeline manualmente sem o
> worker.
>
> No Windows, o banco local fica em `%LOCALAPPDATA%\voa-leve\pglite`, fora do
> OneDrive. Se quiser outro caminho, defina `PGLITE_DATA_DIR`.

## Variáveis de ambiente

Todas estão documentadas em `.env.example`. As principais:

| Variável | Padrão | Observação |
| --- | --- | --- |
| `SITE_URL` | `http://localhost:3000` | usada em links de e-mail, sitemap e canonical |
| `AUTH_SECRET` | `dev-secret-change-me` | assina cookie admin e tokens de confirmação |
| `ADMIN_PASSWORD` | `admin123` em dev | vazio em produção desabilita o login |
| `DATABASE_URL` | — | se ausente, usa PGlite local |
| `PRICE_SOURCE` | `mock` | `mock` ou `travelpayouts` |
| `RESEND_API_KEY` | — | sem chave, e-mails são simulados |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHANNEL_ID` | — | sem ambos, não há broadcast |
| `ALLOWED_AFFILIATE_HOSTS` | hosts padrão | allowlist dos destinos aceitos em `/go/:id` |
| `ALLOW_PGLITE_IN_PRODUCTION` | — | `1` libera PGlite só para teste local em modo produção |

## Como a detecção funciona

Cada tarifa é agrupada por `route_id + departure_month + trip_bucket`
(duração da viagem). A janela é de 90 dias, com mínimo de 10 dias e 20
snapshots para sair do cold start. São calculados mediana, p01, p10, p25, p50,
p90, MAD, mínimo e “segundo mínimo”.

| Nível | Critério | TTL |
| --- | --- | --- |
| 🟢 Boa | `preço <= p25` ou `preço/p50 <= 0.85` | 24h |
| 🔥 Ótima | `preço <= p10` ou `preço/p50 <= 0.70` | 12h |
| 🚨 Excepcional | `preço <= p01`, `preço/p50 <= 0.45` ou queda ≥ 40%, com duas confirmações e revisão humana | 6h |

Antes de publicar, a oferta passa por checagem de qualidade: número de
escalas, duração máxima, self transfer, preço mínimo e consistência dos dados.
Ofertas sem histórico suficiente usam `routes.ceiling_cents` (cold start) e
recebem o selo de **prévia**.

Ofertas publicadas são revalidadas a cada 6h. Se o preço subir mais de 10% em
uma coleta recente, a oferta é expirada; ausência de coleta não derruba a
oferta.

## Fluxo do MVP

```
coleta → snapshots → estatísticas → detecção → rascunho
       → aprovação/publicação → site + Telegram
       → e-mail (Resend) → clique rastreado (/go/:id) → conversão
```

Endpoints públicos:

- `GET /api/offers?origin=GRU&destination=LIS&level=great&limit=20`
- `GET /api/health`
- `POST /api/alerts` — cria alerta com double opt-in
- `GET /api/confirm?token=...` — confirma inscrição
- `GET /api/unsubscribe?token=...` — descadastra e desativa regras
- `GET /go/:offerId?c=site` — registra clique e redireciona ao afiliado

## Scripts

```bash
npm run dev          # Next.js em modo desenvolvimento
npm run build        # build de produção da web
npm run start        # serve o build
npm run typecheck    # TypeScript em todos os workspaces
npm test             # testes unitários do core
npm run db:generate  # gera migração a partir do schema
npm run db:migrate   # aplica migrações no banco configurado
npm run demo         # seed + pipeline de demonstração
npm run worker:dev   # worker com watch
```

## Decisões e desvios do plano original

Para reduzir dependências e manter o MVP auditável:

- **Sem shadcn/ui**: componentes próprios em Tailwind, com tema e tipografia
  definidos em `globals.css`.
- **Sem Auth.js/Google**: login admin com senha + cookie HMAC assinado
  (`AUTH_SECRET`), suficiente para um painel de uma pessoa no MVP.
- **Sem pg-boss**: croner + tabela `job_runs`, sem fila externa.
- **Sem React Email**: templates HTML inline em `packages/jobs/src/notify.ts` e
  `apps/web/src/lib/subscribers.ts`.
- **Sem grammY/SDKs**: chamadas `fetch` diretas para Resend e Telegram.
- **PGlite em desenvolvimento**: evita Docker/Postgres local, mas é
  single-process. Em produção, `DATABASE_URL` é obrigatório.
- **Fonte mock**: permite validar o produto antes de contratar Travelpayouts.
  A fonte real já está implementada em `packages/sources/src/travelpayouts.ts`.
- **Preços em centavos**: todos os valores monetários são inteiros (BRL cents).

## Pendências de produto

Estas decisões ainda não foram fechadas e não bloqueiam o scaffold:

1. **Nicho inicial** (ex.: internacionais saindo de GRU, nordeste, Europa).
2. **Cidade/origem base** para priorizar rotas e conteúdo.
3. **Contratação da Travelpayouts** (token + marker) e programa de afiliado.
4. **Provedor de e-mail** (Resend é o default) e domínio verificado.
5. **Hospedagem** (Railway/Neon é o caminho sugerido para web + Postgres).
6. **Domínio final** (`voaleve.com.br` é placeholder) e identidade visual.

Ao definir esses pontos, ajuste `packages/db/src/seed-data.ts` (rotas e tetos),
`.env`, textos institucionais e o canal do Telegram.

## Checklist para produção

- [ ] Criar Postgres gerenciado e definir `DATABASE_URL` (obrigatório em produção).
- [ ] Rodar `npm run db:migrate` no banco de produção.
- [ ] Definir `AUTH_SECRET` longo (obrigatório) e `ADMIN_PASSWORD` forte.
- [ ] Configurar `SITE_URL` com o domínio final e HTTPS.
- [ ] Verificar domínio no Resend e configurar `EMAIL_FROM`.
- [ ] Criar bot no Telegram, adicionar ao canal e definir token/channel ID.
- [ ] Configurar `PRICE_SOURCE=travelpayouts` + token/marker.
- [ ] Rodar o worker em processo separado (Railway worker ou cron).
- [ ] Configurar backup do banco e monitorar `/api/health`.
- [ ] Revisar textos legais com apoio jurídico antes de escalar.
