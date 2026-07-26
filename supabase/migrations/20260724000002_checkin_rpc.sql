-- Atomic door check-in. SECURITY DEFINER so it can bypass RLS on
-- credentials/guests/access_links (the validator caller is anonymous —
-- authorized purely by knowing the access_links.token, same trust model as
-- the rest of the public RSVP flow). Runs as the function owner (the
-- migration role), which has table ownership and therefore bypasses RLS
-- inside the function body regardless of the caller's role.
--
-- The single `update ... where status = 'active' returning *` is what makes
-- this safe under concurrent scans of the same QR: only one concurrent
-- transaction can win that row lock, so two doormen scanning the same code
-- at the same instant cannot both get `result = 'valid'`.
create or replace function public.checkin_credential(p_qr_token text, p_link_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_id uuid;
  v_cred     public.credentials%rowtype;
  v_guest    public.guests%rowtype;
  v_link     public.access_links%rowtype;
begin
  -- 1) valida o link do validador
  select * into v_link from public.access_links
    where token = p_link_token
      and kind = 'validator'
      and revoked = false
      and (expires_at is null or expires_at > now());
  if not found then
    return jsonb_build_object('result', 'link_invalid');
  end if;
  v_event_id := v_link.event_id;

  -- 2) tenta consumir a credencial de forma atômica
  update public.credentials
    set status = 'used', checked_in_at = now(), checked_in_by = p_link_token
    where qr_token = p_qr_token
      and event_id = v_event_id
      and status = 'active'
    returning * into v_cred;

  if found then
    select * into v_guest from public.guests where id = v_cred.guest_id;
    return jsonb_build_object('result', 'valid', 'guest_name', v_guest.name);
  end if;

  -- 3) diagnostica o motivo
  select * into v_cred from public.credentials
    where qr_token = p_qr_token and event_id = v_event_id;

  if found and v_cred.status = 'used' then
    select * into v_guest from public.guests where id = v_cred.guest_id;
    return jsonb_build_object(
      'result', 'already_used',
      'guest_name', v_guest.name,
      'checked_in_at', v_cred.checked_in_at
    );
  end if;

  return jsonb_build_object('result', 'invalid');
end;
$$;

-- Public/anon must never be able to call this directly via the PostgREST
-- RPC endpoint — only our server route (using the service role) may, so
-- door check-in always goes through the app's own validation of the
-- request shape.
revoke all on function public.checkin_credential(text, text) from public;
grant execute on function public.checkin_credential(text, text) to service_role;
