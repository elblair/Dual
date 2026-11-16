/** Shared response shapes. The FastAPI schemas (api/app/schemas.py) mirror these. */

export interface Me {
  id: string;
  name: string;
  email?: string;
}

export interface Person {
  id: string;
  name: string;
  /** Avatar color: 'you' is blue, everyone else maroon. */
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
  /** The other player from my point of view (for an invite I received: whoever sent it). Null for an open invite nobody accepted. */
  opponent: Person | null;
  /** Who started the duel. */
  creator: Person;
  /** True when I started it; false for an invite I received or looked up by code. */
  viewerIsCreator: boolean;
  /** The code a friend enters to accept. Only while the duel is pending. */
  inviteCode: string | null;
  /** When the duel started (ISO). Null while pending. */
  startedAt: string | null;
  /** Index of the current day, 0 to 6. 7 once the duel is finished. */
  today: number;
  /** Check-in day indexes. My own count at once; theirDays only the ones I confirmed. Score = how many. */
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
  /** A person found with search. Omit for an open invite that a friend accepts with the code. */
  friendId?: string | null;
}

export interface AuthInput {
  email: string;
  password: string;
}

export interface RegisterInput extends AuthInput {
  name: string;
}

/** A person found by the friend search. The email is masked ("m***@example.com"). */
export interface UserHit {
  id: string;
  name: string;
  emailHint: string;
  level: string | null;
}

/** You screen, all computed from the database. */
export interface Stats {
  duelsWon: number;
  daysCheckedIn: number;
  currentStreak: number;
  /** My own check-in times (ISO) from the last 14 days, for this week's streak bubbles. */
  recentCheckIns: string[];
  /** Progression, computed by the API from check-ins and duels (rules: api/app/progression.py). */
  xp: number;
  tier: string;
  nextTier: string | null;
  xpToNext: number | null;
  /** 0 to 1 towards the next tier (1 at the top). */
  progress: number;
  restDaysPerDuel: number;
  tiers: Tier[];
}

export interface Tier {
  name: string;
  minXp: number;
  /** What reaching the tier unlocks (null for the first tier). */
  perk: string | null;
  reached: boolean;
}

/** Head-to-head record with someone I have dueled. */
export interface Rival {
  person: Person;
  duels: number;
  wins: number;
  losses: number;
  ties: number;
  active: number;
  finished: number;
  /** Friendship level from finished duels together (null until you have finished one). */
  level: string | null;
  nextLevel: string | null;
  duelsToNextLevel: number | null;
}

export interface LeaderRow {
  id: string;
  name: string;
  tone: Person['tone'];
  wins: number;
  isYou: boolean;
}

/** Groups tab: people I have dueled and a wins leaderboard among us. */
export interface Groups {
  rivals: Rival[];
  leaderboard: LeaderRow[];
}
