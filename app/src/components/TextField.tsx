import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface TextFieldProps
  extends Pick<
    TextInputProps,
    'value' | 'onChangeText' | 'placeholder' | 'secureTextEntry' | 'keyboardType' | 'autoCapitalize' | 'maxLength' | 'autoComplete'
  > {
  label: string;
}

/** Labeled text input (not in Figma: built from the same tokens as the cards and buttons). */
export function TextField({ label, autoCapitalize = 'none', ...input }: TextFieldProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text variant="smallStrong" color="muted">
        {label}
      </Text>
      <TextInput
        {...input}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        accessibilityLabel={label}
        placeholderTextColor={t.colors.mutedSoft}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          t.text.body,
          {
            color: t.colors.ink,
            backgroundColor: t.colors.surface,
            borderRadius: t.radii.lg,
            paddingHorizontal: t.spacing.xxl,
            paddingVertical: t.spacing.xl,
            borderWidth: t.borders.thick,
            borderColor: focused ? t.colors.maroon : 'transparent',
          },
        ]}
      />
    </View>
  );
}
