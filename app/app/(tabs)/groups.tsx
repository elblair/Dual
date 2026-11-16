import { View } from 'react-native';
import { Avatar, Card, ErrorBanner, ErrorView, LoadingView, Screen, Text } from '@/components';
import { useGroups } from '@/data';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';

/**
 * Groups (Figma 217:239), rebuilt on real data: the people you have dueled with (head-to-head record) and a wins
 * leaderboard among you and them. Both come from finished duels in the database; nothing is sample content.
 */
export default function GroupsScreen() {
  const t = useTheme();
  const { data, error, loading, refetch } = useGroups();
  const { refreshing, onRefresh } = useRefresh(refetch);

  if (loading) {
    return (
      <Screen tabBar>
        <LoadingView />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen tabBar>
        <ErrorView message={error?.message ?? 'Something went wrong.'} onRetry={onRefresh} />
      </Screen>
    );
  }

  const anyWins = data.leaderboard.some((r) => r.wins > 0);

  return (
    <Screen scroll tabBar gap="loose" refresh={{ refreshing, onRefresh }}>
      <Text variant="display">Groups</Text>
      {error ? <ErrorBanner message={`${error.message} Pull down to try again.`} /> : null}

      <Text variant="label" color="muted">
        Wins leaderboard
      </Text>
      <View style={{ gap: t.spacing.hairline }}>
        {data.leaderboard.map((r, i) => (
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
            <Text variant="smallStrong">
              {r.wins} {r.wins === 1 ? 'win' : 'wins'}
            </Text>
          </View>
        ))}
      </View>
      {!anyWins ? (
        <Text variant="small" color="muted">
          No finished duels yet. Wins show up here when a duel ends.
        </Text>
      ) : null}

      <Text variant="label" color="muted">
        People you’ve dueled
      </Text>
      {data.rivals.length === 0 ? (
        <Text variant="small" color="muted">
          No one yet. Start a duel from the + tab and your opponents will be listed here.
        </Text>
      ) : null}
      {data.rivals.map((r) => (
        <Card key={r.person.id} variant="outline" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg, borderRadius: t.radii.lg }}>
          <Avatar name={r.person.name} tone="opponent" size="md" />
          <View style={{ flex: 1, gap: 1 }}>
            <Text variant="label">{r.person.name}</Text>
            {r.level ? (
              <Text variant="captionStrong" color="orangeDark">
                {r.level}
              </Text>
            ) : null}
            <Text variant="caption" color="muted">
              {r.duels} {r.duels === 1 ? 'duel' : 'duels'} · you {r.wins} – {r.losses}
              {r.ties > 0 ? ` (${r.ties} ${r.ties === 1 ? 'tie' : 'ties'})` : ''}
              {r.active > 0 ? ` · ${r.active} live` : ''}
            </Text>
            {r.nextLevel && r.duelsToNextLevel ? (
              <Text variant="caption" color="muted">
                {r.duelsToNextLevel} more finished {r.duelsToNextLevel === 1 ? 'duel' : 'duels'} to {r.nextLevel}
              </Text>
            ) : null}
          </View>
        </Card>
      ))}
    </Screen>
  );
}
