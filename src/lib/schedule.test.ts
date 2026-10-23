import { describe, expect, it } from 'vitest'
import { buildSchedule } from './schedule'
import type { LearningModule } from '../content/types'

const mod = (id: string, hours: number, prereqs: string[] = [], essential = true): LearningModule => ({
  id,
  phase: 1,
  title: id,
  why: '',
  objectives: [],
  prereqs,
  hours,
  difficulty: 'core',
  essential,
  completion: [],
  deliverable: '',
})

describe('buildSchedule', () => {
  it('packs modules into weeks up to the weekly budget', () => {
    const mods = [mod('a', 4), mod('b', 4), mod('c', 4)]
    const weeks = buildSchedule(mods, new Set(), 8)
    expect(weeks).toHaveLength(2)
    expect(weeks[0].items.map((m) => m.id)).toEqual(['a', 'b'])
    expect(weeks[0].hours).toBe(8)
    expect(weeks[1].items.map((m) => m.id)).toEqual(['c'])
    expect(weeks[1].hours).toBe(4)
  })

  it('skips completed modules entirely', () => {
    const mods = [mod('a', 4), mod('b', 4)]
    const weeks = buildSchedule(mods, new Set(['a']), 8)
    expect(weeks).toHaveLength(1)
    expect(weeks[0].items.map((m) => m.id)).toEqual(['b'])
  })

  it('skips optional modules', () => {
    const mods = [mod('a', 4), mod('opt', 4, [], false)]
    const weeks = buildSchedule(mods, new Set(), 8)
    expect(weeks[0].items.map((m) => m.id)).toEqual(['a'])
  })

  it('never schedules a module before its prerequisite (modules arrive in dependency order)', () => {
    const ordered = [mod('x', 6), mod('y', 6, ['x'])]
    const w = buildSchedule(ordered, new Set(), 6)
    expect(w[0].items.map((m) => m.id)).toEqual(['x'])
    expect(w[1].items.map((m) => m.id)).toEqual(['y'])
  })

  it('allows a module that overshoots the remaining budget by up to 2h', () => {
    const mods = [mod('a', 5), mod('b', 5)]
    const weeks = buildSchedule(mods, new Set(), 8)
    // After a (5h), 3h remain; b (5h) fits because 5 ≤ 3+2 — one 10h week.
    expect(weeks[0].items.map((m) => m.id)).toEqual(['a', 'b'])
    expect(weeks[0].hours).toBe(10)
    // A 7h module alone in an 8h week reports its true 7h:
    const weeks2 = buildSchedule([mod('big', 7)], new Set(), 8)
    expect(weeks2[0].hours).toBe(7)
  })

  it('gives an oversized module a week of its own instead of stalling', () => {
    const mods = [mod('huge', 30), mod('small', 2, ['huge'])]
    const weeks = buildSchedule(mods, new Set(), 10)
    expect(weeks[0].items.map((m) => m.id)).toEqual(['huge'])
    expect(weeks[0].hours).toBe(30)
    expect(weeks[1].items.map((m) => m.id)).toEqual(['small'])
  })

  it('respects prerequisites completed virtually in earlier weeks', () => {
    const mods = [mod('a', 5), mod('b', 5, ['a'])]
    const weeks = buildSchedule(mods, new Set(), 10)
    expect(weeks[0].items.map((m) => m.id)).toEqual(['a', 'b'])
  })

  it('returns nothing when everything is complete', () => {
    const mods = [mod('a', 4)]
    expect(buildSchedule(mods, new Set(['a']), 8)).toEqual([])
  })
})
