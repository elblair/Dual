import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Logo, Screen, Text } from '@/components';
import { useTheme } from '@/theme';

/** First screen for anyone who is not signed in: sign up or log in. NOT in Figma: built from the same tokens. */
export default function WelcomeScreen() {
  const t = useTheme();
  const router = useRouter();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: t.spacing.lg }}>
        <Logo size="lg" />
        <Text variant="titleLg">Keep up a hobby with a friend.</Text>
        <Text variant="body" color="muted">
          Check in every day for 7 days. Whoever shows up more wins.
        </Text>
      </View>

      <Button label="Create account" onPress={() => router.push('/auth?mode=signup')} />
      <Button label="Log in" variant="outline" onPress={() => router.push('/auth?mode=login')} />
      <Pressable accessibilityRole="link" onPress={() => router.push('/code')} style={{ alignSelf: 'center' }}>
        <Text variant="labelMedium" color="blue">
          I have a code
        </Text>
      </Pressable>
    </Screen>
  );
}
