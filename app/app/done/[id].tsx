import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { Button, Card, PlayerRow, Screen, Text } from '@/components';
import { useDuel, useMe } from '@/data';
import { friendName, myDayStates, myScore, theirDayStates, theirScore } from '@/lib/duel';
import { useTheme } from '@/theme';

/** Done (Figma 217:2): "Day N logged". Guests also get the "Save your streak" card. */
export default function DoneScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: duel } = useDuel(id);
  const { data: me } = useMe();

  if (!duel || !me) return <Screen>{null}</Screen>;

  const a = myScore(duel);
  const b = theirScore(duel);
  const lead = a === b ? `You’re tied ${a} – ${b}.` : a > b ? `You’re ahead ${a} – ${b}.` : `You’re behind ${a} – ${b}.`;

  return (
    <Screen scroll contentStyle={{ alignItems: 'center' }}>
      <View style={{ flex: 1 }} />

      <View
        style={{
          width: t.sizes.successBadge,
          height: t.sizes.successBadge,
          borderRadius: t.sizes.successBadge / 2,
          backgroundColor: t.colors.success,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check size={t.sizes.icon.hero} color={t.colors.white} strokeWidth={1} />
      </View>

      <Text variant="titleLg">Day {Math.min(duel.today + 1, duel.lengthDays)} logged</Text>
      <Text variant="body" color="muted" align="center">
        {friendName(duel)} gets a tap to confirm it. {lead}
      </Text>

      <Card variant="surface" style={{ alignSelf: 'stretch', paddingHorizontal: t.spacing.s18, paddingVertical: t.spacing.xxl, gap: t.spacing.md }}>
        <PlayerRow name={me.name} label="You" avatarTone="you" dotsTone="you" days={myDayStates(duel)} avatarSize="xs" />
        <PlayerRow name={friendName(duel)} avatarTone="opponent" dotsTone="opponent" days={theirDayStates(duel)} avatarSize="xs" />
      </Card>

      {me.isGuest ? (
        <Card variant="orangeTint" style={{ alignSelf: 'stretch', paddingHorizontal: t.spacing.s18, paddingVertical: t.spacing.xxl, gap: t.spacing.md }}>
          <Text variant="cardTitle">Save your streak</Text>
          <Text variant="small" color="muted">
            You’re {a} {a === 1 ? 'day' : 'days'} in. Make an account so you don’t lose it. 20 seconds.
          </Text>
          <Button label="Create account" variant="orange" onPress={() => router.push('/save')} />
        </Card>
      ) : null}

      <View style={{ flex: 1 }} />

      <Pressable accessibilityRole="link" onPress={() => router.replace('/today')}>
        <Text variant="label" color="blue">
          Back to Today
        </Text>
      </Pressable>
    </Screen>
  );
}
