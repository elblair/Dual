import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Check, MailCheck } from 'lucide-react-native';
import { Button, CodeInput, FadeIn, Screen, Text, type CodeInputHandle } from '@/components';
import { useData, useMe } from '@/data';
import { buzz } from '@/lib/haptics';
import { nativeDriver, useReducedMotion } from '@/lib/motion';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/** Wait before "Send a new code" works again (the API refuses sooner resends too: verification.RESEND_SECONDS). */
const RESEND_SECONDS = 30;
const CODE_LENGTH = 6;
/** How long a code works (verification.CODE_MINUTES on the API). */
const CODE_MINUTES = 10;

/**
 * Verify your email: type the 6-digit code we emailed at sign-up. Everyone signed in but unverified lands here (from Auth
 * and the launcher). The code submits by itself on the last digit; a wrong code shakes the boxes; the right one shows a
 * check, then moves on. NOT in Figma: built from the same tokens as Auth.
 */
export default function VerifyScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const reduced = useReducedMotion();
  const { data: me, loading } = useMe();
  const { pendingCode, setPendingCode } = useOnboarding();
  const codeInput = useRef<CodeInputHandle>(null);
  const pop = useRef(new Animated.Value(0)).current;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);
  // Set from the first verify until we leave, so the "already verified" redirect below doesn't race next() (which may go to Accept).
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

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

  async function verify(digits = code) {
    if (busy || verified || digits.length < CODE_LENGTH) return;
    setBusy(true);
    setVerifying(true);
    setError('');
    setNotice('');
    try {
      await data.verifyEmail(digits);
      setVerified(true);
      buzz('success');
      Animated.spring(pop, { toValue: 1, useNativeDriver: nativeDriver }).start();
      setTimeout(next, reduced ? 0 : t.motion.celebrate);
    } catch (e) {
      setVerifying(false);
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
      buzz('error');
      codeInput.current?.shake();
      setCode('');
      codeInput.current?.focus();
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
      codeInput.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
  }

  async function switchAccount() {
    await data.logout();
    router.replace('/welcome');
  }

  const popScale = pop.interpolate({ inputRange: [0, 1], outputRange: [t.motion.popScale, 1] });

  return (
    <Screen scroll>
      <FadeIn style={{ gap: t.spacing.lg }}>
        <View
          style={{
            width: t.sizes.checkBadge,
            height: t.sizes.checkBadge,
            borderRadius: t.radii.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: verified ? t.colors.successTint : t.colors.maroonTint,
          }}
        >
          {verified ? (
            <Animated.View style={{ opacity: pop, transform: [{ scale: popScale }] }}>
              <Check size={t.sizes.icon.flame} color={t.colors.success} strokeWidth={3} />
            </Animated.View>
          ) : (
            <MailCheck size={t.sizes.icon.flame} color={t.colors.maroon} strokeWidth={2} />
          )}
        </View>
        <Text variant="titleLg">{verified ? 'You’re verified' : 'Verify your email'}</Text>
        <Text variant="body" color="muted">
          {verified
            ? 'Taking you in…'
            : me?.email
              ? `We sent a ${CODE_LENGTH}-digit code to ${me.email}. It works for ${CODE_MINUTES} minutes.`
              : `Enter the ${CODE_LENGTH}-digit code we emailed you.`}
        </Text>
      </FadeIn>

      <FadeIn index={1} style={{ marginTop: t.spacing.sm, gap: t.spacing.lg }}>
        <CodeInput
          ref={codeInput}
          length={CODE_LENGTH}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (error) setError('');
          }}
          onComplete={verify}
          error={!!error}
          success={verified}
          disabled={busy || verified}
        />
        {error ? (
          <Text variant="caption" color="maroonBright" accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        {notice ? (
          <Text variant="caption" color="muted" accessibilityLiveRegion="polite">
            {notice}
          </Text>
        ) : null}
        {!verified ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.xs }}>
            <Text variant="small" color="muted">
              No email? Check Spam, or
            </Text>
            <Pressable accessibilityRole="button" disabled={wait > 0} onPress={resend}>
              <Text variant="smallStrong" color={wait > 0 ? 'mutedSoft' : 'link'}>
                {wait > 0 ? `send a new code in ${wait}s` : 'send a new code'}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </FadeIn>

      <View style={{ flex: 1 }} />

      {!verified ? (
        <>
          <Button label="Verify" disabled={code.length < CODE_LENGTH} loading={busy} onPress={() => verify()} />
          <Pressable accessibilityRole="link" onPress={switchAccount} style={{ alignSelf: 'center' }}>
            <Text variant="labelMedium" color="link">
              Use a different email
            </Text>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}
