import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, BackButton, Button, Card, ErrorView, LoadingView, Screen, Text } from '@/components';
import { useData, useDuelByCode, useMe } from '@/data';
import { hobbyById } from '@/data/catalog';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/**
 * Accept (Figma 215:152), shown in-app to the invited friend after entering a code. Everything on it comes from the duel
 * (challenger, hobby, goal, length). The browser chrome from the Figma frame is dropped, and so is its "Stake" row.
 */
export default function AcceptScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { data: duel, error: duelError, loading: duelLoading, refetch } = useDuelByCode(code);
  const { data: me, loading: meLoading } = useMe();
  const { afterName, setAfterName } = useOnboarding();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Back from the name screen with a session: carry on with the accept.
  useEffect(() => {
    if (me && afterName === 'accept' && duel) {
      setAfterName(null);
      accept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, afterName, duel]);

  if (duelLoading || meLoading) {
    return (
      <Screen background="surface">
        <LoadingView />
      </Screen>
    );
  }
  if (!duel) {
    return (
      <Screen background="surface">
        <ErrorView message={duelError?.message ?? 'We couldn’t find that invite.'} onRetry={refetch} />
      </Screen>
    );
  }

  const hobby = hobbyById(duel.hobbyId);
  const challenger = duel.creator;
  const ownInvite = !!me && duel.viewerIsCreator;
  const rows: [string, string][] = [
    ['Hobby', `${hobby.label} · ${duel.minutes} min a day`],
    ['Length', `${duel.lengthDays} days, starts when you accept`],
    ['Check-ins', 'One tap · you confirm each other'],
  ];

  async function accept() {
    if (!duel) return;
    if (!me) {
      // Not signed in yet: ask for a first name, then come back and accept.
      setAfterName('accept');
      router.push('/name');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await data.acceptDuel(duel.id);
      router.replace('/today');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
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
        <Avatar name={me?.name ?? '?'} tone="opponent" size="xxl" ring="white" />
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

      {ownInvite ? (
        <Text variant="caption" color="maroonBright" align="center">
          This is your own invite. Send the code to a friend so they can accept it.
        </Text>
      ) : null}
      {error ? (
        <Text variant="caption" color="maroonBright" align="center">
          {error}
        </Text>
      ) : null}
      <Button label="Accept" onPress={accept} disabled={busy || ownInvite} />
    </Screen>
  );
}
