import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

export const DURATION_PRESETS = [3, 7, 14, 30] as const;
const MIN_DAYS = 1;
const MAX_DAYS = 365;

interface DurationPickerProps {
  value: number;
  onChange: (days: number) => void;
}

/**
 * Duration picker on the Hobby step. Quick presets (3 / 7 / 14 / 30 days) plus
 * a custom number field for any value from 1 to 365.
 */
export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const t = useTheme();
  const [text, setText] = useState(String(value));
  const [inputFocused, setInputFocused] = useState(false);

  const error = (() => {
    const n = parseInt(text, 10);
    if (text && (isNaN(n) || n < MIN_DAYS || n > MAX_DAYS)) {
      return `Enter ${MIN_DAYS}-${MAX_DAYS}`;
    }
    return null;
  })();

  function commitText(raw: string) {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= MIN_DAYS && n <= MAX_DAYS) {
      onChange(n);
      setText(String(n));
    } else {
      setText(String(value));
    }
  }

  function handlePreset(days: number) {
    onChange(days);
    setText(String(days));
  }

  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text variant="caption" color="muted">How long?</Text>

      {/* Presets */}
      <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
        {DURATION_PRESETS.map((days) => {
          const selected = days === value && !error;
          return (
            <Pressable
              key={days}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${days} days`}
              onPress={() => handlePreset(days)}
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
              <Text variant="bodyStrong" color={selected ? 'white' : 'ink'}>
                {days}d
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Custom input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: t.spacing.sm,
          borderRadius: t.radii.md,
          borderWidth: t.borders.selected,
          borderColor: inputFocused ? t.colors.maroon : error ? t.colors.maroonBright : t.colors.mutedSoft,
          backgroundColor: t.colors.surface,
          paddingHorizontal: t.spacing.lg,
          paddingVertical: t.spacing.s9,
        }}
      >
        <View
          style={{
            borderRadius: t.radii.sm,
            borderWidth: t.borders.thick,
            borderColor: inputFocused ? t.colors.maroon : error ? t.colors.maroonBright : t.colors.mutedSoft,
            paddingHorizontal: t.spacing.sm,
            paddingVertical: t.spacing.xs,
          }}
        >
          <TextInput
            value={text}
            onChangeText={(v) => setText(v.replace(/[^0-9]/g, ''))}
            onBlur={() => { setInputFocused(false); commitText(text); }}
            onFocus={() => setInputFocused(true)}
            onSubmitEditing={() => commitText(text)}
            keyboardType="numeric"
            returnKeyType="done"
            maxLength={3}
            accessibilityLabel="Number of days"
            style={[
              t.text.body,
              {
                color: error ? t.colors.maroonBright : t.colors.ink,
                width: 40,
                textAlign: 'center',
              },
            ]}
          />
        </View>
        <Text variant="body" color={error ? 'maroonBright' : 'muted'}>
          {error ?? 'days'}
        </Text>
      </View>
    </View>
  );
}
