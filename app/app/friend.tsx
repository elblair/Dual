import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, MessageSquare, Send } from 'lucide-react-native';
import { BackButton, Button, Card, ContactRow, Logo, Screen, Text, TextField } from '@/components';
import { useData, useGroups, useMe, type UserHit } from '@/data';
import { useChallenge } from '@/lib/useChallenge';
import { useOnboarding } from '@/state/onboarding';
import { useTheme } from '@/theme';

/**
 * Friend (Figma 215:98). Two ways in:
 * - after the Hobby step (step 2 of 2): the button sends the invite and goes to Sent;
 * - "friend first" (`?first=1`, from Your crew > Invite): step 1 of 2, the button goes on to Hobby with this friend preselected
 *   (or, for someone not on Dual, to Hobby to make an invite code to text).
 * Find a real person by name or email, or invite someone who is not on Dual by text.
 * The search field and the results are not in Figma (the frame showed a fixed contacts list): built from the theme.
 */
export default function FriendScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { data: me, loading: meLoading } = useMe();
  const { data: groups } = useGroups();
  const { hobby, minutes, friend, setFriend } = useOnboarding();
  const { first } = useLocalSearchParams<{ first?: string }>();
  const friendFirst = first === '1';
  const { send, sending, error, message } = useChallenge();

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<UserHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const q = query.trim();

  // Friend first starts with nobody picked (an earlier pick must not stick).
  useEffect(() => {
    if (friendFirst) setFriend(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendFirst]);
  const recent = groups?.rivals ?? [];

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

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
        <BackButton />
        <Text variant="eyebrow" color="orangeDark">
          {friendFirst ? 'STEP 1 OF 2' : 'STEP 2 OF 2'}
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
            subtitle={h.level ? `${h.level} · ${h.emailHint}` : h.emailHint}
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
        {q.length < 2 && recent.length > 0 ? (
          <>
            <Text variant="smallStrong" color="muted" style={{ marginTop: t.spacing.sm }}>
              Recent
            </Text>
            {recent.map((r) => (
              <ContactRow
                key={r.person.id}
                name={r.person.name}
                subtitle={`${r.level ? `${r.level} · ` : ''}${r.duels} ${r.duels === 1 ? 'duel' : 'duels'} together`}
                tone="opponent"
                selected={friend?.id === r.person.id}
                onPress={() => setFriend(friend?.id === r.person.id ? null : { id: r.person.id, name: r.person.name })}
              />
            ))}
          </>
        ) : null}
        {!searching && !searchError && q.length >= 2 && hits.length === 0 ? (
          <Text variant="small" color="muted">
            No one on Dual matches “{q}”. Invite them by text below.
          </Text>
        ) : null}
      </View>

      {friend ? (
        <Card variant="surface" style={{ gap: t.spacing.sm }}>
          <Text variant="bodyStrong">{friendFirst ? `Challenge ${friend.name}` : `Invite ${friend.name}`}</Text>
          <Text variant="small" color="muted">
            {friendFirst
              ? `Next you pick a hobby. ${friend.name} will see your challenge under Pending invites on Today, and can accept it there.`
              : `${friend.name} will see your ${hobby.label.toLowerCase()} challenge (${minutes} min a day) under Pending invites on Today, and can accept it there.`}
          </Text>
        </Card>
      ) : friendFirst ? (
        <>
          <Text variant="smallStrong" color="muted">
            Or invite someone by text
          </Text>
          <Card variant="surface" style={{ gap: t.spacing.sm }}>
            <Text variant="small" color="muted">
              Not on Dual yet? Pick a hobby next, and we’ll make a code for you to text them.
            </Text>
          </Card>
        </>
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
      {friendFirst ? (
        <Button
          label={friend ? 'Next: pick a hobby' : 'Send by text'}
          icon={friend ? ArrowRight : MessageSquare}
          onPress={() => router.push({ pathname: '/hobby', params: friend ? { friendId: friend.id, friendName: friend.name } : { via: 'text' } })}
        />
      ) : (
        <Button
          label={friend ? `Invite ${friend.name}` : 'Send by text'}
          icon={friend ? Send : MessageSquare}
          onPress={() => send(friend)}
          disabled={sending}
        />
      )}
    </Screen>
  );
}
