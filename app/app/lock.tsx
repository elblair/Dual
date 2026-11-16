import { Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components';
import { useTheme } from '@/theme';

/** Lock screen (Figma 217:42), a static image only: the widget and the actionable notification are not built. */
export default function LockScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.ink }}>
      <Image
        accessibilityLabel="Lock screen with a Dual widget and a notification"
        source={require('../assets/images/lock-screen.png')}
        resizeMode="contain"
        style={{ flex: 1, width: '100%' }}
      />
      <View style={{ position: 'absolute', top: insets.top + t.spacing.sm, left: t.spacing.gutter }}>
        <BackButton />
      </View>
    </View>
  );
}
