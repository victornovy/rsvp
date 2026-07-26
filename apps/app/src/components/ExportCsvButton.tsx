"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { DownloadIcon } from "@/components/icons";

export function ExportCsvButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/export`);

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(json?.error?.message ?? "Não foi possível exportar o CSV.");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] ?? "convidados.csv";

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      toast.success("CSV exportado.");
    } catch {
      toast.error("Erro de conexão ao exportar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:border-ink/30 disabled:opacity-50"
    >
      <DownloadIcon width={14} height={14} />
      {loading ? "Exportando…" : "Exportar CSV"}
    </button>
  );
}
