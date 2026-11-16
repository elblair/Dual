import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { dataSource } from './dataSource';
import type { DataSource } from './source';
import type { Duel, Groups, Me, Stats } from './types';

const VersionContext = createContext(0);

/** Re-renders consumers after every data change so the hooks below refetch. */
export function DataProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  useEffect(() => dataSource.subscribe(() => setVersion((v) => v + 1)), []);
  return <VersionContext.Provider value={version}>{children}</VersionContext.Provider>;
}

/** Actions (check in, create duel, ...). Screens call these, never fetch or the mock directly. */
export function useData(): DataSource {
  return dataSource;
}

export interface Query<T> {
  data: T | null;
  error: Error | null;
  /** True until the first answer (data or error) arrives. */
  loading: boolean;
  /** Fetch again now (pull-to-refresh). Resolves when the answer is in. */
  refetch: () => Promise<void>;
}

function useQuery<T>(load: () => Promise<T>): Query<T> {
  const version = useContext(VersionContext);
  const [state, setState] = useState<Omit<Query<T>, 'refetch'>>({ data: null, error: null, loading: true });
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    try {
      const data = await load();
      if (alive.current) setState({ data, error: null, loading: false });
    } catch (e) {
      // Keep the last good data on screen and show the error beside it.
      if (alive.current) setState((s) => ({ data: s.data, error: e instanceof Error ? e : new Error(String(e)), loading: false }));
    }
  }, [load]);

  useEffect(() => {
    run();
  }, [run, version]);

  return { ...state, refetch: run };
}

/** The signed-in person, or `data: null` (not loading) when there is no session. */
export function useMe(): Query<Me | null> {
  return useQuery(useCallback(() => dataSource.getMe(), []));
}

export function useDuels(): Query<Duel[]> {
  return useQuery(useCallback(() => dataSource.listDuels(), []));
}

export function useDuel(id: string | undefined): Query<Duel> {
  return useQuery(useCallback(() => (id ? dataSource.getDuel(id) : Promise.reject(new Error('No duel id'))), [id]));
}

export function useDuelByCode(code: string | undefined): Query<Duel> {
  return useQuery(useCallback(() => (code ? dataSource.getDuelByCode(code) : Promise.reject(new Error('No code'))), [code]));
}

export function useStats(): Query<Stats> {
  return useQuery(useCallback(() => dataSource.getStats(), []));
}

export function useGroups(): Query<Groups> {
  return useQuery(useCallback(() => dataSource.getGroups(), []));
}

export type ConnectionStatus = 'checking' | 'live' | 'offline' | 'mock';

/** The Live / Offline badge: pings the API every 10 seconds. The mock is always "mock". */
export function useConnection(): { status: ConnectionStatus; host: string; recheck: () => Promise<void> } {
  const version = useContext(VersionContext);
  const [status, setStatus] = useState<ConnectionStatus>(dataSource.mode === 'mock' ? 'mock' : 'checking');

  const recheck = useCallback(async () => {
    if (dataSource.mode === 'mock') return;
    const ok = await dataSource.ping();
    setStatus(ok ? 'live' : 'offline');
  }, []);

  useEffect(() => {
    if (dataSource.mode === 'mock') return;
    recheck();
    const timer = setInterval(recheck, 10_000);
    return () => clearInterval(timer);
  }, [recheck, version]);

  return { status, host: dataSource.host, recheck };
}
