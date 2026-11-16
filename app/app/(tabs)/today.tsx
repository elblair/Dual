import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Screen, Text } from '@/components';
import { useOnboarding } from '@/state/onboarding';

/** Placeholder until Phase 3 builds the real Today screen. Dev links let you reach every Phase 2 screen. */
export default function TodayPlaceholder() {
  const router = useRouter();
  const { reset } = useOnboarding();

  return (
    <Screen scroll gap="loose">
      <Text variant="display">Today</Text>
      <Text variant="body" color="muted">
        Coming in Phase 3. You made it through the onboarding flow.
      </Text>

      <View style={{ flex: 1 }} />

      <Button label="Save your streak (preview)" variant="orange" onPress={() => router.push('/save')} />
      <Button label="Component preview" variant="soft" onPress={() => router.push('/kitchen-sink')} />
      <Button
        label="Start over"
        variant="outline"
        onPress={() => {
          reset();
          router.replace('/');
        }}
      />
    </Screen>
  );
}
