import { View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Avatar, Button, Card, ErrorBanner, ErrorView, LoadingView, Pill, RankCard, Screen, Text } from '@/components';
import { useData, useDuels, useMe, useStats } from '@/data';
import { hobbyById } from '@/data/catalog';
import { useRefresh } from '@/lib/useRefresh';
import { useAppearance, useTheme, type Appearance } from '@/theme';

/** You (Figma 217:314). Real numbers only: duels won, days checked in and the current streak, computed from the database. */
export default function YouScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { data: me, error: meError, loading: meLoading, refetch: refetchMe } = useMe();
  const { data: duels, error: duelsError, loading: duelsLoading, refetch: refetchDuels } = useDuels();
  const { data: stats, error: statsError, loading: statsLoading, refetch: refetchStats } = useStats();
  const { refreshing, onRefresh } = useRefresh(refetchMe, refetchDuels, refetchStats);
  const { appearance, setAppearance } = useAppearance();

  if (meLoading || duelsLoading || statsLoading) {
    return (
      <Screen tabBar>
        <LoadingView />
      </Screen>
    );
  }
  if (!me && !meError) return <Redirect href="/welcome" />; // signed out
  if (!me || !duels || !stats) {
    return (
      <Screen tabBar>
        <ErrorView message={(meError ?? duelsError ?? statsError)?.message ?? 'Something went wrong.'} onRetry={onRefresh} />
      </Screen>
    );
  }
  const loadError = duelsError ?? statsError ?? meError;

  const hobbies = [...new Set(duels.filter((d) => d.status !== 'pending').map((d) => hobbyById(d.hobbyId).label))];
  const tiles = [
    { value: stats.duelsWon, label: stats.duelsWon === 1 ? 'duel won' : 'duels won' },
    { value: stats.daysCheckedIn, label: stats.daysCheckedIn === 1 ? 'day checked in' : 'days checked in' },
    { value: stats.currentStreak, label: 'day streak' },
  ];

  return (
    <Screen scroll tabBar gap="loose" refresh={{ refreshing, onRefresh }}>
      <Text variant="display">You</Text>
      {loadError ? <ErrorBanner message={`${loadError.message} Pull down to try again.`} /> : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xl }}>
        <Avatar name={me.name} tone="brand" size="xl" ring="orange" />
        <View style={{ flex: 1, gap: t.spacing.hairline }}>
          <Text variant="heading">{me.name}</Text>
          <Text variant="small" color="muted">
            {hobbies.length ? hobbies.join(' · ') : 'No duels yet'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
        {tiles.map((s) => (
          <Card
            key={s.label}
            variant="surface"
            style={{
              flex: 1,
              alignItems: 'center',
              gap: t.spacing.hairline,
              borderRadius: t.radii.md,
              paddingHorizontal: t.spacing.sm,
              paddingVertical: t.spacing.xl,
            }}
          >
            <Text variant="headingLg">{s.value}</Text>
            <Text variant="micro" color="muted" align="center">
              {s.label}
            </Text>
          </Card>
        ))}
      </View>

      {stats.tiers.length > 0 ? <RankCard stats={stats} /> : null}

      <Card variant="outline" style={{ padding: t.spacing.xxl, gap: t.spacing.lg }}>
        <Text variant="label">Appearance</Text>
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          {(['system', 'light', 'dark'] as Appearance[]).map((a) => (
            <Pill
              key={a}
              label={a === 'system' ? 'Automatic' : a === 'light' ? 'Light' : 'Dark'}
              tone={appearance === a ? 'maroon' : 'soft'}
              onPress={() => setAppearance(a)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      </Card>

      <Card variant="outline" style={{ padding: t.spacing.xxl, gap: t.spacing.lg }}>
        <Text variant="label">Signed in</Text>
        <Text variant="caption" color="muted">
          {me.email ?? me.name}
        </Text>
        <Button
          label="Log out"
          variant="outline"
          onPress={async () => {
            await data.logout();
            router.replace('/welcome');
          }}
        />
      </Card>
    </Screen>
  );
}
