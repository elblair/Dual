import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/theme';

interface BackButtonProps {
  onPress?: () => void;
  /** 'strong' = the darker gray used on the Break screen. */
  tone?: 'default' | 'strong';
}

export function BackButton({ onPress, tone = 'default' }: BackButtonProps) {
  const t = useTheme();
  const router = useRouter();
  const size = t.sizes.backButton;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress ?? (() => router.back())}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.colors[tone === 'strong' ? 'surfaceStrong' : 'surface'],
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <ChevronLeft size={t.sizes.icon.back} color={t.colors.ink} strokeWidth={2.2} />
    </Pressable>
  );
}
