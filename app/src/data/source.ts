import type { AuthInput, CreateDuelInput, Duel, Me, RegisterInput } from './types';

/**
 * The one interface the app talks to. Two implementations: `mockSource` (in-memory, works offline) and
 * `apiSource` (FastAPI, Phase 5). Any new field or endpoint goes into this interface, the mock and the API together.
 */
export interface DataSource {
  /** Called after every change so screens can refetch. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;

  getMe(): Promise<Me>;
  register(input: RegisterInput): Promise<Me>;
  login(input: AuthInput): Promise<Me>;

  listDuels(): Promise<Duel[]>;
  getDuel(id: string): Promise<Duel>;
  getDuelByCode(code: string): Promise<Duel>;
  createDuel(input: CreateDuelInput): Promise<Duel>;
  acceptDuel(id: string): Promise<Duel>;

  checkIn(id: string): Promise<Duel>;
  /** Confirm the friend's pending check-in ("OK" on Today). */
  confirmFriend(id: string): Promise<Duel>;
  restDay(id: string): Promise<Duel>;
  pause(id: string): Promise<Duel>;
  resume(id: string): Promise<Duel>;
  forfeit(id: string): Promise<Duel>;
  /** 'same' = same goal again, 'easier' = a lighter goal against the same friend. */
  rematch(id: string, kind: 'same' | 'easier'): Promise<Duel>;

  /** Demo tools (You screen, only shown when EXPO_PUBLIC_DEMO=true; the API enables them with DEMO_MODE=true). */
  demo: {
    advanceDay(): Promise<void>;
    opponentCheckIn(): Promise<void>;
    reset(): Promise<void>;
  };
}
