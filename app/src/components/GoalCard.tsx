import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { PencilLine, Sparkle } from 'lucide-react-native';
import { DUEL_DAYS, GOAL_MAX, MINUTE_OPTIONS, replaceFirstNumber, validateGoal } from '@/data/catalog';
import { useTheme } from '@/theme';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';
import { TextField } from './TextField';

interface GoalCardProps {
  /** The goal as it will be saved (the suggestion until the player writes their own). */
  goal: string;
  /** True once the player has written their own words. */
  custom: boolean;
  /** Minutes logged by default on each check-in. */
  minutes: number;
  /** A quick chip was tapped. */
  onMinutes: (minutes: number) => void;
  /** Save the text the player wrote (already trimmed and valid). */
  onSave: (text: string) => void;
  /** Go back to the suggestion built from the hobby and minutes. */
  onReset: () => void;
}

/**
 * The goal on the Hobby step (Figma "Starter goal" card). Tap the card or the pencil to write your own goal: any text up to
 * GOAL_MAX characters, with the minute options as quick chips that update the numbers in the text.
 */
export function GoalCard({ goal, custom, minutes, onMinutes, onSave, onReset }: GoalCardProps) {
  const t = useTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal);
  const [error, setError] = useState('');

  function open() {
    setDraft(goal);
    setError('');
    setEditing(true);
  }

  function chip(m: number) {
    onMinutes(m);
    setDraft((text) => replaceFirstNumber(text, m) ?? text);
    setError('');
  }

  function save() {
    const problem = validateGoal(draft);
    if (problem) {
      setError(problem);
      return;
    }
    onSave(draft.trim().replace(/\s+/g, ' '));
    setEditing(false);
  }

  if (!editing) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel="Edit your goal" onPress={open}>
        <Card variant="orangeTint" style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg, borderRadius: t.radii.lg }}>
          <Sparkle size={t.sizes.icon.xl} color={t.colors.orangeDark} strokeWidth={2} />
          <View style={{ flex: 1, gap: t.spacing.hairline }}>
            <Text variant="captionStrong" color="orangeDark">
              {custom ? 'Your goal' : 'Starter goal'}
            </Text>
            <Text variant="cardTitle">{goal}</Text>
            <Text variant="caption" color="muted">
              {DUEL_DAYS} days · tap to write your own
            </Text>
          </View>
          <PencilLine size={t.sizes.icon.md} color={t.colors.muted} strokeWidth={2} />
        </Card>
      </Pressable>
    );
  }

  return (
    <Card variant="orangeTint" style={{ gap: t.spacing.lg, borderRadius: t.radii.lg }}>
      <Text variant="captionStrong" color="orangeDark">
        Your goal
      </Text>
      <TextField
        label="What will you do each day?"
        value={draft}
        onChangeText={(v) => {
          setDraft(v);
          setError('');
        }}
        maxLength={GOAL_MAX}
        autoCapitalize="sentences"
        placeholder="Describe your daily goal"
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="caption" color={error ? 'maroonBright' : 'muted'} style={{ flex: 1 }}>
          {error || 'Your own words, up to 60 characters.'}
        </Text>
        <Text variant="caption" color="muted">
          {draft.length}/{GOAL_MAX}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
        {MINUTE_OPTIONS.map((m) => {
          const selected = m === minutes;
          return (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${m} minutes`}
              onPress={() => chip(m)}
              style={{
                paddingHorizontal: t.spacing.xl,
                paddingVertical: t.spacing.s9,
                borderRadius: t.radii.pill,
                backgroundColor: selected ? t.colors.maroon : t.colors.cardRaised,
              }}
            >
              <Text variant="smallStrong" color={selected ? 'white' : 'ink'}>
                {m} min
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Button label="Save goal" onPress={save} />
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          onReset();
          setEditing(false);
        }}
        style={{ alignSelf: 'center' }}
      >
        <Text variant="labelMedium" color="link">
          Use the suggestion
        </Text>
      </Pressable>
    </Card>
  );
}
