import { cn } from "@/lib/cn";

interface TicketCardProps {
  children: React.ReactNode;
  className?: string;
  /** Vertical offset of the punched notches, in px from the top edge. */
  notchTop?: number;
  /** Background the notches should punch through to (must match the surface behind the card). */
  notchBg?: string;
}

/** Card with two punched side notches — the signature "admission ticket" shape used across the product. */
export function TicketCard({ children, className, notchTop = 44, notchBg }: TicketCardProps) {
  return (
    <div
      className={cn("stub-card rounded-card bg-card shadow-card", className)}
      style={
        {
          "--notch-top": `${notchTop}px`,
          ...(notchBg ? { "--notch-bg": notchBg } : {}),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

export function TicketDivider({ className }: { className?: string }) {
  return <div className={cn("stub-divider", className)} />;
}
