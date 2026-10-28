import { describe, expect, it } from 'vitest'
import { BUNDLES } from '../content/roadmaps/registry'
import { DEFAULT_DATA, emptyModuleRecord, type ProgressData } from '../store/progress'
import {
  findUnfinishedYesterdayBlocks,
  generateDailyPlan,
  getOrCreateDailyPlan,
  moveDailyBlock,
} from './dailyPlan'

const makeData = (over: Partial<ProgressData> = {}): ProgressData => ({
  ...DEFAULT_DATA,
  ...over,
})

describe('dailyPlan (Feature 4)', () => {
  it('generates a 4-block study plan summing to the requested budget', () => {
    const plan = generateDailyPlan(makeData(), '2026-04-20', 90)
    expect(plan.date).toBe('2026-04-20')
    expect(plan.roadmap).toBe('ai-agents')
    expect(plan.blocks).toHaveLength(4)
    expect(plan.blocks.map((b) => b.kind)).toEqual(['revise', 'learn', 'practise', 'reflect'])
    const sum = plan.blocks.reduce((s, b) => s + b.minutes, 0)
    expect(sum).toBe(90)
  })

  it('reorders daily blocks cleanly with moveDailyBlock', () => {
    const plan = generateDailyPlan(makeData(), '2026-04-20', 60)
    const firstId = plan.blocks[0].id
    const secondId = plan.blocks[1].id
    const moved = moveDailyBlock(plan, firstId, 1)
    expect(moved.blocks[0].id).toBe(secondId)
    expect(moved.blocks[1].id).toBe(firstId)
  })

  it('surfaces unfinished non-skipped blocks from previous days for calm rollover', () => {
    const oldPlan = generateDailyPlan(makeData(), '2026-04-19', 60)
    oldPlan.blocks[0].done = true
    oldPlan.blocks[1].done = false
    oldPlan.blocks[2].skipped = true
    oldPlan.blocks[3].done = false

    const d = makeData({
      dailyPlans: { '2026-04-19': oldPlan },
    })
    const unfinished = findUnfinishedYesterdayBlocks(d, '2026-04-20')
    expect(unfinished?.fromDate).toBe('2026-04-19')
    expect(unfinished?.blocks).toHaveLength(2)
  })

  it('generates roadmap-scoped daily plans across all 4 roadmaps and prevents same-day cross-roadmap cache leaks', () => {
    for (const [slug, bundle] of Object.entries(BUNDLES)) {
      const modIds = new Set(bundle.MODULES.map((m) => m.id))
      const plan = generateDailyPlan(makeData(), '2026-04-20', 90, bundle)
      expect(plan.roadmap).toBe(slug)
      for (const block of plan.blocks) {
        expect(block.moduleId && modIds.has(block.moduleId)).toBe(true)
        expect(block.target?.slug).toBe(slug)
      }
    }

    // Cache an ai-agents plan under '2026-04-20' and verify switching to other roadmaps does not return it
    const aiPlan = generateDailyPlan(makeData(), '2026-04-20', 90, BUNDLES['ai-agents'])
    aiPlan.blocks[0].done = true
    const withAiCached = makeData({
      dailyPlans: { '2026-04-20': aiPlan },
    })

    // Calling getOrCreateDailyPlan for ai-agents returns the cached plan (with block[0].done === true)
    const resolvedAi = getOrCreateDailyPlan(withAiCached, '2026-04-20', 90, BUNDLES['ai-agents'])
    expect(resolvedAi.roadmap).toBe('ai-agents')
    expect(resolvedAi.blocks[0].done).toBe(true)

    // Calling getOrCreateDailyPlan for prompt-engineering, ai-programming, or chatbot-dev generates a plan for that roadmap
    for (const otherSlug of ['prompt-engineering', 'ai-programming', 'chatbot-dev'] as const) {
      const resolvedOther = getOrCreateDailyPlan(
        withAiCached,
        '2026-04-20',
        90,
        BUNDLES[otherSlug],
      )
      expect(resolvedOther.roadmap).toBe(otherSlug)
      expect(resolvedOther.blocks[0].target?.slug).toBe(otherSlug)
      expect(resolvedOther.blocks[0].done).toBe(false)
    }
  })

  it('uses lastActiveByRoadmap for the active bundle when all modules in that bundle are mastered', () => {
    const peBundle = BUNDLES['prompt-engineering']
    const masteredModules = Object.fromEntries(
      peBundle.MODULES.map((m) => [m.id, emptyModuleRecord('mastered')]),
    )
    const targetPeMod = peBundle.MODULES[2]
    const d = makeData({
      modules: masteredModules,
      lastActiveModuleId: 'p1-python-core', // belongs to ai-agents, should not be picked for PE
      lastActiveByRoadmap: { 'prompt-engineering': targetPeMod.id },
    })

    const plan = generateDailyPlan(d, '2026-04-20', 60, peBundle)
    expect(plan.blocks[1].moduleId).toBe(targetPeMod.id)
    expect(plan.blocks[1].target?.slug).toBe('prompt-engineering')
  })

  it('ai-programming: practise block schedules the next incomplete practice task with a taskId deep link', () => {
    const aipBundle = BUNDLES['ai-programming']
    const plan = generateDailyPlan(makeData(), '2026-04-20', 90, aipBundle)
    const practise = plan.blocks.find((b) => b.kind === 'practise')!
    // Fresh data: primary module is aip-toolchain, whose only open task is the 15m exercise
    expect(practise.title).toBe('Practice (~15m): Prove the one-command check bites')
    expect(practise.subtitle).toMatch(/^Done when: /)
    expect(practise.target?.taskId).toBe('aip-t-toolcheck')
    expect(practise.target?.slug).toBe('ai-programming')
  })

  it('ai-programming: falls back to the legacy practise block when the primary module’s tasks are all done', () => {
    const aipBundle = BUNDLES['ai-programming']
    const d = makeData({
      tasks: { 'aip-t-toolcheck': { done: true, at: '2026-04-19T10:00:00.000Z' } },
    })
    const plan = generateDailyPlan(d, '2026-04-20', 90, aipBundle)
    const practise = plan.blocks.find((b) => b.kind === 'practise')!
    expect(practise.title).toBe(`Hands-on exercise: ${aipBundle.MODULES[0].title}`)
    expect(practise.subtitle).toMatch(/^Practice target: /)
    expect(practise.target?.taskId).toBeUndefined()
  })

  it('ai-agents (no PRACTICE_TASKS): practise block keeps the exact legacy fallback', () => {
    const plan = generateDailyPlan(makeData(), '2026-04-20', 90)
    const practise = plan.blocks.find((b) => b.kind === 'practise')!
    expect(practise.title).toMatch(/^Hands-on exercise: /)
    expect(practise.subtitle).toMatch(/^Practice target: /)
    expect(practise.target?.taskId).toBeUndefined()
  })
})
