import { useCallback, useEffect, useRef, useState } from "react";

/** Only the latest, still-mounted request may publish a result or error. */
export function useAsyncTask() {
  const generation = useRef(0);
  const mounted = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current += 1; };
  }, []);
  const invalidate = useCallback(() => {
    generation.current += 1;
    setBusy(false);
    setError("");
  }, []);
  const run = useCallback(async <T,>(operation: () => Promise<T>, accept: (value: T) => void) => {
    const id = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const value = await operation();
      if (mounted.current && generation.current === id) accept(value);
    } catch (cause) {
      if (mounted.current && generation.current === id) {
        setError(cause instanceof Error ? cause.message : "操作失败，请重试");
      }
    } finally {
      if (mounted.current && generation.current === id) setBusy(false);
    }
  }, []);
  return { busy, error, invalidate, run };
}
