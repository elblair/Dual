import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { ChartColumn, Check, ChevronRight, Clock, Plus, Users } from 'lucide-react-native';
import { Avatar, Button, Card, Chip, ConnectionBadge, ErrorBanner, ErrorView, LoadingView, Pill, PlayerRow, Screen, StreakCard, Text } from '@/components';
import { useData, useDuels, useGroups, useMe, useStats, type Duel } from '@/data';
import { hobbyById } from '@/data/catalog';
import { hobbyIcons } from '@/lib/hobbyIcons';
import { daysLeftLabel, friendName, myDayStates, needsCheckIn, scoreColor, scoreText, theirDayStates } from '@/lib/duel';
import { todayLabel } from '@/lib/dates';
import { recapNumbers, signed, thisWeek } from '@/lib/week';
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
  // Stats and crew only add cards: if they fail to load, Today still works without them.
  const { data: stats, refetch: refetchStats } = useStats();
  const { data: groups, refetch: refetchGroups } = useGroups();
  const { refreshing, onRefresh } = useRefresh(refetchMe, refetchDuels, refetchStats, refetchGroups);
  const [actionError, setActionError] = useState('');

  if (meLoading || duelsLoading) {
    return (
      <Screen tabBar>
        <ConnectionBadge />
        <LoadingView />
      </Screen>
    );
  }
  if (!me && !meError) return <Redirect href="/welcome" />; // signed out
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
  const hasHistory = duels.some((d) => d.status !== 'pending');
  const streak = stats?.currentStreak ?? 0;
  const streakSubtitle =
    toCheckIn.length > 0
      ? streak > 0
        ? 'Check in today to keep it going'
        : 'Check in today to start one'
      : live.length > 0
        ? 'You’re all checked in for today'
        : 'Start or accept a duel to keep it going';
  const crew = groups?.rivals ?? [];
  const recap = recapNumbers(stats?.recentCheckIns ?? []);

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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="See this check-in"
        onPress={() => router.push('/confirm')}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}
      >
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
      </Pressable>
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
        {d.status === 'active' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
            <Chip icon={Users} label={`${friendName(d)} confirms`} />
            <Chip icon={Clock} label={daysLeftLabel(d)} />
          </View>
        ) : null}
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
          : `Waiting for a friend. Send them the code ${d.inviteCode} and they enter it with “Enter an invite code”.`}
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

      {hasHistory ? (
        <StreakCard
          title={streak > 0 ? `${streak}-day streak` : 'No streak yet'}
          subtitle={streakSubtitle}
          week={thisWeek(stats?.recentCheckIns ?? [])}
        />
      ) : null}

      {duels.length === 0 ? (
        <Card variant="surface" style={{ gap: t.spacing.xl }}>
          <Text variant="headingSm">No duels yet</Text>
          <Text variant="small" color="muted">
            Pick a hobby, challenge a friend, and check in once a day. Whoever shows up more wins.
          </Text>
          <Button label="Start a duel" onPress={() => router.push('/hobby')} />
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="bodyStrong" color="muted">
          {invites.length > 0 ? 'Pending invites' : ''}
        </Text>
        <Pressable accessibilityRole="link" onPress={() => router.push('/code')} hitSlop={8}>
          <Text variant="labelMedium" color="link">
            Enter an invite code
          </Text>
        </Pressable>
      </View>
      {invites.map(inviteCard)}

      {toCheckIn.map(heroCard)}
      {toConfirm.map(confirmCard)}

      {live.length + sent.length + finished.length > 0 ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="headingSm">Your duals</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push('/hobby')} hitSlop={8}>
              <Text variant="labelMedium" color="link">
                + New
              </Text>
            </Pressable>
          </View>
          {live.map(dualCard)}
          {sent.map(sentCard)}
          {finished.map(finishedCard)}
        </>
      ) : null}

      {crew.length > 0 ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="headingSm">Your crew</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/friend', params: { first: '1' } })} hitSlop={8}>
              <Text variant="labelMedium" color="link">
                Invite
              </Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xl }}>
            {crew.map((r) => (
              <Pressable
                key={r.person.id}
                accessibilityRole="button"
                accessibilityLabel={`Challenge ${r.person.name}`}
                onPress={() => router.push({ pathname: '/hobby', params: { friendId: r.person.id, friendName: r.person.name } })}
                style={{ alignItems: 'center', gap: t.spacing.s6 }}
              >
                <Avatar name={r.person.name} tone="opponent" size="crew" />
                <Text variant="caption" color="muted" numberOfLines={1}>
                  {r.person.name}
                </Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" accessibilityLabel="Invite someone" onPress={() => router.push({ pathname: '/friend', params: { first: '1' } })} style={{ alignItems: 'center', gap: t.spacing.s6 }}>
              <View
                style={{
                  width: t.sizes.avatar.crew,
                  height: t.sizes.avatar.crew,
                  borderRadius: t.sizes.avatar.crew / 2,
                  borderWidth: t.borders.thick,
                  borderColor: t.colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={t.sizes.icon.xl} color={t.colors.muted} strokeWidth={2} />
              </View>
              <Text variant="caption" color="muted">
                Invite
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {hasHistory && stats ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/recap')}>
          <Card variant="surface" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg, borderRadius: t.radii.lg }}>
            <ChartColumn size={t.sizes.icon.xl} color={t.colors.ink} strokeWidth={2} />
            <View style={{ flex: 1, gap: t.spacing.hairline }}>
              <Text variant="label">Weekly recap</Text>
              <Text variant="caption" color="muted">
                {recap.thisWeek} {recap.thisWeek === 1 ? 'day' : 'days'} practiced · {signed(recap.thisWeek - recap.lastWeek)} vs last week
              </Text>
            </View>
            <ChevronRight size={t.sizes.icon.md} color={t.colors.muted} strokeWidth={2} />
          </Card>
        </Pressable>
      ) : null}
    </Screen>
  );
}
