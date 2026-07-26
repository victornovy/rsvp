"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { TicketCard, TicketDivider } from "@/components/ui/TicketCard";
import { PlusIcon, TicketIcon, XIcon } from "@/components/icons";

interface RsvpFormProps {
  publicToken: string;
  spotsRemaining: number;
  antiPenetra: boolean;
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

const responseCopy: Record<StoredRsvp["response"], { label: string; tone: string }> = {
  yes: { label: "Presença confirmada", tone: "border-mint text-mint" },
  no: { label: "Você não vai comparecer", tone: "border-clay text-clay" },
  pending: { label: "Resposta pendente", tone: "border-amber text-amber" },
};

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-line bg-card px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-guava";
const fieldLabel = "block text-xs font-semibold uppercase tracking-wide text-ink-muted";

export function RsvpForm({ publicToken, spotsRemaining, antiPenetra }: RsvpFormProps) {
  const [stored, setStored] = useState<StoredRsvp | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const copy = responseCopy[stored.response];
    return (
      <TicketCard notchTop={60} className="animate-fade-up p-7 text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
          Olá, {stored.name}
        </p>
        <div
          className={cn(
            "animate-stamp mx-auto mt-4 w-fit -rotate-3 rounded-xl border-[3px] px-5 py-2.5 font-display text-lg",
            copy.tone,
          )}
        >
          {copy.label}
        </div>

        {antiPenetra && stored.response === "yes" && (
          <a
            href={`/e/${publicToken}/credencial/${stored.guestToken}`}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            <TicketIcon width={16} height={16} />
            Ver minha credencial
          </a>
        )}

        <TicketDivider className="my-6" />

        <p className="text-sm text-ink-muted">Mudou de ideia? Atualize sua resposta:</p>
        {error && <p className="mt-3 text-sm text-clay">{error}</p>}
        <div className="mt-4 flex justify-center gap-3">
          <Button
            type="button"
            variant={stored.response === "yes" ? "secondary" : "primary"}
            disabled={submitting || stored.response === "yes"}
            onClick={() => updateResponse("yes")}
          >
            Vou comparecer
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={submitting || stored.response === "no"}
            onClick={() => updateResponse("no")}
          >
            Não vou
          </Button>
        </div>
      </TicketCard>
    );
  }

  const pillTone =
    spotsRemaining === 0 ? "text-clay bg-clay-light" : spotsRemaining <= 5 ? "text-amber bg-amber-light" : "text-mint bg-mint-light";

  return (
    <TicketCard notchTop={130} className="p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-ink">Confirme sua presença</h2>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide", pillTone)}>
          {spotsRemaining === 0 ? "lotado" : `${spotsRemaining} vaga(s)`}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-5">
        <div className="space-y-4">
          <div>
            <label className={fieldLabel}>Nome</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Seu nome completo"
            />
          </div>
          <div>
            <label className={fieldLabel}>Contato (telefone ou e-mail)</label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className={inputClass}
              placeholder="Opcional"
            />
          </div>
        </div>

        <TicketDivider className="my-5" />

        <div>
          <div className="flex items-center justify-between">
            <label className={fieldLabel}>Acompanhantes</label>
            <button
              type="button"
              onClick={addCompanion}
              className="flex items-center gap-1 text-xs font-semibold text-guava"
            >
              <PlusIcon width={13} height={13} />
              Adicionar
            </button>
          </div>
          {companions.length > 0 && (
            <div className="mt-2.5 space-y-2">
              {companions.map((companion, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={companion.name}
                    onChange={(e) => updateCompanion(index, e.target.value)}
                    placeholder="Nome do acompanhante"
                    className={cn(inputClass, "mt-0")}
                  />
                  <button
                    type="button"
                    onClick={() => removeCompanion(index)}
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl border border-line text-ink-faint transition hover:border-clay/40 hover:text-clay"
                    aria-label="Remover acompanhante"
                  >
                    <XIcon width={15} height={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-5 rounded-xl border border-clay/30 bg-clay-light px-3.5 py-2 text-sm text-clay">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting} className="mt-6 w-full">
          {submitting ? "Enviando…" : "Confirmar presença"}
        </Button>
      </form>
    </TicketCard>
  );
}
