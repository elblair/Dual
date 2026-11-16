import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Minus, Plus } from 'lucide-react-native';
import { Button, Card, PlayerRow, Screen, Text, TextField } from '@/components';
import { useData, useDuel, useMe } from '@/data';
import { friendName, myDayStates, myScore, theirDayStates, theirScore } from '@/lib/duel';
import { useTheme, type Theme } from '@/theme';

/** Round − / + button of the minutes stepper. */
const stepButton = (t: Theme) => ({
  width: t.sizes.perkBadge + t.spacing.xs,
  height: t.sizes.perkBadge + t.spacing.xs,
  borderRadius: (t.sizes.perkBadge + t.spacing.xs) / 2,
  backgroundColor: t.colors.surfaceStrong,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
});

/** Done (Figma 217:2): "Day N logged". */
export default function DoneScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useData();
  const { data: duel } = useDuel(id);
  const { data: me } = useMe();
  // Optional details for today's check-in (the one tap already logged the goal minutes and no note).
  const [minutes, setMinutes] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (!duel || !me) return <Screen>{null}</Screen>;

  const logged = duel.activity.find((a) => a.who === 'me' && a.dayIndex === duel.today);
  const shownMinutes = minutes ?? logged?.minutes ?? duel.minutes;
  const shownNote = note ?? logged?.note ?? '';
  const step = (delta: number) => {
    setSaved(false);
    setMinutes(Math.min(240, Math.max(5, shownMinutes + delta)));
  };
  async function saveDetails() {
    setSaving(true);
    setError('');
    try {
      await data.addCheckInDetails(duel!.id, { minutes: shownMinutes, note: shownNote });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  }

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

      <View style={{ flex: 1 }} />

      {logged ? (
        <Card variant="outline" style={{ alignSelf: 'stretch', gap: t.spacing.xl, padding: t.spacing.xxl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
            <View style={{ flex: 1, gap: t.spacing.hairline }}>
              <Text variant="label">Add details</Text>
              <Text variant="caption" color="muted">
                Optional. How long, and a note for {friendName(duel)}.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Fewer minutes" onPress={() => step(-5)} style={[stepButton(t)]}>
                <Minus size={t.sizes.icon.sm} color={t.colors.ink} strokeWidth={2.4} />
              </Pressable>
              <Text variant="bodyStrong" style={{ minWidth: t.sizes.playerName, textAlign: 'center' }}>
                {shownMinutes} min
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="More minutes" onPress={() => step(5)} style={[stepButton(t)]}>
                <Plus size={t.sizes.icon.sm} color={t.colors.ink} strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>
          <TextField
            label="Note (optional)"
            value={shownNote}
            onChangeText={(v) => {
              setSaved(false);
              setNote(v);
            }}
            placeholder="How did it go?"
            maxLength={200}
            autoCapitalize="sentences"
          />
          {error ? (
            <Text variant="caption" color="maroonBright">
              {error}
            </Text>
          ) : null}
          <Button label={saved ? 'Saved' : 'Save details'} variant="soft" disabled={saving || saved} onPress={saveDetails} />
        </Card>
      ) : null}

      <Pressable accessibilityRole="link" onPress={() => router.replace('/today')}>
        <Text variant="label" color="link">
          Back to Today
        </Text>
      </Pressable>
    </Screen>
  );
}
