import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Hourglass, Share2 } from 'lucide-react-native';
import { Avatar, Button, Card, ErrorView, LoadingView, Pill, Screen, Text } from '@/components';
import { useDuel, useMe } from '@/data';
import { DUEL_DAYS, hobbyById } from '@/data/catalog';
import { goalText, pendingInviteLabel } from '@/lib/duel';
import { useTheme } from '@/theme';

/**
 * Sent (Figma Base Sent 197:239): shown right after you challenge someone. Everything comes from the duel you just made.
 * Dropped from the Figma frame: Vibe and Stake (not in the app), and "24 hours to accept" / "we'll text a link" (there is
 * no expiry and no link: a named friend sees it under Pending invites, anyone else enters the code). A friend who has not
 * joined yet is shown as a neutral hourglass avatar with "Invite sent · code ...", never as a made-up name or "?".
 */
export default function SentScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: duel, error, loading, refetch } = useDuel(id);
  const { data: me } = useMe();
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  }
  if (!duel || !me) {
    return (
      <Screen>
        <ErrorView message={error?.message ?? 'We couldn’t find that duel.'} onRetry={refetch} />
      </Screen>
    );
  }

  const friend = duel.opponent;
  const hobby = hobbyById(duel.hobbyId);
  const rows: [string, string][] = [
    ['Hobby', hobby.label],
    ['Goal', goalText(duel)],
    ['Length', `${duel.lengthDays || DUEL_DAYS} days`],
    ['Check-ins', 'Friend confirms'],
  ];

  async function copyCode() {
    if (!duel?.inviteCode) return;
    try {
      await Clipboard.setStringAsync(duel.inviteCode);
      setCopied(true);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <Screen scroll contentStyle={{ alignItems: 'center' }}>
      <View style={{ flex: 1 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.xl }}>
        <Avatar name={me.name} tone="you" size="xxl" />
        <Text variant="subheading" color="orange" style={{ fontFamily: t.fonts.bold }}>
          VS
        </Text>
        {friend ? (
          <Avatar name={friend.name} tone="opponent" size="xxl" />
        ) : (
          <Avatar name="Your friend has not joined yet" icon={Hourglass} tone="neutral" size="xxl" />
        )}
      </View>
      {!friend ? (
        <Text variant="bodyStrong" color="muted">
          {pendingInviteLabel(duel)}
        </Text>
      ) : null}

      <Text variant="eyebrow" color="orangeDark">
        CHALLENGE SENT
      </Text>
      <Text variant="title" align="center">
        Your dual is on its way
      </Text>
      <Text variant="subtitle" color="muted" align="center">
        {friend
          ? `${friend.name} will see your invite under Pending invites on Today and can accept it there.`
          : 'Send your friend the code below. They enter it with “Enter an invite code” on Today.'}
      </Text>

      {!friend && duel.inviteCode ? (
        <Card variant="orangeTint" style={{ alignSelf: 'stretch', alignItems: 'center', gap: t.spacing.md }}>
          <Text variant="caption" color="orangeDark">
            Invite code
          </Text>
          <Text variant="display" style={{ letterSpacing: 6 }}>
            {duel.inviteCode}
          </Text>
          <Pill label={copied ? 'Copied' : 'Copy code'} onPress={copyCode} />
        </Card>
      ) : null}

      <Card variant="surface" style={{ alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md, padding: t.spacing.lg }}>
        {rows.map(([label, value]) => (
          <Card key={label} variant="white" style={{ flexBasis: '47%', flexGrow: 1, gap: t.spacing.hairline, paddingVertical: t.spacing.lg }}>
            <Text variant="caption" color="muted">
              {label}
            </Text>
            <Text variant="bodyStrong">{value}</Text>
          </Card>
        ))}
      </Card>

      <View style={{ flex: 1 }} />

      <Button label="Back home" onPress={() => router.replace('/today')} />
      <Button label="Invite someone else" variant="soft" icon={Share2} onPress={() => router.replace('/hobby')} />
    </Screen>
  );
}
