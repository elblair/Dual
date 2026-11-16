import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { HOBBIES, MINUTE_OPTIONS, type Hobby } from '@/data/catalog';

/** Who the player picked in the friend search (null = invite someone by text). */
export interface PickedFriend {
  id: string;
  name: string;
}

/**
 * Local state for the "pick a hobby, pick a friend" flow. Nothing here is user data from the server: it is only what the
 * player has chosen so far, before the duel is created.
 */
interface OnboardingState {
  hobby: Hobby;
  setHobbyId: (id: string) => void;
  minutes: number;
  cycleMinutes: () => void;
  friend: PickedFriend | null;
  setFriend: (next: PickedFriend | null) => void;
  /** A guest has to give a first name before searching for friends or accepting: where to go afterwards. */
  afterName: 'friend' | 'accept' | null;
  setAfterName: (next: 'friend' | 'accept' | null) => void;
  reset: () => void;
}

const Ctx = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hobbyId, setHobbyId] = useState(HOBBIES[0].id);
  const [minutes, setMinutes] = useState(MINUTE_OPTIONS[2]);
  const [friend, setFriend] = useState<PickedFriend | null>(null);
  const [afterName, setAfterName] = useState<'friend' | 'accept' | null>(null);

  const cycleMinutes = useCallback(() => {
    setMinutes((m) => MINUTE_OPTIONS[(MINUTE_OPTIONS.indexOf(m) + 1) % MINUTE_OPTIONS.length]);
  }, []);

  const reset = useCallback(() => {
    setHobbyId(HOBBIES[0].id);
    setMinutes(MINUTE_OPTIONS[2]);
    setFriend(null);
  }, []);

  const value = useMemo<OnboardingState>(
    () => ({
      hobby: HOBBIES.find((h) => h.id === hobbyId) ?? HOBBIES[0],
      setHobbyId,
      minutes,
      cycleMinutes,
      friend,
      setFriend,
      afterName,
      setAfterName,
      reset,
    }),
    [hobbyId, minutes, friend, afterName, cycleMinutes, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding(): OnboardingState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return v;
}
