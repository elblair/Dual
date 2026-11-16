/** One bubble of the streak card: this calendar week, Monday first. */
export interface WeekDay {
  letter: string;
  /** I checked in on this day (any duel). */
  done: boolean;
  today: boolean;
  future: boolean;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** This week's 7 days (Monday to Sunday, in the viewer's time zone) from my real check-in times. */
export function thisWeek(checkInTimes: string[], now = new Date()): WeekDay[] {
  const checked = new Set(checkInTimes.map((iso) => dayKey(new Date(iso))));
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const todayKey = dayKey(now);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getTime());
    d.setDate(monday.getDate() + i);
    const key = dayKey(d);
    return {
      letter: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      done: checked.has(key),
      today: key === todayKey,
      future: d.getTime() > now.getTime() && key !== todayKey,
    };
  });
}

/** Monday 00:00 (local) of the week containing `now`, and the next Monday. */
export function weekBounds(now = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + 7);
  return { start, end };
}

/** "Nov 16 – 22", or "Nov 30 – Dec 6" when the week crosses a month. */
export function weekRangeLabel(now = new Date()): string {
  const { start, end } = weekBounds(now);
  const last = new Date(end.getTime() - 1);
  const month = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' });
  return start.getMonth() === last.getMonth()
    ? `${month(start)} ${start.getDate()} – ${last.getDate()}`
    : `${month(start)} ${start.getDate()} – ${month(last)} ${last.getDate()}`;
}

/** How many different days (local) I checked in between `from` (inclusive) and `to` (exclusive). */
export function daysPracticed(checkInTimes: string[], from: Date, to: Date): number {
  const days = new Set<string>();
  for (const iso of checkInTimes) {
    const d = new Date(iso);
    if (d >= from && d < to) days.add(dayKey(d));
  }
  return days.size;
}

/** The recap numbers: days practiced this week and last week (Monday to Sunday, viewer's time zone). */
export function recapNumbers(checkInTimes: string[], now = new Date()): { thisWeek: number; lastWeek: number } {
  const { start, end } = weekBounds(now);
  const lastStart = new Date(start.getTime());
  lastStart.setDate(lastStart.getDate() - 7);
  return { thisWeek: daysPracticed(checkInTimes, start, end), lastWeek: daysPracticed(checkInTimes, lastStart, start) };
}

/** "+2", "-1" or "+0" (with a real minus sign). */
export function signed(n: number): string {
  return n >= 0 ? `+${n}` : `\u2212${-n}`;
}
