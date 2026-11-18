import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Button, Screen, Text, TextField } from '@/components';
import { useData, useMe } from '@/data';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/** Wait before "Send a new code" works again (the API refuses sooner resends too). */
const RESEND_SECONDS = 30;
const CODE_LENGTH = 6;

/**
 * Verify: type the 6-digit code we emailed at sign-up. Everyone signed in but unverified lands here (from Auth and the
 * launcher). NOT in Figma: built from the same tokens as Auth and "Got a code?".
 */
export default function VerifyScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { data: me, loading } = useMe();
  const { pendingCode, setPendingCode } = useOnboarding();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);
  // Set while verifying, so the "already verified" redirect below doesn't race next() (which may go to Accept).
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  if (!loading && !me) return <Redirect href="/welcome" />;
  if (me?.emailVerified && !verifying) return <Redirect href="/today" />;

  function next() {
    if (pendingCode) {
      setPendingCode(null);
      router.replace({ pathname: '/accept', params: { code: pendingCode } });
    } else {
      router.replace('/today');
    }
  }

  async function verify() {
    setBusy(true);
    setVerifying(true);
    setError('');
    setNotice('');
    try {
      await data.verifyEmail(code);
      next();
    } catch (e) {
      setVerifying(false);
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError('');
    setNotice('');
    try {
      await data.resendCode();
      setCode('');
      setWait(RESEND_SECONDS);
      setNotice('New code sent. The old one no longer works.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
  }

  async function switchAccount() {
    await data.logout();
    router.replace('/welcome');
  }

  return (
    <Screen scroll>
      <Text variant="titleLg">Verify your email</Text>
      <Text variant="body" color="muted">
        {me?.email ? `We sent a ${CODE_LENGTH}-digit code to ${me.email}. It works for 10 minutes.` : `Enter the ${CODE_LENGTH}-digit code we emailed you.`}
      </Text>

      <View style={{ marginTop: t.spacing.sm, gap: t.spacing.sm }}>
        <TextField
          label="Code"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, CODE_LENGTH))}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
        />
        {error ? (
          <Text variant="caption" color="maroonBright">
            {error}
          </Text>
        ) : null}
        {notice ? (
          <Text variant="caption" color="muted">
            {notice}
          </Text>
        ) : null}
      </View>

      <Pressable accessibilityRole="button" disabled={wait > 0} onPress={resend} style={{ alignSelf: 'flex-start' }}>
        <Text variant="labelMedium" color={wait > 0 ? 'mutedSoft' : 'link'}>
          {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
        </Text>
      </Pressable>

      <View style={{ flex: 1 }} />

      <Button label="Verify" disabled={code.length < CODE_LENGTH || busy} onPress={verify} />
      <Pressable accessibilityRole="link" onPress={switchAccount} style={{ alignSelf: 'center' }}>
        <Text variant="labelMedium" color="link">
          Use a different email
        </Text>
      </Pressable>
    </Screen>
  );
}
