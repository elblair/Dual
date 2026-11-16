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

/** For a code invite nobody has accepted yet: "Invite sent · code K3X9". */
export const pendingInviteLabel = (d: Duel) => `Invite sent${d.inviteCode ? ` · code ${d.inviteCode}` : ''}`;

/** "You lead by 1", "Tied", or "Eleanor leads by 2". */
export function leadLabel(d: Duel): string {
  const diff = myScore(d) - theirScore(d);
  return diff === 0 ? 'Tied' : diff > 0 ? `You lead by ${diff}` : `${friendName(d)} leads by ${-diff}`;
}

/** "2 days left" after today, or "Last day" (a 7-day duel on day 5 has 2 days left). */
export function daysLeftLabel(d: Duel): string {
  const left = d.lengthDays - 1 - d.today;
  return left <= 0 ? 'Last day' : left === 1 ? '1 day left' : `${left} days left`;
}

/** The other player's name for sentences ("Sam gets a tap to confirm it"). */
export const friendName = (d: Duel) => d.opponent?.name ?? 'Your friend';

/** One letter per duel day, starting from the weekday the duel started on (M T W T F S S for a duel that began on a Monday). */
export function weekdayLetters(startedAt: string | null, days = 7): string[] {
  const start = startedAt ? new Date(startedAt) : new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime());
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString('en-US', { weekday: 'narrow' });
  });
}

/** The weekday the duel's last day falls on ("Saturday"). */
export function lastDayName(startedAt: string | null, days = 7): string {
  const d = startedAt ? new Date(startedAt) : new Date();
  d.setDate(d.getDate() + days - 1);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}
