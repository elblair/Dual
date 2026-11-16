import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { dataSource } from './dataSource';
import type { DataSource } from './source';
import type { Duel, Me } from './types';

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

interface Query<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

function useQuery<T>(load: () => Promise<T>): Query<T> {
  const version = useContext(VersionContext);
  const [state, setState] = useState<Query<T>>({ data: null, error: null, loading: true });

  useEffect(() => {
    let live = true;
    load().then(
      (data) => live && setState({ data, error: null, loading: false }),
      (error: Error) => live && setState((s) => ({ data: s.data, error, loading: false })),
    );
    return () => {
      live = false;
    };
  }, [load, version]);

  return state;
}

export function useMe(): Query<Me> {
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
