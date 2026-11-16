import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { BackButton, Button, Card, Chip, ErrorView, LoadingView, Screen, Text } from '@/components';
import { useDuels, useMe, useStats, type Duel } from '@/data';
import { hobbyById } from '@/data/catalog';
import { daysLeftLabel, friendName, leadLabel, scoreText } from '@/lib/duel';
import { duelHref, resultHref } from '@/lib/routes';
import { useRefresh } from '@/lib/useRefresh';
import { recapNumbers, signed, weekBounds, weekRangeLabel } from '@/lib/week';
import { useTheme } from '@/theme';

const DAY_MS = 86_400_000;

/** When a started duel ends (its start plus its length). */
const endsAt = (d: Duel) => new Date(new Date(d.startedAt ?? Date.now()).getTime() + d.lengthDays * DAY_MS);

/** "Mon Nov 23, 4:12 PM" */
const endLabel = (d: Duel) => {
  const e = endsAt(d);
  return `${e.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, ${e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

/**
 * Weekly recap (Figma Base Recap 199:94). Computed from your real check-ins and duels each time you open it; nothing is
 * sent on Sundays. Dropped from the frame: "Chat stays in your group chats", the floor rivalry, and "Your rest day is ...".
 */
export default function RecapScreen() {
  const t = useTheme();
  const router = useRouter();
  const { data: me, loading: meLoading, refetch: refetchMe } = useMe();
  const { data: stats, error: statsError, loading: statsLoading, refetch: refetchStats } = useStats();
  const { data: duels, error: duelsError, loading: duelsLoading, refetch: refetchDuels } = useDuels();
  const { refreshing, onRefresh } = useRefresh(refetchMe, refetchStats, refetchDuels);

  if (meLoading || statsLoading || duelsLoading) {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  }
  if (!me || !stats || !duels) {
    return (
      <Screen>
        <ErrorView message={(statsError ?? duelsError)?.message ?? 'Something went wrong.'} onRetry={onRefresh} />
      </Screen>
    );
  }

  const now = new Date();
  const { start } = weekBounds(now);
  const { thisWeek, lastWeek } = recapNumbers(stats.recentCheckIns, now);
  const tiles = [
    { value: String(thisWeek), label: thisWeek === 1 ? 'day practiced' : 'days practiced' },
    { value: signed(thisWeek - lastWeek), label: 'vs last week' },
    { value: String(stats.currentStreak), label: 'day streak' },
  ];

  const live = duels.filter((d) => d.status === 'active' || d.status === 'paused');
  const endedThisWeek = duels.filter((d) => d.status === 'finished' && endsAt(d) >= start);
  const comingUp = live.filter((d) => d.status === 'active');

  const resultLine = (d: Duel) => {
    const who = d.result?.winner === 'me' ? 'You won' : d.result?.winner === 'them' ? `${friendName(d)} won` : 'Tied';
    return `Ended · ${who} ${d.myDays.length}–${d.theirDays.length}`;
  };

  return (
    <Screen scroll gap="loose" refresh={{ refreshing, onRefresh }}>
      <View style={{ alignItems: 'flex-start' }}>
        <BackButton />
      </View>

      <View style={{ gap: t.spacing.sm }}>
        <Text variant="title">Weekly recap</Text>
        <Text variant="subtitle" color="muted">
          {weekRangeLabel(now)} · Worked out from your check-ins each time you open it.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
        {tiles.map((s) => (
          <Card
            key={s.label}
            variant="surface"
            style={{ flex: 1, alignItems: 'center', gap: t.spacing.hairline, borderRadius: t.radii.md, paddingHorizontal: t.spacing.sm, paddingVertical: t.spacing.xl }}
          >
            <Text variant="headingLg">{s.value}</Text>
            <Text variant="micro" color="muted" align="center">
              {s.label}
            </Text>
          </Card>
        ))}
      </View>

      <Text variant="headingSm">Your duals this week</Text>
      {endedThisWeek.length + live.length === 0 ? (
        <Text variant="small" color="muted">
          No duels this week yet. Start one below.
        </Text>
      ) : null}
      {endedThisWeek.map((d) => (
        <Pressable key={d.id} accessibilityRole="button" onPress={() => router.push(resultHref(d.id))}>
        <Card variant="surface" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg, borderRadius: t.radii.lg }}>
          <View style={{ flex: 1, gap: t.spacing.hairline }}>
            <Text variant="label">
              {hobbyById(d.hobbyId).label} vs {friendName(d)}
            </Text>
            <Text variant="caption" color="muted">
              {resultLine(d)}
            </Text>
          </View>
          <Chip label="Rematch?" tone="orange" />
        </Card>
        </Pressable>
      ))}
      {live.map((d) => (
        <Pressable key={d.id} accessibilityRole="button" onPress={() => router.push(duelHref(d.id))}>
        <Card variant="surface" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg, borderRadius: t.radii.lg }}>
          <View style={{ flex: 1, gap: t.spacing.hairline }}>
            <Text variant="label">
              {hobbyById(d.hobbyId).label} vs {friendName(d)}
            </Text>
            <Text variant="caption" color="muted">
              {d.status === 'paused' ? 'Paused' : `${leadLabel(d)} · ${daysLeftLabel(d)}`} · {scoreText(d)}
            </Text>
          </View>
          <Chip label={d.status === 'paused' ? 'Paused' : 'Live'} tone={d.status === 'paused' ? 'neutral' : 'success'} />
        </Card>
        </Pressable>
      ))}

      {comingUp.length > 0 ? (
        <>
          <Text variant="headingSm">Coming up</Text>
          <View style={{ gap: t.spacing.lg }}>
            {comingUp.map((d) => (
              <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
                <Clock size={t.sizes.icon.lg} color={t.colors.orangeDark} strokeWidth={2} />
                <Text variant="small">
                  {hobbyById(d.hobbyId).label} vs {friendName(d)} ends {endLabel(d)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Card variant="maroon" style={{ borderRadius: t.radii.hero, padding: t.spacing.xxl, gap: t.spacing.xl }}>
        <Text variant="captionStrong" color="orange">
          START YOUR NEXT DUAL
        </Text>
        <Text variant="headingSm" color="white">
          Keep the momentum going with a new challenge this week.
        </Text>
        <Button label="Pick a friend" variant="outline" onPress={() => router.push('/hobby')} />
      </Card>
    </Screen>
  );
}
