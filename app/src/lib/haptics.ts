import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** A small buzz on phones; nothing on web. Never throws. */
export function buzz(kind: 'success' | 'error' | 'tap') {
  if (Platform.OS === 'web') return;
  const run =
    kind === 'tap'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
  run.catch(() => {});
}
