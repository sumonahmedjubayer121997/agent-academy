import { describe, expect, it } from 'vitest'
import { DEFAULT_DATA, emptyModuleRecord, type ProgressData } from '../store/progress'
import { getRecommendations } from './recommend'

const makeData = (over: Partial<ProgressData> = {}): ProgressData => ({
  ...DEFAULT_DATA,
  ...over,
})

describe('getRecommendations (Feature 3)', () => {
  it('recommends foundational unlocked modules for a fresh learner with all 7 required fields', () => {
    const recs = getRecommendations(makeData(), { limit: 3 })
    expect(recs).toHaveLength(3)
    const top = recs[0]
    // Must have no unmet prerequisites
    expect(top.prerequisites.every((p) => p.met)).toBe(true)
    // Verify all 7 required fields are populated
    expect(top.module.title.length).toBeGreaterThan(0)
    expect(top.reasons.length).toBeGreaterThan(0)
    expect(Array.isArray(top.prerequisites)).toBe(true)
    expect(top.estimatedTime.moduleHours).toBeGreaterThan(0)
    expect(top.expectedOutcome.length).toBeGreaterThan(0)
    expect(top.practicalExercise.length).toBeGreaterThan(0)
    expect(top.masteryProof.length).toBeGreaterThan(0)
  })

  it('prioritises revising a shaky prerequisite before advancing', () => {
    const d = makeData({
      moduleStatus: { 'p1-python-core': 'completed' },
      modules: { 'p1-python-core': emptyModuleRecord('confident') },
      confidence: { 'p1-python-core': 'shaky' },
    })
    const recs = getRecommendations(d, { limit: 3 })
    expect(recs[0].module.id).toBe('p1-python-core')
    expect(recs[0].kind).toBe('revise-foundation')
  })

  it('prioritises finishing an active in-progress module to prevent half-finished work', () => {
    const d = makeData({
      moduleStatus: {
        'p1-python-core': 'completed',
        'p1-env-packages': 'in-progress',
      },
      modules: {
        'p1-python-core': emptyModuleRecord('mastered'),
        'p1-env-packages': emptyModuleRecord('practising'),
      },
    })
    const recs = getRecommendations(d, { limit: 3 })
    expect(recs[0].module.id).toBe('p1-env-packages')
    expect(recs[0].kind).toBe('finish-active')
  })
})
