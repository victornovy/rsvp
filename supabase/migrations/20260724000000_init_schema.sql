-- Initial schema: events, guests, credentials, access_links
-- credentials/access_links are created now (for the future anti-penetra/QR phase)
-- but have no UI in this phase.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  event_date timestamptz not null,
  location text,
  image_url text,
  max_people int not null default 25,
  anti_penetra boolean not null default false,
  public_token text not null unique,
  status text not null default 'active',
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_status_check check (status in ('active', 'cancelled', 'archived')),
  constraint events_max_people_check check (max_people > 0)
);

create index events_owner_id_idx on public.events (owner_id);
create index events_public_token_idx on public.events (public_token);

create trigger events_set_updated_at
  before update on public.events
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- guests
-- ---------------------------------------------------------------------------
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  main_guest_id uuid references public.guests (id) on delete cascade,
  name text not null,
  contact text,
  response text not null default 'pending',
  guest_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guests_response_check check (response in ('pending', 'yes', 'no'))
);

create index guests_event_id_idx on public.guests (event_id);
create index guests_main_guest_id_idx on public.guests (main_guest_id);
create index guests_guest_token_idx on public.guests (guest_token);
create index guests_event_name_idx on public.guests (event_id, name);

create trigger guests_set_updated_at
  before update on public.guests
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- credentials (future QR / anti-penetra phase — no UI yet)
-- ---------------------------------------------------------------------------
create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  guest_id uuid not null references public.guests (id) on delete cascade,
  qr_token text not null unique,
  status text not null default 'active',
  checked_in_at timestamptz,
  checked_in_by text,
  created_at timestamptz not null default now(),
  constraint credentials_status_check check (status in ('active', 'used', 'revoked'))
);

create index credentials_event_id_idx on public.credentials (event_id);
create index credentials_guest_id_idx on public.credentials (guest_id);

-- ---------------------------------------------------------------------------
-- access_links (future validator-link phase — no UI yet)
-- ---------------------------------------------------------------------------
create table public.access_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  kind text not null default 'validator',
  token text not null unique,
  expires_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index access_links_event_id_idx on public.access_links (event_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.credentials enable row level security;
alter table public.access_links enable row level security;

-- events: owner manages their own events
create policy "events_select_owner" on public.events
  for select using (auth.uid() = owner_id);

create policy "events_insert_owner" on public.events
  for insert with check (auth.uid() = owner_id);

create policy "events_update_owner" on public.events
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "events_delete_owner" on public.events
  for delete using (auth.uid() = owner_id);

-- guests: owner manages guests of their own events (via join on events)
create policy "guests_select_owner" on public.guests
  for select using (
    exists (
      select 1 from public.events e
      where e.id = guests.event_id and e.owner_id = auth.uid()
    )
  );

create policy "guests_insert_owner" on public.guests
  for insert with check (
    exists (
      select 1 from public.events e
      where e.id = guests.event_id and e.owner_id = auth.uid()
    )
  );

create policy "guests_update_owner" on public.guests
  for update using (
    exists (
      select 1 from public.events e
      where e.id = guests.event_id and e.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.events e
      where e.id = guests.event_id and e.owner_id = auth.uid()
    )
  );

create policy "guests_delete_owner" on public.guests
  for delete using (
    exists (
      select 1 from public.events e
      where e.id = guests.event_id and e.owner_id = auth.uid()
    )
  );

-- credentials: owner reads/manages via event join
create policy "credentials_select_owner" on public.credentials
  for select using (
    exists (
      select 1 from public.events e
      where e.id = credentials.event_id and e.owner_id = auth.uid()
    )
  );

create policy "credentials_all_owner" on public.credentials
  for all using (
    exists (
      select 1 from public.events e
      where e.id = credentials.event_id and e.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.events e
      where e.id = credentials.event_id and e.owner_id = auth.uid()
    )
  );

-- access_links: owner reads/manages via event join
create policy "access_links_select_owner" on public.access_links
  for select using (
    exists (
      select 1 from public.events e
      where e.id = access_links.event_id and e.owner_id = auth.uid()
    )
  );

create policy "access_links_all_owner" on public.access_links
  for all using (
    exists (
      select 1 from public.events e
      where e.id = access_links.event_id and e.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.events e
      where e.id = access_links.event_id and e.owner_id = auth.uid()
    )
  );

-- Note: anonymous/public RSVP access does NOT use RLS policies here.
-- The public /e/:public_token flow is served through server Route Handlers
-- using the Supabase service role key (server-only), which bypasses RLS
-- after validating the public_token / guest_token explicitly in application code.
