import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { BackButton, Button, FadeIn, PasswordStrength, Screen, Text, TextField } from '@/components';
import { PASSWORD_MIN } from '@/lib/password';
import { useData } from '@/data';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/** Email sign-up / log-in. NOT in Figma: a minimal form built from the same tokens. Sign-up continues to Verify (6-digit email code). */
export default function AuthScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { pendingCode, setPendingCode } = useOnboarding();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const signup = mode !== 'login';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const nameOk = name.trim().length > 0;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const passwordOk = password.length >= PASSWORD_MIN;
  const valid = emailOk && passwordOk && (!signup || nameOk);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const creds = { email: email.trim().toLowerCase(), password };
      const me = signup ? await data.register({ ...creds, name: name.trim() }) : await data.login(creds);
      if (!me.emailVerified) {
        // Verify first; Verify carries on to Accept when they came from an invite (pendingCode stays set).
        router.replace('/verify');
      } else if (pendingCode) {
        // They opened an invite while signed out: carry on to Accept now that they have an account.
        setPendingCode(null);
        router.replace({ pathname: '/accept', params: { code: pendingCode } });
      } else {
        router.replace('/today');
      }
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

      <FadeIn style={{ gap: t.spacing.sm }}>
        <Text variant="titleLg">{signup ? 'Create your account' : 'Welcome back'}</Text>
        <Text variant="body" color="muted">
          {signup ? 'Takes about 20 seconds. We’ll email you a 6-digit code to check it’s you.' : 'Log in to pick up your duals where you left off.'}
        </Text>
      </FadeIn>

      <View style={{ gap: t.spacing.xl, marginTop: t.spacing.sm }}>
        {signup ? (
          <FadeIn index={1}>
            <TextField label="Your name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="given-name" valid={nameOk} />
          </FadeIn>
        ) : null}
        <FadeIn index={signup ? 2 : 1}>
          <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" valid={emailOk} />
        </FadeIn>
        <FadeIn index={signup ? 3 : 2} style={{ gap: t.spacing.md }}>
          <TextField
            label={signup ? `Password (${PASSWORD_MIN}+ characters)` : 'Password'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete={signup ? 'new-password' : 'current-password'}
            textContentType={signup ? 'newPassword' : 'password'}
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                hitSlop={t.spacing.md}
                onPress={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <EyeOff size={t.sizes.icon.md} color={t.colors.muted} strokeWidth={2} />
                ) : (
                  <Eye size={t.sizes.icon.md} color={t.colors.muted} strokeWidth={2} />
                )}
              </Pressable>
            }
          />
          {signup && password.length > 0 ? <PasswordStrength password={password} /> : null}
        </FadeIn>
      </View>

      <View style={{ flex: 1 }} />

      {error ? (
        <Text variant="caption" color="maroonBright" align="center">
          {error}
        </Text>
      ) : null}
      <Button label={signup ? 'Create account' : 'Log in'} disabled={!valid} loading={busy} onPress={submit} />
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          setError('');
          router.setParams({ mode: signup ? 'login' : 'signup' });
        }}
        style={{ alignSelf: 'center' }}
      >
        <Text variant="labelMedium" color="link">
          {signup ? 'I already have an account' : 'Create an account instead'}
        </Text>
      </Pressable>
    </Screen>
  );
}
