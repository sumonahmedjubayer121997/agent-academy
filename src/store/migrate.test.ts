import { describe, expect, it } from 'vitest'
import { validateAndMigrateProgress } from './progress'

describe('validateAndMigrateProgress', () => {
  it('rejects non-object roots', () => {
    expect(validateAndMigrateProgress(null).ok).toBe(false)
    expect(validateAndMigrateProgress('nope').ok).toBe(false)
    expect(validateAndMigrateProgress([1, 2]).ok).toBe(false)
  })

  it('rejects a newer schema version with a clear error', () => {
    const r = validateAndMigrateProgress({ schemaVersion: 3, moduleStatus: {} })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/newer app version/)
  })

  it('rejects structurally wrong shapes instead of crashing later', () => {
    expect(validateAndMigrateProgress({ moduleStatus: [] }).ok).toBe(false)
    expect(validateAndMigrateProgress({ activity: 'not-an-array' }).ok).toBe(false)
    expect(validateAndMigrateProgress({ sessions: {} }).ok).toBe(false)
  })

  it('migrates v1 three-state data to v2 stages without loss', () => {
    const r = validateAndMigrateProgress({
      moduleStatus: { 'p1-python-core': 'completed', 'p1-sql': 'in-progress' },
      activity: ['2026-10-01', 42, '2026-10-02'],
      weeklyHours: 12,
    })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.data.schemaVersion).toBe(2)
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
})
