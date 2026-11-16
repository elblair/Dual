/** "Sunday, Nov 15" (the eyebrow on Today uppercases it). */
export function todayLabel(now = new Date()): string {
  return now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

/** "Nov 22" */
export function shortDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** A week from now, as "Nov 22". */
export function inOneWeek(now = new Date()): string {
  return shortDate(new Date(now.getTime() + 7 * 24 * 3600 * 1000));
}

/** "Today 7:42 AM", "Yesterday 7:42 AM", or "Mon 7:42 AM" for a check-in time, in the viewer's time zone. */
export function whenLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const day = days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'short' });
  return `${day} ${time}`;
}

/** "Nov 16, 4:12 PM" in the viewer's time zone (for database timestamps). */
export function dateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
