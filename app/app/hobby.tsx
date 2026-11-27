import { View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, BackButton, Button, CategoryPicker, DurationPicker, FrequencyPicker, GoalCard, Logo, MetricInput, Screen, Text } from '@/components';
import { useMe } from '@/data';
import { CUSTOM_HOBBY_ID, defaultGoal, minutesFromText } from '@/data/catalog';
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
  const {
    hobby, setHobbyId, customHobby, setCustomHobby,
    minutes, setMinutes, goal, setGoal,
    frequency, setFrequency, timesPerWeek, setTimesPerWeek,
    unit, setUnit, target, setTarget,
    lengthDays, setLengthDays,
  } = useOnboarding();
  const { data: me, loading } = useMe();
  const { friendId, friendName, via } = useLocalSearchParams<{ friendId?: string; friendName?: string; via?: string }>();
  const { send, sending, error, waitingCode } = useChallenge();
  const chosen = friendId && friendName ? { id: friendId, name: friendName } : null;
  const direct = !!chosen || via === 'text';
  const isCustom = hobby.id === CUSTOM_HOBBY_ID;

  if (!me) return loading ? null : <Redirect href="/welcome" />;

  function next() {
    router.push('/friend');
  }

  const displayGoal = goal ?? defaultGoal(hobby.id, minutes, customHobby ?? undefined);

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
            {chosen ? `vs ${chosen.name}` : `vs a friend you'll invite by text`}
          </Text>
        </View>
      ) : null}

      <CategoryPicker
        value={[hobby.id]}
        onChange={(ids) => setHobbyId(ids[0])}
        showCustom
        customName={customHobby ?? ''}
        onCustomName={setCustomHobby}
      />

      <GoalCard
        goal={displayGoal}
        custom={goal !== null}
        minutes={minutes}
        lengthDays={lengthDays}
        onMinutes={setMinutes}
        onSave={(text) => {
          const m = minutesFromText(text) ?? minutes;
          setMinutes(m);
          setGoal(text === defaultGoal(hobby.id, m, customHobby ?? undefined) ? null : text);
        }}
        onReset={() => setGoal(null)}
      />

      <FrequencyPicker
        frequency={frequency}
        timesPerWeek={timesPerWeek}
        onChange={(f, n) => { setFrequency(f); setTimesPerWeek(n); }}
      />

      <DurationPicker value={lengthDays} onChange={setLengthDays} />

      <MetricInput unit={unit} target={target} onUnit={setUnit} onTarget={setTarget} />

      <View style={{ flex: 1 }} />

      {error ? (
        <Text variant="caption" color="maroonBright" align="center">
          {error}
        </Text>
      ) : null}
      {waitingCode ? (
        <Text variant="caption" color="muted" align="center">
          {'Not sent yet. Your invite code is '}{waitingCode}{': tap Send by text to share it again.'}
        </Text>
      ) : null}

      {isCustom && !customHobby?.trim() ? (
        <Button label={direct ? (chosen ? `Invite ${chosen.name}` : 'Send by text') : 'Next: pick a friend'} disabled />
      ) : direct ? (
        <Button label={chosen ? `Invite ${chosen.name}` : 'Send by text'} disabled={sending} onPress={() => send(chosen)} />
      ) : (
        <Button label="Next: pick a friend" onPress={next} />
      )}
    </Screen>
  );
}
