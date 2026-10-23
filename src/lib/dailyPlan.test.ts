import { describe, expect, it } from 'vitest'
import { DEFAULT_DATA, type ProgressData } from '../store/progress'
import { findUnfinishedYesterdayBlocks, generateDailyPlan, moveDailyBlock } from './dailyPlan'

const makeData = (over: Partial<ProgressData> = {}): ProgressData => ({
  ...DEFAULT_DATA,
  ...over,
})

describe('dailyPlan (Feature 4)', () => {
  it('generates a 4-block study plan summing to the requested budget', () => {
    const plan = generateDailyPlan(makeData(), '2026-04-20', 90)
    expect(plan.date).toBe('2026-04-20')
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
})
