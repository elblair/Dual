import { View } from 'react-native';
import { useTheme } from '@/theme';

/** done = filled, today = orange ring (not yet checked in), empty = not done, rest = rest day (hollow, muted). */
export type DayState = 'done' | 'today' | 'empty' | 'rest';

interface DotsProps {
  /** One entry per check-in slot: 7 (day 1 to day 7) in a daily duel, fewer when the duel is weekly or N times a week. */
  days: DayState[];
  /** you = blue, opponent = maroon (the one way to show who's winning). */
  tone: 'you' | 'opponent';
  size?: 'md' | 'lg';
}

export function Dots({ days, tone, size = 'md' }: DotsProps) {
  const t = useTheme();
  const px = t.sizes.dot[size];
  const fill = tone === 'you' ? t.colors.blue : t.colors.maroonBright;

  return (
    <View style={{ flexDirection: 'row', gap: t.sizes.dotGap }} accessibilityLabel={`${days.filter((d) => d === 'done').length} of ${days.length} done`}>
      {days.map((state, i) => (
        <View
          key={i}
          style={{
            width: px,
            height: px,
            borderRadius: px / 2,
            backgroundColor: state === 'done' ? fill : state === 'empty' ? t.colors.dotEmpty : 'transparent',
            borderWidth: state === 'today' || state === 'rest' ? t.borders.selected : 0,
            borderColor: state === 'today' ? t.colors.orange : state === 'rest' ? t.colors.mutedSoft : undefined,
          }}
        />
      ))}
    </View>
  );
}

/** The dots for a weekly or "N times a week" duel: one per slot, filled in order as check-ins are made (the days do not matter).
 *  The orange ring is on the next slot while today still needs a check-in. */
export function buildSlots(done: number, slots: number, needsToday: boolean): DayState[] {
  return Array.from({ length: slots }, (_, i) => (i < done ? 'done' : i === done && needsToday ? 'today' : 'empty'));
}

/** Build the 7 dots from a list of checked-in day indexes (0 to 6) and the current day index. */
export function buildDays(doneDays: number[], todayIndex?: number, restDays: number[] = []): DayState[] {
  return Array.from({ length: 7 }, (_, i) =>
    doneDays.includes(i) ? 'done' : restDays.includes(i) ? 'rest' : i === todayIndex ? 'today' : 'empty',
  );
}
