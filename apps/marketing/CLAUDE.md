# apps/marketing — CLAUDE.md

Landing pública (`dominio.com`), indexável. Nesta fase é um **stub
intencional**: uma página estática com CTA para `apps/app/login`. Leia
também o `CLAUDE.md` da raiz.

## O que existe / o que não existe

- Sem autenticação, sem chamadas a Supabase, sem dados sensíveis. O único
  dado dinâmico é `NEXT_PUBLIC_APP_URL` (usado para montar o link de CTA).
- Não há `noindex` aqui de propósito — este app deve ser indexado pelo
  Google. Não copie o `robots.ts`/metadata de `apps/app` para cá.
- Não adicione formulários, coleta de e-mail ou qualquer chamada de API
  autenticada aqui sem antes verificar se não deveria simplesmente virar uma
  página em `apps/app`. Este app não tem sessão nem RLS por trás.

## Padrões de segurança específicos deste app

- **Nunca importe `@rsvp/db` aqui além de tipos/constantes públicas.** Este
  app não deve ter acesso a `SUPABASE_SERVICE_ROLE_KEY` nem à anon key —
  ele não fala com o banco. Se uma feature futura exigir isso (ex.: mostrar
  contagem de eventos criados), prefira buscar via uma rota pública de
  `apps/app` em vez de duplicar credenciais Supabase neste app.
- **Todo conteúdo aqui é público por definição** — não coloque nada neste
  app (texto, imagem, variável de ambiente) que não deva ser visto por
  qualquer visitante e indexado por buscadores.
- **CTAs para o produto devem apontar para `NEXT_PUBLIC_APP_URL`**, nunca
  hardcode o domínio — isso já é o padrão em `src/app/page.tsx`; mantenha
  ao adicionar novas páginas.
