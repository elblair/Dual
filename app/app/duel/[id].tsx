import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Pause, Users } from 'lucide-react-native';
import { Avatar, BackButton, Button, Card, Dots, ErrorBanner, ErrorView, LoadingView, Screen, Text } from '@/components';
import { DEMO } from '@/config';
import { useData, useDuel, useMe } from '@/data';
import { hobbyById } from '@/data/sample';
import { shortDate } from '@/lib/dates';
import { resultHref } from '@/lib/routes';
import { hobbyIcons } from '@/lib/hobbyIcons';
import { WEEKDAYS, myDayStates, myScore, theirDayStates, theirScore } from '@/lib/duel';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';

/** Duel (Figma 217:79): the score, the 7 dots each, the rules, and the way out (break / forfeit). */
export default function DuelScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: duel, error: duelError, loading: duelLoading, refetch: refetchDuel } = useDuel(id);
  const { data: me, refetch: refetchMe } = useMe();
  const { refreshing, onRefresh } = useRefresh(refetchDuel, refetchMe);
  const [note, setNote] = useState('');

  if (duelLoading) {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  }
  if (!duel || !me) {
    return (
      <Screen>
        <ErrorView message={duelError?.message ?? 'Duel not found.'} onRetry={onRefresh} />
      </Screen>
    );
  }

  const hobby = hobbyById(duel.hobbyId);
  const HobbyIcon = hobbyIcons[duel.hobbyId];
  const dayNumber = Math.min(duel.today + 1, duel.lengthDays);
  const openBreak = (pick: 'rest' | 'pause' | 'forfeit') => router.push({ pathname: '/break/[id]', params: { id: duel.id, pick } });

  async function seeHowItEnds() {
    if (!duel) return;
    if (duel.status === 'finished') {
      router.push(resultHref(duel.id));
    } else if (DEMO) {
      // Demo: fast-forward this duel to the end, then show the result.
      let current = duel;
      for (let i = 0; i < 8 && current.status !== 'finished'; i++) {
        await data.demo.advanceDay();
        current = await data.getDuel(duel.id);
      }
      router.push(resultHref(duel.id));
    } else {
      setNote('Your result arrives on Saturday.');
    }
  }

  const info: { icon: typeof Users; label: string; value: string }[] = [
    { icon: HobbyIcon, label: 'Goal', value: `${duel.minutes} min a day · ends Saturday` },
    { icon: Users, label: 'Check-ins', value: 'You confirm each other · crew votes on disputes' },
  ];

  return (
    <Screen scroll gap="loose" refresh={{ refreshing, onRefresh }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton />
        <Text variant="headerTitle">{hobby.label}</Text>
        <View style={{ width: t.sizes.backButton }} />
      </View>

      {duelError ? <ErrorBanner message={`${duelError.message} Pull down to try again.`} /> : null}

      <Card
        variant="surface"
        style={{
          borderRadius: t.radii.score,
          paddingHorizontal: t.spacing.xxxl,
          paddingVertical: t.spacing.gutter,
          alignItems: 'center',
          gap: t.spacing.xxl,
        }}
      >
        <Text variant="eyebrow" color="muted">
          Day {dayNumber} of {duel.lengthDays} · Friendly
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.gutter }}>
          <View style={{ alignItems: 'center', gap: t.spacing.s6 }}>
            <Avatar name={me.name} tone="you" size="lg" ring="orange" />
            <Text variant="smallStrong">You</Text>
          </View>
          <Text variant="score">
            {myScore(duel)} – {theirScore(duel)}
          </Text>
          <View style={{ alignItems: 'center', gap: t.spacing.s6 }}>
            <Avatar name={duel.opponent.name} tone={duel.opponent.tone} size="lg" />
            <Text variant="smallStrong">{duel.opponent.name}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'center', gap: t.spacing.sm }}>
          <Dots days={myDayStates(duel)} tone="you" size="lg" />
          <Dots days={theirDayStates(duel)} tone="opponent" size="lg" />
          <View style={{ flexDirection: 'row', gap: t.sizes.dotGap }}>
            {WEEKDAYS.map((letter, i) => (
              <View key={i} style={{ width: t.sizes.dot.lg, alignItems: 'center' }}>
                <Text variant="tiny" color="muted">
                  {letter}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Card>

      <Card variant="outline" style={{ padding: 0, overflow: 'hidden' }}>
        {info.map(({ icon: Icon, label, value }) => (
          <View
            key={label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.spacing.lg,
              paddingHorizontal: t.spacing.xxl,
              paddingVertical: t.spacing.s13,
            }}
          >
            <Icon size={t.sizes.icon.md} color={t.colors.muted} strokeWidth={2} />
            <View style={{ flex: 1, gap: 1 }}>
              <Text variant="caption" color="muted">
                {label}
              </Text>
              <Text variant="labelMedium">{value}</Text>
            </View>
          </View>
        ))}
      </Card>

      {duel.status === 'paused' ? (
        <Card variant="orangeTint" style={{ gap: t.spacing.lg }}>
          <Text variant="label">Paused until {duel.pausedUntil ? shortDate(duel.pausedUntil) : 'next week'}</Text>
          <Text variant="small" color="muted">
            The dual is frozen for both of you. Nothing is lost.
          </Text>
          <Button label="Resume dual" variant="orange" onPress={() => data.resume(duel.id)} />
        </Card>
      ) : duel.status === 'active' ? (
        <>
          <Text variant="label" color="muted">
            Need a break?
          </Text>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            {[
              { key: 'rest' as const, icon: Calendar, label: `Rest day · ${duel.restLeft} left` },
              { key: 'pause' as const, icon: Pause, label: 'Pause 1 week' },
            ].map(({ key, icon: Icon, label }) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                onPress={() => openBreak(key)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: t.spacing.sm,
                  paddingHorizontal: t.spacing.md,
                  paddingVertical: t.spacing.lg,
                  borderRadius: t.radii.md,
                  backgroundColor: t.colors.surface,
                }}
              >
                <Icon size={t.sizes.icon.sm} color={t.colors.ink} strokeWidth={2} />
                <Text variant="smallMedium">{label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={() => openBreak('forfeit')} style={{ alignSelf: 'flex-start' }}>
            <Text variant="smallMedium" color="maroonBright">
              Forfeit
            </Text>
          </Pressable>
        </>
      ) : null}

      <View style={{ flex: 1 }} />

      {note ? (
        <Text variant="caption" color="muted" align="center">
          {note}
        </Text>
      ) : null}
      <Button label="See how it ends (Saturday)" variant="soft" onPress={seeHowItEnds} />
    </Screen>
  );
}
