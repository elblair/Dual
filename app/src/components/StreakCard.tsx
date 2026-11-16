import { View } from 'react-native';
import { Flame } from 'lucide-react-native';
import type { WeekDay } from '@/lib/week';
import { useTheme } from '@/theme';
import { Card } from './Card';
import { Text } from './Text';

interface StreakCardProps {
  title: string;
  subtitle: string;
  week: WeekDay[];
}

/** Today's streak card (Figma Base Home 195:233): flame, "N-day streak", and this week's 7 day bubbles. */
export function StreakCard({ title, subtitle, week }: StreakCardProps) {
  const t = useTheme();
  const size = t.sizes.weekDay;
  return (
    <Card variant="maroon" style={{ borderRadius: t.radii.hero, padding: t.spacing.xxxl, gap: t.spacing.xxl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
        <Flame size={t.sizes.icon.flame} color={t.colors.orange} strokeWidth={2} />
        <View style={{ flex: 1, gap: t.spacing.hairline }}>
          <Text variant="headingLg" color="white">
            {title}
          </Text>
          <Text variant="small" color="onDarkMuted">
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityLabel="This week">
        {week.map((d, i) => (
          <View
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: d.done ? t.colors.card : d.today ? 'transparent' : t.colors.overlayLight,
              borderWidth: d.today ? t.borders.selected : 0,
              borderColor: d.today ? t.colors.orange : undefined,
              opacity: d.future ? 0.6 : 1,
            }}
          >
            <Text variant="captionStrong" color={d.done ? 'tabActive' : 'white'}>
              {d.letter}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
