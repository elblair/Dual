import { storage } from '@/lib/storage';
import type { DataSource } from './source';
import type { Duel, Groups, Me, Stats, UserHit } from './types';

const TOKEN_KEY = 'dual.token';
/** Generous on purpose: the free Render tier takes about a minute to wake up after being idle. */
const TIMEOUT_MS = 60_000;
const PING_TIMEOUT_MS = 8_000;

interface AuthResponse {
  token: string;
  me: Me;
}

/** FastAPI implementation of DataSource. Keeps the login token in secure storage (localStorage on web). */
export function createApiSource(baseUrl: string): DataSource {
  const root = baseUrl.replace(/\/+$/, '');
  const host = root ? root.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : 'no API URL set';
  const notConfigured = 'The app is not set up: EXPO_PUBLIC_API_URL is missing. Add it to app/.env and restart with `npx expo start -c`.';
  const listeners = new Set<() => void>();
  let token: string | null = null;
  const ready = storage.get(TOKEN_KEY).then((t) => {
    token = t;
  });

  const notify = () => listeners.forEach((l) => l());

  async function setToken(next: string | null) {
    token = next;
    if (next) await storage.set(TOKEN_KEY, next);
    else await storage.remove(TOKEN_KEY);
  }

  /** One place for every network call, so errors are friendly and sessions expire cleanly. */
  async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    if (!root) throw new Error(notConfigured);
    await ready;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${root}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
    } catch {
      throw new Error(`Can’t reach the server (${host}). Check your connection and try again.`);
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 204) return undefined as T;
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      /* no body */
    }
    if (!res.ok) {
      const detail = (json as { detail?: unknown } | null)?.detail;
      // An expired or unknown token on a normal call: forget it so the app falls back to signed out.
      if (res.status === 401 && token && !path.startsWith('/auth/login')) {
        await setToken(null);
        notify();
      }
      if (typeof detail === 'string') throw new Error(detail);
      if (Array.isArray(detail)) throw new Error('Please check the details you entered.');
      throw new Error(`Something went wrong (${res.status}). Try again.`);
    }
    return json as T;
  }

  /** Run a mutation, then tell every screen to refetch. */
  async function mutate<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const result = await request<T>(method, path, body);
    notify();
    return result;
  }

  async function signIn(path: string, body: unknown): Promise<Me> {
    const { token: next, me } = await request<AuthResponse>('POST', path, body);
    await setToken(next);
    notify();
    return me;
  }

  const duelPost = (id: string, action: string, body?: unknown) => mutate<Duel>('POST', `/duels/${encodeURIComponent(id)}/${action}`, body ?? {});

  return {
    mode: 'api',
    host,

    async ping(timeoutMs = PING_TIMEOUT_MS) {
      if (!root) return false;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(`${root}/health`, { signal: controller.signal });
        return res.ok;
      } catch {
        return false;
      } finally {
        clearTimeout(timer);
      }
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async getMe() {
      await ready;
      if (!token) return null;
      try {
        return await request<Me>('GET', '/me');
      } catch (e) {
        if (!token) return null; // the session expired and was cleared
        throw e;
      }
    },
    register: ({ name, email, password }) => signIn('/auth/register', { name, email, password }),
    login: ({ email, password }) => signIn('/auth/login', { email, password }),
    async logout() {
      await setToken(null);
      notify();
    },

    searchUsers: (query) => request<UserHit[]>('GET', `/users/search?q=${encodeURIComponent(query.trim())}`),

    async listDuels() {
      await ready;
      if (!token) return [];
      return request<Duel[]>('GET', '/duels');
    },
    getDuel: (id) => request<Duel>('GET', `/duels/${encodeURIComponent(id)}`),
    getDuelByCode: (code) => request<Duel>('GET', `/duels/by-code/${encodeURIComponent(code.trim())}`),
    createDuel: (input) => mutate<Duel>('POST', '/duels', input),
    acceptDuel: (id) => duelPost(id, 'accept'),

    checkIn: (id) => duelPost(id, 'checkin'),
    addCheckInDetails: (id, { minutes, note }) => duelPost(id, 'checkin/details', { minutes, note }),
    confirmFriend: (id) => duelPost(id, 'confirm'),
    restDay: (id) => duelPost(id, 'rest'),
    pause: (id) => duelPost(id, 'pause'),
    resume: (id) => duelPost(id, 'resume'),
    forfeit: (id) => duelPost(id, 'forfeit'),
    rematch: (id, kind) => duelPost(id, 'rematch', { kind }),

    getStats: () => request<Stats>('GET', '/me/stats'),
    getGroups: () => request<Groups>('GET', '/groups'),
  };
}
