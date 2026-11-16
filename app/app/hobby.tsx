import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { PencilLine, Sparkle } from 'lucide-react-native';
import { Button, Card, HobbyTile, Logo, Screen, Text } from '@/components';
import { useMe } from '@/data';
import { DUEL_DAYS, HOBBIES } from '@/data/catalog';
import { hobbyIconRotation, hobbyIcons } from '@/lib/hobbyIcons';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/** Hobby (Figma 215:30): step 1 of 2. Only for signed-in people (the first screen is sign up / log in). */
export default function HobbyScreen() {
  const t = useTheme();
  const router = useRouter();
  const { hobby, setHobbyId, minutes, cycleMinutes } = useOnboarding();
  const { data: me, loading } = useMe();

  // Nobody gets here without an account (or a guest session from an invite code): the first screen is sign up / log in.
  if (!me) return loading ? null : <Redirect href="/welcome" />;

  function next() {
    router.push('/friend');
  }

  const rows = [HOBBIES.slice(0, 3), HOBBIES.slice(3, 6), HOBBIES.slice(6, 9)];

  return (
    <Screen scroll gap="loose">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size="lg" />
      </View>

      <Text variant="eyebrow" color="orangeDark">
        STEP 1 OF 2
      </Text>
      <Text variant="title">What do you want to get better at?</Text>

      <View style={{ gap: t.spacing.md }}>
        {rows.map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: t.spacing.md }}>
            {row.map((h) => (
              <HobbyTile
                key={h.id}
                label={h.label}
                icon={hobbyIcons[h.id]}
                iconRotation={hobbyIconRotation[h.id]}
                selected={h.id === hobby.id}
                onPress={() => setHobbyId(h.id)}
              />
            ))}
          </View>
        ))}
      </View>

      <Card
        variant="orangeTint"
        style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg, borderRadius: t.radii.lg }}
      >
        <Sparkle size={t.sizes.icon.xl} color={t.colors.orangeDark} strokeWidth={2} />
        <View style={{ flex: 1, gap: t.spacing.hairline }}>
          <Text variant="captionStrong" color="orangeDark">
            Starter goal
          </Text>
          <Text variant="cardTitle">
            {minutes} minutes a day for {DUEL_DAYS} days
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Change daily minutes" onPress={cycleMinutes} hitSlop={12}>
          <PencilLine size={t.sizes.icon.md} color={t.colors.muted} strokeWidth={2} />
        </Pressable>
      </Card>

      <View style={{ flex: 1 }} />

      <Button label="Next: pick a friend" onPress={next} />
      {me.isGuest ? (
        <Button label="Create account" variant="outline" onPress={() => router.push('/auth?mode=signup')} />
      ) : null}
    </Screen>
  );
}
