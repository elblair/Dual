import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { BackButton, Button, Screen, Text, TextField } from '@/components';
import { useTheme } from '@/theme';

/**
 * "I have a code": the invited friend types the 4-character code from the text.
 * NOT in Figma (the Figma Accept frame assumed a web link). Phase 5 looks the duel up by code.
 */
export default function CodeScreen() {
  const t = useTheme();
  const router = useRouter();
  const [code, setCode] = useState('');

  return (
    <Screen scroll>
      <View style={{ alignItems: 'flex-start' }}>
        <BackButton />
      </View>

      <Text variant="titleLg">Got a code?</Text>
      <Text variant="body" color="muted">
        Enter the 4-character code from your friend’s text.
      </Text>

      <View style={{ marginTop: t.spacing.sm }}>
        <TextField label="Invite code" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" maxLength={4} />
      </View>

      <View style={{ flex: 1 }} />

      <Button label="Find my duel" disabled={code.length < 4} onPress={() => router.push('/accept')} />
    </Screen>
  );
}
