import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import type { Frequency } from '@/data/types';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface FrequencyPickerProps {
  frequency: Frequency;
  timesPerWeek: number | null;
  onChange: (frequency: Frequency, timesPerWeek: number | null) => void;
}

const OPTIONS: { key: Frequency; label: string }[] = [
  { key: 'daily', label: 'Every day' },
  { key: 'weekly', label: 'Once a week' },
  { key: 'perWeek', label: 'X / week' },
];

export function FrequencyPicker({ frequency, timesPerWeek, onChange }: FrequencyPickerProps) {
  const t = useTheme();
  const [rawTimes, setRawTimes] = useState(String(timesPerWeek ?? 3));

  function pickOption(key: Frequency) {
    if (key === 'perWeek') {
      const n = parseInt(rawTimes, 10);
      onChange(key, isNaN(n) ? 3 : Math.min(6, Math.max(2, n)));
    } else {
      onChange(key, null);
    }
  }

  function commitTimes(raw: string) {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) ? 3 : Math.min(6, Math.max(2, n));
    setRawTimes(String(clamped));
    onChange('perWeek', clamped);
  }

  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text variant="caption" color="muted">How often?</Text>
      <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
        {OPTIONS.map(({ key, label }) => {
          const selected = frequency === key;
          return (
            <Pressable
              key={key}
              onPress={() => pickOption(key)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: t.spacing.md,
                borderRadius: t.radii.md,
                backgroundColor: selected ? t.colors.maroon : t.colors.surface,
                borderWidth: t.borders.thick,
                borderColor: selected ? t.colors.maroon : t.colors.mutedSoft,
              }}
            >
              <Text variant="bodyStrong" color={selected ? 'white' : 'ink'}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      {frequency === 'perWeek' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm,
          borderRadius: t.radii.md, borderWidth: t.borders.selected,
          borderColor: t.colors.mutedSoft, backgroundColor: t.colors.surface,
          paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.s9 }}>
          <View style={{ borderRadius: t.radii.sm, borderWidth: t.borders.thick,
            borderColor: t.colors.mutedSoft, paddingHorizontal: t.spacing.sm, paddingVertical: t.spacing.xs }}>
            <TextInput
              value={rawTimes}
              onChangeText={(v) => setRawTimes(v.replace(/[^0-9]/g, ''))}
              onBlur={() => commitTimes(rawTimes)}
              onSubmitEditing={() => commitTimes(rawTimes)}
              keyboardType="numeric"
              returnKeyType="done"
              maxLength={1}
              style={[t.text.body, { color: t.colors.ink, width: 32, textAlign: 'center' }]}
            />
          </View>
          <Text variant="body" color="muted">times per week (2-6)</Text>
        </View>
      ) : null}
    </View>
  );
}
