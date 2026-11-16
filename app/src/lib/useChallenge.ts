import { useState } from 'react';
import { Platform, Share } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useData } from '@/data';
import { sentHref } from '@/lib/routes';
import { useOnboarding, type PickedFriend } from '@/state/onboarding';

/**
 * Creates the duel from the hobby and minutes picked so far and goes to the Sent screen.
 * Used by the Friend step (hobby first) and by the Hobby step (friend first). With a friend the duel is a named invite;
 * without one it is an open invite and the code is shared by text (the browser has no share sheet: the text is copied instead).
 */
export function useChallenge() {
  const data = useData();
  const router = useRouter();
  const { hobby, minutes, reset } = useOnboarding();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  /** The text a friend gets (the invite code is added when it is sent). */
  const message = `I’m ${hobby.phrase} ${minutes} min a day this week. Dual me so I don’t quit? ${hobby.emoji}`;

  async function send(friend: PickedFriend | null) {
    if (sending) return;
    setSending(true);
    setError('');
    try {
      const duel = await data.createDuel({ hobbyId: hobby.id, minutes, friendId: friend?.id ?? null });
      if (!friend) {
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
      router.replace(sentHref(duel.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setSending(false);
    }
  }

  return { send, sending, error, message };
}
