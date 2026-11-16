import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Avatar, Button, Card, ConnectionBadge, ErrorBanner, ErrorView, LoadingView, Pill, PlayerRow, Screen, Text } from '@/components';
import { useData, useDuels, useMe, type Duel } from '@/data';
import { hobbyById } from '@/data/catalog';
import { hobbyIcons } from '@/lib/hobbyIcons';
import { friendName, myDayStates, needsCheckIn, scoreColor, scoreText, theirDayStates } from '@/lib/duel';
import { todayLabel } from '@/lib/dates';
import { doneHref, duelHref, resultHref } from '@/lib/routes';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';

/** Today (Figma 215:185): what to do today, pending invites, and this week's progress. Everything comes from the API. */
export default function TodayScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { data: me, error: meError, loading: meLoading, refetch: refetchMe } = useMe();
  const { data: duels, error: duelsError, loading: duelsLoading, refetch: refetchDuels } = useDuels();
  const { refreshing, onRefresh } = useRefresh(refetchMe, refetchDuels);
  const [actionError, setActionError] = useState('');

  if (meLoading || duelsLoading) {
    return (
      <Screen tabBar>
        <ConnectionBadge />
        <LoadingView />
      </Screen>
    );
  }
  if (!me && !meError) return <Redirect href="/hobby" />; // signed out
  if (!me || !duels) {
    return (
      <Screen tabBar>
        <ConnectionBadge />
        <ErrorView message={(meError ?? duelsError)?.message ?? 'Something went wrong.'} onRetry={onRefresh} />
      </Screen>
    );
  }
  const loadError = duelsError ?? meError;

  const invites = duels.filter((d) => d.status === 'pending' && !d.viewerIsCreator);
  const sent = duels.filter((d) => d.status === 'pending' && d.viewerIsCreator);
  const live = duels.filter((d) => d.status === 'active' || d.status === 'paused');
  const finished = duels.filter((d) => d.status === 'finished');
  const toCheckIn = live.filter(needsCheckIn);
  const toConfirm = live.filter((d) => d.status === 'active' && d.theirPending);
  const todo = invites.length + toCheckIn.length + toConfirm.length;

  /** Run a button action and show its error (for example "Can’t reach the server") instead of swallowing it. */
  async function run(fn: () => Promise<unknown>) {
    setActionError('');
    try {
      await fn();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
  }

  const checkIn = (d: Duel) =>
    run(async () => {
      await data.checkIn(d.id);
      router.push(doneHref(d.id));
    });

  const inviteCard = (d: Duel) => (
    <Card key={d.id} variant="surface" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
      <Avatar name={d.creator.name} tone="opponent" size="md" />
      <View style={{ flex: 1, gap: t.spacing.hairline }}>
        <Text variant="bodyStrong">{d.creator.name} invited you</Text>
        <Text variant="caption" color="muted">
          {hobbyById(d.hobbyId).label} · {d.minutes} min a day · {d.lengthDays} days
        </Text>
      </View>
      <Pill label="Accept" tone="maroon" onPress={() => run(() => data.acceptDuel(d.id))} />
    </Card>
  );

  const heroCard = (d: Duel) => {
    const hobby = hobbyById(d.hobbyId);
    const Icon = hobbyIcons[d.hobbyId];
    const friendDone = d.theirDays.includes(d.today) || !!d.theirPending;
    return (
      <Card key={d.id} variant="maroon" style={{ borderRadius: t.radii.hero, padding: t.spacing.s18, gap: t.spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
          <View
            style={{
              width: t.sizes.iconTile,
              height: t.sizes.iconTile,
              borderRadius: t.radii.md,
              backgroundColor: t.colors.overlayLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={t.sizes.icon.xl} color={t.colors.white} strokeWidth={2} />
          </View>
          <View style={{ flex: 1, gap: t.spacing.hairline }}>
            <Text variant="headingSm" color="white">
              {hobby.action} {d.minutes} min
            </Text>
            <Text variant="small" color="onDarkMuted">
              vs {friendName(d)} · {friendDone ? 'done today' : 'not yet today'}
            </Text>
          </View>
        </View>
        <Button label="I did it" variant="orange" icon={Check} onPress={() => checkIn(d)} />
      </Card>
    );
  };

  const confirmCard = (d: Duel) => (
    <Card key={d.id} variant="surface" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
      <Avatar name={friendName(d)} tone="opponent" size="md" />
      <View style={{ flex: 1, gap: t.spacing.hairline }}>
        <Text variant="bodyStrong">
          Confirm {friendName(d)}’s {d.theirPending?.minutes} min
        </Text>
        {d.theirPending?.note ? (
          <Text variant="caption" color="muted">
            “{d.theirPending.note}”
          </Text>
        ) : null}
      </View>
      <Pill label="OK" tone="maroon" onPress={() => run(() => data.confirmFriend(d.id))} />
    </Card>
  );

  const dualCard = (d: Duel) => (
    <Pressable key={d.id} accessibilityRole="button" onPress={() => router.push(duelHref(d.id))}>
      <Card variant="outline" style={{ padding: t.spacing.xxl, gap: t.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="cardTitle">{hobbyById(d.hobbyId).label}</Text>
          {d.status === 'paused' ? (
            <Text variant="smallStrong" color="muted">
              Paused
            </Text>
          ) : (
            <Text variant="cardTitle" color={scoreColor(d)}>
              {scoreText(d)}
            </Text>
          )}
        </View>
        <PlayerRow name={me.name} label="You" avatarTone="you" dotsTone="you" days={myDayStates(d)} />
        <PlayerRow name={friendName(d)} avatarTone="opponent" dotsTone="opponent" days={theirDayStates(d)} />
      </Card>
    </Pressable>
  );

  const sentCard = (d: Duel) => (
    <Card key={d.id} variant="outline" style={{ padding: t.spacing.xxl, gap: t.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="cardTitle">{hobbyById(d.hobbyId).label}</Text>
        <Text variant="smallStrong" color="muted">
          Invited
        </Text>
      </View>
      <Text variant="caption" color="muted">
        {d.opponent
          ? `Waiting for ${d.opponent.name} to accept.`
          : `Waiting for a friend. Send them the code ${d.inviteCode} and they enter it under “I have a code”.`}
      </Text>
    </Card>
  );

  const finishedCard = (d: Duel) => (
    <Pressable key={d.id} accessibilityRole="button" onPress={() => router.push(resultHref(d.id))}>
      <Card variant="outline" style={{ padding: t.spacing.xxl, gap: t.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="cardTitle">{hobbyById(d.hobbyId).label} · finished</Text>
          <Text variant="cardTitle" color={scoreColor(d)}>
            {scoreText(d)}
          </Text>
        </View>
        <Text variant="caption" color="muted">
          vs {friendName(d)} · see the result
        </Text>
      </Card>
    </Pressable>
  );

  return (
    <Screen scroll tabBar gap="loose" refresh={{ refreshing, onRefresh }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ gap: t.spacing.hairline }}>
          <Text variant="eyebrow" color="muted">
            {todayLabel()}
          </Text>
          <Text variant="display">Today</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="You" onPress={() => router.navigate('/you')}>
          <Avatar name={me.name} tone="you" size="header" />
        </Pressable>
      </View>

      <ConnectionBadge />
      {loadError ? <ErrorBanner message={`${loadError.message} Pull down to try again.`} /> : null}
      {actionError ? <ErrorBanner message={actionError} /> : null}

      <Text variant="bodyStrong" color="muted">
        Hey, {me.name} · {todo === 0 ? 'nothing to do right now' : `${todo} ${todo === 1 ? 'thing' : 'things'} to do`}
      </Text>

      {duels.length === 0 ? (
        <Card variant="surface" style={{ gap: t.spacing.xl }}>
          <Text variant="headingSm">No duels yet</Text>
          <Text variant="small" color="muted">
            Pick a hobby, challenge a friend, and check in once a day. Whoever shows up more wins.
          </Text>
          <Button label="Start a duel" onPress={() => router.push('/hobby')} />
        </Card>
      ) : null}

      {invites.length > 0 ? (
        <>
          <Text variant="bodyStrong" color="muted">
            Pending invites
          </Text>
          {invites.map(inviteCard)}
        </>
      ) : null}

      {toCheckIn.map(heroCard)}
      {toConfirm.map(confirmCard)}

      {live.length + sent.length + finished.length > 0 ? (
        <>
          <Text variant="bodyStrong" color="muted">
            This week
          </Text>
          {live.map(dualCard)}
          {sent.map(sentCard)}
          {finished.map(finishedCard)}
        </>
      ) : null}
    </Screen>
  );
}
