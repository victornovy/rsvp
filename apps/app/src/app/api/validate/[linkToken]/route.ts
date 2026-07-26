import { apiError, apiOk } from "@/lib/api-response";
import { getValidatorLinkContext } from "@/lib/validator";

export async function GET(
  _request: Request,
  { params }: { params: { linkToken: string } },
) {
  const context = await getValidatorLinkContext(params.linkToken);

  if (!context.valid || !context.event) {
    return apiError("NOT_FOUND", "Link de validação inválido, expirado ou revogado.", 404);
  }

  return apiOk({ event: context.event });
}
