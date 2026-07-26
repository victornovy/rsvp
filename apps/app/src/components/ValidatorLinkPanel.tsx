"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { TicketIcon, PlusIcon } from "@/components/icons";
import { useToast } from "@/components/ui/Toast";

export interface ValidatorLink {
  id: string;
  token: string;
  label: string | null;
  url: string;
  expires_at: string | null;
}

export function ValidatorLinkPanel({
  eventId,
  initialLinks,
}: {
  eventId: string;
  initialLinks: ValidatorLink[];
}) {
  const [links, setLinks] = useState<ValidatorLink[]>(initialLinks);
  const [labelInput, setLabelInput] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function generateLink() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/validator-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: labelInput.trim() || undefined }),
      }).catch(() => null);

      if (res?.ok) {
        const json = await res.json();
        setLinks((prev) => [json, ...prev]);
        setLabelInput("");
        toast.success("Link de validação gerado.");
      } else {
        toast.error("Não foi possível gerar o link.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function revokeLink(id: string) {
    if (!confirm("Revogar este link? Quem estiver com ele na porta perde o acesso à validação.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/access-links/${id}/revoke`, { method: "POST" }).catch(
        () => null,
      );
      if (res?.ok) {
        setLinks((prev) => prev.filter((link) => link.id !== id));
        toast.success("Link revogado.");
      } else {
        toast.error("Não foi possível revogar o link.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function revokeAll() {
    if (!confirm(`Revogar todos os ${links.length} links ativos? Ninguém mais consegue validar entradas até gerar um novo.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/validator-link/revoke`, {
        method: "POST",
      }).catch(() => null);
      if (res?.ok) {
        setLinks([]);
        toast.success("Todos os links foram revogados.");
      } else {
        toast.error("Não foi possível revogar os links.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-card border border-line bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Novo link de validação
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="validator-label" className="sr-only">
            Rótulo do link (opcional)
          </label>
          <input
            id="validator-label"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Rótulo opcional (ex: Portão A)"
            className="flex-1 rounded-2xl border border-line bg-card px-4 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-guava"
          />
          <Button size="sm" onClick={generateLink} disabled={loading} type="button">
            <PlusIcon width={14} height={14} />
            Gerar link
          </Button>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          Dá pra manter mais de um ativo ao mesmo tempo — um por portão, por exemplo.
        </p>
      </div>

      {links.length === 0 ? (
        <div className="rounded-card border border-dashed border-line p-5 text-center text-sm text-ink-muted">
          <TicketIcon width={20} height={20} className="mx-auto mb-1 text-ink-faint" />
          Nenhum link de validação ativo.
        </div>
      ) : (
        <>
          {links.map((link) => (
            <ValidatorLinkCard
              key={link.id}
              link={link}
              onRevoke={() => revokeLink(link.id)}
              loading={loading}
            />
          ))}
          {links.length > 1 && (
            <button
              type="button"
              onClick={revokeAll}
              disabled={loading}
              className="w-full text-center text-xs font-semibold text-clay underline decoration-dotted disabled:opacity-40"
            >
              Revogar todos os links ativos
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ValidatorLinkCard({
  link,
  onRevoke,
  loading,
}: {
  link: ValidatorLink;
  onRevoke: () => void;
  loading: boolean;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(link.url, {
      margin: 1,
      width: 180,
      color: { dark: "#17191B", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [link.url]);

  return (
    <div className="rounded-card border border-line bg-card p-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`QR do link${link.label ? ` — ${link.label}` : ""}`}
            className="h-24 w-24 rounded-xl border border-line"
          />
        )}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-sm font-semibold text-ink">{link.label || "Link sem rótulo"}</p>
          <p className="mt-0.5 truncate text-xs text-ink-muted">{link.url}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <CopyLinkButton url={link.url} />
            <a
              href={`/v/${link.token}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-ink/30"
            >
              Abrir validador
            </a>
            <button
              type="button"
              onClick={onRevoke}
              disabled={loading}
              className="rounded-full border border-clay/30 px-3 py-1.5 text-xs font-semibold text-clay disabled:opacity-40"
            >
              Revogar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
