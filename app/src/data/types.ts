/** Shared response shapes. The FastAPI schemas mirror these (Phase 4). */

export interface Me {
  id: string;
  name: string;
  isGuest: boolean;
  email?: string;
}

export interface Person {
  id: string;
  name: string;
  /** Avatar color: Eleanor is maroon-bright, Tanish blue, Ben neutral gray. */
  tone: 'you' | 'opponent' | 'neutral';
}

export type DuelStatus = 'pending' | 'active' | 'paused' | 'finished';

/** A friend's check-in that is waiting for "you confirm each other". Counts only once confirmed. */
export interface PendingCheckin {
  minutes: number;
  note: string;
}

export interface DuelResult {
  winner: 'me' | 'them' | 'tie';
  forfeitedBy: 'me' | 'them' | null;
}

export interface Duel {
  id: string;
  hobbyId: string;
  minutes: number;
  lengthDays: number;
  status: DuelStatus;
  /** The other player, from my point of view (for the invited friend looking at a code: the challenger). */
  opponent: Person;
  /** Who started the duel. */
  creator: Person;
  /** True when I started it; false for the invited friend looking at it by code. */
  viewerIsCreator: boolean;
  /** Set while the friend has not accepted yet (they enter this code in the app). */
  inviteCode: string | null;
  /** Index of the current day, 0 to 6. 7 once the duel is finished. */
  today: number;
  /** Confirmed check-in day indexes. Score = how many. */
  myDays: number[];
  theirDays: number[];
  myRestDays: number[];
  restLeft: number;
  theirPending: PendingCheckin | null;
  pausedUntil: string | null;
  result: DuelResult | null;
}

export interface CreateDuelInput {
  hobbyId: string;
  minutes: number;
  /** Contact id: 'eleanor' and 'tanish' are seeded accounts that auto-accept; anyone else stays pending. */
  friendId: string;
  inviteCode?: string;
}

export interface AuthInput {
  email: string;
  password: string;
}

export interface RegisterInput extends AuthInput {
  name: string;
  /** Demo builds: give a brand-new account the day-5 demo duels. */
  seedDemo?: boolean;
}

export interface GuestInput {
  /** First name only, so nobody is called "Ari" by default. */
  name: string;
  seedDemo?: boolean;
}

/** A row in the Groups-style list: people in my duels ranked by minutes practiced. */
export interface LeaderRow {
  id: string;
  name: string;
  tone: Person['tone'];
  minutes: number;
  isYou: boolean;
}

/** The Database screen (demo): rows straight from the tables. Never contains password hashes. */
export interface DbUser {
  id: string;
  name: string;
  email: string | null;
  isGuest: boolean;
  isSeeded: boolean;
  createdAt: string;
}

export interface DbDuel {
  id: string;
  hobbyId: string;
  minutes: number;
  goal: string;
  status: string;
  creator: string;
  opponent: string;
  score: string;
  today: number;
  createdAt: string;
}

export interface DbSnapshot {
  database: { engine: string; host: string };
  userCount: number;
  duelCount: number;
  users: DbUser[];
  duels: DbDuel[];
}
