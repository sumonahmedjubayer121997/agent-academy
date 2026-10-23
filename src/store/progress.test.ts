import { describe, expect, it } from 'vitest'
import { isUnlocked, phaseStats, statusOf, streak, totals, todayStr } from './progress'
import type { ProgressData } from './progress'
import { MODULES } from '../content/modules'

const day = (offsetFromToday: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetFromToday)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

describe('streak', () => {
  it('counts consecutive days ending today', () => {
    expect(streak([day(0), day(-1), day(-2)])).toBe(3)
  })

  it('survives when today has no activity yet but yesterday does', () => {
    expect(streak([day(-1), day(-2)])).toBe(2)
  })

  it('breaks on a gap', () => {
    expect(streak([day(0), day(-1), day(-3), day(-4)])).toBe(2)
  })

  it('is zero with no recent activity', () => {
    expect(streak([day(-3)])).toBe(0)
    expect(streak([])).toBe(0)
  })

  it('ignores duplicate entries for the same day', () => {
    expect(streak([day(0), day(0), day(-1)])).toBe(2)
  })
})

describe('statusOf / isUnlocked', () => {
  const data: ProgressData = {
    moduleStatus: { 'p1-python-core': 'completed', 'p1-env-packages': 'in-progress' },
    activity: [],
    quiz: {},
    weeklyHours: 10,
    assessment: { done: false, applied: false, scores: {} },
  }

  it('defaults to not-started', () => {
    expect(statusOf(data, 'p1-sql')).toBe('not-started')
  })

  it('reads recorded statuses', () => {
    expect(statusOf(data, 'p1-python-core')).toBe('completed')
    expect(statusOf(data, 'p1-env-packages')).toBe('in-progress')
  })

  it('unlocks only when every prerequisite is completed', () => {
    const pyd = { ...data, moduleStatus: { ...data.moduleStatus } }
    const env = MODULES.find((m) => m.id === 'p1-env-packages')!
    expect(env.prereqs).toContain('p1-python-core')
    expect(isUnlocked(pyd, env)).toBe(true) // python-core completed
    const dataStack = MODULES.find((m) => m.id === 'p1-data-stack')! // prereq: python-core only
    expect(isUnlocked(pyd, dataStack)).toBe(true)
    const locked = MODULES.find((m) => m.id === 'p2-ml-core')! // prereqs incl. not-completed modules
    expect(isUnlocked(pyd, locked)).toBe(false)
  })
})

describe('totals / phaseStats', () => {
  it('computes zero-progress totals consistently with the curriculum data', () => {
    const fresh: ProgressData = {
      moduleStatus: {},
      activity: [],
      quiz: {},
      weeklyHours: 10,
      assessment: { done: false, applied: false, scores: {} },
    }
    const t = totals(fresh)
    expect(t.modulesTotal).toBe(MODULES.length)
    expect(t.hoursTotal).toBe(MODULES.reduce((s, m) => s + m.hours, 0))
    expect(t.essentialHoursTotal).toBe(MODULES.filter((m) => m.essential).reduce((s, m) => s + m.hours, 0))
    expect(t.hoursDone).toBe(0)
    expect(t.essentialRemaining).toBe(t.essentialHoursTotal)
  })

  it('credits only completed modules in done hours', () => {
    const py = MODULES.find((m) => m.id === 'p1-python-core')!
    const data: ProgressData = {
      moduleStatus: { 'p1-python-core': 'completed', 'p1-env-packages': 'in-progress' },
      activity: [],
      quiz: {},
      weeklyHours: 10,
      assessment: { done: false, applied: false, scores: {} },
    }
    expect(totals(data).hoursDone).toBe(py.hours)
    expect(totals(data).modulesDone).toBe(1)
  })

  it('covers every phase with matching module counts', () => {
    const stats = phaseStats({ moduleStatus: {}, activity: [], quiz: {}, weeklyHours: 10, assessment: { done: false, applied: false, scores: {} } })
    expect(stats).toHaveLength(8)
    expect(stats.reduce((s, p) => s + p.modules.length, 0)).toBe(MODULES.length)
    for (const s of stats) {
      expect(s.hours).toBe(s.modules.reduce((acc, m) => acc + m.hours, 0))
    }
  })
})

describe('todayStr', () => {
  it('formats the local date as yyyy-mm-dd', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(todayStr()).toBe(day(0))
  })
})
