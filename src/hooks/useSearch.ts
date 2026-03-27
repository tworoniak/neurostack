import { useMemo } from 'react'
import Fuse from 'fuse.js'
import type { MemoryDirectory } from '../types/memory'

export interface SearchResult {
  path: string
  name: string
  content: string
  matchedLine: string
  lineNumber: number
}

export function useSearch(directory: MemoryDirectory | null, query: string): SearchResult[] {
  const items = useMemo(() => {
    if (!directory) return []
    const results: Array<{ path: string; name: string; content: string; line: string; lineNum: number }> = []

    for (const [path, file] of directory.files.entries()) {
      const lines = file.content.split('\n')
      lines.forEach((line, idx) => {
        if (line.trim()) {
          results.push({
            path,
            name: file.name,
            content: file.content,
            line: line.trim(),
            lineNum: idx + 1,
          })
        }
      })
    }
    return results
  }, [directory])

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ['line', 'name'],
        threshold: 0.35,
        includeScore: true,
      }),
    [items]
  )

  const MAX_RESULTS = 40

  return useMemo(() => {
    if (!query.trim()) return []
    const seen = new Set<string>()
    const results: SearchResult[] = []
    for (const r of fuse.search(query)) {
      const key = `${r.item.path}:${r.item.lineNum}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push({
        path: r.item.path,
        name: r.item.name,
        content: r.item.content,
        matchedLine: r.item.line,
        lineNumber: r.item.lineNum,
      })
      if (results.length === MAX_RESULTS) break
    }
    return results
  }, [fuse, query])
}
