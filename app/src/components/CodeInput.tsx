import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ComponentRef } from 'react';
import { Animated, Pressable, TextInput, View } from 'react-native';
import { nativeDriver, useReducedMotion } from '@/lib/motion';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface CodeInputProps {
  length: number;
  value: string;
  onChange: (digits: string) => void;
  /** Called once all digits are typed. */
  onComplete?: (digits: string) => void;
  error?: boolean;
  success?: boolean;
  disabled?: boolean;
}

export interface CodeInputHandle {
  shake: () => void;
  focus: () => void;
}

/**
 * One box per digit over a single hidden text field, so paste and the phone's "From Messages / Mail" autofill still work.
 * NOT in Figma: built from the TextField tokens.
 */
export const CodeInput = forwardRef<CodeInputHandle, CodeInputProps>(function CodeInput(
  { length, value, onChange, onComplete, error, success, disabled },
  ref,
) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const shakeX = useRef(new Animated.Value(0)).current;
  const [focused, setFocused] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    shake: () => {
      if (reduced) return;
      const d = t.motion.shakeDistance;
      const step = (toValue: number) => Animated.timing(shakeX, { toValue, duration: t.motion.fast / 3, useNativeDriver: nativeDriver });
      Animated.sequence([step(d), step(-d), step(d / 2), step(-d / 2), step(0)]).start();
    },
  }));

  useEffect(() => {
    const timer = setTimeout(() => input.current?.focus(), t.motion.slow);
    return () => clearTimeout(timer);
  }, [t.motion.slow]);

  function change(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, length);
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
  }

  const active = Math.min(value.length, length - 1);
  return (
    <Pressable onPress={() => input.current?.focus()} accessibilityLabel={`${length}-digit code`} disabled={disabled}>
      <Animated.View style={{ flexDirection: 'row', justifyContent: 'space-between', transform: [{ translateX: shakeX }] }}>
        {Array.from({ length }, (_, i) => {
          const digit = value[i] ?? '';
          const isActive = focused && i === active && !success;
          const borderColor = success ? t.colors.success : error ? t.colors.maroonBright : isActive ? t.colors.maroon : 'transparent';
          return (
            <View
              key={i}
              style={{
                width: t.sizes.codeBox.width,
                height: t.sizes.codeBox.height,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: t.radii.md,
                backgroundColor: success ? t.colors.successTint : digit ? t.colors.cardRaised : t.colors.surface,
                borderWidth: t.borders.thick,
                borderColor: digit && !isActive && !error && !success ? t.colors.border : borderColor,
              }}
            >
              <Text variant="title" color={success ? 'success' : 'ink'}>
                {digit}
              </Text>
            </View>
          );
        })}
      </Animated.View>
      <TextInput
        ref={input}
        value={value}
        onChangeText={change}
        editable={!disabled}
        keyboardType="number-pad"
        maxLength={length}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Code"
        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0 }}
      />
    </Pressable>
  );
});
