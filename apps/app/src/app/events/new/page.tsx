import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { EventForm } from "@/components/EventForm";

export default async function NewEventPage() {
  await requireUser();

  return (
    <>
      <AppHeader title="Novo evento" />
      <main className="mx-auto max-w-xl px-4 py-8">
        <EventForm mode="create" />
      </main>
    </>
  );
}
