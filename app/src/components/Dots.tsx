import { View } from 'react-native';
import { useTheme } from '@/theme';

/** done = filled, today = orange ring (not yet checked in), empty = not done, rest = rest day (hollow, muted). */
export type DayState = 'done' | 'today' | 'empty' | 'rest';

interface DotsProps {
  /** Exactly 7 entries, Monday-style day 1 to day 7 of the duel. */
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
    <View style={{ flexDirection: 'row', gap: t.sizes.dotGap[size] }} accessibilityLabel={`${days.filter((d) => d === 'done').length} of 7 days done`}>
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

/** Build the 7 dots from a list of checked-in day indexes (0 to 6) and the current day index. */
export function buildDays(doneDays: number[], todayIndex?: number, restDays: number[] = []): DayState[] {
  return Array.from({ length: 7 }, (_, i) =>
    doneDays.includes(i) ? 'done' : restDays.includes(i) ? 'rest' : i === todayIndex ? 'today' : 'empty',
  );
}
