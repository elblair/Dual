import { useEffect, useState } from 'react';
import { Platform, Pressable, Share, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { MessageSquare, Send } from 'lucide-react-native';
import { BackButton, Button, Card, ContactRow, Logo, Screen, Text, TextField } from '@/components';
import { useData, useMe, type UserHit } from '@/data';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/**
 * Friend (Figma 215:98): step 2 of 2. Find a real person by name or email, or invite someone who is not on Dual by text.
 * The search field and the results are not in Figma (the frame showed a fixed contacts list): built from the theme.
 */
export default function FriendScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { data: me, loading: meLoading } = useMe();
  const { hobby, minutes, friend, setFriend, reset } = useOnboarding();

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<UserHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) {
      setHits([]);
      setSearchError('');
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        setHits(await data.searchUsers(q));
        setSearchError('');
      } catch (e) {
        setSearchError(e instanceof Error ? e.message : 'Search failed. Try again.');
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, data]);

  if (!meLoading && !me) return <Redirect href="/welcome" />; // a session is needed to search

  const message = `I’m ${hobby.phrase} ${minutes} min a day this week. Dual me so I don’t quit? ${hobby.emoji}`;

  async function send() {
    if (sending) return;
    setSending(true);
    setError('');
    try {
      const duel = await data.createDuel({ hobbyId: hobby.id, minutes, friendId: friend?.id ?? null });
      if (!friend) {
        // Not on Dual yet: text them the code (the browser has no share sheet, so copy it instead).
        const full = `${message}\nOpen Dual and enter the code ${duel.inviteCode}`;
        if (Platform.OS === 'web') {
          try {
            await Promise.race([Clipboard.setStringAsync(full), new Promise((resolve) => setTimeout(resolve, 1500))]);
          } catch {
            /* clipboard blocked by the browser */
          }
        } else {
          await Share.share({ message: full });
        }
      }
      reset();
      router.replace('/today');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
        <BackButton />
        <Text variant="eyebrow" color="orangeDark">
          STEP 2 OF 2
        </Text>
      </View>

      <Text variant="title">Who’ll keep you honest?</Text>
      <Text variant="subtitle" color="muted">
        Pick someone who’d actually notice if you skipped.
      </Text>

      <TextField label="Find a friend on Dual" value={query} onChangeText={setQuery} placeholder="Name or email" autoCapitalize="none" />

      <View style={{ gap: t.spacing.hairline }} accessibilityRole="radiogroup">
        {hits.map((h) => (
          <ContactRow
            key={h.id}
            name={h.name}
            subtitle={h.emailHint}
            tone="opponent"
            selected={friend?.id === h.id}
            onPress={() => setFriend(friend?.id === h.id ? null : { id: h.id, name: h.name })}
          />
        ))}
        {searching ? (
          <Text variant="small" color="muted">
            Searching…
          </Text>
        ) : null}
        {searchError ? (
          <Text variant="small" color="maroonBright">
            {searchError}
          </Text>
        ) : null}
        {!searching && !searchError && q.length < 2 ? (
          <Text variant="small" color="muted">
            Type at least 2 letters of a name or email. Not on Dual yet? Invite them by text below.
          </Text>
        ) : null}
        {!searching && !searchError && q.length >= 2 && hits.length === 0 ? (
          <Text variant="small" color="muted">
            No one on Dual matches “{q}”. Invite them by text below.
          </Text>
        ) : null}
      </View>

      {friend ? (
        <Card variant="surface" style={{ gap: t.spacing.sm }}>
          <Text variant="bodyStrong">Invite {friend.name}</Text>
          <Text variant="small" color="muted">
            {friend.name} will see your {hobby.label.toLowerCase()} challenge ({minutes} min a day) under Pending invites on Today, and can accept it there.
          </Text>
        </Card>
      ) : (
        <>
          <Text variant="smallStrong" color="muted">
            Or invite someone by text
          </Text>
          <Card variant="surface" style={{ gap: t.spacing.sm }}>
            <Text variant="body">“{message}”</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: t.spacing.md,
                backgroundColor: t.colors.cardRaised,
                borderRadius: t.radii.sm,
                paddingHorizontal: t.spacing.lg,
                paddingVertical: t.spacing.md,
              }}
            >
              <Logo />
              <Text variant="caption" color="muted" style={{ flexShrink: 1 }}>
                Your invite code is added when you send
              </Text>
            </View>
          </Card>
        </>
      )}

      <Pressable accessibilityRole="link" onPress={() => router.push('/code')} style={{ alignSelf: 'center' }}>
        <Text variant="labelMedium" color="link">
          Got an invite code? Enter it
        </Text>
      </Pressable>

      <View style={{ flex: 1 }} />

      {error ? (
        <Text variant="caption" color="maroonBright" align="center">
          {error}
        </Text>
      ) : null}
      <Button
        label={friend ? `Invite ${friend.name}` : 'Send by text'}
        icon={friend ? Send : MessageSquare}
        onPress={send}
        disabled={sending}
      />
    </Screen>
  );
}
