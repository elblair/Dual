import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton, Button, Screen, Text, TextField } from '@/components';
import { useData } from '@/data';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/**
 * First name only, for guests who skip sign-up. NOT in Figma: built from the same tokens.
 * Shown the first time a guest needs a session (searching for a friend, or accepting an invite).
 */
export default function NameScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { afterName, setAfterName } = useOnboarding();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setError('');
    try {
      await data.startGuest({ name: name.trim() });
      if (afterName === 'friend') {
        setAfterName(null);
        router.replace('/friend');
      } else if (afterName === 'accept') {
        router.back(); // Accept picks up where it left off and accepts
      } else {
        router.replace('/today');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <View style={{ alignItems: 'flex-start' }}>
        <BackButton />
      </View>

      <Text variant="titleLg">What should we call you?</Text>
      <Text variant="body" color="muted">
        Just a first name. You can create an account later to keep your streak.
      </Text>

      <View style={{ marginTop: t.spacing.sm, gap: t.spacing.sm }}>
        <TextField label="First name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="given-name" maxLength={30} />
        {error ? (
          <Text variant="caption" color="maroonBright">
            {error}
          </Text>
        ) : null}
      </View>

      <View style={{ flex: 1 }} />

      <Button label="Continue" disabled={name.trim().length === 0 || busy} onPress={start} />
      <Pressable accessibilityRole="link" onPress={() => router.replace('/auth?mode=signup')} style={{ alignSelf: 'center' }}>
        <Text variant="labelMedium" color="blue">
          Create an account instead
        </Text>
      </Pressable>
    </Screen>
  );
}
