import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme';
import { Avatar, type AvatarTone } from './Avatar';
import { Radio } from './Radio';
import { Text } from './Text';

interface ContactRowProps {
  name: string;
  subtitle: string;
  tone: AvatarTone;
  selected: boolean;
  onPress: () => void;
}

/** Friend picker row: avatar, name + subtitle, radio. Selected row gets the maroon tint. */
export function ContactRow({ name, subtitle, tone, selected, onPress }: ContactRowProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.lg,
        paddingHorizontal: t.spacing.lg,
        paddingVertical: t.spacing.md,
        borderRadius: t.radii.md,
        backgroundColor: selected ? t.colors.maroonTint : 'transparent',
      }}
    >
      <Avatar name={name} tone={tone} size="md" />
      <View style={{ flex: 1, gap: t.spacing.hairline }}>
        <Text variant="bodyStrong">{name}</Text>
        <Text variant="caption" color="muted">
          {subtitle}
        </Text>
      </View>
      <Radio selected={selected} />
    </Pressable>
  );
}
