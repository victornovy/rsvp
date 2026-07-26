import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getValidatorLinkContext } from "@/lib/validator";

const ValidatorScanner = dynamic(
  () => import("@/components/ValidatorScanner").then((mod) => mod.ValidatorScanner),
  { ssr: false },
);

// Tela operacional da portaria — nunca deve ser indexada nem exibir anúncios.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

const REASON_MESSAGE: Record<string, string> = {
  expired: "Este link de validação expirou.",
  revoked: "Este link de validação foi revogado pelo organizador.",
  not_found: "Link de validação não encontrado.",
};

export default async function ValidatorPage({
  params,
}: {
  params: { linkToken: string };
}) {
  const context = await getValidatorLinkContext(params.linkToken);

  if (!context.valid || !context.event) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-plum px-4 text-center">
        <p className="font-display text-2xl text-white">Link indisponível</p>
        <p className="mt-2 max-w-xs text-sm text-white/70">
          {REASON_MESSAGE[context.reason ?? "not_found"]}
        </p>
        <p className="mt-4 text-xs text-white/50">Peça um novo link ao organizador do evento.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ink px-4 py-6">
      <div className="mx-auto max-w-sm">
        <p className="text-center font-mono text-[11px] uppercase tracking-widest text-white/50">
          Validação de entrada
        </p>
        <h1 className="mt-1 text-center font-display text-xl text-white">{context.event.title}</h1>
        <div className="mt-6">
          <ValidatorScanner linkToken={params.linkToken} />
        </div>
      </div>
    </main>
  );
}
