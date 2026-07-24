"use client";

import { useEffect, useState } from "react";

interface RsvpFormProps {
  publicToken: string;
  spotsRemaining: number;
}

interface Companion {
  name: string;
}

interface StoredRsvp {
  guestToken: string;
  name: string;
  response: "pending" | "yes" | "no";
}

function storageKey(publicToken: string) {
  return `rsvp:${publicToken}`;
}

export function RsvpForm({ publicToken, spotsRemaining }: RsvpFormProps) {
  const [stored, setStored] = useState<StoredRsvp | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey(publicToken));
    if (raw) {
      try {
        setStored(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem(storageKey(publicToken));
      }
    }
  }, [publicToken]);

  function addCompanion() {
    setCompanions((prev) => [...prev, { name: "" }]);
  }

  function updateCompanion(index: number, value: string) {
    setCompanions((prev) =>
      prev.map((companion, i) => (i === index ? { name: value } : companion)),
    );
  }

  function removeCompanion(index: number) {
    setCompanions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/rsvp/${publicToken}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact: contact || null,
          companions: companions.filter((c) => c.name.trim().length > 0),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Não foi possível confirmar presença.");
        return;
      }

      const guest = json.guest;
      const record: StoredRsvp = {
        guestToken: guest.guest_token,
        name: guest.name,
        response: guest.response,
      };
      window.localStorage.setItem(storageKey(publicToken), JSON.stringify(record));
      setStored(record);
      setSuccess(true);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateResponse(response: "yes" | "no") {
    if (!stored) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/rsvp/${publicToken}/response/${stored.guestToken}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response }),
        },
      );
      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Não foi possível atualizar sua resposta.");
        return;
      }

      const updated: StoredRsvp = { ...stored, response: json.guest.response };
      window.localStorage.setItem(storageKey(publicToken), JSON.stringify(updated));
      setStored(updated);
    } finally {
      setSubmitting(false);
    }
  }

  if (stored) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Sua confirmação, {stored.name}:</p>
        <p className="mt-1 text-lg font-semibold">
          {stored.response === "yes" && "Presença confirmada ✅"}
          {stored.response === "no" && "Você marcou que não vai comparecer"}
          {stored.response === "pending" && "Resposta pendente"}
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={submitting || stored.response === "yes"}
            onClick={() => updateResponse("yes")}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Confirmar presença
          </button>
          <button
            type="button"
            disabled={submitting || stored.response === "no"}
            onClick={() => updateResponse("no")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
          >
            Não vou comparecer
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold">Confirme sua presença</h2>
      <p className="mt-1 text-sm text-gray-500">
        {spotsRemaining > 0
          ? `${spotsRemaining} vaga(s) restante(s).`
          : "Este evento pode estar com lotação esgotada."}
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contato (telefone ou e-mail)
          </label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Acompanhantes
            </label>
            <button
              type="button"
              onClick={addCompanion}
              className="text-sm font-medium text-gray-900 underline"
            >
              + adicionar
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {companions.map((companion, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={companion.name}
                  onChange={(e) => updateCompanion(index, e.target.value)}
                  placeholder="Nome do acompanhante"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeCompanion(index)}
                  className="rounded-lg border border-gray-300 px-3 text-sm text-gray-500"
                >
                  remover
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Enviando..." : "Confirmar presença"}
      </button>
    </form>
  );
}
