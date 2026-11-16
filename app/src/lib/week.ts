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
