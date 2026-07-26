"use client";

import { useCallback, useEffect, useState } from "react";
import type { GuestRow } from "@/lib/guest-rows";
import {
  StatusBadge,
  guestResponseTone,
  credentialTone,
  CREDENTIAL_STATUS_LABEL,
  GUEST_RESPONSE_LABEL,
} from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchIcon } from "@/components/icons";
import { useToast } from "@/components/ui/Toast";

const statTiles = [
  { key: "yes" as const, label: "Confirmados", text: "text-mint", bg: "bg-mint-light" },
  { key: "pending" as const, label: "Pendentes", text: "text-amber", bg: "bg-amber-light" },
  { key: "no" as const, label: "Recusados", text: "text-clay", bg: "bg-clay-light" },
];

const selectClass =
  "rounded-full border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink focus:border-guava";

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

export function GuestList({ eventId, antiPenetra }: { eventId: string; antiPenetra: boolean }) {
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [counts, setCounts] = useState({ yes: 0, no: 0, pending: 0, total: 0 });
  const [search, setSearch] = useState("");
  const [responseFilter, setResponseFilter] = useState("");
  const [credentialFilter, setCredentialFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const toast = useToast();

  const loadGuests = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (responseFilter) params.set("response", responseFilter);
      if (credentialFilter) params.set("credential", credentialFilter);
      const qs = params.toString();

      const res = await fetch(`/api/events/${eventId}/guests${qs ? `?${qs}` : ""}`, {
        signal,
      }).catch(() => null);

      if (res?.ok) {
        const json = await res.json();
        setGuests(json.guests);
        setCounts(json.counts);
      }
      setLoading(false);
    },
    [eventId, search, responseFilter, credentialFilter],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => loadGuests(controller.signal), 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [loadGuests]);

  async function revokeCredential(credentialId: string) {
    setPendingActionId(credentialId);
    const res = await fetch(`/api/credentials/${credentialId}/revoke`, {
      method: "POST",
    }).catch(() => null);
    if (res?.ok) {
      toast.success("Credencial revogada.");
    } else {
      toast.error("Não foi possível revogar a credencial.");
    }
    await loadGuests();
    setPendingActionId(null);
  }

  async function reissueCredential(credentialId: string) {
    setPendingActionId(credentialId);
    const res = await fetch(`/api/credentials/${credentialId}/reissue`, {
      method: "POST",
    }).catch(() => null);
    if (res?.ok) {
      toast.success("Nova credencial emitida.");
    } else {
      toast.error("Não foi possível reemitir a credencial.");
    }
    await loadGuests();
    setPendingActionId(null);
  }

  const hasActiveFilters = Boolean(search || responseFilter || credentialFilter);

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        {statTiles.map((tile) => (
          <div key={tile.key} className={`rounded-2xl ${tile.bg} p-3.5 text-center`}>
            <p className={`font-mono text-xl font-semibold ${tile.text}`}>{counts[tile.key]}</p>
            <p className={`text-[11px] font-medium ${tile.text}`}>{tile.label}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-3">
        <SearchIcon
          width={16}
          height={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <label htmlFor="guest-search" className="sr-only">
          Buscar convidado por nome
        </label>
        <input
          id="guest-search"
          placeholder="Buscar convidado por nome"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-line bg-card py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-guava"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label htmlFor="response-filter" className="sr-only">
          Filtrar por resposta
        </label>
        <select
          id="response-filter"
          value={responseFilter}
          onChange={(e) => setResponseFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">Toda resposta</option>
          <option value="yes">Confirmados</option>
          <option value="pending">Pendentes</option>
          <option value="no">Recusados</option>
        </select>

        {antiPenetra && (
          <>
            <label htmlFor="credential-filter" className="sr-only">
              Filtrar por status da credencial
            </label>
            <select
              id="credential-filter"
              value={credentialFilter}
              onChange={(e) => setCredentialFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">Toda credencial</option>
              <option value="active">Válidas</option>
              <option value="used">Usadas (presentes)</option>
              <option value="revoked">Revogadas</option>
            </select>
          </>
        )}
      </div>

      {loading ? (
        <p className="px-1 text-sm text-ink-muted">Carregando…</p>
      ) : guests.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "Nada encontrado" : "Nenhum convidado ainda"}
          description={
            hasActiveFilters
              ? "Ajuste a busca ou os filtros."
              : "Compartilhe o link do evento para começar a receber confirmações."
          }
        />
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-card">
          {guests.map((guest) => (
            <li key={guest.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{guest.name}</p>
                {guest.main_guest_id && (
                  <p className="truncate text-xs text-ink-faint">
                    acompanhante de {guest.main_guest_name ?? "titular"}
                  </p>
                )}
                {guest.contact && (
                  <p className="truncate text-xs text-ink-muted">{guest.contact}</p>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StatusBadge
                  label={GUEST_RESPONSE_LABEL[guest.response] ?? guest.response}
                  tone={guestResponseTone(guest.response)}
                />

                {antiPenetra && guest.credential && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge
                        label={
                          CREDENTIAL_STATUS_LABEL[guest.credential.status] ?? guest.credential.status
                        }
                        tone={credentialTone(guest.credential.status)}
                      />
                      <div className="flex gap-1">
                        {guest.credential.status !== "revoked" && (
                          <button
                            type="button"
                            onClick={() => revokeCredential(guest.credential!.id)}
                            disabled={pendingActionId === guest.credential.id}
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-ink-faint underline decoration-dotted hover:text-clay disabled:opacity-40"
                          >
                            revogar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => reissueCredential(guest.credential!.id)}
                          disabled={pendingActionId === guest.credential.id}
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-ink-faint underline decoration-dotted hover:text-guava disabled:opacity-40"
                        >
                          reemitir
                        </button>
                      </div>
                    </div>
                    {guest.credential.status === "used" && guest.credential.checked_in_at && (
                      <p className="text-[10px] text-ink-faint">
                        entrou às {formatTime(guest.credential.checked_in_at)}
                        {guest.checked_in_via ? ` · ${guest.checked_in_via}` : ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
