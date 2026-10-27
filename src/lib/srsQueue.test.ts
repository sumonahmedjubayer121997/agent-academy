import { describe, expect, it } from 'vitest'
import { DEFAULT_MAX_REVIEWS_PER_DAY, planReviewQueue, spreadBacklog } from './srsQueue'
import type { SrsCard } from './srs'

const today = '2026-10-27'
const mk = (due: string, reps = 3): SrsCard => ({ ease: 2.5, intervalDays: 3, due, reps, lapses: 0 })
const slugOf = (id: string) => id.split('/')[0]

describe('planReviewQueue', () => {
  it('caps new cards per roadmap per day; overflow waits queued', () => {
    const srs: Record<string, SrsCard> = {}
    for (let i = 0; i < 15; i++) srs[`pe/fc:m:${i}`] = mk(today, 0) // all NEW
    const plan = planReviewQueue(srs, today, { roadmapOf: slugOf })
    expect(plan.queue).toHaveLength(10) // default newCardsPerDay
    expect(plan.queuedNew).toBe(5)
    expect(plan.dueCount).toBe(15)
  })

  it('caps are per roadmap, not global, for new cards', () => {
    const srs: Record<string, SrsCard> = {}
    for (let i = 0; i < 8; i++) srs[`pe/n:${i}`] = mk(today, 0)
    for (let i = 0; i < 8; i++) srs[`ai-agents/n:${i}`] = mk(today, 0)
    const plan = planReviewQueue(srs, today, { roadmapOf: slugOf })
    expect(plan.queue).toHaveLength(16) // 8 + 8, each under its own cap
    expect(plan.queuedNew).toBe(0)
  })

  it('reviewed cards are not subject to the new-card cap', () => {
    const srs: Record<string, SrsCard> = {}
    for (let i = 0; i < 30; i++) srs[`pe/r:${i}`] = mk(today, 2)
    const plan = planReviewQueue(srs, today, { roadmapOf: slugOf })
    expect(plan.queue).toHaveLength(30)
  })

  it('global max-reviews cap cuts the queue and reports cappedOut', () => {
    const srs: Record<string, SrsCard> = {}
    for (let i = 0; i < 150; i++) srs[`ai-agents/r:${i}`] = mk(today, 2)
    const plan = planReviewQueue(srs, today, { roadmapOf: slugOf })
    expect(plan.queue).toHaveLength(DEFAULT_MAX_REVIEWS_PER_DAY)
    expect(plan.cappedOut).toBe(50)
  })

  it('focus roadmap cards come first in the queue', () => {
    const srs: Record<string, SrsCard> = {
      'ai-agents/a': mk(today, 1),
      'pe/b': mk(today, 1),
      'ai-agents/c': mk(today, 1),
    }
    const plan = planReviewQueue(srs, today, { focusSlug: 'pe', roadmapOf: slugOf })
    expect(plan.queue[0]).toBe('pe/b')
  })

  it('focus ordering never disturbs cards already in the focus roadmap', () => {
    const srs: Record<string, SrsCard> = {
      'pe/a': mk(today, 1),
      'pe/b': mk(today, 1),
      'pe/c': mk(today, 1),
    }
    const plan = planReviewQueue(srs, today, { focusSlug: 'pe', roadmapOf: slugOf })
    expect(plan.queue).toEqual(['pe/a', 'pe/b', 'pe/c'])
  })

  it('scope chip narrows to one roadmap; dueCount stays global', () => {
    const srs: Record<string, SrsCard> = { 'pe/a': mk(today, 1), 'ai-agents/b': mk(today, 1) }
    const plan = planReviewQueue(srs, today, { scope: 'pe', roadmapOf: slugOf })
    expect(plan.queue).toEqual(['pe/a'])
    expect(plan.dueCount).toBe(2)
  })

  it('spread valve arms when due exceeds 3x the review cap', () => {
    const srs: Record<string, SrsCard> = {}
    for (let i = 0; i < 301; i++) srs[`ai-agents/x:${i}`] = mk(today, 2)
    expect(planReviewQueue(srs, today, { roadmapOf: slugOf }).spreadEligible).toBe(true)
    expect(planReviewQueue(srs, today, { roadmapOf: slugOf, settings: { maxReviewsPerDay: 150 } }).spreadEligible).toBe(false)
  })
})

describe('spreadBacklog', () => {
  it('spreads overdue cards across the next 7 days, keeping a slice today', () => {
    const srs: Record<string, SrsCard> = {}
    for (let i = 0; i < 70; i++) srs[`ai-agents/x:${i}`] = mk('2026-10-20', 2)
    const addDays = (_t: string, n: number) => {
      const d = new Date(Date.parse('2026-10-27') + n * 86400000)
      return d.toISOString().slice(0, 10)
    }
    const { next, spread } = spreadBacklog(srs, today, addDays)
    expect(spread).toBe(70)
    const stillToday = Object.values(next).filter((c) => c.due <= today).length
    const future = Object.values(next).filter((c) => c.due > today).length
    expect(stillToday).toBe(10) // first chunk stays
    expect(future).toBe(60)
    expect(Object.values(next).some((c) => c.due > '2026-11-02')).toBe(false) // within 6 days
  })
})
