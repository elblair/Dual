import { easierMinutes } from './catalog';
import type { DataSource } from './source';
import type { CreateDuelInput, Duel, Groups, Me, Person, ProfileInput, Stats, UserHit } from './types';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function makeCode(taken: Set<string>): string {
  for (;;) {
    let code = '';
    for (let i = 0; i < 4; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    if (!taken.has(code)) return code;
  }
}

/**
 * EXPLICIT OPT-IN ONLY (EXPO_PUBLIC_USE_MOCK=true): a single local user held in memory, nothing saved, no other people,
 * no clock (the day never advances) and no seeded data. It exists so the screens can be exercised without a server;
 * the two-phone flow needs the real API. You may accept your own invite here so one device can reach the Accept screen.
 */
export function createMockSource(): DataSource {
  let me: Me | null = null;
  let duels: Duel[] = [];
  let seq = 1;
  let users = 1;
  const accounts: { id: string; name: string; email: string; password: string; verified: boolean; profile: Pick<Me, 'bio' | 'interests' | 'avatar'> }[] = [];
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((l) => l());
  const fail = (msg: string) => Promise.reject(new Error(msg));
  const self = (): Person => ({ id: me!.id, name: me!.name, tone: 'you' });

  function find(id: string): Duel {
    const d = duels.find((x) => x.id === id);
    if (!d) throw new Error('Duel not found.');
    return d;
  }

  /** Run an action on one of my duels, turning thrown errors into rejected promises. */
  function act(id: string, fn: (d: Duel) => Duel): Promise<Duel> {
    try {
      if (!me) return fail('Please sign in.');
      const d = fn(find(id));
      notify();
      return Promise.resolve(clone(d));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  function newDuel(input: CreateDuelInput): Duel {
    const friend = input.friendId ? accounts.find((a) => a.id === input.friendId) : undefined;
    return {
      id: `m${seq++}`,
      hobbyId: input.hobbyId,
      minutes: input.minutes,
      goal: input.goal ?? null,
      lengthDays: 7,
      frequency: input.frequency ?? 'daily',
      timesPerWeek: input.timesPerWeek ?? null,
      verification: input.verification ?? 'mutual',
      mode: input.mode ?? 'compete',
      unit: input.unit ?? null,
      target: input.target ?? null,
      status: 'pending',
      opponent: friend ? { id: friend.id, name: friend.name, tone: 'opponent' } : null,
      creator: self(),
      viewerIsCreator: true,
      inviteCode: makeCode(new Set(duels.map((d) => d.inviteCode ?? ''))),
      startedAt: null,
      today: 0,
      myDays: [],
      theirDays: [],
      myRestDays: [],
      restLeft: 2,
      theirPending: null,
      activity: [],
      pausedUntil: null,
      result: null,
    };
  }

  const start = (next: Me) => {
    me = next;
    notify();
    return Promise.resolve(clone(next));
  };

  return {
    mode: 'mock',
    host: 'in-memory mock (nothing is saved)',
    ping: () => Promise.resolve(true),

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getMe: () => Promise.resolve(me ? clone(me) : null),
    register({ name, email, password }) {
      if (accounts.some((a) => a.email === email)) return fail('That email already has an account. Try logging in.');
      const id = `u${users++}`;
      const profile = { bio: null, interests: [], avatar: null };
      accounts.push({ id, name, email, password, verified: false, profile });
      return start({ id, name, email, emailVerified: false, ...profile });
    },
    login({ email, password }) {
      const a = accounts.find((x) => x.email === email);
      if (!a) return fail('No account with that email. Try creating one.');
      if (a.password !== password) return fail('Wrong password.');
      duels = [];
      return start({ id: a.id, name: a.name, email, emailVerified: a.verified, ...a.profile });
    },
    // The mock sends no email: any 6 digits verify.
    verifyEmail(code) {
      if (!me) return fail('Please sign in.');
      if (!/^\d{6}$/.test(code.trim())) return fail('Enter the 6-digit code.');
      const a = accounts.find((x) => x.id === me!.id);
      if (a) a.verified = true;
      return start({ ...me, emailVerified: true });
    },
    resendCode: () => Promise.resolve(),
    logout() {
      me = null;
      duels = [];
      notify();
      return Promise.resolve();
    },

    updateProfile(input: ProfileInput) {
      if (!me) return fail('Please sign in.');
      const next = { ...me };
      if ('bio' in input) {
        const bio = (input.bio ?? '').trim();
        if (bio.length > 160) return fail('Keep your bio under 160 characters.');
        next.bio = bio || null;
      }
      if ('interests' in input) next.interests = [...new Set((input.interests ?? []).map((i) => i.trim().toLowerCase()))].filter(Boolean).slice(0, 12);
      if ('avatar' in input) next.avatar = input.avatar?.trim() || null;
      const account = accounts.find((a) => a.id === me!.id);
      if (account) account.profile = { bio: next.bio, interests: next.interests, avatar: next.avatar };
      return start(next);
    },

    searchUsers(query): Promise<UserHit[]> {
      const q = query.trim().toLowerCase();
      if (!me || q.length < 2) return Promise.resolve([]);
      const hits = accounts
        .filter((a) => a.id !== me!.id && (a.name.toLowerCase().includes(q) || a.email.startsWith(q)))
        .map((a) => ({ id: a.id, name: a.name, emailHint: `${a.email[0]}***@${a.email.split('@')[1]}`, level: null }));
      return Promise.resolve(hits);
    },

    listDuels: () => Promise.resolve(me ? clone(duels) : []),
    getDuel: (id) => act(id, (d) => d),
    getDuelByCode(code) {
      const d = duels.find((x) => x.status === 'pending' && x.inviteCode === code.trim().toUpperCase());
      return d ? Promise.resolve(clone(d)) : fail('We couldn’t find that code. Check it and try again.');
    },
    createDuel(input) {
      if (!me) return fail('Please sign in.');
      const d = newDuel(input);
      duels = [d, ...duels];
      notify();
      return Promise.resolve(clone(d));
    },
    cancelInvite(id) {
      const d = duels.find((x) => x.id === id);
      if (!d) return fail('Duel not found.');
      if (d.status !== 'pending' || !d.viewerIsCreator) return fail('Only an invite that has not been accepted can be cancelled.');
      duels = duels.filter((x) => x.id !== id);
      notify();
      return Promise.resolve();
    },
    acceptDuel: (id) =>
      act(id, (d) => {
        if (d.status !== 'pending') throw new Error('This duel was already accepted.');
        d.status = 'active';
        d.startedAt = new Date().toISOString();
        d.inviteCode = null;
        return d;
      }),

    checkIn: (id) =>
      act(id, (d) => {
        if (d.status !== 'active') throw new Error('This duel is not active.');
        if (d.myDays.includes(d.today)) throw new Error('You already checked in today.');
        d.myDays.push(d.today);
        return d;
      }),
    addCheckInDetails: (id) => act(id, (d) => d),
    confirmFriend: (id) => act(id, (d) => d),
    restDay: (id) =>
      act(id, (d) => {
        if (d.restLeft <= 0) throw new Error('No rest days left this week.');
        if (d.myDays.includes(d.today) || d.myRestDays.includes(d.today)) throw new Error('Today is already logged.');
        d.myRestDays.push(d.today);
        d.restLeft -= 1;
        return d;
      }),
    pause: (id) =>
      act(id, (d) => {
        d.status = 'paused';
        d.pausedUntil = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
        return d;
      }),
    resume: (id) =>
      act(id, (d) => {
        d.status = 'active';
        d.pausedUntil = null;
        return d;
      }),
    forfeit: (id) =>
      act(id, (d) => {
        d.status = 'finished';
        d.today = 7;
        d.result = { winner: 'them', forfeitedBy: 'me' };
        return d;
      }),
    rematch(id, kind) {
      try {
        if (!me) return fail('Please sign in.');
        const old = find(id);
        if (old.status !== 'finished') throw new Error('You can start a rematch once this duel is over.');
        const d = newDuel({
          hobbyId: old.hobbyId,
          minutes: kind === 'easier' ? easierMinutes(old.minutes) : old.minutes,
          frequency: old.frequency,
          timesPerWeek: old.timesPerWeek,
          verification: old.verification,
          mode: old.mode,
          unit: old.unit,
          target: old.target,
          friendId: old.opponent?.id ?? null,
        });
        duels = [d, ...duels];
        notify();
        return Promise.resolve(clone(d));
      } catch (e) {
        return Promise.reject(e);
      }
    },

    getStats(): Promise<Stats> {
      const mine = duels.filter((d) => d.status !== 'pending');
      return Promise.resolve({
        duelsWon: mine.filter((d) => d.result?.winner === 'me').length,
        daysCheckedIn: mine.reduce((n, d) => n + d.myDays.length, 0),
        currentStreak: 0,
        recentCheckIns: [],
        xp: 0,
        tier: 'Bronze',
        nextTier: null,
        xpToNext: null,
        progress: 0,
        restDaysPerDuel: 2,
        tiers: [],
      });
    },
    getGroups(): Promise<Groups> {
      if (!me) return Promise.resolve({ rivals: [], leaderboard: [] });
      return Promise.resolve({
        rivals: [],
        leaderboard: [{ id: me.id, name: me.name, tone: 'you', wins: duels.filter((d) => d.result?.winner === 'me').length, isYou: true }],
      });
    },
  };
}
