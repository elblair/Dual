import { useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { MessageSquare } from 'lucide-react-native';
import { BackButton, Button, Card, ContactRow, Logo, Screen, Text } from '@/components';
import { CONTACTS } from '@/data/sample';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/** Friend (Figma 215:98): step 2 of 2. Pick who keeps you honest, then send the invite text. */
export default function FriendScreen() {
  const t = useTheme();
  const router = useRouter();
  const { hobby, minutes, friendId, setFriendId, code } = useOnboarding();
  const [sending, setSending] = useState(false);

  const message = `I'm ${hobby.phrase} ${minutes} min a day this week. Dual me so I don't quit? ${hobby.emoji}`;

  async function sendByText() {
    if (sending) return;
    setSending(true);
    const full = `${message}\nOpen Dual and enter the code ${code}`;
    try {
      if (Platform.OS === 'web') {
        // No share sheet in the browser: copy the text instead.
        await Clipboard.setStringAsync(full);
        router.replace('/today');
      } else {
        const result = await Share.share({ message: full });
        if (result.action === Share.sharedAction) router.replace('/today');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
        <BackButton />
        <Text variant="eyebrow" color="orangeDark">
          STEP 2 OF 2
        </Text>
      </View>

      <Text variant="title">Who’ll keep you honest?</Text>
      <Text variant="subtitle" color="muted">
        Pick someone who’d actually notice if you skipped.
      </Text>

      <View style={{ gap: t.spacing.hairline }} accessibilityRole="radiogroup">
        {CONTACTS.map((c) => (
          <ContactRow
            key={c.id}
            name={c.name}
            subtitle={c.subtitle}
            tone={c.tone}
            selected={c.id === friendId}
            onPress={() => setFriendId(c.id)}
          />
        ))}
      </View>

      <Text variant="smallStrong" color="muted">
        Your text will say
      </Text>
      <Card variant="surface" style={{ gap: t.spacing.sm }}>
        <Text variant="body">“{message}”</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.spacing.md,
            backgroundColor: t.colors.white,
            borderRadius: t.radii.sm,
            paddingHorizontal: t.spacing.lg,
            paddingVertical: t.spacing.md,
          }}
        >
          <Logo />
          <Text variant="caption" color="muted">
            Code {code}
          </Text>
        </View>
      </Card>

      <View style={{ flex: 1 }} />

      <Button label="Send by text" icon={MessageSquare} onPress={sendByText} disabled={sending} />
    </Screen>
  );
}
