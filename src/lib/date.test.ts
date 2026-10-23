import { describe, expect, it } from 'vitest'
import { addDays, dayStr, daysBetween } from './date'
import { streak } from '../store/progress'

describe('date helpers', () => {
  it('crosses the UK spring DST boundary (2026-03-29) without losing a day', () => {
    const before = new Date(2026, 2, 28, 12, 0) // Sat 28 Mar, GMT
    expect(dayStr(addDays(before, 1))).toBe('2026-03-29') // clocks jump forward
    expect(dayStr(addDays(before, 2))).toBe('2026-03-30')
  })

  it('crosses the UK autumn DST boundary (2026-10-25) without repeating a day', () => {
    const before = new Date(2026, 9, 24, 12, 0)
    expect(dayStr(addDays(before, 1))).toBe('2026-10-25') // clocks fall back
    expect(dayStr(addDays(before, 2))).toBe('2026-10-26')
  })

  it('daysBetween is exact over a DST week', () => {
    expect(daysBetween('2026-03-26', '2026-04-02')).toBe(7)
    expect(daysBetween('2026-10-22', '2026-10-29')).toBe(7)
    expect(daysBetween('2026-10-29', '2026-10-22')).toBe(-7)
  })
})

describe('streak across DST', () => {
  it('counts a 7-day streak that spans the October clock change', () => {
    const activity = Array.from({ length: 7 }, (_, i) => dayStr(addDays(new Date(2026, 9, 29), -i)))
    expect(activity[0]).toBe('2026-10-29')
    expect(activity[6]).toBe('2026-10-23') // spans 2026-10-25 (BST→GMT)
    const s = streak(activity, '2026-10-29')
    expect(s).toBe(7)
  })

  it('breaks correctly on a missing day even around the boundary', () => {
    const activity = ['2026-10-26', '2026-10-24'] // gap on the 25th (clock-change day)
    expect(streak(activity, '2026-10-26')).toBe(1)
  })
})
