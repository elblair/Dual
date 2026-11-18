import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { nativeDriver, useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/theme';

interface FadeInProps {
  children: ReactNode;
  /** Position in a sequence: item n starts n x motion.stagger later. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/** Fades its children in while sliding them up a little. Skipped when "Reduce motion" is on. */
export function FadeIn({ children, index = 0, style }: FadeInProps) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: t.motion.slow,
      delay: index * t.motion.stagger,
      useNativeDriver: nativeDriver,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, reduced, index, t.motion.slow, t.motion.stagger]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [t.motion.enterDistance, 0] });
  return <Animated.View style={[{ opacity: progress, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}
