import type { AuthInput, CreateDuelInput, DbSnapshot, Duel, GuestInput, LeaderRow, Me, RegisterInput } from './types';

/**
 * The one interface the app talks to. Two implementations: `mockSource` (in-memory, works offline) and
 * `apiSource` (FastAPI + Neon). Any new field or endpoint goes into this interface, the mock and the API together.
 */
export interface DataSource {
  /** 'api' talks to the FastAPI server, 'mock' is the in-memory fallback. */
  readonly mode: 'api' | 'mock';
  /** Where the data lives, for the Live / Offline badge (the API host, or "in-memory demo data"). */
  readonly host: string;
  /** Is the data source reachable right now? Never throws. */
  ping(): Promise<boolean>;

  /** Called after every change so screens can refetch. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;

  /** The signed-in person (guest or account), or null when there is no session yet. */
  getMe(): Promise<Me | null>;
  /** Start as a guest with just a first name. */
  startGuest(input: GuestInput): Promise<Me>;
  /** Sign up: upgrades the current guest, or adds a brand-new user when there is no session. */
  register(input: RegisterInput): Promise<Me>;
  login(input: AuthInput): Promise<Me>;
  logout(): Promise<void>;

  /** My duels. An empty list when there is no session. */
  listDuels(): Promise<Duel[]>;
  getDuel(id: string): Promise<Duel>;
  /** Works before signing in, so an invited friend can see who challenged them. */
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

  /** Groups-style list: people in my duels, ranked by minutes. */
  getLeaderboard(): Promise<LeaderRow[]>;

  /** Demo tools (You screen, only shown when EXPO_PUBLIC_DEMO=true; the API enables them with DEMO_MODE=true). */
  demo: {
    advanceDay(): Promise<void>;
    opponentCheckIn(): Promise<void>;
    reset(): Promise<void>;
    /** The Database screen: latest users and duels straight from the database. */
    database(): Promise<DbSnapshot>;
  };
}
