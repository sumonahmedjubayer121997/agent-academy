import { describe, expect, it } from 'vitest'
import { BUNDLES, ROADMAPS, getRoadmap } from './registry'
import { MODULES } from './ai-agents'
import { MODULES as PE_MODULES, PHASES as PE_PHASES, PRACTICE_PROJECTS as PE_PP } from './prompt-engineering'

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

  it('non-live roadmaps either have a planned outline or bundle-backed stats — never invented numbers', () => {
    for (const r of ROADMAPS.filter((x) => x.status !== 'live')) {
      if (BUNDLES[r.slug]) {
        // curriculum authored: stats must match the bundle exactly, no planned skeleton
        expect(r.stats?.modules).toBe(BUNDLES[r.slug].MODULES.length)
        expect(r.stats?.phases).toBe(BUNDLES[r.slug].PHASES.length)
        expect(r.stats?.lessons).toBe((BUNDLES[r.slug].LESSONS ?? []).length)
        expect(r.stats?.hours).toBe(BUNDLES[r.slug].MODULES.reduce((s, m) => s + m.hours, 0))
        expect(r.plannedPhases).toBeUndefined()
      } else {
        expect((r.plannedPhases ?? []).length).toBeGreaterThanOrEqual(5)
        expect(r.stats).toBeUndefined()
      }
    }
  })

  it('every ROADMAPS entry with stats derives phases, modules, lessons, and hours from its bundle', () => {
    const withStats = ROADMAPS.filter((r) => r.stats !== undefined)
    expect(withStats.length).toBeGreaterThan(0)
    for (const r of withStats) {
      const bundle = BUNDLES[r.slug]
      expect(bundle, `${r.slug}: stats entry must have a corresponding bundle`).toBeDefined()
      expect(r.stats?.phases, `${r.slug}: phases`).toBe(bundle.PHASES.length)
      expect(r.stats?.modules, `${r.slug}: modules`).toBe(bundle.MODULES.length)
      expect(r.stats?.lessons, `${r.slug}: lessons`).toBe((bundle.LESSONS ?? []).length)
      expect(r.stats?.hours, `${r.slug}: hours`).toBe(bundle.MODULES.reduce((s, m) => s + m.hours, 0))
    }
  })

  it('prompt-engineering curriculum is registered with authored stats', () => {
    const pe = getRoadmap('prompt-engineering')
    expect(pe?.stats?.modules).toBe(PE_MODULES.length)
    expect(pe?.stats?.phases).toBe(PE_PHASES.length)
    expect(pe?.stats?.hours).toBeGreaterThan(0)
    expect(BUNDLES['prompt-engineering'].PRACTICE_PROJECTS.length).toBe(PE_PP.length)
  })

  it('exposes a bundle for every live roadmap and resolves slugs', () => {
    for (const r of ROADMAPS.filter((x) => x.status === 'live')) {
      expect(BUNDLES[r.slug]).toBeDefined()
    }
    expect(getRoadmap('ai-agents')?.title).toBe('AI Agents')
    expect(getRoadmap('does-not-exist')).toBeUndefined()
  })
})
