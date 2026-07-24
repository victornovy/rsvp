import { generateToken } from "@rsvp/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiError, apiOk } from "@/lib/api-response";
import { eventCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHORIZED", "É necessário estar autenticado.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = eventCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues.map((issue) => issue.message).join("; "),
      400,
    );
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      owner_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      event_date: parsed.data.event_date,
      location: parsed.data.location ?? null,
      image_url: parsed.data.image_url ?? null,
      max_people: parsed.data.max_people,
      anti_penetra: parsed.data.anti_penetra,
      public_token: generateToken(),
    })
    .select()
    .single();

  if (error) {
    return apiError("INTERNAL_ERROR", error.message, 500);
  }

  return apiOk({ event: data }, { status: 201 });
}
