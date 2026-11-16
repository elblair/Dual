import { buildDays, type DayState } from '@/components';
import type { ColorName } from '@/theme';
import type { Duel } from '@/data';

export const myScore = (d: Duel) => d.myDays.length;
export const theirScore = (d: Duel) => d.theirDays.length;

/** "4 – 4" (en dash, as in the design). */
export const scoreText = (d: Duel) => `${myScore(d)} – ${theirScore(d)}`;

export const isLive = (d: Duel) => d.status === 'active' && d.today <= 6;
export const checkedInToday = (d: Duel) => d.myDays.includes(d.today);
export const restingToday = (d: Duel) => d.myRestDays.includes(d.today);
export const needsCheckIn = (d: Duel) => isLive(d) && !checkedInToday(d) && !restingToday(d);

/** Green when tied or ahead, maroon when behind. */
export function scoreColor(d: Duel): ColorName {
  return myScore(d) >= theirScore(d) ? 'success' : 'maroonBright';
}

/** My 7 dots: orange ring on today while the duel is live. */
export function myDayStates(d: Duel): DayState[] {
  return buildDays(d.myDays, isLive(d) ? d.today : undefined, d.myRestDays);
}

export function theirDayStates(d: Duel): DayState[] {
  return buildDays(d.theirDays);
}

export const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
