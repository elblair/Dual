import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton, Button, Screen, Text, TextField } from '@/components';
import { useData } from '@/data';
import { useTheme } from '@/theme';

/**
 * "I have a code": the invited friend types the 4-character code from the text.
 * NOT in Figma (the Figma Accept frame assumed a web link).
 */
export default function CodeScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function find() {
    setBusy(true);
    setError('');
    try {
      await data.getDuelByCode(code);
      router.push({ pathname: '/accept', params: { code } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <View style={{ alignItems: 'flex-start' }}>
        <BackButton />
      </View>

      <Text variant="titleLg">Got a code?</Text>
      <Text variant="body" color="muted">
        Enter the 4-character code from your friend’s text.
      </Text>

      <View style={{ marginTop: t.spacing.sm, gap: t.spacing.sm }}>
        <TextField label="Invite code" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" maxLength={4} />
        {error ? (
          <Text variant="caption" color="maroonBright">
            {error}
          </Text>
        ) : null}
      </View>

      <View style={{ flex: 1 }} />

      <Button label="Find my duel" disabled={code.length < 4 || busy} onPress={find} />
    </Screen>
  );
}
