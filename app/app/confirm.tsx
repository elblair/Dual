import { useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { Check, Info } from 'lucide-react-native';
import { Avatar, BackButton, Button, Card, ErrorBanner, ErrorView, LoadingView, Screen, Text } from '@/components';
import { useData, useDuels, useMe, type Duel } from '@/data';
import { friendName, hobbyLabel } from '@/lib/duel';
import { whenLabel } from '@/lib/dates';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';

/**
 * Confirm check-ins (Figma Base Confirm 196:166): your friends' check-ins that are waiting for you, with the minutes and the
 * note they wrote. Dropped from the frame: the photo, "Ask about it" and the crew vote (not built), and Strava auto-verified rows.
 */
export default function ConfirmScreen() {
  const t = useTheme();
  const data = useData();
  const { data: me, loading: meLoading, refetch: refetchMe } = useMe();
  const { data: duels, error, loading, refetch } = useDuels();
  const { refreshing, onRefresh } = useRefresh(refetchMe, refetch);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  if (meLoading || loading) {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  }
  if (!me && !error) return <Redirect href="/welcome" />;
  if (!me || !duels) {
    return (
      <Screen>
        <ErrorView message={error?.message ?? 'Something went wrong.'} onRetry={onRefresh} />
      </Screen>
    );
  }

  const waiting = duels.filter((d) => d.status === 'active' && d.theirPending);

  async function confirm(d: Duel) {
    setBusyId(d.id);
    setActionError('');
    try {
      await data.confirmFriend(d.id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen scroll gap="loose" refresh={{ refreshing, onRefresh }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
        <BackButton />
        <Text variant="headerTitle">Confirm check-ins</Text>
      </View>
      <Text variant="subtitle" color="muted">
        Friends keep each other honest. It takes two seconds.
      </Text>
      {actionError ? <ErrorBanner message={actionError} /> : null}

      {waiting.length === 0 ? (
        <Card variant="surface">
          <Text variant="small" color="muted">
            Nothing to confirm right now. When a friend checks in, it shows up here.
          </Text>
        </Card>
      ) : null}

      {waiting.map((d) => {
        const entry = d.activity.find((a) => a.who === 'them' && !a.confirmed);
        const name = friendName(d);
        return (
          <Card key={d.id} variant="surface" style={{ gap: t.spacing.xl, padding: t.spacing.xxl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
              <Avatar name={name} tone="opponent" size="md" />
              <View style={{ flex: 1, gap: t.spacing.hairline }}>
                <Text variant="bodyStrong">
                  {name} practiced {d.theirPending?.minutes} min
                </Text>
                <Text variant="caption" color="muted">
                  {hobbyLabel(d)} · Day {Math.min((entry?.dayIndex ?? d.today) + 1, d.lengthDays)}
                  {entry ? ` · ${whenLabel(entry.createdAt)}` : ''}
                </Text>
              </View>
            </View>
            {d.theirPending?.note ? <Text variant="small">“{d.theirPending.note}”</Text> : null}
            <Button label="Looks good" icon={Check} disabled={busyId === d.id} onPress={() => confirm(d)} />
          </Card>
        );
      })}

      <Card variant="surface" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.lg, backgroundColor: t.colors.blueTint }}>
        <Info size={t.sizes.icon.md} color={t.colors.link} strokeWidth={2} />
        <Text variant="caption" color="link" style={{ flex: 1 }}>
          You confirm what you saw. A day counts for your friend once you confirm it, and anything still waiting is confirmed
          when the day rolls over.
        </Text>
      </Card>
    </Screen>
  );
}
