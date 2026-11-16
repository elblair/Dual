import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Check, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react-native';
import { Avatar, Button, Card, Pill, PlayerRow, Screen, Text } from '@/components';
import { useData, useDuels, useMe, type Duel } from '@/data';
import { hobbyById } from '@/data/sample';
import { hobbyIcons } from '@/lib/hobbyIcons';
import { myDayStates, needsCheckIn, scoreColor, scoreText, theirDayStates } from '@/lib/duel';
import { todayLabel } from '@/lib/dates';
import { doneHref, duelHref, resultHref } from '@/lib/routes';
import { useTheme } from '@/theme';

/** Today (Figma 215:185): only what to do today, plus this week's progress. */
export default function TodayScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { data: me } = useMe();
  const { data: duels } = useDuels();

  if (!me || !duels) return <Screen tabBar>{null}</Screen>;

  const live = duels.filter((d) => d.status === 'active' || d.status === 'paused');
  const pending = duels.filter((d) => d.status === 'pending');
  const finished = duels.filter((d) => d.status === 'finished');
  // Running is "synced from Strava" (sample data): it shows the Strava card instead of a check-in card.
  const strava = live.find((d) => d.hobbyId === 'running' && d.status === 'active');
  const toCheckIn = live.filter((d) => needsCheckIn(d) && d.hobbyId !== 'running');
  const toConfirm = live.filter((d) => d.status === 'active' && d.theirPending);
  const todo = toCheckIn.length + toConfirm.length;

  async function checkIn(d: Duel) {
    await data.checkIn(d.id);
    router.push(doneHref(d.id));
  }

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
              vs {d.opponent.name} · {friendDone ? 'done today' : 'not yet today'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
          <Button label="I did it" variant="orange" icon={Check} onPress={() => checkIn(d)} style={{ flex: 1 }} />
          <View
            accessibilityLabel="Add a photo"
            style={{
              width: t.sizes.cameraButton,
              height: t.sizes.cameraButton,
              borderRadius: t.radii.lg,
              backgroundColor: t.colors.overlayLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Camera size={t.sizes.icon.lg} color={t.colors.white} strokeWidth={2} />
          </View>
        </View>
      </Card>
    );
  };

  const confirmCard = (d: Duel) => (
    <Card key={d.id} variant="surface" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
      <Avatar name={d.opponent.name} tone={d.opponent.tone} size="md" />
      <View style={{ flex: 1, gap: t.spacing.hairline }}>
        <Text variant="bodyStrong">
          Confirm {d.opponent.name}’s {d.theirPending?.minutes} min
        </Text>
        <Text variant="caption" color="muted">
          “{d.theirPending?.note}”
        </Text>
      </View>
      <Pill label="OK" tone="maroon" onPress={() => data.confirmFriend(d.id)} />
    </Card>
  );

  const dualCard = (d: Duel) => {
    const hobby = hobbyById(d.hobbyId);
    return (
      <Pressable key={d.id} accessibilityRole="button" onPress={() => router.push(duelHref(d.id))}>
        <Card variant="outline" style={{ padding: t.spacing.xxl, gap: t.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="cardTitle">{hobby.label}</Text>
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
          <PlayerRow name={d.opponent.name} avatarTone={d.opponent.tone} dotsTone="opponent" days={theirDayStates(d)} />
        </Card>
      </Pressable>
    );
  };

  const pendingCard = (d: Duel) => (
    <Card key={d.id} variant="outline" style={{ padding: t.spacing.xxl, gap: t.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="cardTitle">{hobbyById(d.hobbyId).label}</Text>
        <Text variant="smallStrong" color="muted">
          Invited
        </Text>
      </View>
      <Text variant="caption" color="muted">
        Waiting for {d.opponent.name} to accept · code {d.inviteCode}
      </Text>
    </Card>
  );

  const recapTarget = finished[0] ? resultHref(finished[0].id) : live[0] ? duelHref(live[0].id) : null;

  return (
    <Screen scroll tabBar gap="loose">
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

      <Text variant="bodyStrong" color="muted">
        {todo === 0 ? 'Nothing to do right now' : `${todo} ${todo === 1 ? 'thing' : 'things'} to do`}
      </Text>

      {toCheckIn.map(heroCard)}
      {toConfirm.map(confirmCard)}

      {strava ? (
        <Card variant="successTint" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
          <ShieldCheck size={t.sizes.icon.xl} color={t.colors.success} strokeWidth={2} />
          <View style={{ flex: 1, gap: t.spacing.hairline }}>
            <Text variant="bodyStrong">
              {hobbyById(strava.hobbyId).label} vs {strava.opponent.name} · done
            </Text>
            <Text variant="caption" color="muted">
              3.2 mi synced from Strava at 7:10 AM
            </Text>
          </View>
        </Card>
      ) : null}

      {duels.length === 0 ? (
        <Card variant="surface" style={{ gap: t.spacing.xl }}>
          <Text variant="headingSm">No duals yet</Text>
          <Text variant="small" color="muted">
            Pick a hobby, challenge a friend, and check in once a day. Whoever shows up more wins.
          </Text>
          <Button label="Start a dual" onPress={() => router.push('/hobby')} />
        </Card>
      ) : (
        <>
          <Text variant="bodyStrong" color="muted">
            This week
          </Text>
          {live.map(dualCard)}
          {pending.map(pendingCard)}
          {finished.map((d) => (
            <Pressable key={d.id} accessibilityRole="button" onPress={() => router.push(resultHref(d.id))}>
              <Card variant="outline" style={{ padding: t.spacing.xxl, gap: t.spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text variant="cardTitle">{hobbyById(d.hobbyId).label} · finished</Text>
                  <Text variant="cardTitle" color={scoreColor(d)}>
                    {scoreText(d)}
                  </Text>
                </View>
                <Text variant="caption" color="muted">
                  See the result
                </Text>
              </Card>
            </Pressable>
          ))}
        </>
      )}

      {recapTarget ? (
        <Pressable accessibilityRole="button" onPress={() => router.push(recapTarget)}>
          <Card variant="orangeTint" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
            <Sparkles size={t.sizes.icon.lg} color={t.colors.orangeDark} strokeWidth={2} />
            <View style={{ flex: 1, gap: t.spacing.hairline }}>
              <Text variant="label">Sunday recap</Text>
              <Text variant="caption" color="muted">
                5 days practiced, up from 3. See how last week ended.
              </Text>
            </View>
            <ChevronRight size={t.sizes.icon.md} color={t.colors.muted} strokeWidth={2} />
          </Card>
        </Pressable>
      ) : null}
    </Screen>
  );
}
