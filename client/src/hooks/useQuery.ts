import { useCallback, useEffect, useRef, useState } from 'react';

interface QueryState<T> {
  data: T | undefined;
  error: string | null;
  /** True only before the first successful load. */
  isLoading: boolean;
  /** True while refetching with data already on screen. */
  isRefreshing: boolean;
  refetch: () => void;
}

/**
 * Loads data and refetches when `key` changes.
 *
 * Previous data stays on screen during a refetch (the UI dims it instead of
 * flashing a spinner), and stale responses are aborted so a slow request for
 * an old filter can never overwrite a newer one.
 */
export function useQuery<T>(key: string, load: (signal: AbortSignal) => Promise<T>): QueryState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const [version, setVersion] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    const controller = new AbortController();
    setPending(true);

    loadRef
      .current(controller.signal)
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setPending(false);
      });

    return () => controller.abort();
  }, [key, version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  return {
    data,
    error,
    isLoading: pending && data === undefined,
    isRefreshing: pending && data !== undefined,
    refetch,
  };
}
