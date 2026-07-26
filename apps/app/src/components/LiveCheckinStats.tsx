"use client";

import { useEffect, useState } from "react";

const POLL_MS = 5000;

export function LiveCheckinStats({
  eventId,
  initialConfirmed,
  initialCheckedIn,
}: {
  eventId: string;
  initialConfirmed: number;
  initialCheckedIn: number;
}) {
  const [stats, setStats] = useState({ confirmed: initialConfirmed, checkedIn: initialCheckedIn });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/events/${eventId}/checkin-stats`).catch(() => null);
      if (res?.ok && !cancelled) {
        const json = await res.json();
        setStats({ confirmed: json.confirmed, checkedIn: json.checkedIn });
      }
    }

    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [eventId]);

  const pct = stats.confirmed > 0 ? Math.min(100, Math.round((stats.checkedIn / stats.confirmed) * 100)) : 0;

  return (
    <div className="rounded-card border border-line bg-card p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Confirmados x presentes
        </p>
        <p className="font-mono text-xs text-ink-faint">ao vivo</p>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-semibold text-ink">{stats.checkedIn}</span>
        <span className="text-sm text-ink-muted">/ {stats.confirmed} presentes</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
        <div
          className="h-full rounded-full bg-mint transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
