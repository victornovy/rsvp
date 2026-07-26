interface SummaryTile {
  label: string;
  value: string;
}

export function EventSummaryCards({
  total,
  confirmed,
  checkedIn,
  antiPenetra,
}: {
  total: number;
  confirmed: number;
  checkedIn: number;
  antiPenetra: boolean;
}) {
  const attendanceRate = antiPenetra && confirmed > 0 ? Math.round((checkedIn / confirmed) * 100) : null;

  const tiles: SummaryTile[] = [
    { label: "Convidados", value: String(total) },
    { label: "Confirmados", value: String(confirmed) },
    { label: "Presentes", value: antiPenetra ? String(checkedIn) : "—" },
    { label: "% presença", value: attendanceRate !== null ? `${attendanceRate}%` : "—" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-2xl border border-line bg-card p-4 text-center">
          <p className="font-mono text-2xl font-semibold text-ink">{tile.value}</p>
          <p className="mt-0.5 text-[11px] font-medium text-ink-muted">{tile.label}</p>
        </div>
      ))}
    </div>
  );
}
