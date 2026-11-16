import { CONTACTS, makeInviteCode } from './sample';
import type { DataSource } from './source';
import type { CreateDuelInput, Duel, Me, Person } from './types';

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
 * In-memory implementation of DataSource. Everything resets when the app reloads.
 * `seed: true` creates the day-5 demo duels on first launch (EXPO_PUBLIC_DEMO=true).
 */
export function createMockSource({ seed }: { seed: boolean }): DataSource {
  let me: Me = { id: 'me', name: 'Ari', isGuest: true };
  let duels: Duel[] = [];
  let seq = 1;
  let noteIdx = 0;
  const accounts: { name: string; email: string; password: string }[] = [];
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((l) => l());

  function find(id: string): Duel {
    const d = duels.find((x) => x.id === id);
    if (!d) throw new Error('Duel not found');
    return d;
  }

  function blankDuel(i: CreateDuelInput, status: Duel['status']): Duel {
    return {
      id: `d${seq++}`,
      hobbyId: i.hobbyId,
      minutes: i.minutes,
      lengthDays: 7,
      status,
      opponent: person(i.friendId),
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

  if (seed) seedDemo();

  const done = (d: Duel) => {
    notify();
    return Promise.resolve(clone(d));
  };
  const fail = (msg: string) => Promise.reject(new Error(msg));

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getMe: () => Promise.resolve(clone(me)),
    register({ name, email, password }) {
      if (accounts.some((a) => a.email === email)) return fail('That email already has an account. Try logging in.');
      accounts.push({ name, email, password });
      me = { ...me, name, email, isGuest: false };
      notify();
      return Promise.resolve(clone(me));
    },
    login({ email, password }) {
      const a = accounts.find((x) => x.email === email);
      if (!a) return fail('No account with that email. Try creating one.');
      if (a.password !== password) return fail('Wrong password.');
      me = { ...me, name: a.name, email, isGuest: false };
      notify();
      return Promise.resolve(clone(me));
    },

    listDuels: () => Promise.resolve(clone(duels)),
    getDuel(id) {
      try {
        return Promise.resolve(clone(find(id)));
      } catch (e) {
        return Promise.reject(e);
      }
    },
    getDuelByCode(code) {
      const d = duels.find((x) => x.status === 'pending' && x.inviteCode === code.trim().toUpperCase());
      return d ? Promise.resolve(clone(d)) : fail('We couldn’t find that code. Check it and try again.');
    },
    createDuel(input) {
      const status = BOT_IDS.includes(input.friendId) ? 'active' : 'pending';
      const d = blankDuel(input, status);
      duels = [d, ...duels];
      return done(d);
    },
    acceptDuel(id) {
      const d = find(id);
      if (d.status !== 'pending') return fail('This duel was already accepted.');
      d.status = 'active';
      d.inviteCode = null;
      d.today = 0;
      return done(d);
    },

    checkIn(id) {
      const d = find(id);
      if (d.status !== 'active') return fail('This duel is not active.');
      if (d.myDays.includes(d.today)) return fail('You already checked in today.');
      d.myRestDays = d.myRestDays.filter((x) => x !== d.today);
      d.myDays.push(d.today);
      return done(d);
    },
    confirmFriend(id) {
      const d = find(id);
      if (d.theirPending) {
        d.theirDays.push(d.today);
        d.theirPending = null;
      }
      return done(d);
    },
    restDay(id) {
      const d = find(id);
      if (d.restLeft <= 0) return fail('No rest days left this week.');
      if (d.myDays.includes(d.today) || d.myRestDays.includes(d.today)) return fail('Today is already logged.');
      d.myRestDays.push(d.today);
      d.restLeft -= 1;
      return done(d);
    },
    pause(id) {
      const d = find(id);
      d.status = 'paused';
      d.pausedUntil = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
      return done(d);
    },
    resume(id) {
      const d = find(id);
      d.status = 'active';
      d.pausedUntil = null;
      return done(d);
    },
    forfeit(id) {
      const d = find(id);
      finish(d, 'me');
      return done(d);
    },
    rematch(id, kind) {
      const old = find(id);
      const status = BOT_IDS.includes(old.opponent.id) ? 'active' : 'pending';
      const d = blankDuel({ hobbyId: old.hobbyId, minutes: kind === 'easier' ? 15 : old.minutes, friendId: old.opponent.id }, status);
      duels = [d, ...duels];
      return done(d);
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
        seq = 1;
        seedDemo();
        notify();
        return Promise.resolve();
      },
    },
  };
}
