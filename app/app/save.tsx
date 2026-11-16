import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Flame, Mail } from 'lucide-react-native';
import { BackButton, Button, Screen, Text } from '@/components';
import { useDuels } from '@/data';
import { useTheme } from '@/theme';

/** Save (Figma 217:407): "Save your streak" account prompt for guests. Email is the only way to sign up. */
export default function SaveScreen() {
  const t = useTheme();
  const router = useRouter();
  const { data: duels } = useDuels();
  const friend = duels?.find((d) => d.status === 'active' || d.status === 'paused')?.opponent?.name;

  return (
    <Screen scroll>
      <View style={{ alignItems: 'flex-start' }}>
        <BackButton />
      </View>

      <View
        style={{
          width: t.sizes.flameTile,
          height: t.sizes.flameTile,
          borderRadius: t.radii.xl + 2,
          backgroundColor: t.colors.orangeTint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Flame size={t.sizes.icon.flame} color={t.colors.orange} strokeWidth={2} />
      </View>

      <Text variant="titleLg">Save your streak</Text>
      <Text variant="body" color="muted">
        {friend ? `You’ve already started. Create an account so your dual with ${friend} is safe.` : 'Create an account so your duals are safe.'}
      </Text>

      <View style={{ flex: 1 }} />

      <Button label="Create account with email" icon={Mail} onPress={() => router.push('/auth?mode=signup')} />
      <Text variant="micro" color="muted" align="center">
        It takes about 20 seconds.
      </Text>
    </Screen>
  );
}
