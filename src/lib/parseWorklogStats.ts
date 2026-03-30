import type { WorklogEntry, DecisionEntry } from '../types/memory'

/** One cell per day for the last 365 days. count = worklog entries on that date. */
export function activityByDay(entries: WorklogEntry[]): { date: string; count: number }[] {
  const countByDate: Record<string, number> = {}
  for (const e of entries) {
    countByDate[e.date] = (countByDate[e.date] ?? 0) + 1
  }

  const days: { date: string; count: number }[] = []
  const today = new Date()
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    days.push({ date, count: countByDate[date] ?? 0 })
  }
  return days
}

/** Sessions per project, within the last `days` calendar days. Sorted descending by sessions. */
export function projectActivity(
  entries: WorklogEntry[],
  days: number
): { project: string; sessions: number }[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const counts: Record<string, number> = {}
  for (const e of entries) {
    if (e.date >= cutoffStr) {
      counts[e.project] = (counts[e.project] ?? 0) + 1
    }
  }

  return Object.entries(counts)
    .map(([project, sessions]) => ({ project, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
}

/** Decisions grouped by ISO week label (e.g. "2026-W12"), last `weeks` weeks. */
export function decisionsPerWeek(
  entries: DecisionEntry[],
  weeks = 12
): { week: string; count: number }[] {
  const result: { week: string; count: number }[] = []
  const today = new Date()

  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i * 7)
    const year = d.getFullYear()
    // ISO week number
    const jan4 = new Date(year, 0, 4)
    const weekNum = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
    const label = `W${String(weekNum).padStart(2, '0')}`

    // Date range for this week (Mon–Sun)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const startStr = weekStart.toISOString().slice(0, 10)
    const endStr = weekEnd.toISOString().slice(0, 10)

    const count = entries.filter(e => e.date >= startStr && e.date <= endStr).length
    result.push({ week: label, count })
  }

  return result
}
