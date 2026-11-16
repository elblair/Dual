import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Flame, Mail } from 'lucide-react-native';
import { BackButton, Button, Screen, Text } from '@/components';
import { useTheme } from '@/theme';

/** Save (Figma 217:407): "Save your streak" account prompt shown after the first check-in. */
export default function SaveScreen() {
  const t = useTheme();
  const router = useRouter();
  const [note, setNote] = useState('');

  return (
    <Screen scroll>
      <View style={{ alignItems: 'flex-start' }}>
        <BackButton />
      </View>

      <View
        style={{
          width: t.sizes.flameTile,
          height: t.sizes.flameTile,
          borderRadius: t.radii.xl + 2,
          backgroundColor: t.colors.orangeTint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Flame size={t.sizes.icon.flame} color={t.colors.orange} strokeWidth={2} />
      </View>

      <Text variant="titleLg">Save your streak</Text>
      <Text variant="body" color="muted">
        You’ve already started. Create an account so your dual with Eleanor is safe.
      </Text>

      <View style={{ flex: 1 }} />

      <Button label="Continue with Apple" onPress={() => setNote('Apple sign-in is coming soon. Use email for now.')} />
      <Button label="Continue with Google" variant="outline" onPress={() => setNote('Google sign-in is coming soon. Use email for now.')} />
      <Button label="Use email" variant="outline" icon={Mail} onPress={() => router.push('/auth?mode=signup')} />

      {note ? (
        <Text variant="caption" color="maroonBright" align="center" accessibilityLiveRegion="polite">
          {note}
        </Text>
      ) : null}
      <Text variant="micro" color="muted" align="center">
        We ask for an account only after your first check-in.
      </Text>
    </Screen>
  );
}
