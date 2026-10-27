import { isDue, type SrsCard } from './srs'

/**
 * Review-queue planning: intake caps and load spreading across roadmaps.
 * Pure functions over a plain srs map — no store dependency (avoids cycles).
 */

export interface ReviewSettings {
  maxReviewsPerDay?: number
  newCardsPerDay?: Record<string, number>
}

export const DEFAULT_MAX_REVIEWS_PER_DAY = 100
export const DEFAULT_NEW_CARDS_PER_DAY = 10

export interface QueuePlan {
  /** Card ids to review now: focus roadmap first, then oldest-due. */
  queue: string[]
  /** Total due today across ALL roadmaps, before any caps. */
  dueCount: number
  /** New cards (never reviewed) held back today by per-roadmap intake caps. */
  queuedNew: number
  /** Due cards cut by the global max-reviews cap. */
  cappedOut: number
  /** Backlog valve: dueCount exceeds 3x the daily review cap. */
  spreadEligible: boolean
}

export function maxReviewsOf(settings?: ReviewSettings): number {
  const v = settings?.maxReviewsPerDay ?? DEFAULT_MAX_REVIEWS_PER_DAY
  return Number.isFinite(v) && v >= 10 ? Math.min(500, Math.round(v)) : DEFAULT_MAX_REVIEWS_PER_DAY
}

export function newPerDayOf(slug: string, settings?: ReviewSettings): number {
  const v = settings?.newCardsPerDay?.[slug] ?? DEFAULT_NEW_CARDS_PER_DAY
  return Number.isFinite(v) && v >= 0 ? Math.min(50, Math.round(v)) : DEFAULT_NEW_CARDS_PER_DAY
}

/**
 * Plan today's queue.
 * - scope: 'all' (default) or a roadmap slug — the chip on the Review page.
 * - New cards (reps === 0) are capped per roadmap per day; the rest wait queued.
 * - The final queue is capped globally (maxReviewsPerDay), focus roadmap first.
 */
export function planReviewQueue(
  srs: Record<string, SrsCard>,
  today: string,
  opts: {
    focusSlug?: string
    scope?: 'all' | string
    roadmapOf?: (cardId: string) => string
    settings?: ReviewSettings
  } = {},
): QueuePlan {
  const roadmapOf = opts.roadmapOf ?? (() => 'ai-agents')
  const scope = opts.scope ?? 'all'

  const due = Object.entries(srs)
    .filter(([id, card]) => isDue(card, today) && (scope === 'all' || roadmapOf(id) === scope))
    .map(([id, card]) => ({ id, due: card.due, reps: card.reps }))
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.id < b.id ? -1 : 1))

  // per-roadmap intake caps for NEW cards (never reviewed)
  const newSeen = new Map<string, number>()
  const kept: typeof due = []
  let queuedNew = 0
  for (const c of due) {
    if (c.reps === 0) {
      const slug = roadmapOf(c.id)
      const n = newSeen.get(slug) ?? 0
      if (n >= newPerDayOf(slug, opts.settings)) {
        queuedNew++
        continue
      }
      newSeen.set(slug, n + 1)
    }
    kept.push(c)
  }

  const max = maxReviewsOf(opts.settings)
  const focus = opts.focusSlug
  const focusFirst = (a: { id: string }, b: { id: string }) => {
    if (!focus) return 0
    const fa = roadmapOf(a.id) === focus
    const fb = roadmapOf(b.id) === focus
    if (fa === fb) return 0 // both (or neither) in focus: keep due order
    return fa ? -1 : 1
  }
  const ordered = [...kept].sort((a, b) => focusFirst(a, b) || (a.due < b.due ? -1 : a.due > b.due ? 1 : 0))

  const queue = ordered.slice(0, max).map((c) => c.id)
  // dueCount is GLOBAL (ignores scope + caps) — the honest headline number
  const dueCount = Object.values(srs).filter((card) => isDue(card, today)).length
  return {
    queue,
    dueCount,
    queuedNew,
    cappedOut: Math.max(0, ordered.length - queue.length),
    spreadEligible: dueCount > 3 * max,
  }
}

/**
 * Backlog valve: redistribute overdue cards evenly across the next 7 days
 * (a small slice stays due today). Returns the new srs map — pure.
 */
export function spreadBacklog(
  srs: Record<string, SrsCard>,
  today: string,
  addDaysStr: (today: string, n: number) => string,
): { next: Record<string, SrsCard>; spread: number } {
  const overdue = Object.entries(srs)
    .filter(([, card]) => card.due <= today)
    .sort((a, b) => (a[1].due < b[1].due ? -1 : 1))
  const next = { ...srs }
  // keep ~1/7 due today, spread the rest over the following 6 days
  const chunk = Math.max(1, Math.ceil(overdue.length / 7))
  overdue.forEach(([id], i) => {
    const day = Math.floor(i / chunk)
    if (day > 0) {
      next[id] = { ...next[id], due: addDaysStr(today, Math.min(day, 6)) }
    }
  })
  return { next, spread: overdue.length }
}
