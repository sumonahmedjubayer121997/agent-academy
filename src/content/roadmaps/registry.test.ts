import { describe, expect, it } from 'vitest'
import { BUNDLES, ROADMAPS, getRoadmap } from './registry'
import { MODULES } from './ai-agents'

describe('roadmap registry', () => {
  it('lists five roadmaps with unique slugs', () => {
    expect(ROADMAPS).toHaveLength(5)
    expect(new Set(ROADMAPS.map((r) => r.slug)).size).toBe(5)
  })

  it('has exactly one live roadmap: ai-agents, with stats computed from content', () => {
    const live = ROADMAPS.filter((r) => r.status === 'live')
    expect(live.map((r) => r.slug)).toEqual(['ai-agents'])
    const stats = live[0].stats
    expect(stats?.modules).toBe(MODULES.length)
    expect(stats?.hours).toBe(MODULES.reduce((s, m) => s + m.hours, 0))
    expect(stats && stats.phases).toBeGreaterThan(0)
  })

  it('coming-soon roadmaps have a planned phase outline but no invented stats', () => {
    for (const r of ROADMAPS.filter((x) => x.status === 'coming-soon')) {
      expect((r.plannedPhases ?? []).length).toBeGreaterThanOrEqual(5)
      expect(r.stats).toBeUndefined()
    }
  })

  it('exposes a bundle for every live roadmap and resolves slugs', () => {
    for (const r of ROADMAPS.filter((x) => x.status === 'live')) {
      expect(BUNDLES[r.slug]).toBeDefined()
    }
    expect(getRoadmap('ai-agents')?.title).toBe('AI Agents')
    expect(getRoadmap('does-not-exist')).toBeUndefined()
  })
})
