-- Rótulo opcional por link de validador (ex: "Portão A", "Entrada VIP"),
-- para suportar múltiplos validadores simultâneos por evento.
alter table public.access_links add column label text;
