import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { HOBBIES, MINUTE_OPTIONS, makeInviteCode, type Hobby } from '@/data/sample';

/**
 * Temporary local state for the "pick a hobby, pick a friend" flow (Phase 2).
 * Phase 3 replaces this with the DataSource hooks (mock store, later the API).
 */
interface OnboardingState {
  hobby: Hobby;
  setHobbyId: (id: string) => void;
  minutes: number;
  cycleMinutes: () => void;
  friendId: string;
  setFriendId: (id: string) => void;
  code: string;
  /** A guest has to give a first name before the first duel can be sent or accepted: what to resume afterwards. */
  afterName: 'send' | 'accept' | null;
  setAfterName: (next: 'send' | 'accept' | null) => void;
  reset: () => void;
}

const Ctx = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [hobbyId, setHobbyId] = useState('guitar');
  const [minutes, setMinutes] = useState(20);
  const [friendId, setFriendId] = useState('eleanor');
  const [code, setCode] = useState(makeInviteCode);
  const [afterName, setAfterName] = useState<'send' | 'accept' | null>(null);

  const cycleMinutes = useCallback(() => {
    setMinutes((m) => MINUTE_OPTIONS[(MINUTE_OPTIONS.indexOf(m) + 1) % MINUTE_OPTIONS.length]);
  }, []);

  const reset = useCallback(() => {
    setHobbyId('guitar');
    setMinutes(20);
    setFriendId('eleanor');
    setCode(makeInviteCode());
  }, []);

  const value = useMemo<OnboardingState>(
    () => ({
      hobby: HOBBIES.find((h) => h.id === hobbyId) ?? HOBBIES[0],
      setHobbyId,
      minutes,
      cycleMinutes,
      friendId,
      setFriendId,
      code,
      afterName,
      setAfterName,
      reset,
    }),
    [hobbyId, minutes, friendId, code, afterName, cycleMinutes, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding(): OnboardingState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return v;
}
