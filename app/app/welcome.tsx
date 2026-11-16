import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Logo, Screen, Text } from '@/components';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/** First screen for anyone who is not signed in: sign up or log in, nothing else. NOT in Figma: built from the same tokens. */
export default function WelcomeScreen() {
  const t = useTheme();
  const router = useRouter();
  const { pendingCode } = useOnboarding();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: t.spacing.lg }}>
        <Logo size="lg" />
        <Text variant="titleLg">Keep up a hobby with a friend.</Text>
        <Text variant="body" color="muted">
          Check in every day for 7 days. Whoever shows up more wins.
        </Text>
        {pendingCode ? (
          <Text variant="bodyStrong" color="orangeDark">
            You’ve been invited to a duel. Create an account or log in to see it.
          </Text>
        ) : null}
      </View>

      <Button label="Create account" onPress={() => router.push('/auth?mode=signup')} />
      <Button label="Log in" variant="outline" onPress={() => router.push('/auth?mode=login')} />
    </Screen>
  );
}
