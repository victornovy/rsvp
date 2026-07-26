import { cn } from "@/lib/cn";

export type BadgeTone = "mint" | "amber" | "clay" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  mint: "border-mint text-mint bg-mint-light",
  amber: "border-amber text-amber bg-amber-light",
  clay: "border-clay text-clay bg-clay-light",
  neutral: "border-ink/25 text-ink-muted bg-transparent",
};

/** A small rotated "stamp" pill — the door-check verdict, made visible everywhere a status appears. */
export function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block -rotate-2 whitespace-nowrap rounded-md border-[1.5px] px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

export function eventStatusTone(status: string): BadgeTone {
  if (status === "cancelled") return "clay";
  if (status === "archived") return "neutral";
  return "mint";
}

export function guestResponseTone(response: string): BadgeTone {
  if (response === "yes") return "mint";
  if (response === "no") return "clay";
  return "amber";
}

export const GUEST_RESPONSE_LABEL: Record<string, string> = {
  yes: "Confirmado",
  no: "Não vai",
  pending: "Pendente",
};

export function credentialTone(status: string): BadgeTone {
  if (status === "active") return "mint";
  if (status === "used") return "neutral";
  return "clay";
}

export const CREDENTIAL_STATUS_LABEL: Record<string, string> = {
  active: "Válida",
  used: "Usada",
  revoked: "Revogada",
};
