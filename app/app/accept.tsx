import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, BackButton, Button, Card, Screen, Text } from '@/components';
import { useData, useDuelByCode, useMe } from '@/data';
import { hobbyById } from '@/data/sample';
import { useTheme } from '@/theme';

/**
 * Accept (Figma 215:152), shown in-app to the invited friend after entering a code.
 * The browser chrome from the Figma frame (URL pill, "what Eleanor sees") is dropped.
 */
export default function AcceptScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { data: duel } = useDuelByCode(code);
  const { data: me } = useMe();

  if (!duel || !me) return <Screen background="surface">{null}</Screen>;

  const hobby = hobbyById(duel.hobbyId);
  const rows: [string, string][] = [
    ['Hobby', `${hobby.label} · ${duel.minutes} min a day`],
    ['Length', '7 days, starts tomorrow'],
    ['Check-ins', 'One tap · you confirm each other'],
    ['Stake', 'None'],
  ];

  async function accept() {
    if (!duel) return;
    await data.acceptDuel(duel.id);
    router.replace('/today');
  }

  return (
    <Screen scroll background="surface" contentStyle={{ alignItems: 'center' }}>
      <View style={{ alignSelf: 'flex-start' }}>
        <BackButton tone="strong" />
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xl }}>
        <Avatar name={me.name} tone="you" size="xxl" ring="white" />
        <Text variant="subheading" color="orange" style={{ fontFamily: t.fonts.bold }}>
          VS
        </Text>
        <Avatar name={duel.opponent.name} tone={duel.opponent.tone} size="xxl" ring="white" />
      </View>

      <Text variant="title" align="center">
        {me.name} challenged you
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

      <Button label="Accept · no download needed" onPress={accept} />
      <Text variant="caption" color="muted" align="center">
        Check in from your texts this week. Get the app whenever you want.
      </Text>
    </Screen>
  );
}
