export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export function formatShortDate(date: Date) {
  return shortDateFormatter.format(date).replace(".", "");
}

const monthAbbrevFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });

export function formatMonthAbbrev(date: Date) {
  return monthAbbrevFormatter.format(date).replace(".", "");
}

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

export function formatWeekdayDate(date: Date) {
  const weekday = weekdayFormatter.format(date).replace(".", "");
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${formatShortDate(date)}`;
}

export function formatRelativeDate(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  if (days < 14) return "há 1 semana";
  if (days < 30) return `há ${Math.floor(days / 7)} semanas`;
  const months = Math.floor(days / 30);
  return `há ${months} ${months === 1 ? "mês" : "meses"}`;
}

const longDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatLongDate(date: Date) {
  const formatted = longDateFormatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function greetingForHour(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function matchesQuery(query: string, ...fields: Array<string | null | undefined>) {
  const q = query.trim().toLocaleLowerCase("pt-BR");
  if (!q) return true;
  return fields.some((field) => field?.toLocaleLowerCase("pt-BR").includes(q));
}

export function toDateInput(date: Date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toTimeInput(date: Date) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
