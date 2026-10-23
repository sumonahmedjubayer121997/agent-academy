import { describe, expect, it } from 'vitest'
import { addDays, dayStr, dueForecast, isDue, newCard, review, type SrsCard } from './srs'

const T0 = new Date('2026-10-23T10:00:00')

describe('srs scheduler', () => {
  it('new cards become due one day later', () => {
    const c = newCard(T0)
    expect(c.due).toBe('2026-10-24')
    expect(c.reps).toBe(0)
    expect(isDue(c, '2026-10-23')).toBe(false)
    expect(isDue(c, '2026-10-24')).toBe(true)
  })

  it('successful sequence grows 1d → 3d → interval×ease', () => {
    let c: SrsCard = { ...newCard(T0), due: '2026-10-23' } // due today
    c = review(c, true, T0) // rep 1
    expect(c.reps).toBe(1)
    expect(c.due).toBe('2026-10-24')
    c = review(c, true, addDays(T0, 1)) // rep 2
    expect(c.due).toBe(dayStr(addDays(T0, 1 + 3)))
    c = review(c, true, addDays(T0, 4)) // rep 3: interval = 3 × 2.55 ≈ 8
    expect(c.intervalDays).toBe(8)
    expect(c.due).toBe(dayStr(addDays(T0, 12)))
  })

  it('a lapse resets the interval, penalises ease, and counts', () => {
    let c: SrsCard = { ease: 2.5, intervalDays: 8, due: '2026-10-23', reps: 3, lapses: 0 }
    c = review(c, false, T0)
    expect(c.lapses).toBe(1)
    expect(c.intervalDays).toBe(1)
    expect(c.due).toBe('2026-10-24')
    expect(c.ease).toBe(2.3)
    expect(c.reps).toBe(0)
  })

  it('never lets ease drop below 1.3 or rise above 2.5', () => {
    let c: SrsCard = { ease: 1.35, intervalDays: 1, due: '2026-10-23', reps: 0, lapses: 0 }
    c = review(c, false, T0)
    expect(c.ease).toBe(1.3)
    let d: SrsCard = { ease: 2.48, intervalDays: 1, due: '2026-10-23', reps: 0, lapses: 0 }
    d = review(d, true, T0)
    expect(d.ease).toBe(2.5)
  })

  it('overdue cards stay due (reviewing late never skips)', () => {
    const c = newCard(addDays(T0, -5))
    expect(isDue(c, dayStr(T0))).toBe(true)
  })
})

describe('dueForecast', () => {
  it('buckets cards into the next 7 days', () => {
    const cards: Record<string, SrsCard> = {
      a: { ...newCard(T0) }, // due tomorrow
      b: { ...newCard(T0) }, // due tomorrow
      c: { ease: 2.5, intervalDays: 3, due: dayStr(addDays(T0, 3)), reps: 2, lapses: 0 },
      d: { ease: 2.5, intervalDays: 9, due: dayStr(addDays(T0, 9)), reps: 3, lapses: 0 }, // beyond window
    }
    const f = dueForecast(cards, dayStr(T0))
    expect(f).toEqual([0, 2, 0, 1, 0, 0, 0])
  })
})
