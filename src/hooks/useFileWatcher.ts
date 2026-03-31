import { useEffect, useRef } from 'react';
import type { MemoryDirectory } from '../types/memory';

export function useFileWatcher(
  directory: MemoryDirectory | null,
  onRefresh: () => void,
  intervalMs = 10000,
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!directory) return;

    const start = () => {
      if (timerRef.current) return;
      timerRef.current = setInterval(onRefresh, intervalMs);
    };

    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleVisibility = () => {
      document.visibilityState === 'hidden' ? stop() : start();
    };

    start();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [directory, onRefresh, intervalMs]);
}
