import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ChevronRight, Copy } from 'lucide-react-native';
import { Avatar, Button, Card, ErrorBanner, Pill, Screen, Text } from '@/components';
import { LoadingView } from '@/components';
import { useLeaderboard } from '@/data';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';

/**
 * Groups (Figma 217:239). The floor battle and the invite code are sample data; the ranking list is real:
 * people in my duels ranked by minutes, loaded from the API.
 */
export default function GroupsScreen() {
  const t = useTheme();
  const router = useRouter();
  const { data: rows, error, loading, refetch } = useLeaderboard();
  const { refreshing, onRefresh } = useRefresh(refetch);
  const [copied, setCopied] = useState(false);

  const bars = [
    { label: 'Floor 3', value: '412 min', fill: t.colors.orange, share: 0.82 },
    { label: 'Floor 4', value: '388 min', fill: t.colors.white, share: 0.77 },
  ];

  async function copyCode() {
    await Clipboard.setStringAsync('FLR3-28');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Screen scroll tabBar gap="loose" refresh={{ refreshing, onRefresh }}>
      <Text variant="display">Groups</Text>

      <Card variant="slate" style={{ borderRadius: t.radii.hero, padding: t.spacing.s18, gap: t.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="eyebrow" color="white">
            Live · ends Sunday
          </Text>
          <Text variant="caption" color="onDarkMuted">
            Floor 3
          </Text>
        </View>
        <Text variant="headingLg" color="white">
          Floor 3 vs Floor 4
        </Text>
        {bars.map((b) => (
          <View key={b.label} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
            <Text variant="smallMedium" color="white" style={{ width: t.sizes.barLabel }}>
              {b.label}
            </Text>
            <View
              style={{
                flex: 1,
                height: t.sizes.bar,
                borderRadius: t.sizes.bar / 2,
                backgroundColor: t.colors.overlayTrack,
                overflow: 'hidden',
              }}
            >
              <View style={{ width: `${b.share * 100}%`, height: t.sizes.bar, borderRadius: t.sizes.bar / 2, backgroundColor: b.fill }} />
            </View>
            <Text variant="smallStrong" color="white">
              {b.value}
            </Text>
          </View>
        ))}
        <Text variant="small" color="onDarkSubtle">
          You added 95 min · 2nd on your floor
        </Text>
      </Card>

      <Text variant="label" color="muted">
        Top in your duals
      </Text>
      {loading ? (
        <View style={{ paddingVertical: t.spacing.gutter }}>
          <LoadingView label="Loading the ranking…" />
        </View>
      ) : null}
      {error ? <ErrorBanner message={`${error.message} Pull down to try again.`} /> : null}
      {!loading && rows && rows.length === 0 ? (
        <Text variant="small" color="muted">
          Start a dual to see who is ahead.
        </Text>
      ) : null}
      <View style={{ gap: t.spacing.hairline }}>
        {(rows ?? []).map((r, i) => (
          <View
            key={r.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.spacing.lg,
              paddingHorizontal: t.spacing.lg,
              paddingVertical: t.spacing.md,
              borderRadius: t.radii.sm,
              backgroundColor: r.isYou ? t.colors.blueTint : 'transparent',
            }}
          >
            <Text variant="small" color="muted" style={{ fontFamily: t.fonts.bold }}>
              {i + 1}
            </Text>
            <Avatar name={r.name} tone={r.tone} size="sm" />
            <Text variant="label" style={{ flex: 1 }}>
              {r.isYou ? 'You' : r.name}
            </Text>
            <Text variant="smallStrong">{r.minutes} min</Text>
          </View>
        ))}
      </View>

      <Card variant="surface" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg, borderRadius: t.radii.lg }}>
        <View style={{ flex: 1, gap: 1 }}>
          <Text variant="label">Invite your floor</Text>
          <Text variant="caption" color="muted">
            Code FLR3-28
          </Text>
        </View>
        <Pill label={copied ? 'Copied' : 'Copy'} icon={Copy} onPress={copyCode} />
      </Card>

      <Card variant="outline" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg, borderRadius: t.radii.lg }}>
        <View style={{ flex: 1, gap: 1 }}>
          <Text variant="label">CU Run Club</Text>
          <Text variant="caption" color="muted">
            8 members · Saturday long run
          </Text>
        </View>
        <ChevronRight size={t.sizes.icon.md} color={t.colors.muted} strokeWidth={2} />
      </Card>

      <Button label="Dual a floor-mate" onPress={() => router.push('/friend')} />
    </Screen>
  );
}
