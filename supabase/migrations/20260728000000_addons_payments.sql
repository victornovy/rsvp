-- Fase 4: monetização por add-on (nunca o anti-penetra, que é grátis).

create table public.event_addons (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  addon        text not null check (addon in ('scale', 'remove_ads', 'custom_domain')),
  people_limit integer,                     -- só usado pelo addon 'scale': novo teto
  status       text not null default 'pending' check (status in ('pending', 'active', 'cancelled')),
  created_at   timestamptz not null default now()
);
create index idx_addons_event on public.event_addons(event_id);

-- Registro de pagamentos: auditoria do checkout + idempotência do webhook.
create table public.payments (
  id                   uuid primary key default gen_random_uuid(),
  event_id             uuid not null references public.events(id) on delete cascade,
  addon                text not null,
  provider             text not null default 'mercadopago',
  provider_payment_id  text unique,          -- id do pagamento no MP; chave de idempotência
  amount_cents         integer not null,
  status               text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'refunded')),
  created_at           timestamptz not null default now()
);
create index idx_payments_event on public.payments(event_id);

alter table public.event_addons enable row level security;
alter table public.payments enable row level security;

create policy "owner reads addons" on public.event_addons
  for select using (
    exists (select 1 from public.events e where e.id = event_addons.event_id and e.owner_id = auth.uid())
  );

create policy "owner reads payments" on public.payments
  for select using (
    exists (select 1 from public.events e where e.id = payments.event_id and e.owner_id = auth.uid())
  );

-- Sem policies de insert/update/delete: só a service_role (que bypassa RLS)
-- escreve nessas tabelas — sempre a partir do webhook do Mercado Pago já
-- validado no servidor, nunca a partir do client.
