import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface CancelInviteProps {
  /** Deletes the pending invite. */
  onCancel: () => Promise<void>;
}

/**
 * "Cancel invite" for a pending duel I created. Asks once on the screen (no system dialog, which the browser blocks), then
 * deletes the invite; the parent decides where to go next.
 */
export function CancelInvite({ onCancel }: CancelInviteProps) {
  const t = useTheme();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await onCancel();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  }

  if (!asking) {
    return (
      <Pressable accessibilityRole="button" onPress={() => setAsking(true)} style={{ alignSelf: 'center', padding: t.spacing.sm }}>
        <Text variant="labelMedium" color="maroonBright">
          Cancel invite
        </Text>
      </Pressable>
    );
  }

  return (
    <Card variant="surface" style={{ alignSelf: 'stretch', gap: t.spacing.lg }}>
      <Text variant="bodyStrong">Cancel this invite?</Text>
      <Text variant="small" color="muted">
        It disappears for you and for your friend, and the code stops working. You can always send a new one.
      </Text>
      {error ? (
        <Text variant="caption" color="maroonBright">
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
        <Button label="Keep it" variant="soft" onPress={() => setAsking(false)} disabled={busy} style={{ flex: 1 }} />
        <Button label="Yes, cancel" variant="outline" onPress={confirm} disabled={busy} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}
