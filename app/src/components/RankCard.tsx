import { View } from 'react-native';
import { Check, Lock, Trophy } from 'lucide-react-native';
import type { Stats } from '@/data';
import { useTheme } from '@/theme';
import { Card } from './Card';
import { Text } from './Text';

interface RankCardProps {
  stats: Stats;
}

/** The rank card on You (Figma Base Profile 199:168): tier, XP progress bar, and what each tier unlocks. All from the API. */
export function RankCard({ stats }: RankCardProps) {
  const t = useTheme();
  const perks = stats.tiers.filter((tier) => tier.perk);
  const nextTier = stats.tiers.find((tier) => tier.name === stats.nextTier);
  return (
    <Card variant="surface" style={{ borderRadius: t.radii.hero, padding: t.spacing.xxl, gap: t.spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
        <Trophy size={t.sizes.icon.lg} color={t.colors.orange} strokeWidth={2} />
        <Text variant="subheading" style={{ flex: 1, fontFamily: t.fonts.bold }}>
          {stats.tier}
        </Text>
        <Text variant="small" color="muted">
          {nextTier ? `${stats.xp} / ${nextTier.minXp} XP` : `${stats.xp} XP`}
        </Text>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(stats.progress * 100) }}
        style={{ height: t.sizes.rankBar, borderRadius: t.sizes.rankBar / 2, backgroundColor: t.colors.dotEmpty, overflow: 'hidden' }}
      >
        <View style={{ width: `${Math.round(stats.progress * 100)}%`, height: '100%', backgroundColor: t.colors.blue }} />
      </View>

      <Text variant="caption" color="muted">
        {stats.nextTier && stats.xpToNext !== null ? `${stats.xpToNext} XP to ${stats.nextTier}` : 'Top tier reached'}
      </Text>

      <View style={{ gap: t.spacing.md }}>
        {perks.map((tier) => (
          <View key={tier.name} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
            <View
              style={{
                width: t.sizes.perkBadge,
                height: t.sizes.perkBadge,
                borderRadius: t.sizes.perkBadge / 2,
                backgroundColor: tier.reached ? t.colors.success : t.colors.surfaceStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {tier.reached ? (
                <Check size={t.sizes.icon.xs} color={t.colors.white} strokeWidth={3} />
              ) : (
                <Lock size={t.sizes.icon.xs} color={t.colors.muted} strokeWidth={2} />
              )}
            </View>
            <Text variant="small" color={tier.reached ? 'ink' : 'muted'} style={{ flex: 1 }}>
              {tier.name} · {tier.perk}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
