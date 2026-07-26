import Link from "next/link";
import { ArrowLeftIcon, LogOutIcon } from "@/components/icons";

export function AppHeader({
  title,
  backHref,
  backLabel = "Voltar",
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <div className="min-w-0">
          <Link
            href="/dashboard"
            className="font-display text-base italic tracking-tight text-plum"
          >
            rsvp.
          </Link>
          {backHref ? (
            <Link
              href={backHref}
              className="mt-0.5 flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
            >
              <ArrowLeftIcon width={14} height={14} />
              {backLabel}
            </Link>
          ) : (
            <p className="mt-0.5 truncate text-sm font-medium text-ink-muted">{title}</p>
          )}
        </div>

        <form action="/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-black/[0.04] hover:text-ink"
          >
            <LogOutIcon width={16} height={16} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </form>
      </div>
    </header>
  );
}
