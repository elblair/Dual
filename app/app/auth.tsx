import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton, Button, Screen, Text, TextField } from '@/components';
import { useData } from '@/data';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/** Email sign-up / log-in. NOT in Figma: a minimal form built from the same tokens. */
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

  const valid = email.includes('@') && password.length >= 6 && (!signup || name.trim().length > 0);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const creds = { email: email.trim().toLowerCase(), password };
      if (signup) await data.register({ ...creds, name: name.trim() });
      else await data.login(creds);
      if (pendingCode) {
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

      <Text variant="titleLg">{signup ? 'Create your account' : 'Welcome back'}</Text>
      <Text variant="body" color="muted">
        {signup ? 'Takes about 20 seconds. Your streak and your dual come with you.' : 'Log in to pick up your duals where you left off.'}
      </Text>

      <View style={{ gap: t.spacing.xl, marginTop: t.spacing.sm }}>
        {signup ? <TextField label="Your name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="given-name" /> : null}
        <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <TextField
          label={signup ? 'Password (6+ characters)' : 'Password'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={signup ? 'new-password' : 'current-password'}
        />
      </View>

      <View style={{ flex: 1 }} />

      {error ? (
        <Text variant="caption" color="maroonBright" align="center">
          {error}
        </Text>
      ) : null}
      <Button label={signup ? 'Create account' : 'Log in'} disabled={!valid || busy} onPress={submit} />
      <Pressable
        accessibilityRole="link"
        onPress={() => {
          setError('');
          router.setParams({ mode: signup ? 'login' : 'signup' });
        }}
        style={{ alignSelf: 'center' }}
      >
        <Text variant="labelMedium" color="blue">
          {signup ? 'I already have an account' : 'Create an account instead'}
        </Text>
      </Pressable>
    </Screen>
  );
}
