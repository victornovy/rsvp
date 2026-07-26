"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Event } from "@rsvp/db";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { ImagePlusIcon, XIcon } from "@/components/icons";
import { useToast } from "@/components/ui/Toast";

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

const fieldLabel = "block text-xs font-semibold uppercase tracking-wide text-ink-muted";
const inputClass =
  "mt-1.5 w-full rounded-2xl border border-line bg-card px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-guava";

function FormSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-card p-5 sm:p-6">
      <p className="font-mono text-[11px] uppercase tracking-widest text-guava">{eyebrow}</p>
      <h2 className="mt-1 font-display text-lg text-ink">{title}</h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function EventForm({ mode, event }: EventFormProps) {
  const router = useRouter();
  const toast = useToast();
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return imagePreview ? event?.image_url ?? null : null;

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
        const message = json.error?.message ?? "Não foi possível salvar o evento.";
        setError(message);
        toast.error(message);
        return;
      }

      if (json.warning) {
        toast.info(json.warning.message);
      } else {
        toast.success(mode === "create" ? "Evento criado." : "Alterações salvas.");
      }

      const savedEvent = json.event;
      router.push(`/events/${savedEvent.id}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-24">
      <FormSection eyebrow="Passo 1" title="Detalhes do evento">
        <div>
          <label className={fieldLabel}>Título</label>
          <input
            required
            placeholder="Aniversário da Marina"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={fieldLabel}>Data e hora</label>
            <input
              required
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={fieldLabel}>Local</label>
            <input
              placeholder="Espaço Vila, São Paulo"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={fieldLabel}>Descrição</label>
          <textarea
            placeholder="Detalhes que os convidados devem saber: dress code, estacionamento, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inputClass}
          />
        </div>
      </FormSection>

      <FormSection eyebrow="Passo 2" title="Imagem de capa">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        {imagePreview ? (
          <div className="group relative overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Prévia do evento" className="h-44 w-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-white backdrop-blur transition hover:bg-ink"
              aria-label="Remover imagem"
            >
              <XIcon width={16} height={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-ink-muted transition hover:border-guava hover:text-guava"
          >
            <ImagePlusIcon width={24} height={24} />
            <span className="text-sm font-medium">Adicionar imagem</span>
          </button>
        )}
      </FormSection>

      <FormSection eyebrow="Passo 3" title="Capacidade e acesso">
        <div>
          <label className={fieldLabel}>Máximo de pessoas</label>
          <div className="mt-1.5 flex w-full items-center justify-between rounded-2xl border border-line bg-card px-2 py-1.5">
            <button
              type="button"
              onClick={() => setMaxPeople((n) => Math.max(1, n - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-ink-muted transition hover:bg-black/[0.04] hover:text-ink"
              aria-label="Diminuir"
            >
              –
            </button>
            <input
              required
              type="number"
              min={1}
              value={maxPeople}
              onChange={(e) => setMaxPeople(Number(e.target.value))}
              className="w-16 border-0 bg-transparent text-center font-mono text-lg text-ink focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setMaxPeople((n) => n + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold text-ink-muted transition hover:bg-black/[0.04] hover:text-ink"
              aria-label="Aumentar"
            >
              +
            </button>
          </div>
        </div>

        <Switch
          checked={antiPenetra}
          onChange={setAntiPenetra}
          label="Modo anti-penetra"
          description="Validação por QR na entrada — chegando em breve. Ativar aqui já reserva a configuração para quando lançar."
        />
      </FormSection>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="mx-auto max-w-xl">
          {error && (
            <p className="mb-2 rounded-xl border border-clay/30 bg-clay-light px-3.5 py-2 text-sm text-clay">
              {error}
            </p>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Salvando…" : mode === "create" ? "Criar evento" : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </form>
  );
}
