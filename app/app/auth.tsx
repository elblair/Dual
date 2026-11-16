import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton, Button, Screen, Text, TextField } from '@/components';
import { useTheme } from '@/theme';

/**
 * Email sign-up / log-in. NOT in Figma: a minimal form built from the same tokens.
 * Phase 2: validates the fields and continues. Phase 5 calls the API (/auth/register, /auth/login).
 */
export default function AuthScreen() {
  const t = useTheme();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const signup = mode !== 'login';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const valid = email.includes('@') && password.length >= 6 && (!signup || name.trim().length > 0);

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

      <Button label={signup ? 'Create account' : 'Log in'} disabled={!valid} onPress={() => router.replace('/today')} />
      <Pressable
        accessibilityRole="link"
        onPress={() => router.setParams({ mode: signup ? 'login' : 'signup' })}
        style={{ alignSelf: 'center' }}
      >
        <Text variant="labelMedium" color="blue">
          {signup ? 'I already have an account' : 'Create an account instead'}
        </Text>
      </Pressable>
    </Screen>
  );
}
