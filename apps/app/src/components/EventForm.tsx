"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Event } from "@rsvp/db";

interface EventFormProps {
  mode: "create" | "edit";
  event?: Event;
}

function toLocalDateTimeInput(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EventForm({ mode, event }: EventFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(event?.title ?? "");
  const [eventDate, setEventDate] = useState(toLocalDateTimeInput(event?.event_date));
  const [location, setLocation] = useState(event?.location ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [maxPeople, setMaxPeople] = useState(event?.max_people ?? 25);
  const [antiPenetra, setAntiPenetra] = useState(event?.anti_penetra ?? false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event?.image_url ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return event?.image_url ?? null;

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Sessão expirada.");

    const extension = imageFile.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("event-images")
      .upload(path, imageFile, { upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const imageUrl = await uploadImage();

      const payload = {
        title,
        event_date: new Date(eventDate).toISOString(),
        location: location || null,
        description: description || null,
        image_url: imageUrl,
        max_people: maxPeople,
        anti_penetra: antiPenetra,
      };

      const url = mode === "create" ? "/api/events" : `/api/events/${event!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Não foi possível salvar o evento.");
        return;
      }

      const savedEvent = json.event;
      router.push(`/events/${savedEvent.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700">Título</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Data e hora</label>
        <input
          required
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Local</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Imagem</label>
        <input type="file" accept="image/*" onChange={handleImageChange} className="mt-1 text-sm" />
        {imagePreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreview}
            alt="Prévia"
            className="mt-3 h-32 w-full rounded-lg object-cover"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Máximo de pessoas
        </label>
        <input
          required
          type="number"
          min={1}
          value={maxPeople}
          onChange={(e) => setMaxPeople(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={antiPenetra}
          onChange={(e) => setAntiPenetra(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        Modo anti-penetra (validação por QR — disponível em breve)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Salvando..." : mode === "create" ? "Criar evento" : "Salvar alterações"}
      </button>
    </form>
  );
}
