import { useCallback, useRef, useState } from 'react';

/** Pull-to-refresh state for a screen: pass the `refetch` of each query it shows (and any extra refresh work). */
export function useRefresh(...tasks: (() => Promise<unknown>)[]) {
  const [refreshing, setRefreshing] = useState(false);
  const latest = useRef(tasks);
  latest.current = tasks;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(latest.current.map((task) => task()));
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { refreshing, onRefresh };
}
