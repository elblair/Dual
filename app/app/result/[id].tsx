import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronRight, RefreshCw, Trophy, Users, type LucideIcon } from 'lucide-react-native';
import { Button, Card, PlayerRow, Screen, Text } from '@/components';
import { useData, useDuel, useMe } from '@/data';
import { hobbyById } from '@/data/sample';
import { myDayStates, myScore, theirDayStates, theirScore } from '@/lib/duel';
import { duelHref } from '@/lib/routes';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

type Next = 'rematch' | 'easier' | 'rival';

/** Result (Figma 217:166): who won, and always three ways to start the next dual. */
export default function ResultScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { setHobbyId, setFriendId } = useOnboarding();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: duel } = useDuel(id);
  const { data: me } = useMe();
  const [next, setNext] = useState<Next>('rematch');
  const [error, setError] = useState('');

  if (!duel || !me) return <Screen>{null}</Screen>;
  if (duel.status !== 'finished') return <Redirect href={duelHref(duel.id)} />;

  const hobby = hobbyById(duel.hobbyId);
  const a = myScore(duel);
  const b = theirScore(duel);
  const opp = duel.opponent.name;
  const rival = duel.opponent.id === 'tanish' ? { id: 'eleanor', name: 'Eleanor' } : { id: 'tanish', name: 'Tanish' };
  const rivalHobby = duel.hobbyId === 'running' ? 'guitar' : 'running';

  const forfeited = duel.result?.forfeitedBy === 'me';
  const title = forfeited
    ? `${opp} won by forfeit`
    : duel.result?.winner === 'me'
      ? `You won, ${a} – ${b}`
      : duel.result?.winner === 'them'
        ? `${opp} won, ${b} – ${a}`
        : `It’s a tie, ${a} – ${b}`;
  const subtitle = forfeited ? 'You waved the white flag.' : `You practiced ${a} ${a === 1 ? 'day' : 'days'}${a > 3 ? ', up from 3 last time' : ''}.`;

  const options: { key: Next; icon: LucideIcon; title: string; sub: string }[] = [
    { key: 'rematch', icon: RefreshCw, title: 'Rematch', sub: 'Same goal, 7 days' },
    { key: 'easier', icon: Trophy, title: 'Easier win', sub: '4 of 7 days, 15 min' },
    { key: 'rival', icon: Users, title: 'New rival', sub: `Dual ${rival.name} at ${hobbyById(rivalHobby).label.toLowerCase()}` },
  ];
  const buttonLabel = next === 'rematch' ? 'Send rematch' : next === 'easier' ? 'Start the easier dual' : 'Pick a rival';

  async function go() {
    setError('');
    try {
      if (next === 'rival') {
        setHobbyId(rivalHobby);
        setFriendId(rival.id);
        router.push('/friend');
        return;
      }
      await data.rematch(duel!.id, next === 'easier' ? 'easier' : 'same');
      router.replace('/today');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <Screen scroll>
      <View style={{ alignItems: 'center', gap: t.spacing.s6, paddingVertical: t.spacing.md }}>
        <Text variant="eyebrow" color="orangeDark">
          Dual over · {hobby.label}
        </Text>
        <Text variant="titleLg" align="center">
          {title}
        </Text>
        <Text variant="body" color="muted" align="center">
          {subtitle}
        </Text>
      </View>

      <Card variant="surface" style={{ paddingHorizontal: t.spacing.s18, paddingVertical: t.spacing.xxl, gap: t.spacing.md }}>
        <PlayerRow name={me.name} label="You" avatarTone="you" dotsTone="you" days={myDayStates(duel)} avatarSize="xs" />
        <PlayerRow name={opp} avatarTone={duel.opponent.tone} dotsTone="opponent" days={theirDayStates(duel)} avatarSize="xs" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
          <View
            style={{
              width: t.sizes.radio,
              height: t.sizes.radio,
              borderRadius: t.sizes.radio / 2,
              backgroundColor: t.colors.successTint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={t.sizes.icon.badge} color={t.colors.success} strokeWidth={3} />
          </View>
          <Text variant="subtitle" style={{ flex: 1 }}>
            +60 XP · Friendship Lv 3 with {opp}
          </Text>
        </View>
      </Card>

      <Text variant="headingSm">What’s next?</Text>
      {options.map(({ key, icon: Icon, title: label, sub }) => {
        const selected = key === next;
        return (
          <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setNext(key)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.spacing.lg,
              paddingHorizontal: t.spacing.xxl,
              paddingVertical: t.spacing.xl,
              borderRadius: t.radii.lg,
              backgroundColor: selected ? t.colors.maroonTint : t.colors.surface,
              borderWidth: t.borders.thick,
              borderColor: selected ? t.colors.maroon : 'transparent',
            }}
          >
            <View
              style={{
                width: t.sizes.avatar.md,
                height: t.sizes.avatar.md,
                borderRadius: t.sizes.avatar.md / 2,
                backgroundColor: selected ? t.colors.maroon : t.colors.surfaceStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={t.sizes.icon.back} color={selected ? t.colors.white : t.colors.ink} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text variant="bodyStrong">{label}</Text>
              <Text variant="caption" color="muted">
                {sub}
              </Text>
            </View>
            <ChevronRight size={t.sizes.icon.md} color={t.colors.muted} strokeWidth={2} />
          </Pressable>
        );
      })}

      <View style={{ flex: 1 }} />

      {error ? (
        <Text variant="caption" color="maroonBright" align="center">
          {error}
        </Text>
      ) : null}
      <Button label={buttonLabel} onPress={go} />
      <Text variant="micro" color="muted" align="center">
        We track one number: did you start a second dual?
      </Text>
    </Screen>
  );
}
