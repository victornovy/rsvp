# RSVP

SaaS de confirmação de presença para eventos. Fase atual: fundação + RSVP
básico — organizador loga com Google, cria evento, recebe um link público, e
convidados confirmam presença. QR / validação na porta / pagamento / anúncios
ficam para fases posteriores (o schema já reserva as tabelas `credentials` e
`access_links` para isso, mas não há UI ainda).

## Arquitetura

```
/apps/app         → app.seudominio.com  (produto, noindex)
/apps/marketing   → seudominio.com       (landing, indexável — stub nesta fase)
/packages/db      → client Supabase (browser/server/service) + tipos gerados
/supabase/migrations → schema SQL, RLS, triggers, storage bucket
```

Gerenciador de pacotes: **pnpm** (workspaces). Stack: Next.js 14 (App Router)
+ TypeScript + Tailwind + Supabase (Postgres + Auth + Storage), hospedado na
Netlify.

## 1. Criar o projeto Supabase

1. Crie um projeto em https://supabase.com/dashboard.
2. Em **Project Settings > API**, anote `Project URL`, `anon public key` e
   `service_role key`.
3. Instale a CLI do Supabase (`brew install supabase/tap/supabase` ou veja a
   [documentação oficial](https://supabase.com/docs/guides/cli)).
4. Faça login e linke o projeto:
   ```bash
   supabase login
   supabase link --project-ref <seu-project-ref>
   ```

## 2. Rodar a migração

```bash
supabase db push
```

Isso aplica `/supabase/migrations/*.sql`, criando as tabelas `events`,
`guests`, `credentials`, `access_links`, as policies de RLS, o trigger de
`updated_at` e o bucket de Storage `event-images` (público, com policies de
escrita restritas ao dono).

Para desenvolver localmente com Postgres em Docker em vez do projeto remoto:

```bash
supabase start
supabase db reset   # aplica as migrations no banco local
```

### Gerar os tipos TypeScript

Um `packages/db/src/types.generated.ts` já vem no repositório (escrito à mão,
espelhando o schema). Depois de alterar as migrations, regenere com:

```bash
pnpm db:types
```

(requer `supabase start` rodando localmente, ou ajuste o script para
`supabase gen types typescript --project-id <ref> --schema public`).

## 3. Configurar login com Google

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um
   OAuth Client ID (tipo "Web application").
2. Em **Authorized redirect URIs**, adicione:
   `https://<seu-project-ref>.supabase.co/auth/v1/callback`
3. No Supabase Dashboard, vá em **Authentication > Providers > Google**,
   habilite e cole o Client ID / Client Secret.
4. Em **Authentication > URL Configuration**, adicione
   `http://localhost:3000/auth/callback` (dev) e a URL de produção do app
   (`https://app.seudominio.com/auth/callback`) às Redirect URLs.

## 4. Variáveis de ambiente

Copie `.env.example` para `.env.local` dentro de **cada app**:

```bash
cp apps/app/.env.example apps/app/.env.local
cp apps/marketing/.env.example apps/marketing/.env.local
```

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima (client-side, respeita RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role — **usada só em Route Handlers**, nunca no client (necessária para o fluxo público de RSVP, que não passa por RLS) |
| `NEXT_PUBLIC_APP_URL` | URL do app do produto (ex: `http://localhost:3000`) |
| `NEXT_PUBLIC_MARKETING_URL` | URL da landing (ex: `http://localhost:3001`) |

## 5. Rodar localmente

```bash
corepack enable        # garante o pnpm certo via packageManager
pnpm install
pnpm dev:app            # http://localhost:3000
pnpm dev:marketing       # http://localhost:3001 (stub)
```

## 6. Deploy na Netlify

Cada app é publicado como um site Netlify separado, apontando para o mesmo
repositório:

1. **Base directory:** `apps/app` (ou `apps/marketing`).
2. **Build command:** `pnpm install && pnpm --filter @rsvp/app build` (ajuste
   o filtro para `@rsvp/marketing` no segundo site).
3. **Publish directory:** deixe o plugin oficial da Netlify para Next.js
   (`@netlify/plugin-nextjs`) cuidar disso — adicione-o via
   `netlify.toml` ou pela UI da Netlify. Ele não usa nenhuma API exclusiva da
   Vercel.
4. Configure as variáveis de ambiente do passo 4 em cada site.
5. Atualize as Redirect URLs no Supabase Auth com o domínio final de
   produção do app.

## Funcionalidades desta fase

- Organizador autentica com Google, cria/edita/cancela eventos, faz upload de
  imagem de capa (Supabase Storage) e acompanha confirmados/pendentes com
  busca por nome.
- Convidados confirmam presença por um link público (`/e/:public_token`),
  podem adicionar acompanhantes, e a lotação (`max_people`) é validada no
  servidor (`LIMIT_REACHED`).
- Convidados podem atualizar ou recusar a resposta depois, através do token
  individual salvo no navegador ao confirmar.

Fora de escopo nesta fase (schema já preparado): QR de credencial
(`credentials`), links de validação na porta (`access_links`), pagamento
(`is_paid`) e anúncios.

## Limitações conhecidas desta fase

- A checagem de lotação faz "ler contagem, depois inserir": duas confirmações
  simultâneas no último lugar disponível podem, em teoria, ambas passar. Para
  o volume esperado nesta fase isso não foi tratado com lock/transação
  dedicados — considere isso ao evoluir para o modo anti-penetra.
