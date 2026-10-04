export function formatDuration(value: number | null): string {
  if (value === null) return "—";
  const sign = value < 0 ? "−" : "";
  const magnitude = Math.abs(value);
  if (magnitude < 1) return `${sign}${Math.round(magnitude * 1_000)}μs`;
  if (magnitude < 1_000) return `${sign}${magnitude.toFixed(magnitude < 10 ? 1 : 0)}ms`;
  return `${sign}${(magnitude / 1_000).toFixed(2)}s`;
}

export function formatCost(value: string | null): string {
  if (value === null) return "—";
  const numeric = Number(value);
  if (numeric === 0) return "$0";
  const sign = numeric < 0 ? "−" : "";
  const magnitude = Math.abs(numeric);
  if (magnitude < 0.01) return `${sign}$${magnitude.toFixed(5)}`;
  return `${sign}$${magnitude.toFixed(2)}`;
}

export function formatTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function formatDate(value: string): string {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `Today, ${formatTime(value)}`;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
