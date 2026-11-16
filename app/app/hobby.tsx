import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, BookOpen, Code, Dumbbell, Globe, Leaf, Music, Palette, Pencil, Sparkles, Utensils, type LucideIcon } from 'lucide-react-native';
import { Button, Card, HobbyTile, Logo, Screen, Text } from '@/components';
import { HOBBIES } from '@/data/sample';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

const hobbyIcons: Record<string, LucideIcon> = {
  guitar: Music,
  running: Activity,
  spanish: Globe,
  gym: Dumbbell,
  reading: BookOpen,
  drawing: Palette,
  cooking: Utensils,
  coding: Code,
  meditation: Leaf,
};

/** Hobby (Figma 215:30): step 1 of 2, no account needed. */
export default function HobbyScreen() {
  const t = useTheme();
  const router = useRouter();
  const { hobby, setHobbyId, minutes, cycleMinutes } = useOnboarding();

  const rows = [HOBBIES.slice(0, 3), HOBBIES.slice(3, 6), HOBBIES.slice(6, 9)];

  return (
    <Screen scroll gap="loose">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size="lg" />
        <Pressable accessibilityRole="link" onPress={() => router.push('/auth?mode=login')}>
          <Text variant="labelMedium" color="blue">
            Log in
          </Text>
        </Pressable>
      </View>

      <Text variant="eyebrow" color="orangeDark">
        STEP 1 OF 2 · NO ACCOUNT NEEDED
      </Text>
      <Text variant="title">What do you want to get better at?</Text>

      <View style={{ gap: t.spacing.md }}>
        {rows.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: t.spacing.md }}>
            {row.map((h) => (
              <HobbyTile key={h.id} label={h.label} icon={hobbyIcons[h.id]} selected={h.id === hobby.id} onPress={() => setHobbyId(h.id)} />
            ))}
          </View>
        ))}
      </View>

      <Card
        variant="orangeTint"
        style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg, borderRadius: t.radii.lg }}
      >
        <Sparkles size={t.sizes.icon.xl} color={t.colors.orangeDark} strokeWidth={2} />
        <View style={{ flex: 1, gap: t.spacing.hairline }}>
          <Text variant="captionStrong" color="orangeDark">
            Starter goal
          </Text>
          <Text variant="cardTitle">{minutes} minutes a day for 7 days</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Change daily minutes" onPress={cycleMinutes} hitSlop={12}>
          <Pencil size={t.sizes.icon.md} color={t.colors.muted} strokeWidth={2} />
        </Pressable>
      </Card>

      <View style={{ flex: 1 }} />

      <Button label="Next: pick a friend" onPress={() => router.push('/friend')} />
      <Pressable accessibilityRole="link" onPress={() => router.push('/code')} style={{ alignSelf: 'center' }}>
        <Text variant="labelMedium" color="blue">
          I have a code
        </Text>
      </Pressable>
    </Screen>
  );
}
