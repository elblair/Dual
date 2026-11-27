import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface MetricInputProps {
  unit: string | null;
  target: number | null;
  onUnit: (u: string | null) => void;
  onTarget: (n: number | null) => void;
}

export function MetricInput({ unit, target, onUnit, onTarget }: MetricInputProps) {
  const t = useTheme();
  const [rawTarget, setRawTarget] = useState(target != null ? String(target) : '');

  function commitTarget(raw: string) {
    const n = parseInt(raw, 10);
    const result = !isNaN(n) && n > 0 ? n : null;
    setRawTarget(result != null ? String(result) : '');
    onTarget(result);
  }

  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text variant="caption" color="muted">Track a number? (optional)</Text>
      <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
        <View style={{ flex: 1, borderRadius: t.radii.md, borderWidth: t.borders.selected,
          borderColor: t.colors.mutedSoft, backgroundColor: t.colors.surface,
          paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.s9 }}>
          <TextInput
            value={unit ?? ''}
            onChangeText={(v) => onUnit(v.trim() || null)}
            placeholder="unit (e.g. lbs)"
            placeholderTextColor={t.colors.muted}
            maxLength={24}
            style={[t.text.body, { color: t.colors.ink }]}
          />
        </View>
        <View style={{ flex: 1, borderRadius: t.radii.md, borderWidth: t.borders.selected,
          borderColor: t.colors.mutedSoft, backgroundColor: t.colors.surface,
          paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.s9 }}>
          <TextInput
            value={rawTarget}
            onChangeText={(v) => setRawTarget(v.replace(/[^0-9]/g, ''))}
            onBlur={() => commitTarget(rawTarget)}
            onSubmitEditing={() => commitTarget(rawTarget)}
            placeholder="target"
            placeholderTextColor={t.colors.muted}
            keyboardType="numeric"
            returnKeyType="done"
            maxLength={6}
            style={[t.text.body, { color: t.colors.ink }]}
          />
        </View>
      </View>
      {unit && target ? (
        <Text variant="caption" color="muted">Winner = most {unit} by the end</Text>
      ) : unit ? (
        <Text variant="caption" color="muted">Tracks {unit} per check-in</Text>
      ) : null}
    </View>
  );
}
