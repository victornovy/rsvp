-- Fase 5: add-on de convite por WhatsApp (links wa.me, sem API paga).

alter table public.event_addons
  drop constraint event_addons_addon_check;

alter table public.event_addons
  add constraint event_addons_addon_check
  check (addon in ('scale', 'remove_ads', 'custom_domain', 'whatsapp'));

-- Template de mensagem editável pelo organizador. Nulo = usa o padrão do
-- app (ver apps/app/src/lib/whatsapp.ts). Placeholders resolvidos em
-- código: {evento}, {data}, {link}.
alter table public.events add column whatsapp_message_template text;
