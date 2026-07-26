import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-response";
import { fetchGuestRows } from "@/lib/guest-rows";
import { toCsv, slugify } from "@/lib/csv";
import { GUEST_RESPONSE_LABEL, CREDENTIAL_STATUS_LABEL } from "@/components/ui/StatusBadge";

const COLUMNS = [
  "nome",
  "tipo",
  "titular_de",
  "contato",
  "resposta",
  "credencial_status",
  "presente",
  "checkin_em",
] as const;

function formatDateTime(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "É necessário estar autenticado.", 401);
  }

  // RLS garante que só o dono do evento lê os dados a seguir.
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", params.id)
    .maybeSingle();

  if (eventError) {
    return apiError("INTERNAL_ERROR", eventError.message, 500);
  }
  if (!event) {
    return apiError("NOT_FOUND", "Evento não encontrado.", 404);
  }

  let guests;
  try {
    guests = await fetchGuestRows(supabase, event.id);
  } catch (err) {
    return apiError("INTERNAL_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }

  const rows = guests.map((guest) => ({
    nome: guest.name,
    tipo: guest.main_guest_id ? "acompanhante" : "titular",
    titular_de: guest.main_guest_id ? (guest.main_guest_name ?? "") : "",
    contato: guest.contact ?? "",
    resposta: GUEST_RESPONSE_LABEL[guest.response] ?? guest.response,
    credencial_status: guest.credential
      ? (CREDENTIAL_STATUS_LABEL[guest.credential.status] ?? guest.credential.status)
      : "",
    presente: guest.credential?.status === "used" ? "sim" : "nao",
    checkin_em: formatDateTime(guest.credential?.checked_in_at ?? null),
  }));

  // BOM no início ajuda o Excel a reconhecer UTF-8 e não corromper acentos.
  const csv = "﻿" + toCsv(rows, [...COLUMNS]);
  const filename = `convidados-${slugify(event.title)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
