import { describe, expect, it } from 'vitest'
import { validateAndMigrateProgress } from './progress'

describe('validateAndMigrateProgress', () => {
  it('rejects non-object roots', () => {
    expect(validateAndMigrateProgress(null).ok).toBe(false)
    expect(validateAndMigrateProgress('nope').ok).toBe(false)
    expect(validateAndMigrateProgress([1, 2]).ok).toBe(false)
  })

  it('rejects a newer schema version with a clear error', () => {
    const r = validateAndMigrateProgress({ schemaVersion: 4, moduleStatus: {} })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/newer app version/)
  })

  it('rejects structurally wrong shapes instead of crashing later', () => {
    expect(validateAndMigrateProgress({ moduleStatus: [] }).ok).toBe(false)
    expect(validateAndMigrateProgress({ activity: 'not-an-array' }).ok).toBe(false)
    expect(validateAndMigrateProgress({ sessions: {} }).ok).toBe(false)
  })

  it('migrates v1 three-state data to v3 stages without loss', () => {
    const r = validateAndMigrateProgress({
      moduleStatus: { 'p1-python-core': 'completed', 'p1-sql': 'in-progress' },
      activity: ['2026-10-01', 42, '2026-10-02'],
      weeklyHours: 12,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.schemaVersion).toBe(3)
    expect(r.data.modules?.['p1-python-core']?.stage).toBe('confident')
    expect(r.data.modules?.['p1-sql']?.stage).toBe('learning')
    // non-string activity entries are dropped, real ones kept
    expect(r.data.activity).toEqual(['2026-10-01', '2026-10-02'])
    expect(r.data.weeklyHours).toBe(12)
  })

  it('sanitises unknown stage values and non-numeric checklist entries', () => {
    const r = validateAndMigrateProgress({
      modules: {
        'p2-ml-core': {
          stage: 'galactic',
          objectivesDone: [0, 'x', 1],
          notes: 42,
        },
      },
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const rec = r.data.modules?.['p2-ml-core']
    expect(rec?.stage).toBe('not-started')
    expect(rec?.objectivesDone).toEqual([0, 1])
    expect(rec?.notes).toBe('')
  })

  it('falls back to defaults for invalid weeklyHours', () => {
    const r = validateAndMigrateProgress({ weeklyHours: 999 })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.weeklyHours).toBe(10)
  })

  it('v2 → v3: single-roadmap fields move under the ai-agents key without loss', () => {
    const r = validateAndMigrateProgress({
      schemaVersion: 2,
      sequenceMode: 'phase-order',
      assessment: { done: true, applied: false, scores: { python: 3, math: 2 } },
      lastActiveModuleId: 'p1-python-core',
      moduleStatus: { 'p1-python-core': 'completed' },
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.schemaVersion).toBe(3)
    expect(r.data.sequenceModes?.['ai-agents']).toBe('phase-order')
    expect(r.data.assessments?.['ai-agents']).toEqual({
      done: true,
      applied: false,
      scores: { python: 3, math: 2 },
    })
    expect(r.data.lastActiveModuleId).toBe('p1-python-core')
    expect(r.data.lastActiveByRoadmap?.['ai-agents']).toBe('p1-python-core')
  })

  it('v2 → v3: stored plan route strings become {slug, moduleId} targets', () => {
    const r = validateAndMigrateProgress({
      schemaVersion: 2,
      dailyPlans: {
        '2026-10-20': {
          date: '2026-10-20',
          budgetMinutes: 120,
          blocks: [
            { id: 'b1', kind: 'learn', title: 'Study', minutes: 40, done: false, moduleId: 'pe-anatomy', route: '/roadmap/pe-anatomy' },
            { id: 'b2', kind: 'revise', title: 'Review', minutes: 30, done: true, route: '/review' },
          ],
        },
      },
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const blocks = r.data.dailyPlans?.['2026-10-20']?.blocks
    expect(blocks?.[0]?.target).toEqual({ slug: 'prompt-engineering', moduleId: 'pe-anatomy' })
    expect(blocks?.[0]?.route).toBeUndefined()
    expect(blocks?.[1]?.target).toBeUndefined() // review links stay kind-based
  })

  it('v3 data round-trips: per-slug assessments and started roadmaps survive untouched', () => {
    const v3 = {
      schemaVersion: 3,
      assessments: {
        'ai-agents': { done: true, applied: true, scores: { python: 3 } },
        'prompt-engineering': { done: false, applied: false, scores: {} },
      },
      sequenceModes: { 'prompt-engineering': 'builder-fast-track' },
      startedRoadmaps: { 'ai-agents': '2026-10-01T00:00:00.000Z' },
    }
    const r = validateAndMigrateProgress(v3)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.assessments).toEqual(v3.assessments)
    expect(r.data.sequenceModes?.['prompt-engineering']).toBe('builder-fast-track')
    expect(r.data.sequenceModes?.['ai-agents']).toBe('agent-fast-track') // default preserved
    expect(r.data.startedRoadmaps).toEqual(v3.startedRoadmaps)
  })

  it('sessions gain roadmap attribution from module ids during migration', () => {
    const r = validateAndMigrateProgress({
      sessions: [
        { moduleId: 'p1-python-core', minutes: 30, at: '2026-10-01T10:00:00.000Z' },
        { moduleId: 'pe-anatomy', minutes: 20, at: '2026-10-01T11:00:00.000Z' },
        { moduleId: 'review', minutes: 15, at: '2026-10-01T12:00:00.000Z' },
      ],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.sessions[0]?.roadmap).toBe('ai-agents')
    expect(r.data.sessions[1]?.roadmap).toBe('prompt-engineering')
    expect(r.data.sessions[2]?.roadmap).toBeUndefined() // legacy review sessions stay unattributed
  })

  it('carries practice-task completion through migration, sanitising malformed entries', () => {
    const r = validateAndMigrateProgress({
      moduleStatus: {},
      tasks: {
        'aip-t-error-triage': { done: true, at: '2026-10-28T09:00:00.000Z' },
        'aip-t-other': { done: 'yes', at: 42 },
        'not-an-object': 'nope',
      },
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.tasks?.['aip-t-error-triage']).toEqual({ done: true, at: '2026-10-28T09:00:00.000Z' })
    expect(r.data.tasks?.['aip-t-other']).toEqual({ done: true }) // truthy done coerced, bad `at` dropped
    expect(r.data.tasks?.['not-an-object']).toBeUndefined() // non-object entries dropped
  })

  it('loads pre-tasks v3 progress unchanged — no tasks key, no schema bump', () => {
    const r = validateAndMigrateProgress({
      moduleStatus: { 'p1-python-core': 'completed' },
      activity: ['2026-10-01'],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.schemaVersion).toBe(3)
    expect(r.data.tasks).toEqual({})
    expect(r.data.modules?.['p1-python-core']?.stage).toBe('confident')
    expect(r.data.activity).toEqual(['2026-10-01'])
  })
})
