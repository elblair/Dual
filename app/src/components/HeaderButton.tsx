import { Pressable } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';

interface HeaderButtonProps {
  icon: LucideIcon;
  /** Read aloud by screen readers (the button has no text). */
  label: string;
  onPress: () => void;
}

/** A round icon button for a screen header (same size and gray as the Back button): "Settings" on the Profile. */
export function HeaderButton({ icon: Icon, label, onPress }: HeaderButtonProps) {
  const t = useTheme();
  const size = t.sizes.backButton;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.colors.surface,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon size={t.sizes.icon.back} color={t.colors.ink} strokeWidth={2.2} />
    </Pressable>
  );
}
