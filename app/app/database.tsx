import { Platform, View } from 'react-native';
import { Redirect } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { BackButton, Card, ConnectionBadge, ErrorBanner, ErrorView, LoadingView, Pill, Screen, Text } from '@/components';
import { DEMO } from '@/config';
import { useDbSnapshot } from '@/data';
import { hobbyById } from '@/data/sample';
import { dateTime } from '@/lib/dates';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';

/**
 * Database (demo): the latest users and duels straight from the tables, newest first.
 * NOT in Figma: built from the theme. Pull down to refresh (on web, tap Refresh).
 */
export default function DatabaseScreen() {
  const t = useTheme();
  const { data, error, loading, refetch } = useDbSnapshot();
  const { refreshing, onRefresh } = useRefresh(refetch);

  if (!DEMO) return <Redirect href="/today" />;
  if (loading) {
    return (
      <Screen>
        <View style={{ alignItems: 'flex-start' }}>
          <BackButton />
        </View>
        <ConnectionBadge />
        <LoadingView label="Loading rows…" />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        <View style={{ alignItems: 'flex-start' }}>
          <BackButton />
        </View>
        <ConnectionBadge />
        <ErrorView message={error?.message ?? 'Could not load the database.'} onRetry={onRefresh} />
      </Screen>
    );
  }

  return (
    <Screen scroll gap="loose" refresh={{ refreshing, onRefresh }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton />
        {Platform.OS === 'web' ? <Pill label={refreshing ? 'Refreshing…' : 'Refresh'} icon={RefreshCw} onPress={onRefresh} /> : null}
      </View>

      <View style={{ gap: t.spacing.sm }}>
        <Text variant="display">Database</Text>
        <Text variant="small" color="muted">
          {data.database.engine === 'in-memory mock'
            ? 'Demo data kept in memory on this device. This is the mock fallback, not the database.'
            : `Live rows from ${data.database.engine} on ${data.database.host}, newest first.`}{' '}
          {Platform.OS === 'web' ? 'Tap Refresh' : 'Pull down'} to reload.
        </Text>
      </View>
      <ConnectionBadge />
      {error ? <ErrorBanner message={`${error.message} Showing the last rows we loaded.`} /> : null}

      <Text variant="label" color="muted">
        users · {data.userCount} rows (latest {data.users.length})
      </Text>
      {data.users.map((u) => (
        <Card key={u.id} variant="surface" style={{ gap: t.spacing.hairline }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.md }}>
            <Text variant="bodyStrong" style={{ flexShrink: 1 }}>
              {u.name}
            </Text>
            <Text variant="captionStrong" color={u.isSeeded ? 'orangeDark' : u.isGuest ? 'muted' : 'success'}>
              {u.isSeeded ? 'seeded friend' : u.isGuest ? 'guest' : 'account'}
            </Text>
          </View>
          <Text variant="small" color={u.email ? 'ink' : 'muted'}>
            {u.email ?? 'no email'}
          </Text>
          <Text variant="caption" color="muted">
            created_at {dateTime(u.createdAt)}
          </Text>
        </Card>
      ))}

      <Text variant="label" color="muted">
        duels · {data.duelCount} rows (latest {data.duels.length})
      </Text>
      {data.duels.length === 0 ? (
        <Text variant="small" color="muted">
          No duels yet.
        </Text>
      ) : null}
      {data.duels.map((d) => (
        <Card key={d.id} variant="surface" style={{ gap: t.spacing.hairline }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.md }}>
            <Text variant="bodyStrong" style={{ flexShrink: 1 }}>
              {hobbyById(d.hobbyId).label} · {d.goal}
            </Text>
            <Text variant="captionStrong" color="muted">
              {d.status} · {d.score}
            </Text>
          </View>
          <Text variant="small">
            {d.creator} vs {d.opponent}
          </Text>
          <Text variant="caption" color="muted">
            #{d.id} · day {Math.min(d.today + 1, 7)} of 7 · created_at {dateTime(d.createdAt)}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
