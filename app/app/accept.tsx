import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, BackButton, Button, Card, Screen, Text } from '@/components';
import { useData, useDuelByCode, useMe } from '@/data';
import { useOnboarding } from '@/state/onboarding';
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
  const { data: me, loading: meLoading } = useMe();
  const { afterName, setAfterName } = useOnboarding();
  const [error, setError] = useState('');

  // Back from the name screen with a session: carry on with the accept.
  useEffect(() => {
    if (me && afterName === 'accept' && duel) {
      setAfterName(null);
      accept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, afterName, duel]);

  if (!duel || meLoading) return <Screen background="surface">{null}</Screen>;

  // Left: whoever started the duel. Right: the invited friend (me, unless I'm previewing my own invite).
  const challenger = duel.creator;
  const invitee = duel.viewerIsCreator ? duel.opponent : { name: me?.name ?? 'You', tone: 'opponent' as const };;

  const hobby = hobbyById(duel.hobbyId);
  const rows: [string, string][] = [
    ['Hobby', `${hobby.label} · ${duel.minutes} min a day`],
    ['Length', '7 days, starts tomorrow'],
    ['Check-ins', 'One tap · you confirm each other'],
    ['Stake', 'None'],
  ];

  async function accept() {
    if (!duel) return;
    if (!me) {
      // Not signed in yet: ask for a first name, then come back and accept.
      setAfterName('accept');
      router.push('/name');
      return;
    }
    setError('');
    try {
      await data.acceptDuel(duel.id);
      router.replace('/today');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <Screen scroll background="surface" contentStyle={{ alignItems: 'center' }}>
      <View style={{ alignSelf: 'flex-start' }}>
        <BackButton tone="strong" />
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xl }}>
        <Avatar name={challenger.name} tone="you" size="xxl" ring="white" />
        <Text variant="subheading" color="orange" style={{ fontFamily: t.fonts.bold }}>
          VS
        </Text>
        <Avatar name={invitee.name} tone={invitee.tone} size="xxl" ring="white" />
      </View>

      <Text variant="title" align="center">
        {challenger.name} challenged you
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

      {error ? (
        <Text variant="caption" color="maroonBright" align="center">
          {error}
        </Text>
      ) : null}
      <Button label="Accept · no download needed" onPress={accept} />
      <Text variant="caption" color="muted" align="center">
        Check in from your texts this week. Get the app whenever you want.
      </Text>
    </Screen>
  );
}
