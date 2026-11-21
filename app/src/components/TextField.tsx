import { useState, type ReactNode } from 'react';
import { Check } from 'lucide-react-native';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface TextFieldProps
  extends Pick<
    TextInputProps,
    'value' | 'onChangeText' | 'placeholder' | 'secureTextEntry' | 'keyboardType' | 'autoCapitalize' | 'maxLength' | 'autoComplete' | 'textContentType' | 'multiline'
  > {
  label: string;
  /** A small green check at the right once the value is valid. */
  valid?: boolean;
  /** Something to show at the right inside the field (e.g. the show / hide password button). */
  trailing?: ReactNode;
}

/** Labeled text input (not in Figma: built from the same tokens as the cards and buttons). */
export function TextField({ label, autoCapitalize = 'none', valid, trailing, ...input }: TextFieldProps) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: t.spacing.sm }}>
      <Text variant="smallStrong" color="muted">
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
          backgroundColor: t.colors.surface,
          borderRadius: t.radii.lg,
          paddingRight: valid || trailing ? t.spacing.xl : 0,
          borderWidth: t.borders.thick,
          borderColor: focused ? t.colors.maroon : 'transparent',
        }}
      >
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
              flex: 1,
              color: t.colors.ink,
              paddingHorizontal: t.spacing.xxl,
              paddingVertical: t.spacing.xl,
              ...(input.multiline ? { minHeight: t.sizes.textArea, textAlignVertical: 'top' as const } : null),
            },
          ]}
        />
        {valid ? <Check size={t.sizes.icon.md} color={t.colors.success} strokeWidth={2.5} accessibilityLabel="Looks good" /> : null}
        {trailing}
      </View>
    </View>
  );
}
