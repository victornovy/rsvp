import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { EventForm } from "@/components/EventForm";

export default async function NewEventPage() {
  await requireUser();

  return (
    <>
      <AppHeader title="Novo evento" backHref="/dashboard" backLabel="Meus eventos" />
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 font-display text-2xl text-ink">Novo evento</h1>
        <EventForm mode="create" />
      </main>
    </>
  );
}
