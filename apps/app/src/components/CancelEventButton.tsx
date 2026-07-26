"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function CancelEventButton({ eventId, disabled }: { eventId: string; disabled?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Cancelar este evento? Os convidados verão que ele foi cancelado.")) return;
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/cancel`, { method: "POST" }).catch(() => null);
    setLoading(false);
    if (res?.ok) {
      toast.success("Evento cancelado.");
      router.refresh();
    } else {
      toast.error("Não foi possível cancelar o evento.");
    }
  }

  return (
    <Button type="button" variant="danger" onClick={handleCancel} disabled={disabled || loading}>
      {loading ? "Cancelando…" : "Cancelar evento"}
    </Button>
  );
}
