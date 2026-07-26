# RSVP

SaaS de confirmação de presença para eventos. Fases entregues:

- **Fase 1 — fundação + RSVP básico:** organizador loga com Google, cria
  evento, recebe um link público, e convidados confirmam presença.
- **Fase 2 — controle de acesso anti-penetra:** quando o organizador ativa
  `anti_penetra` num evento, cada pessoa confirmada recebe uma credencial com
  QR único, e a portaria valida entradas em tempo real por um link temporário
  (ver [Fluxo anti-penetra](#fluxo-anti-penetra-fase-2) abaixo).
- **Fase 3 — painel do organizador:** busca/filtros na lista de convidados,
  exportação em CSV, aviso ao reduzir a lotação abaixo do já confirmado,
  múltiplos links de validador simultâneos (um por portão, por exemplo) e
  toasts de feedback nas ações (ver
  [Painel do organizador](#painel-do-organizador-fase-3) abaixo).

Pagamento e anúncios ficam para fases futuras (a coluna `is_paid` já existe
no schema, sem UI ainda).

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
`updated_at`, o bucket de Storage `event-images` (público, com policies de
escrita restritas ao dono) e a função `checkin_credential` — a RPC atômica
que faz o check-in na porta (`security definer`, `EXECUTE` restrito à
`service_role`; ver [Fluxo anti-penetra](#fluxo-anti-penetra-fase-2)).

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

O script usa `supabase gen types typescript --linked`, que gera os tipos a
partir do projeto remoto já conectado via `supabase link` (não precisa de
`supabase start`/Docker). Se estiver desenvolvendo contra o Postgres local,
troque o script para `--local` em vez de `--linked`.

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

## Fluxo anti-penetra (Fase 2)

Ativado por evento, no toggle "Modo anti-penetra" do formulário de evento
(`events.anti_penetra`). Com o modo desligado, nada do que segue roda — sem
QR, sem link de validação, sem overhead.

**1. Emissão da credencial.** Quando alguém confirma presença
(`POST /api/rsvp/:public_token/confirm`) num evento com `anti_penetra=true`,
o servidor cria uma linha em `credentials` por pessoa (titular + cada
acompanhante), com um `qr_token` opaco (`nanoid`, 21 chars). O mesmo
acontece se a resposta for alterada para "sim" depois
(`PATCH .../response/:guestToken`). Se alguém confirmou antes de o
organizador ligar o anti-penetra, a credencial é emitida sob demanda na
primeira vez que a página de credencial é aberta (`ensureCredential` em
`apps/app/src/lib/credentials.ts`) — ninguém fica com confirmação mas sem
ingresso.

**2. Credencial do convidado —** `/e/:public_token/credencial/:guestToken`.
Mostra o QR de cada pessoa do grupo (o QR é renderizado como PNG **no
servidor**, com o pacote `qrcode` — funciona mesmo sem JavaScript no
celular do convidado) e um botão para baixar a imagem.

**3. Link da portaria.** No painel do evento (seção "Controle de acesso"),
o organizador gera um link temporário
(`POST /api/events/:id/validator-link`, tabela `access_links`,
`kind='validator'`) e compartilha com quem vai ficar na porta — por link,
QR ou abrindo direto (`/v/:linkToken`). Dá pra ter **vários links ativos ao
mesmo tempo** (um por portão, por exemplo — ver Fase 3), cada um com um
rótulo opcional; revogação é individual
(`POST /api/access-links/:id/revoke`) ou em bloco
(`.../validator-link/revoke`, revoga todos os links do evento de uma vez).
O acesso é anônimo, autorizado só pela posse do token — mesmo modelo de
confiança do link público de RSVP.

**4. Validação na porta —** `/v/:linkToken`. Tela de câmera contínua
(`html5-qrcode`) otimizada pra celular. A cada QR lido, chama
`POST /api/validate/:linkToken/checkin`, que roda a função Postgres
`checkin_credential`. O resultado vira uma tela cheia colorida (verde =
liberado, amarelo = já utilizado, vermelho = inválido ou link
expirado/revogado), com vibração/beep de feedback e um botão "Próximo" pra
voltar a escanear.

**5. Atomicidade do check-in.** `checkin_credential` é `security definer` e
faz um único
`update credentials set status = 'used' ... where status = 'active'
returning *`. Como o `update` só "ganha" a linha para uma transação por vez,
duas leituras simultâneas do mesmo QR (dois celulares na porta, por
exemplo) não conseguem as duas retornar `valid` — a segunda cai no ramo
`already_used`. A função tem `EXECUTE` revogado de `public`/`anon` e
concedido só a `service_role`: mesmo conhecendo os dois tokens, não dá pra
chamá-la direto pela API REST do Supabase, só através da nossa própria rota.

**6. Painel do organizador.** A seção "Controle de acesso" mostra
confirmados x presentes ao vivo (polling a cada 5s,
`GET /api/events/:id/checkin-stats`), e a lista de convidados ganha o
status da credencial (válida/usada/revogada) com ações de revogar/reemitir
(`POST /api/credentials/:id/revoke|reissue`) — reemitir invalida o QR
antigo e gera um novo. Quando a credencial foi usada, o painel mostra o
horário do check-in e, se o link de validação tinha rótulo, por qual
portão a pessoa entrou (`credentials.checked_in_by` guarda o token do
link; o rótulo é resolvido no servidor a partir dele).

## Painel do organizador (Fase 3)

**Busca e filtros.** A lista de convidados (`/events/:id`) filtra por nome
(`?q=`, `ilike` no servidor), por resposta (confirmado/pendente/recusado) e,
em eventos com anti-penetra, por status da credencial (válida/usada/
revogada) — tudo via `GET /api/events/:id/guests`, com debounce no client.
Cada linha mostra se é titular ou acompanhante (e de quem), a resposta, e
quando aplicável, o status da credencial e o horário do check-in.

**Exportar CSV —** `GET /api/events/:id/export`. Gera o CSV **na mão** (sem
biblioteca — `apps/app/src/lib/csv.ts`), com BOM UTF-8 para abrir certo no
Excel. Colunas: `nome, tipo, titular_de, contato, resposta,
credencial_status, presente, checkin_em`. Autenticado com o client
vinculado à sessão (não o service role), então RLS garante que só o dono do
evento exporta. Nome do arquivo: `convidados-{slug-do-titulo}.csv`. O botão
no painel baixa via `fetch` + `Blob` (não um `<a href>` direto) só para
poder mostrar um toast de sucesso/erro.

**Editar e cancelar** já existiam desde a Fase 1
(`PATCH /api/events/:id`, `POST /api/events/:id/cancel`). O que a Fase 3
adiciona: se a edição reduz `max_people` abaixo do total já confirmado, a
resposta inclui um aviso (`warning.code = "OVER_CAPACITY"`), mostrado como
toast — **ninguém é removido**, e novas confirmações simplesmente ficam
bloqueadas até a lista caber de novo (a checagem de lotação do RSVP já
cobria isso desde a Fase 1, sem precisar de código novo).

**Múltiplos validadores.** `access_links` ganhou a coluna `label`
(migração `20260726000000_access_links_label.sql`). Criar um link novo não
revoga mais os existentes — dá pra ter quantos quiser ativos ao mesmo
tempo, cada um com um rótulo livre ("Portão A", "Entrada VIP"), revogados
individualmente ou todos de uma vez.

**Toasts.** Sistema próprio e leve (`apps/app/src/components/ui/Toast.tsx`,
~70 linhas, sem dependência nova), montado uma vez no layout raiz — qualquer
Client Component chama `useToast().success/error/info(mensagem)`. Usado em:
salvar/editar evento, cancelar evento, gerar/revogar link de validação,
revogar/reemitir credencial, exportar CSV.

## Funcionalidades entregues

- Organizador autentica com Google, cria/edita/cancela eventos, faz upload de
  imagem de capa (Supabase Storage) e acompanha confirmados/pendentes com
  busca por nome.
- Convidados confirmam presença por um link público (`/e/:public_token`),
  podem adicionar acompanhantes, e a lotação (`max_people`) é validada no
  servidor (`LIMIT_REACHED`).
- Convidados podem atualizar ou recusar a resposta depois, através do token
  individual salvo no navegador ao confirmar.
- Modo anti-penetra: emissão de credencial por QR, credencial pública para o
  convidado baixar, link de validação temporário para a portaria, leitor de
  câmera com check-in atômico, e contagem confirmados x presentes ao vivo no
  painel.
- Painel do organizador: busca e filtros na lista de convidados, exportação
  em CSV, aviso ao reduzir a lotação abaixo do já confirmado, múltiplos
  links de validador simultâneos com rótulo, e toasts de sucesso/erro nas
  ações.

Fora de escopo por enquanto (schema já preparado): pagamento (`is_paid`) e
anúncios.

## Limitações conhecidas

- A checagem de lotação no RSVP faz "ler contagem, depois inserir": duas
  confirmações simultâneas no último lugar disponível podem, em teoria,
  ambas passar. O check-in na porta (fluxo mais crítico, com consequência
  física) **não** tem esse problema — é resolvido por um único `update`
  atômico em `checkin_credential`.
- Revogar/reemitir uma credencial não notifica o convidado — a página de
  credencial dele simplesmente passa a mostrar o novo estado na próxima
  visita.
