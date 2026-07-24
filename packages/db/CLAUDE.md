# packages/db — CLAUDE.md

Pacote compartilhado com os clients Supabase e os tipos do banco. É o código
mais sensível do repositório em termos de segurança, porque é aqui que vive
o client com service-role key. Leia também o `CLAUDE.md` da raiz.

## O que tem aqui

- `browser.ts` — client para Client Components (anon key, sujeito a RLS).
- `server.ts` — client para código de servidor vinculado à sessão do
  usuário via cookies (anon key, sujeito a RLS). Recebe um `CookieAdapter`
  em vez de acessar `next/headers` diretamente, para não acoplar o pacote a
  um framework específico.
- `service.ts` — client com `SUPABASE_SERVICE_ROLE_KEY`. **Bypassa RLS
  inteiramente.**
- `tokens.ts` — geração de tokens públicos (`nanoid`, 21 chars, alfabeto
  URL-safe). Usado para `public_token` e `guest_token`.
- `types.generated.ts` — espelha `supabase gen types typescript`. Editado à
  mão hoje porque não há projeto Supabase remoto linkado neste ambiente;
  regenerar com `pnpm db:types` (script na raiz) assim que houver um.
- `models.ts` — aliases de conveniência (`Event`, `Guest`, etc.) derivados
  de `types.generated.ts`.

## Regras e padrões de segurança

1. **`service.ts` só pode ser importado por código server-only dos apps**
   (Route Handlers, Server Components) — nunca por um Client Component, nunca
   re-exportado por um módulo que também é usado no browser. Se você for
   adicionar um novo export a este pacote, não re-exporte `service.ts` a
   partir de um barrel que também é consumido no client.
2. **Não adicione um `.getAll()`/atalho que exponha a service-role key como
   string em log, erro ou resposta.** Erros do Postgres/Supabase podem
   conter detalhes da query — não deixe esses erros vazarem crus para o
   client (isso é responsabilidade de quem chama, mas evite qualquer helper
   aqui que serialize o erro inteiro por padrão).
3. **`types.generated.ts` é gerado, não é fonte de verdade.** A fonte de
   verdade é `/supabase/migrations/*.sql`. Se os dois divergirem, corrija a
   migração primeiro (ou rode `pnpm db:types` contra um banco já migrado) —
   não edite o tipo para "consertar" um erro de compilação sem checar se o
   schema real bate.
4. **Geração de token (`tokens.ts`) usa `nanoid` com alfabeto explícito, não
   `Math.random()`** — se precisar gerar outro tipo de token no futuro
   (ex.: `qr_token` de `credentials`, `access_links.token`), reutilize esta
   função em vez de inventar uma nova fonte de aleatoriedade.
5. **Versões de `@supabase/ssr` e `@supabase/supabase-js` precisam ficar em
   sincronia com as usadas em `apps/app`** (ver a armadilha de versão
   documentada no `CLAUDE.md` da raiz). Ao fazer bump de qualquer uma aqui,
   faça o mesmo em `apps/app/package.json` e rode
   `pnpm --filter @rsvp/app typecheck` e `pnpm --filter @rsvp/db typecheck`.
6. **Este pacote não deve conter lógica de negócio específica de um app**
   (ex.: checagem de lotação, formatação de UI). Ele é infraestrutura de
   acesso a dados; regras de negócio ficam nos Route Handlers de
   `apps/app`. Isso mantém claro onde auditar quando algo relacionado a
   permissão de dado for revisado.
