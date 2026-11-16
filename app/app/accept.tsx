import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, BackButton, Button, Card, Screen, Text } from '@/components';
import { DEMO_USER_NAME } from '@/data/sample';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/**
 * Accept (Figma 215:152), shown in-app to the invited friend after entering a code.
 * The browser chrome from the Figma frame (URL pill, "what Eleanor sees") is dropped.
 * Sample data for now; Phase 5 loads the real duel by code.
 */
export default function AcceptScreen() {
  const t = useTheme();
  const router = useRouter();
  const { hobby, minutes } = useOnboarding();

  const rows: [string, string][] = [
    ['Hobby', `${hobby.label} · ${minutes} min a day`],
    ['Length', '7 days, starts tomorrow'],
    ['Check-ins', 'One tap · you confirm each other'],
    ['Stake', 'None'],
  ];

  return (
    <Screen scroll background="surface" contentStyle={{ alignItems: 'center' }}>
      <View style={{ alignSelf: 'flex-start' }}>
        <BackButton />
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xl }}>
        <Avatar name={DEMO_USER_NAME} tone="you" size="xxl" ring="white" />
        <Text variant="subheading" color="orange" style={{ fontFamily: t.fonts.bold }}>
          VS
        </Text>
        <Avatar name="Eleanor" tone="opponent" size="xxl" ring="white" />
      </View>

      <Text variant="title" align="center">
        {DEMO_USER_NAME} challenged you
      </Text>

      <Card variant="white" style={{ alignSelf: 'stretch', paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }}>
        {rows.map(([label, value]) => (
          <View
            key={label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: t.spacing.lg,
              paddingHorizontal: t.spacing.xxl,
              paddingVertical: t.spacing.s13,
            }}
          >
            <Text variant="small" color="muted">
              {label}
            </Text>
            <Text variant="smallStrong" align="right" style={{ flexShrink: 1 }}>
              {value}
            </Text>
          </View>
        ))}
      </Card>

      <View style={{ flex: 1 }} />

      <Button label="Accept · no download needed" onPress={() => router.replace('/today')} />
      <Text variant="caption" color="muted" align="center">
        Check in from your texts this week. Get the app whenever you want.
      </Text>
    </Screen>
  );
}
