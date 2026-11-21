import type { AuthInput, CreateDuelInput, Duel, Groups, Me, ProfileInput, RegisterInput, Stats, UserHit } from './types';

/**
 * The one interface the app talks to. `apiSource` (FastAPI + Neon) is the real thing; `mockSource` is an explicit
 * opt-in (EXPO_PUBLIC_USE_MOCK=true) for a single local user. Any new field or endpoint goes into this interface,
 * the API source and the API together.
 */
export interface DataSource {
  /** 'api' talks to the FastAPI server, 'mock' is the in-memory opt-in. */
  readonly mode: 'api' | 'mock';
  /** Where the data lives, for the Live / Offline badge. */
  readonly host: string;
  /** Is the server reachable right now? Never throws. */
  ping(timeoutMs?: number): Promise<boolean>;

  /** Called after every change so screens can refetch. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;

  /** The signed-in person, or null when there is no session. */
  getMe(): Promise<Me | null>;
  /** Sign up: adds a new user (everyone has an account; there are no guests). */
  register(input: RegisterInput): Promise<Me>;
  login(input: AuthInput): Promise<Me>;
  logout(): Promise<void>;
  /** Check the 6-digit code emailed at sign-up. Resolves with me (emailVerified: true). */
  verifyEmail(code: string): Promise<Me>;
  /** Email a new code (the old one stops working). */
  resendCode(): Promise<void>;

  /** Edit profile (bio, interests, avatar). Resolves with the updated me. */
  updateProfile(input: ProfileInput): Promise<Me>;

  /** Find real accounts to challenge, by name or the start of their email. */
  searchUsers(query: string): Promise<UserHit[]>;

  /** My duels, including invites I received. An empty list when there is no session. */
  listDuels(): Promise<Duel[]>;
  getDuel(id: string): Promise<Duel>;
  /** Works before signing in, so an invited friend can see who challenged them. */
  getDuelByCode(code: string): Promise<Duel>;
  /** Start a duel. It stays pending until the other person accepts. */
  createDuel(input: CreateDuelInput): Promise<Duel>;
  acceptDuel(id: string): Promise<Duel>;
  /** Delete a pending invite I created (before anyone accepted it). */
  cancelInvite(id: string): Promise<void>;

  checkIn(id: string): Promise<Duel>;
  /** Optional: set the minutes and a note on MY check-in for today (the one-tap check-in stays the default). */
  addCheckInDetails(id: string, input: { minutes: number; note: string }): Promise<Duel>;
  /** Confirm the friend's pending check-in ("OK" on Today). */
  confirmFriend(id: string): Promise<Duel>;
  restDay(id: string): Promise<Duel>;
  pause(id: string): Promise<Duel>;
  resume(id: string): Promise<Duel>;
  forfeit(id: string): Promise<Duel>;
  /** After a duel ends: 'same' = same goal again, 'easier' = a lighter goal. The friend gets a pending invite. */
  rematch(id: string, kind: 'same' | 'easier'): Promise<Duel>;

  /** You screen: duels won, days checked in, current streak. */
  getStats(): Promise<Stats>;
  /** Groups tab: people I have dueled and a wins leaderboard. */
  getGroups(): Promise<Groups>;
}
