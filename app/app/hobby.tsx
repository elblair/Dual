import { Pressable, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, BackButton, Button, CategoryPicker, GoalCard, Logo, Screen, Text } from '@/components';
import { useMe } from '@/data';
import { defaultGoal, minutesFromText } from '@/data/catalog';
import { useChallenge } from '@/lib/useChallenge';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/**
 * Hobby (Figma 215:30). Only for signed-in people (the first screen is sign up / log in). Two ways in:
 * - from + or "+ New": step 1 of 2, the button goes on to the Friend step;
 * - with a friend already chosen (`friendId` and `friendName`, from Your crew or the friend-first picker) or an invite by text
 *   (`via=text`): step 2 of 2, shows "vs <name>", and the button sends the invite and goes straight to Sent.
 */
export default function HobbyScreen() {
  const t = useTheme();
  const router = useRouter();
  const { hobby, setHobbyId, minutes, setMinutes, goal, setGoal } = useOnboarding();
  const { data: me, loading } = useMe();
  const { friendId, friendName, via } = useLocalSearchParams<{ friendId?: string; friendName?: string; via?: string }>();
  const { send, sending, error, waitingCode } = useChallenge();
  const chosen = friendId && friendName ? { id: friendId, name: friendName } : null;
  const direct = !!chosen || via === 'text';

  // Nobody gets here without an account: the first screen is sign up / log in.
  if (!me) return loading ? null : <Redirect href="/welcome" />;

  function next() {
    router.push('/friend');
  }

  return (
    <Screen scroll gap="loose">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {direct ? <BackButton /> : <Logo size="lg" />}
      </View>

      <Text variant="eyebrow" color="orangeDark">
        {direct ? 'STEP 2 OF 2' : 'STEP 1 OF 2'}
      </Text>
      <Text variant="title">What do you want to get better at?</Text>
      {direct ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
          {chosen ? <Avatar name={chosen.name} tone="opponent" size="xs" /> : null}
          <Text variant="bodyStrong" color="muted">
            {chosen ? `vs ${chosen.name}` : 'vs a friend you’ll invite by text'}
          </Text>
        </View>
      ) : null}

      <CategoryPicker value={[hobby.id]} onChange={(ids) => setHobbyId(ids[0])} />

      <GoalCard
        goal={goal ?? defaultGoal(hobby.id, minutes)}
        custom={goal !== null}
        minutes={minutes}
        onMinutes={setMinutes}
        onSave={(text) => {
          // A number of minutes written in the text becomes the minutes logged per check-in.
          const m = minutesFromText(text) ?? minutes;
          setMinutes(m);
          setGoal(text === defaultGoal(hobby.id, m) ? null : text);
        }}
        onReset={() => setGoal(null)}
      />

      <View style={{ flex: 1 }} />

      {error ? (
        <Text variant="caption" color="maroonBright" align="center">
          {error}
        </Text>
      ) : null}
      {waitingCode ? (
        <Text variant="caption" color="muted" align="center">
          Not sent yet. Your invite code is {waitingCode}: tap Send by text to share it again.
        </Text>
      ) : null}
      {direct ? (
        <Button label={chosen ? `Invite ${chosen.name}` : 'Send by text'} disabled={sending} onPress={() => send(chosen)} />
      ) : (
        <Button label="Next: pick a friend" onPress={next} />
      )}
    </Screen>
  );
}
