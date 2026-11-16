import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Flag, Pause } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, BackButton, Button, OptionCard, Screen, Text } from '@/components';
import { useData, useDuel, useMe } from '@/data';
import { inOneWeek } from '@/lib/dates';
import { resultHref } from '@/lib/routes';
import { useTheme } from '@/theme';

type Pick = 'rest' | 'pause' | 'forfeit';

/** Break (Figma Base row 196:212): rest day, pause for a week, or forfeit. Uses the Base row's own metrics. */
export default function BreakScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const insets = useSafeAreaInsets();
  const { id, pick } = useLocalSearchParams<{ id: string; pick?: string }>();
  const { data: duel } = useDuel(id);
  const { data: me } = useMe();
  const [selected, setSelected] = useState<Pick>(pick === 'pause' || pick === 'forfeit' ? pick : 'rest');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!duel || !me) return <Screen>{null}</Screen>;

  const opp = duel.opponent.name;
  const noRest = duel.restLeft <= 0;
  const labels: Record<Pick, string> = { rest: 'Take a rest day', pause: 'Pause the dual', forfeit: 'Forfeit the dual' };
  const footnotes: Record<Pick, string> = {
    rest: `${opp} will see that you’re resting.`,
    pause: `${opp} will see that the dual is paused.`,
    forfeit: `${opp} wins this dual.`,
  };

  async function confirm() {
    if (!duel) return;
    setBusy(true);
    setError('');
    try {
      if (selected === 'rest') {
        await data.restDay(duel.id);
        router.back();
      } else if (selected === 'pause') {
        await data.pause(duel.id);
        router.back();
      } else {
        await data.forfeit(duel.id);
        router.replace(resultHref(duel.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      scroll
      contentStyle={{
        alignItems: 'center',
        gap: t.spacing.s18,
        paddingHorizontal: t.spacing.xxxl,
        paddingTop: Math.max(insets.top + t.spacing.sm, t.spacing.breakTop),
        paddingBottom: Math.max(insets.bottom, t.spacing.tabBottom),
      }}
    >
      <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
        <BackButton tone="strong" />
        <Text variant="subheading">Need a break?</Text>
      </View>

      <Avatar name={me.name} tone="you" size="hero" />

      <Text variant="body" color="muted" align="center">
        Life happens. Pick what fits, and your progress stays safe.
      </Text>

      <OptionCard
        icon={Calendar}
        title="Rest day"
        subtitle={noRest ? 'No rest days left this week' : `${duel.restLeft} left this week · your streak stays alive`}
        selected={selected === 'rest'}
        onPress={() => !noRest && setSelected('rest')}
      />
      <OptionCard
        icon={Pause}
        title="Pause for a week"
        subtitle={`The dual freezes for both of you. Come back by ${inOneWeek()} and nothing is lost.`}
        selected={selected === 'pause'}
        onPress={() => setSelected('pause')}
      />
      <OptionCard
        icon={Flag}
        title="Forfeit"
        subtitle={`Wave the white flag. ${opp} wins this dual.`}
        selected={selected === 'forfeit'}
        danger
        onPress={() => setSelected('forfeit')}
      />

      <View style={{ flex: 1 }} />

      {error ? (
        <Text variant="caption" color="maroonBright" align="center">
          {error}
        </Text>
      ) : null}
      <Button
        label={labels[selected]}
        disabled={busy}
        onPress={confirm}
        style={{ borderRadius: t.radii.md, paddingVertical: t.spacing.s15 }}
      />
      <Text variant="caption" color="muted" align="center">
        {footnotes[selected]}
      </Text>
    </Screen>
  );
}
