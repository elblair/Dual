import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Check, Clock, Flame, Hourglass, Pause, Users } from 'lucide-react-native';
import { Avatar, BackButton, Button, Card, Dots, ErrorBanner, ErrorView, LoadingView, Screen, Text } from '@/components';
import { useData, useDuel, useMe } from '@/data';
import { hobbyById } from '@/data/catalog';
import { shortDate, whenLabel } from '@/lib/dates';
import { resultHref } from '@/lib/routes';
import { hobbyIcons } from '@/lib/hobbyIcons';
import { friendName, goalText, lastDayName, leadLabel, myDayStates, pendingInviteLabel, myScore, theirDayStates, theirScore, weekdayLetters } from '@/lib/duel';
import { useRefresh } from '@/lib/useRefresh';
import { useTheme } from '@/theme';

/** Duel (Figma 217:79): the score, the 7 dots each, the rules, and the way out (break / forfeit). All from the duel's data. */
export default function DuelScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: duel, error: duelError, loading: duelLoading, refetch: refetchDuel } = useDuel(id);
  const { data: me, refetch: refetchMe } = useMe();
  const { refreshing, onRefresh } = useRefresh(refetchDuel, refetchMe);

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
  const letters = weekdayLetters(duel.startedAt, duel.lengthDays);

  const info: { icon: typeof Users; label: string; value: string }[] = [
    { icon: HobbyIcon, label: 'Goal', value: `${goalText(duel)} · ends ${lastDayName(duel.startedAt, duel.lengthDays)}` },
    {
      icon: Users,
      label: 'How check-ins work',
      value: `${friendName(duel)} confirms yours, you confirm theirs. A day counts for you once they confirm it.`,
    },
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
          {duel.status === 'finished' ? 'Finished' : duel.status === 'pending' ? pendingInviteLabel(duel) : `Day ${dayNumber} of ${duel.lengthDays}`} · Friendly
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
            {duel.opponent ? (
              <Avatar name={friendName(duel)} tone="opponent" size="lg" />
            ) : (
              <Avatar name="Your friend has not joined yet" icon={Hourglass} tone="neutral" size="lg" />
            )}
            <Text variant="smallStrong">{duel.opponent ? friendName(duel) : 'Not joined yet'}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'center', gap: t.spacing.sm }}>
          <Dots days={myDayStates(duel)} tone="you" size="lg" />
          <Dots days={theirDayStates(duel)} tone="opponent" size="lg" />
          <View style={{ flexDirection: 'row', gap: t.sizes.dotGap }}>
            {letters.map((letter, i) => (
              <View key={i} style={{ width: t.sizes.dot.lg, alignItems: 'center' }}>
                <Text variant="tiny" color="muted">
                  {letter}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {duel.status !== 'pending' ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.spacing.s6,
              paddingHorizontal: t.spacing.lg,
              paddingVertical: t.spacing.s6,
              borderRadius: t.radii.pill,
              backgroundColor: t.colors.orangeTint,
            }}
          >
            <Flame size={t.sizes.icon.xs} color={t.colors.orangeDark} strokeWidth={2} />
            <Text variant="captionStrong" color="orangeDark">
              {leadLabel(duel)}
            </Text>
          </View>
        ) : null}
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

      {duel.activity.length > 0 ? (
        <>
          <Text variant="headingSm">Recent check-ins</Text>
          <View style={{ gap: t.spacing.xl }}>
            {duel.activity.map((a) => {
              const mine = a.who === 'me';
              const name = mine ? 'You' : friendName(duel);
              const status = a.confirmed
                ? mine
                  ? `${friendName(duel)} confirmed`
                  : 'you confirmed'
                : mine
                  ? `waiting for ${friendName(duel)} to confirm`
                  : 'waiting for you to confirm';
              return (
                <View key={`${a.who}-${a.dayIndex}`} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
                  <Avatar name={mine ? me.name : friendName(duel)} tone={mine ? 'you' : 'opponent'} size="md" />
                  <View style={{ flex: 1, gap: t.spacing.hairline }}>
                    <Text variant="bodyStrong">
                      {name} · {a.minutes} min
                    </Text>
                    <Text variant="caption" color="muted">
                      {whenLabel(a.createdAt)} · {status}
                    </Text>
                    {a.note ? (
                      <Text variant="caption" color="muted">
                        “{a.note}”
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={{
                      width: t.sizes.perkBadge,
                      height: t.sizes.perkBadge,
                      borderRadius: t.sizes.perkBadge / 2,
                      backgroundColor: a.confirmed ? t.colors.success : t.colors.surfaceStrong,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityLabel={a.confirmed ? 'Confirmed' : 'Waiting for confirmation'}
                  >
                    {a.confirmed ? (
                      <Check size={t.sizes.icon.xs} color={t.colors.white} strokeWidth={3} />
                    ) : (
                      <Clock size={t.sizes.icon.xs} color={t.colors.muted} strokeWidth={2} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      {duel.status === 'paused' ? (
        <Card variant="orangeTint" style={{ gap: t.spacing.lg }}>
          <Text variant="label">Paused{duel.pausedUntil ? ` until ${shortDate(duel.pausedUntil)}` : ''}</Text>
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

      {/* The result exists only once the duel has really ended. */}
      {duel.status === 'finished' ? <Button label="See the result" variant="soft" onPress={() => router.push(resultHref(duel.id))} /> : null}
    </Screen>
  );
}
