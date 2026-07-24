"use client";

import { useEffect, useState } from "react";
import type { Guest } from "@rsvp/db";

const RESPONSE_LABEL: Record<string, string> = {
  yes: "Confirmado",
  no: "Não vai",
  pending: "Pendente",
};

export function GuestList({ eventId }: { eventId: string }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [counts, setCounts] = useState({ yes: 0, no: 0, pending: 0, total: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      const params = search ? `?q=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/events/${eventId}/guests${params}`, {
        signal: controller.signal,
      }).catch(() => null);

      if (res?.ok) {
        const json = await res.json();
        setGuests(json.guests);
        setCounts(json.counts);
      }
      setLoading(false);
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [eventId, search]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <p className="text-xl font-semibold text-green-700">{counts.yes}</p>
          <p className="text-xs text-green-700">Confirmados</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 text-center">
          <p className="text-xl font-semibold text-amber-700">{counts.pending}</p>
          <p className="text-xs text-amber-700">Pendentes</p>
        </div>
        <div className="rounded-lg bg-gray-100 p-3 text-center">
          <p className="text-xl font-semibold text-gray-700">{counts.no}</p>
          <p className="text-xs text-gray-700">Recusados</p>
        </div>
      </div>

      <input
        placeholder="Buscar convidado por nome..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />

      {loading ? (
        <p className="text-sm text-gray-500">Carregando...</p>
      ) : guests.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum convidado encontrado.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {guests.map((guest) => (
            <li key={guest.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {guest.name}
                  {guest.main_guest_id && (
                    <span className="ml-2 text-xs text-gray-400">acompanhante</span>
                  )}
                </p>
                {guest.contact && (
                  <p className="text-xs text-gray-500">{guest.contact}</p>
                )}
              </div>
              <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {RESPONSE_LABEL[guest.response]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
