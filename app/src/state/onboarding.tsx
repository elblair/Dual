import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_HOBBY_ID, hobbyById, MINUTE_OPTIONS, type Hobby } from '@/data/catalog';

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
  setMinutes: (minutes: number) => void;
  /** The goal the player wrote, or null to use the suggestion for the hobby and minutes. */
  goal: string | null;
  setGoal: (goal: string | null) => void;
  friend: PickedFriend | null;
  setFriend: (next: PickedFriend | null) => void;
  /** An invite code opened while signed out: kept until the person signs up or logs in, then Accept continues with it. */
  pendingCode: string | null;
  setPendingCode: (next: string | null) => void;
  reset: () => void;
}

const Ctx = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hobbyId, setHobbyId] = useState(DEFAULT_HOBBY_ID);
  const [minutes, setMinutes] = useState(MINUTE_OPTIONS[2]);
  const [friend, setFriend] = useState<PickedFriend | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  // A written goal belongs to the hobby it was written for: picking another hobby goes back to the suggestion.
  const pickHobby = useCallback((id: string) => {
    setHobbyId(id);
    setGoal(null);
  }, []);

  const reset = useCallback(() => {
    setHobbyId(DEFAULT_HOBBY_ID);
    setMinutes(MINUTE_OPTIONS[2]);
    setGoal(null);
    setFriend(null);
  }, []);

  const value = useMemo<OnboardingState>(
    () => ({
      hobby: hobbyById(hobbyId),
      setHobbyId: pickHobby,
      minutes,
      setMinutes,
      goal,
      setGoal,
      friend,
      setFriend,
      pendingCode,
      setPendingCode,
      reset,
    }),
    [hobbyId, minutes, goal, friend, pendingCode, pickHobby, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding(): OnboardingState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return v;
}
