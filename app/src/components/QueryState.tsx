import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/theme';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

/** Full-screen loading state, centered. Use inside <Screen>. */
export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.spacing.lg }} accessibilityLabel={label}>
      <ActivityIndicator color={t.colors.maroon} />
      <Text variant="small" color="muted">
        {label}
      </Text>
    </View>
  );
}

/** Full-screen error state with a retry button. Use inside <Screen>. */
export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.spacing.xl }}>
      <Text variant="headingSm" align="center">
        Couldn’t load this
      </Text>
      <Text variant="small" color="muted" align="center">
        {message}
      </Text>
      <Button label="Try again" variant="soft" onPress={onRetry} />
    </View>
  );
}

/** Inline notice when a refresh failed but older data is still on screen. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <Card variant="orangeTint">
      <Text variant="small" color="maroonBright">
        {message}
      </Text>
    </Card>
  );
}
