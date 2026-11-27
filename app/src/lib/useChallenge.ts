import { useState } from 'react';
import { Platform, Share } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useData } from '@/data';
import { sentHref } from '@/lib/routes';
import { useOnboarding, type PickedFriend } from '@/state/onboarding';

/** Copies text in the browser; never throws and never waits more than 1.5 s (the browser may block the clipboard). */
async function copyText(text: string) {
  try {
    await Promise.race([Clipboard.setStringAsync(text), new Promise((resolve) => setTimeout(resolve, 1500))]);
  } catch {
    /* clipboard blocked by the browser */
  }
}

/**
 * Creates the duel from the hobby and minutes picked so far and goes to the Sent screen.
 * Used by the Friend step (hobby first) and by the Hobby step (friend first). With a friend the duel is a named invite;
 * without one it is an open invite and the code is shared by text (native share sheet; in the browser the Web Share API, or the text is copied).
 * The duel is created BEFORE the share sheet because the invite code comes from the server and goes into the text. If the sheet is
 * cancelled on iOS we stay on the screen; trying again reuses the same pending duel and code (the API returns the existing one).
 */
export function useChallenge() {
  const data = useData();
  const router = useRouter();
  const { hobby, minutes, goal, customHobby, frequency, timesPerWeek, unit, target, lengthDays, reset } = useOnboarding();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  /** Set when the share sheet was cancelled (iOS reports it): the code exists but was not sent, so we stay on the screen. */
  const [waitingCode, setWaitingCode] = useState<string | null>(null);

  /** The text a friend gets (the invite code is added when it is sent). */
  const lengthLabel = lengthDays === 7 ? 'this week' : `for ${lengthDays} days`;
  const hobbyName = hobby.id === 'custom' ? (customHobby ?? 'my hobby') : hobby.phrase;
  const message = `I'm ${hobby.id === 'custom' ? 'doing ' : ''}${hobbyName} ${minutes} min a day ${lengthLabel}. Dual me so I don't quit? ${hobby.emoji}`;

  async function send(friend: PickedFriend | null) {
    if (sending) return;
    setSending(true);
    setError('');
    setWaitingCode(null);
    try {
      const duel = await data.createDuel({
        hobbyId: hobby.id,
        customHobby: hobby.id === 'custom' ? customHobby : null,
        minutes,
        goal,
        frequency,
        timesPerWeek,
        unit,
        target,
        friendId: friend?.id ?? null,
        lengthDays,
      });
      if (!friend) {
        const full = `${message}\nOpen Dual and enter the code ${duel.inviteCode}`;
        if (Platform.OS === 'web') {
          // Browser: the Web Share API opens the share sheet (iOS Safari, Android Chrome). Without it the text is copied.
          // The sheet needs a fresh tap; after a slow first request the browser may refuse it (NotAllowedError). Then we stay
          // on the screen with the code (copied), and the second tap is fast because the duel already exists.
          const nav = typeof navigator !== 'undefined' ? navigator : undefined;
          if (nav && typeof nav.share === 'function') {
            try {
              await nav.share({ text: full });
            } catch {
              await copyText(full);
              setWaitingCode(duel.inviteCode);
              return;
            }
          } else {
            await copyText(full);
          }
        } else {
          const result = await Share.share({ message: full });
          if (result.action === Share.dismissedAction) {
            // Cancelled (only iOS can tell; Android always reports shared, so there we carry on). The pending duel and its
            // code already exist: asking again returns the same duel and code, so nothing is duplicated.
            setWaitingCode(duel.inviteCode);
            return;
          }
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

  return { send, sending, error, message, waitingCode };
}
