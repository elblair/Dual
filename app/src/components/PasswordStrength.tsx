import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { passwordStrength, type StrengthLevel } from '@/lib/password';
import { nativeDriver } from '@/lib/motion';
import { useTheme, type ColorName } from '@/theme';
import { Text } from './Text';

const SEGMENTS = 4;
const levelColor: Record<StrengthLevel, ColorName> = { tooShort: 'muted', weak: 'maroonBright', good: 'link', strong: 'success' };

/** Four segments under the password field that fill and change color as the password gets stronger (Auth, sign-up). */
export function PasswordStrength({ password }: { password: string }) {
  const t = useTheme();
  const s = passwordStrength(password);
  const color = t.colors[levelColor[s.level]];
  return (
    <View style={{ gap: t.spacing.s6 }} accessibilityLabel={`Password strength: ${s.label}`} accessibilityLiveRegion="polite">
      <View style={{ flexDirection: 'row', gap: t.spacing.xs }}>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <Segment key={i} filled={i < s.segments} color={color} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: t.spacing.sm }}>
        <Text variant="captionStrong" color={levelColor[s.level]}>
          {s.label}
        </Text>
        {s.hint ? (
          <Text variant="caption" color="muted" style={{ flexShrink: 1, textAlign: 'right' }}>
            {s.hint}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Segment({ filled, color }: { filled: boolean; color: string }) {
  const t = useTheme();
  const fill = useRef(new Animated.Value(filled ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(fill, { toValue: filled ? 1 : 0, duration: t.motion.base, useNativeDriver: nativeDriver }).start();
  }, [fill, filled, t.motion.base]);
  return (
    <View style={{ flex: 1, height: t.sizes.strengthBar, borderRadius: t.radii.pill, backgroundColor: t.colors.dotEmpty, overflow: 'hidden' }}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: color,
          borderRadius: t.radii.pill,
          opacity: fill,
          transform: [{ scaleX: fill }],
        }}
      />
    </View>
  );
}
