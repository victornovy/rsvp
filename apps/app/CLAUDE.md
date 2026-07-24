# apps/app — CLAUDE.md

Produto autenticado (`app.dominio.com`). Leia também o `CLAUDE.md` da raiz —
as regras de segurança de lá se aplicam integralmente aqui.

## O que existe nesta fase

- Auth Google via `@supabase/ssr`, sessão em cookie `httpOnly`
  (`src/middleware.ts` faz refresh de sessão e protege `/dashboard` e
  `/events/*`; redireciona para `/login` sem sessão).
- CRUD de evento (`/events/new`, `/events/:id`, `/events/:id/edit`),
  dashboard com contagem de confirmados/pendentes.
- RSVP público (`/e/:public_token`) e seus três Route Handlers
  (`/api/rsvp/:public_token`, `.../confirm`, `.../response/:guestToken`).
- `noindex, nofollow` global (`layout.tsx` + `robots.ts`) — este app **não
  deve ser indexado**. Se adicionar novas rotas públicas, não remova esse
  bloqueio.

## Dois clients Supabase — não os confunda

| Client | Onde | Autoridade | Uso |
|---|---|---|---|
| `getSupabaseServerClient()` (`src/lib/supabase/server.ts`) | Server Components, Server Actions, Route Handlers autenticados | Sujeito a RLS, vinculado à sessão do cookie | Tudo que é do organizador logado (`/dashboard`, `/events/*`, `/api/events/*`) |
| `createSupabaseServiceClient()` (`@rsvp/db`) | Só nos Route Handlers de `/api/rsvp/*` e na Server Component de `/e/:public_token` | **Bypassa RLS** | Fluxo anônimo de convidado, onde não existe `auth.uid()` |
| `createSupabaseBrowserClient()` (`src/lib/supabase/browser.ts`) | Client Components | Sujeito a RLS, anon key | Login OAuth, upload de imagem no `EventForm` |

Regra prática: se você está escrevendo um handler novo e a rota começa com
`/api/rsvp/`, use o service client **e valide `public_token`/`guest_token`
manualmente** antes de tocar qualquer linha — não existe RLS te protegendo
ali. Se a rota é qualquer outra coisa sob `/api/events` ou páginas de
`/dashboard`/`/events`, use `getSupabaseServerClient()` e deixe o RLS
(`auth.uid() = owner_id`) fazer o trabalho de isolar dados entre
organizadores.

## Padrões de segurança específicos deste app

- **Nunca importe `@rsvp/db`'s `createSupabaseServiceClient` em um arquivo
  `"use client"`** — isso vazaria a tentativa de uso da service key para o
  bundle do browser (e falharia em runtime, mas não deve nem chegar a isso;
  se o build reclamar de `process.env.SUPABASE_SERVICE_ROLE_KEY` undefined
  no client, é sinal de import no lugar errado).
- **Toda resposta de erro de Route Handler passa por `apiError()`**
  (`src/lib/api-response.ts`) — não retorne `NextResponse.json({ message })`
  solto, para manter o formato `{ error: { code, message } }` e os códigos
  (`UNAUTHORIZED`, `NOT_FOUND`, `VALIDATION_ERROR`, `LIMIT_REACHED`,
  `EVENT_CANCELLED`, `INTERNAL_ERROR`) consistentes com o que o frontend
  espera.
- **`middleware.ts` é a única linha de proteção de rota por path.** Se
  adicionar uma nova área autenticada, inclua o prefixo em
  `PROTECTED_PATHS` — mas não dependa só disso: páginas Server Component
  sensíveis também devem chamar `requireUser()` (`src/lib/auth.ts`), porque
  o middleware pode ser bypassado por chamadas diretas a Route Handlers.
- **Upload de imagem de evento** (`EventForm.tsx`) sobe direto do browser
  para o Storage (`event-images`) usando a sessão do usuário — a policy do
  bucket restringe escrita a `event-images/<auth.uid()>/...`. Se mudar esse
  fluxo, não remova a checagem de pasta por `auth.uid()` na policy nem passe
  a aceitar um path arbitrário vindo do client.
- **`guest_token` é a única credencial guardada em `localStorage`**
  (`RsvpForm.tsx`). Ele só permite alterar a própria resposta de RSVP de
  quem o recebeu — não é um token de sessão e não deve virar um. Não crie
  novos usos desse padrão para dados sensíveis do organizador.
- **Lotação (`max_people`) é validada no servidor**, nunca confie em uma
  checagem só no client — o form pode ser contornado com uma chamada direta
  à API. Qualquer novo fluxo que crie `guests` precisa repetir a checagem de
  `LIMIT_REACHED` que já existe em `confirm/route.ts` e
  `response/[guestToken]/route.ts`.
- **Datas do formulário (`datetime-local`) são convertidas para ISO/UTC**
  antes de enviar à API — ao mexer em `EventForm.tsx`, preserve essa
  conversão para não gravar horário errado no fuso do servidor.

## Ao adicionar uma fase futura (QR/anti-penetra, pagamento, anúncios)

As colunas já existem (`anti_penetra`, `credentials`, `access_links`,
`is_paid`) mas propositalmente sem lógica. Antes de implementar:
- QR/credencial: o `qr_token` de `credentials` deve ser tratado como
  segredo de curta duração — não o exponha em nenhuma resposta de API que
  não seja a tela de exibição do próprio convidado/validador.
- Validação na porta (`access_links`): esses tokens dão acesso a uma
  operação sensível (marcar check-in); trate como equivalente a uma sessão
  de operador — considere expiração (`expires_at`) obrigatória e não
  opcional.
