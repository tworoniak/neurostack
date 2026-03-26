import { useEffect, useRef } from 'react'
import type { MemoryDirectory } from '../types/memory'

export function useFileWatcher(
  directory: MemoryDirectory | null,
  onRefresh: () => void,
  intervalMs = 4000
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!directory) return

    timerRef.current = setInterval(onRefresh, intervalMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [directory, onRefresh, intervalMs])
}
