import { describe, expect, it } from 'vitest'
import { BUNDLES } from '../content/roadmaps/registry'
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

  it('scopes module, lesson, prerequisite, sequence-mode, and diagnostic lookups to each of the 4 roadmaps', () => {
    for (const [slug, bundle] of Object.entries(BUNDLES)) {
      const modIds = new Set(bundle.MODULES.map((m) => m.id))
      const withPrereq = bundle.MODULES.find((m) => m.prereqs.length > 0)!
      const prereqMod = bundle.MODULES.find((m) => m.id === withPrereq.prereqs[0])!
      const fastMode = bundle.SEQUENCE_MODES[1]?.id ?? bundle.SEQUENCE_MODES[0].id
      const firstDomain = Object.keys(bundle.DOMAIN_CREDIT)[0]
      const creditModId =
        bundle.DOMAIN_CREDIT[firstDomain]?.full[0] ??
        bundle.DOMAIN_CREDIT[firstDomain]?.partial[0] ??
        bundle.MODULES[0].id

      const d = makeData({
        moduleStatus: {
          [prereqMod.id]: 'completed',
          [withPrereq.id]: 'in-progress',
        },
        modules: {
          [prereqMod.id]: emptyModuleRecord('confident'),
          [withPrereq.id]: emptyModuleRecord('learning'),
        },
        sequenceModes: { [slug]: fastMode },
        assessments: {
          [slug]: { done: true, applied: false, scores: { [firstDomain]: 1 } },
        },
      })

      const recs = getRecommendations(d, { bundle, limit: 10 })
      expect(recs.length).toBeGreaterThan(0)
      for (const r of recs) {
        expect(modIds.has(r.module.id)).toBe(true)
      }

      // Prerequisite title must resolve to the bundle's human-readable module title, not raw id
      const recWithPrereq = recs.find((r) => r.module.id === withPrereq.id)
      expect(recWithPrereq).toBeDefined()
      expect(recWithPrereq!.prerequisites[0].title).toBe(prereqMod.title)

      // Diagnostic gap alignment must read the active roadmap's assessment
      const gapRec = recs.find((r) => r.module.id === creditModId)
      if (gapRec) {
        expect(gapRec.reasons.join(' ')).toMatch(/diagnostic/i)
      }
    }
  })

  it('detects low lesson quiz scores on non-ai-agents roadmaps using the bundle lesson map', () => {
    const cbBundle = BUNDLES['chatbot-dev']
    const cbLesson = cbBundle.LESSONS![0]
    const d = makeData({
      moduleStatus: { [cbLesson.moduleId]: 'completed' },
      modules: { [cbLesson.moduleId]: emptyModuleRecord('confident') },
      quiz: {
        [`lesson:${cbLesson.id}`]: { score: 1, total: 5, at: '2026-10-28T00:00:00.000Z' },
      },
    })
    const recs = getRecommendations(d, { bundle: cbBundle, limit: 3 })
    expect(recs[0].module.id).toBe(cbLesson.moduleId)
    expect(recs[0].kind).toBe('revise-foundation')
    expect(recs[0].practicalExercise).toBe(cbLesson.exercise.prompt)
  })
})
