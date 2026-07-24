"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelEventButton({ eventId, disabled }: { eventId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Tem certeza que deseja cancelar este evento?")) return;
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/cancel`, { method: "POST" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={disabled || loading}
      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-40"
    >
      {loading ? "Cancelando..." : "Cancelar evento"}
    </button>
  );
}
