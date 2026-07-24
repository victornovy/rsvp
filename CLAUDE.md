# RSVP — CLAUDE.md (raiz do monorepo)

SaaS de confirmação de presença para eventos. Fase atual: fundação + RSVP
básico (ver `README.md` para escopo e setup). Fases futuras (QR /
anti-penetra, validação na porta, pagamento, anúncios) já têm colunas/tabelas
reservadas no schema, mas **não têm UI nem lógica ainda** — não implemente
essas features a menos que explicitamente pedido.

## Arquitetura

```
/apps/app         → app.dominio.com  (produto, autenticado, noindex)
/apps/marketing   → dominio.com       (landing pública, indexável — stub)
/packages/db      → client Supabase (browser/server/service) + tipos gerados
/supabase/migrations → schema SQL, RLS, triggers, storage bucket
```

Cada diretório relevante tem seu próprio `CLAUDE.md` com regras específicas:
[`apps/app/CLAUDE.md`](apps/app/CLAUDE.md), [`apps/marketing/CLAUDE.md`](apps/marketing/CLAUDE.md),
[`packages/db/CLAUDE.md`](packages/db/CLAUDE.md). Leia o do diretório em que
você está trabalhando além deste.

Stack: Next.js 14 (App Router) + TypeScript estrito + Tailwind + Supabase
(Postgres + Auth + Storage). Gerenciador: **pnpm** (workspaces). Deploy:
Netlify — não usar APIs exclusivas da Vercel.

## Comandos

```bash
pnpm install
pnpm dev:app              # apps/app em :3000
pnpm dev:marketing         # apps/marketing em :3001
pnpm --filter @rsvp/app typecheck
pnpm --filter @rsvp/app build
pnpm db:types              # regenera packages/db/src/types.generated.ts
```

Migrações vivem em `/supabase/migrations/*.sql` e são aplicadas com
`supabase db push` (remoto) ou `supabase db reset` (local). Nunca edite uma
migração já aplicada em produção — crie uma nova.

## Convenções gerais

- TypeScript estrito em todo lugar; não introduza `any` para calar o
  compilador — resolva a causa raiz (ver nota sobre versões abaixo).
- Erros de API sempre no formato `{ error: { code, message } }` (ver
  `apps/app/src/lib/api-response.ts`). Não vaze stack traces, mensagens de
  driver Postgres ou detalhes internos nas respostas — logue no servidor,
  responda com mensagem genérica.
- Validação de entrada com `zod` em toda rota que recebe body (`apps/app/src/lib/validation.ts`).
  Nenhum Route Handler deve confiar em `request.json()` sem parsear.
- Não adicione dependências novas sem necessidade clara; ao adicionar,
  confirme que a versão é compatível com o restante do stack (ver
  "Armadilha de versão" abaixo).

## Armadilha de versão conhecida (não repita)

`@supabase/ssr` e `@supabase/supabase-js` têm acoplamento de tipos forte.
Uma vez, um pin desatualizado de `@supabase/ssr` (`^0.5.2`) contra um
`@supabase/supabase-js` recente (`2.110.x`) fez **todo** `.from(...).select()`
inferir `never` silenciosamente (sem erro óbvio na primeira leitura) —
`supabase.from("events").select("*")` retornava dados tipados como `never[]`.
Regra: sempre que atualizar um dos dois pacotes, atualize o outro junto e
confira `npm view @supabase/ssr@<versão> peerDependencies` para saber qual
faixa de `supabase-js` ele espera. Rode `pnpm --filter @rsvp/app typecheck`
depois de qualquer bump.

## Regras e padrões de segurança (aplicam-se a todo o monorepo)

1. **Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` ao client.** Ela só pode ser
   lida em código que roda exclusivamente no servidor (Route Handlers,
   Server Components, `packages/db/src/service.ts`). Nunca a importe em um
   arquivo com `"use client"`, nunca a passe como prop para um Client
   Component, nunca a logue.
2. **RLS é a linha de defesa padrão.** Toda tabela nova precisa de
   `alter table ... enable row level security` e políticas explícitas antes
   de ir para produção. Não crie tabelas "temporariamente sem RLS".
3. **O fluxo público (RSVP anônimo) é a exceção deliberada, não o padrão.**
   Ele usa o service-role client porque não há `auth.uid()` para o RLS
   validar. Isso significa que a validação de posse (o registro pertence ao
   `public_token`/`guest_token` informado) precisa ser feita **explicitamente
   em código de aplicação**, sempre no servidor. Nunca adicione um novo
   endpoint que use o service-role client sem essa checagem.
4. **Nunca confie em IDs vindos do client para decidir propriedade.** Em
   rotas autenticadas, a posse é garantida pelo RLS (`auth.uid() = owner_id`)
   — não adicione um `.eq("owner_id", bodyOwnerId)` vindo do request. Em
   rotas públicas, a posse é o token (`public_token`/`guest_token`), nunca um
   ID numérico/uuid adivinhável sozinho.
5. **Nunca escreva SQL concatenando strings.** Use sempre o query builder do
   Supabase (`.eq()`, `.ilike()`, etc.) ou, se uma migração precisar de SQL
   dinâmico, use identificadores validados por allowlist — nunca interpole
   input de usuário.
6. **Segredos ficam em `.env.local` (nunca commitado).** `.env.example` só
   tem placeholders. Antes de commitar, rode `git status` e confira que
   nenhum arquivo com credencial real foi staged.
7. **Uploads (Supabase Storage) precisam de validação de tipo/tamanho** antes
   de subir — hoje isso vive no client (`EventForm.tsx`) e nas policies de
   Storage (que restringem escrita à pasta do próprio `owner_id`). Se mover
   o upload para o servidor, mantenha as duas camadas.
8. **Sessão só em cookies `httpOnly`** (via `@supabase/ssr`). Não guarde o
   token de sessão do organizador em `localStorage`/`sessionStorage`. O
   `guest_token` do RSVP público é a única exceção deliberada — ele não dá
   acesso a nada além da própria confirmação de presença de quem o recebeu,
   então guardá-lo em `localStorage` no navegador do convidado é aceitável.
9. **Least privilege por rota.** Um Route Handler que só precisa do client
   autenticado (`getSupabaseServerClient`) não deve importar o service-role
   client "por garantia". Se um handler mistura os dois, documente por quê.
10. **Rate limiting / anti-abuso dos endpoints públicos (`/api/rsvp/*`)
    ainda não existe** — é uma lacuna conhecida desta fase, não confunda com
    "resolvido". Antes de abrir esses endpoints para tráfego real em
    produção, considere adicionar throttling (ex.: por IP/token) e captcha
    se houver abuso.
11. **Condição de corrida na checagem de lotação:** o `LIMIT_REACHED` faz
    "ler contagem, depois inserir" sem lock/transação — duas confirmações
    simultâneas no último lugar podem, em teoria, ambas passar. Não é uma
    falha de segurança per se, mas é relevante para o modo anti-penetra
    futuro (onde estourar a lotação tem consequência física). Se for
    endurecer isso, use uma função Postgres com `select ... for update` ou
    uma constraint/trigger no banco, não apenas checagem na aplicação.
