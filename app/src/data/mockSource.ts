import { CONTACTS, makeInviteCode } from './sample';
import type { DataSource } from './source';
import type { CreateDuelInput, DbSnapshot, Duel, LeaderRow, Me, Person } from './types';

const BOT_IDS = ['eleanor', 'tanish'];
const NOTES = ['Finally nailed the F chord', 'Felt good today', 'Short but sweet', 'Got it done before work', 'Back at it'];
/** Seeded friends check in on days 1 to 6 and skip the last day, so a full run ends 6 to 5 like the Result frame. */
const BOT_LAST_DAY = 5;

function person(id: string): Person {
  const c = CONTACTS.find((x) => x.id === id) ?? { id, name: id, tone: 'neutral' as const };
  return { id: c.id, name: c.name, tone: c.tone };
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/**
 * In-memory implementation of DataSource: the fallback when the API is down (EXPO_PUBLIC_USE_MOCK=true).
 * Everything resets when the app reloads. It mirrors api/app/logic.py.
 */
export function createMockSource(): DataSource {
  let me: Me | null = null;
  let meCreatedAt = new Date().toISOString();
  let duels: Duel[] = [];
  let seq = 1;
  let noteIdx = 0;
  const accounts: { name: string; email: string; password: string }[] = [];
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((l) => l());
  /** Duels remember who started them; keep that name in step with the account name. */
  const renameCreator = () => duels.forEach((d) => (d.creator.name = me?.name ?? d.creator.name));
  const fail = (msg: string) => Promise.reject(new Error(msg));

  function find(id: string): Duel {
    const d = duels.find((x) => x.id === id);
    if (!d) throw new Error('Duel not found');
    return d;
  }

  function blankDuel(i: CreateDuelInput, status: Duel['status']): Duel {
    if (!me) throw new Error('Please sign in.');
    return {
      id: `d${seq++}`,
      hobbyId: i.hobbyId,
      minutes: i.minutes,
      lengthDays: 7,
      status,
      opponent: person(i.friendId),
      creator: { id: me.id, name: me.name, tone: 'you' },
      viewerIsCreator: true,
      inviteCode: status === 'pending' ? (i.inviteCode ?? makeInviteCode()) : null,
      today: 0,
      myDays: [],
      theirDays: [],
      myRestDays: [],
      restLeft: 2,
      theirPending: null,
      pausedUntil: null,
      result: null,
    };
  }

  function finish(d: Duel, forfeitedBy: 'me' | 'them' | null = null) {
    if (d.theirPending) {
      d.theirDays.push(d.today);
      d.theirPending = null;
    }
    d.status = 'finished';
    d.today = 7;
    const a = d.myDays.length;
    const b = d.theirDays.length;
    const winner = forfeitedBy === 'me' ? 'them' : forfeitedBy === 'them' ? 'me' : a > b ? 'me' : a < b ? 'them' : 'tie';
    d.result = { winner, forfeitedBy };
  }

  function seedDemo() {
    // Guitar vs Eleanor, day 5 of 7: 4 to 4, and Eleanor's check-in for today is waiting for my OK.
    const guitar = blankDuel({ hobbyId: 'guitar', minutes: 20, friendId: 'eleanor' }, 'active');
    guitar.today = 4;
    guitar.myDays = [0, 1, 2, 3];
    guitar.theirDays = [0, 1, 2, 3];
    guitar.theirPending = { minutes: 25, note: 'Finally nailed the F chord' };
    // Running vs Tanish, day 6 of 7: 5 to 6.
    const running = blankDuel({ hobbyId: 'running', minutes: 30, friendId: 'tanish' }, 'active');
    running.today = 5;
    running.myDays = [0, 1, 2, 3, 4];
    running.theirDays = [0, 1, 2, 3, 4, 5];
    duels = [guitar, running];
  }

  const done = (d: Duel) => {
    notify();
    return Promise.resolve(clone(d));
  };

  /** Run an action on a duel, turning thrown errors into rejected promises. */
  function act(id: string, fn: (d: Duel) => Duel | Promise<Duel>): Promise<Duel> {
    try {
      if (!me) return fail('Please sign in.');
      return Promise.resolve(fn(find(id)));
    } catch (e) {
      return Promise.reject(e);
    }
  }

  return {
    mode: 'mock',
    host: 'in-memory demo data',
    ping: () => Promise.resolve(true),

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getMe: () => Promise.resolve(me ? clone(me) : null),
    startGuest({ name, seedDemo: seed }) {
      me = { id: 'me', name: name.trim(), isGuest: true };
      meCreatedAt = new Date().toISOString();
      duels = [];
      if (seed) seedDemo();
      notify();
      return Promise.resolve(clone(me));
    },
    register({ name, email, password, seedDemo: seed }) {
      if (accounts.some((a) => a.email === email)) return fail('That email already has an account. Try logging in.');
      accounts.push({ name, email, password });
      if (me) {
        me = { ...me, name, email, isGuest: false };
      } else {
        me = { id: 'me', name, email, isGuest: false };
        meCreatedAt = new Date().toISOString();
        if (seed) seedDemo();
      }
      renameCreator();
      notify();
      return Promise.resolve(clone(me));
    },
    login({ email, password }) {
      const a = accounts.find((x) => x.email === email);
      if (!a) return fail('No account with that email. Try creating one.');
      if (a.password !== password) return fail('Wrong password.');
      me = { id: 'me', name: a.name, email, isGuest: false };
      renameCreator();
      notify();
      return Promise.resolve(clone(me));
    },
    logout() {
      me = null;
      duels = [];
      notify();
      return Promise.resolve();
    },

    listDuels: () => Promise.resolve(me ? clone(duels) : []),
    getDuel: (id) => act(id, (d) => clone(d)),
    getDuelByCode(code) {
      const d = duels.find((x) => x.status === 'pending' && x.inviteCode === code.trim().toUpperCase());
      return d ? Promise.resolve(clone(d)) : fail('We couldn’t find that code. Check it and try again.');
    },
    createDuel(input) {
      if (!me) return fail('Please sign in.');
      const status = BOT_IDS.includes(input.friendId) ? 'active' : 'pending';
      const d = blankDuel(input, status);
      duels = [d, ...duels];
      return done(d);
    },
    acceptDuel: (id) =>
      act(id, (d) => {
        if (d.status !== 'pending') throw new Error('This duel was already accepted.');
        d.status = 'active';
        d.inviteCode = null;
        d.today = 0;
        return done(d);
      }),

    checkIn: (id) =>
      act(id, (d) => {
        if (d.status !== 'active') throw new Error('This duel is not active.');
        if (d.myDays.includes(d.today)) throw new Error('You already checked in today.');
        d.myRestDays = d.myRestDays.filter((x) => x !== d.today);
        d.myDays.push(d.today);
        return done(d);
      }),
    confirmFriend: (id) =>
      act(id, (d) => {
        if (d.theirPending) {
          d.theirDays.push(d.today);
          d.theirPending = null;
        }
        return done(d);
      }),
    restDay: (id) =>
      act(id, (d) => {
        if (d.restLeft <= 0) throw new Error('No rest days left this week.');
        if (d.myDays.includes(d.today) || d.myRestDays.includes(d.today)) throw new Error('Today is already logged.');
        d.myRestDays.push(d.today);
        d.restLeft -= 1;
        return done(d);
      }),
    pause: (id) =>
      act(id, (d) => {
        d.status = 'paused';
        d.pausedUntil = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
        return done(d);
      }),
    resume: (id) =>
      act(id, (d) => {
        d.status = 'active';
        d.pausedUntil = null;
        return done(d);
      }),
    forfeit: (id) =>
      act(id, (d) => {
        finish(d, 'me');
        return done(d);
      }),
    rematch: (id, kind) =>
      act(id, (old) => {
        const status = BOT_IDS.includes(old.opponent.id) ? 'active' : 'pending';
        const d = blankDuel({ hobbyId: old.hobbyId, minutes: kind === 'easier' ? 15 : old.minutes, friendId: old.opponent.id }, status);
        duels = [d, ...duels];
        return done(d);
      }),

    getLeaderboard() {
      if (!me) return Promise.resolve([]);
      const totals = new Map<string, LeaderRow>([[me.id, { id: me.id, name: me.name, tone: 'you', minutes: 0, isYou: true }]]);
      for (const d of duels) {
        if (d.status === 'pending') continue;
        const mine = totals.get(me.id)!;
        mine.minutes += d.myDays.length * d.minutes;
        const row = totals.get(d.opponent.id) ?? { id: d.opponent.id, name: d.opponent.name, tone: d.opponent.tone, minutes: 0, isYou: false };
        row.minutes += d.theirDays.length * d.minutes;
        totals.set(d.opponent.id, row);
      }
      return Promise.resolve([...totals.values()].sort((x, y) => y.minutes - x.minutes || x.name.localeCompare(y.name)).slice(0, 5));
    },

    demo: {
      advanceDay() {
        for (const d of duels) {
          if (d.status !== 'active') continue;
          if (d.theirPending) {
            d.theirDays.push(d.today);
            d.theirPending = null;
          }
          d.today += 1;
          if (d.today > 6) {
            finish(d);
          } else if (BOT_IDS.includes(d.opponent.id) && d.today <= BOT_LAST_DAY) {
            d.theirPending = { minutes: d.minutes + 5, note: NOTES[noteIdx++ % NOTES.length] };
          }
        }
        notify();
        return Promise.resolve();
      },
      opponentCheckIn() {
        for (const d of duels) {
          if (d.status !== 'active' || d.today > 6) continue;
          if (!BOT_IDS.includes(d.opponent.id)) continue;
          if (d.theirPending || d.theirDays.includes(d.today)) continue;
          d.theirPending = { minutes: d.minutes + 5, note: NOTES[noteIdx++ % NOTES.length] };
        }
        notify();
        return Promise.resolve();
      },
      reset() {
        if (!me) return fail('Please sign in.');
        seq = 1;
        seedDemo();
        notify();
        return Promise.resolve();
      },
      database() {
        const now = new Date().toISOString();
        const snapshot: DbSnapshot = {
          database: { engine: 'in-memory mock', host: 'this device' },
          userCount: (me ? 1 : 0) + 2,
          duelCount: duels.length,
          users: [
            ...(me ? [{ id: me.id, name: me.name, email: me.email ?? null, isGuest: me.isGuest, isSeeded: false, createdAt: meCreatedAt }] : []),
            { id: 'tanish', name: 'Tanish', email: null, isGuest: false, isSeeded: true, createdAt: now },
            { id: 'eleanor', name: 'Eleanor', email: null, isGuest: false, isSeeded: true, createdAt: now },
          ],
          duels: duels.map((d) => ({
            id: d.id,
            hobbyId: d.hobbyId,
            minutes: d.minutes,
            goal: `${d.minutes} min a day`,
            status: d.status,
            creator: d.creator.name,
            opponent: d.opponent.name,
            score: `${d.myDays.length} – ${d.theirDays.length}`,
            today: d.today,
            createdAt: now,
          })),
        };
        return Promise.resolve(snapshot);
      },
    },
  };
}
