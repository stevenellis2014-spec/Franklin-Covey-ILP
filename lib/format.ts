const STATUS_LABELS: Record<string, string> = {
  on_track: "En curso",
  at_risk: "En riesgo",
  off_track: "Fuera de meta",
  achieved: "Alcanzada",
  open: "Abierto",
  done: "Cumplido",
  missed: "Incumplido",
  pending: "Pendiente",
  active: "Activo",
  completed: "Completado",
  in_progress: "En curso",
  enrolled: "Inscrito",
  draft: "Borrador",
  submitted: "Enviado",
  on_leave: "De permiso",
  suspended: "Suspendido",
  terminated: "Inactivo",
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  on_track: { bg: "#E4F1EA", fg: "#2E7D5B" },
  done: { bg: "#E4F1EA", fg: "#2E7D5B" },
  active: { bg: "#E4F1EA", fg: "#2E7D5B" },
  completed: { bg: "#E4F1EA", fg: "#2E7D5B" },
  submitted: { bg: "#E4F1EA", fg: "#2E7D5B" },
  in_progress: { bg: "#E4F1EA", fg: "#2E7D5B" },
  enrolled: { bg: "#E4F1EA", fg: "#2E7D5B" },
  at_risk: { bg: "#FBEEE0", fg: "#C97A2B" },
  pending: { bg: "#FBEEE0", fg: "#C97A2B" },
  open: { bg: "#FBEEE0", fg: "#C97A2B" },
  draft: { bg: "#FBEEE0", fg: "#C97A2B" },
  on_leave: { bg: "#FBEEE0", fg: "#C97A2B" },
  off_track: { bg: "#F8E4E3", fg: "#B94A48" },
  missed: { bg: "#F8E4E3", fg: "#B94A48" },
  suspended: { bg: "#F8E4E3", fg: "#B94A48" },
  terminated: { bg: "#F8E4E3", fg: "#B94A48" },
  achieved: { bg: "#DDE9F1", fg: "#1B3A4B" },
};

export function statusLabel(s: string): string {
  return STATUS_LABELS[s] ?? s;
}

export function statusColor(s: string): { bg: string; fg: string } {
  return STATUS_COLORS[s] ?? { bg: "#EEE8DC", fg: "#7A8489" };
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
}

export function mciProgress(w: {
  baseline: number | null;
  target: number | null;
  current_value: number | null;
}): number {
  const baseline = w.baseline ?? 0;
  const target = w.target ?? 0;
  const current = w.current_value ?? 0;
  const range = target - baseline;
  if (range === 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((current - baseline) / range) * 100)));
}

export function currentIsoWeek(): string {
  const d = new Date();
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = (target.getTime() - firstThursday.getTime()) / 86400000;
  const week = 1 + Math.round((diff - 3) / 7);
  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function addWeeks(weekStr: string, delta: number): string {
  const [y, w] = weekStr.split("-W").map(Number);
  let nw = w + delta;
  let ny = y;
  if (nw < 1) {
    ny--;
    nw = 52;
  }
  if (nw > 52) {
    ny++;
    nw = 1;
  }
  return `${ny}-W${String(nw).padStart(2, "0")}`;
}
