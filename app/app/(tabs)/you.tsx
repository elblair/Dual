import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Check, ShieldCheck, Smartphone, Trophy } from 'lucide-react-native';
import { Avatar, Button, Card, Screen, Text } from '@/components';
import { DEMO } from '@/config';
import { useData, useDuels, useMe } from '@/data';
import { hobbyById } from '@/data/sample';
import { useTheme } from '@/theme';

/** Sample friendship lines for the two seeded friends; anyone else gets a generic line. */
const RIVAL_LINES: Record<string, string> = {
  eleanor: 'Friendship Lv 3 · 3 duals · 1 – 2',
  tanish: 'Friendship Lv 1 · 1 dual · live',
};

/** You (Figma 217:314). Stats, tier and rivals are sample data except "days checked in" and the hobby list. */
export default function YouScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { data: me } = useMe();
  const { data: duels } = useDuels();

  if (!me || !duels) return <Screen tabBar>{null}</Screen>;

  const hobbies = [...new Set(duels.map((d) => hobbyById(d.hobbyId).label))];
  const rivals = [...new Map(duels.map((d) => [d.opponent.id, d.opponent])).values()];
  const checkedInDays = duels.reduce((n, d) => n + d.myDays.length, 0);

  const stats = [
    { value: '8', label: 'duals won' },
    { value: '5', label: 'second duals' },
    { value: String(checkedInDays), label: 'days checked in' },
  ];

  const settingsRows: { icon: typeof ShieldCheck; title: string; sub: string; onPress?: () => void }[] = [
    { icon: ShieldCheck, title: 'Connected apps', sub: 'Strava, Apple Watch' },
    { icon: Smartphone, title: 'Lock screen widget', sub: 'Check in without opening the app', onPress: () => router.push('/lock') },
  ];

  return (
    <Screen scroll tabBar gap="loose">
      <Text variant="display">You</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xl }}>
        <Avatar name={me.name} tone="brand" size="xl" ring="orange" />
        <View style={{ flex: 1, gap: t.spacing.hairline }}>
          <Text variant="heading">{me.name}</Text>
          <Text variant="small" color="muted">
            {hobbies.length ? hobbies.join(' · ') : 'No duals yet'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
        {stats.map((s) => (
          <Card
            key={s.label}
            variant="surface"
            style={{
              flex: 1,
              alignItems: 'center',
              gap: t.spacing.hairline,
              borderRadius: t.radii.md,
              paddingHorizontal: t.spacing.sm,
              paddingVertical: t.spacing.xl,
            }}
          >
            <Text variant="headingLg">{s.value}</Text>
            <Text variant="micro" color="muted">
              {s.label}
            </Text>
          </Card>
        ))}
      </View>

      <Card variant="outline" style={{ padding: t.spacing.xxl, gap: t.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <Trophy size={t.sizes.icon.lg} color={t.colors.orange} strokeWidth={2} />
            <Text variant="headingSm">Silver</Text>
          </View>
          <Text variant="caption" color="muted">
            2 wins to Gold
          </Text>
        </View>
        {[
          { text: 'Silver perk: 1 extra rest day every month', earned: true },
          { text: 'Gold perk: start your own group rivalries', earned: false },
        ].map((p) => (
          <View key={p.text} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
            <View
              style={{
                width: t.sizes.radio,
                height: t.sizes.radio,
                borderRadius: t.sizes.radio / 2,
                backgroundColor: p.earned ? t.colors.successTint : t.colors.surfaceStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={t.sizes.icon.badge} color={p.earned ? t.colors.success : t.colors.muted} strokeWidth={3} />
            </View>
            <Text variant="subtitle" style={{ flex: 1 }}>
              {p.text}
            </Text>
          </View>
        ))}
      </Card>

      {rivals.length > 0 ? (
        <>
          <Text variant="label" color="muted">
            Your rivals
          </Text>
          {rivals.map((r) => (
            <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
              <Avatar name={r.name} tone={r.tone} size="md" />
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="bodyStrong">{r.name}</Text>
                <Text variant="caption" color="muted">
                  {RIVAL_LINES[r.id] ?? 'Friendship Lv 1 · 1 dual · live'}
                </Text>
              </View>
            </View>
          ))}
        </>
      ) : null}

      <Card variant="surface" style={{ padding: 0, overflow: 'hidden' }}>
        {settingsRows.map(({ icon: Icon, title, sub, onPress }) => (
          <Pressable
            key={title}
            accessibilityRole={onPress ? 'button' : undefined}
            onPress={onPress}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.spacing.lg,
              paddingHorizontal: t.spacing.xxl,
              paddingVertical: t.spacing.xl,
            }}
          >
            <Icon size={t.sizes.icon.md} color={t.colors.ink} strokeWidth={2} />
            <View style={{ flex: 1, gap: 1 }}>
              <Text variant="label">{title}</Text>
              <Text variant="caption" color="muted">
                {sub}
              </Text>
            </View>
            <ChevronRight size={t.sizes.icon.sm} color={t.colors.muted} strokeWidth={2} />
          </Pressable>
        ))}
      </Card>

      {DEMO ? (
        <Card variant="outline" style={{ padding: t.spacing.xxl, gap: t.spacing.lg }}>
          <Text variant="label">Demo tools</Text>
          <Text variant="caption" color="muted">
            Only visible when EXPO_PUBLIC_DEMO=true.
          </Text>
          <Button label="Fast-forward a day" variant="soft" onPress={() => data.demo.advanceDay()} />
          <Button label="Eleanor checks in" variant="soft" onPress={() => data.demo.opponentCheckIn()} />
          <Button
            label="Reset demo"
            variant="outline"
            onPress={async () => {
              await data.demo.reset();
              router.replace('/today');
            }}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
