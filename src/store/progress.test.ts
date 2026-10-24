import { describe, expect, it } from 'vitest'
import {
  emptyModuleRecord,
  isUnlocked,
  legacyStatusToStage,
  phaseStats,
  stageOf,
  stageToLegacyStatus,
  statusOf,
  streak,
  totals,
  todayStr,
  validateAndMigrateProgress,
} from './progress'
import type { ProgressData } from './progress'
import { MODULES } from '../content/roadmaps/ai-agents'
import { answerPersonalAssistantQuery } from '../lib/localSearch'

const base = (over: Partial<ProgressData> = {}): ProgressData => ({
  moduleStatus: {},
  activity: [],
  quiz: {},
  weeklyHours: 10,
  assessments: { 'ai-agents': { done: false, applied: false, scores: {} } },
  srs: {},
  confidence: {},
  feynman: {},
  sessions: [],
  ...over,
})

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
  const data = base({ moduleStatus: { 'p1-python-core': 'completed', 'p1-env-packages': 'in-progress' } })

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
    const fresh = base()
    const t = totals(fresh)
    expect(t.modulesTotal).toBe(MODULES.length)
    expect(t.hoursTotal).toBe(MODULES.reduce((s, m) => s + m.hours, 0))
    expect(t.essentialHoursTotal).toBe(MODULES.filter((m) => m.essential).reduce((s, m) => s + m.hours, 0))
    expect(t.hoursDone).toBe(0)
    expect(t.essentialRemaining).toBe(t.essentialHoursTotal)
  })

  it('credits only completed modules in done hours', () => {
    const py = MODULES.find((m) => m.id === 'p1-python-core')!
    const data = base({ moduleStatus: { 'p1-python-core': 'completed', 'p1-env-packages': 'in-progress' } })
    expect(totals(data).hoursDone).toBe(py.hours)
    expect(totals(data).modulesDone).toBe(1)
  })

  it('covers every phase with matching module counts', () => {
    const stats = phaseStats(base())
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

describe('v2 5-stage mastery lifecycle & schema validation', () => {
  it('maps between 5-stage lifecycle and legacy 3-state status consistently', () => {
    expect(stageToLegacyStatus('not-started')).toBe('not-started')
    expect(stageToLegacyStatus('learning')).toBe('in-progress')
    expect(stageToLegacyStatus('practising')).toBe('in-progress')
    expect(stageToLegacyStatus('confident')).toBe('completed')
    expect(stageToLegacyStatus('mastered')).toBe('completed')

    expect(legacyStatusToStage('not-started')).toBe('not-started')
    expect(legacyStatusToStage('in-progress')).toBe('learning')
    expect(legacyStatusToStage('completed')).toBe('confident')
  })

  it('prefers explicit v2 module stage over legacy status in stageOf()', () => {
    const d = base({
      moduleStatus: { 'p1-python-core': 'completed' },
      modules: { 'p1-python-core': { ...emptyModuleRecord('mastered') } },
    })
    expect(stageOf(d, 'p1-python-core')).toBe('mastered')
    expect(statusOf(d, 'p1-python-core')).toBe('completed')
  })

  it('validates and migrates v1/v2 JSON backups while rejecting malformed payloads', () => {
    expect(validateAndMigrateProgress(null).ok).toBe(false)
    expect(validateAndMigrateProgress([]).ok).toBe(false)
    expect(validateAndMigrateProgress({ activity: 'not-an-array' }).ok).toBe(false)

    const valid = validateAndMigrateProgress({
      moduleStatus: { 'p1-python-core': 'completed' },
      weeklyHours: 14,
      activity: ['2026-04-01'],
    })
    expect(valid.ok).toBe(true)
    if (valid.ok) {
      expect(valid.data.weeklyHours).toBe(14)
      expect(valid.data.moduleStatus['p1-python-core']).toBe('completed')
    }
  })

  it('strictly separates savedFacts from recommendations in personal assistant answers', () => {
    const d = base({
      moduleStatus: { 'p1-python-core': 'completed', 'p4-llm-apis': 'in-progress' },
      confidence: { 'p4-llm-apis': 'shaky' },
    })
    const resp = answerPersonalAssistantQuery('What am I struggling with and what should I learn next?', d)
    expect(resp.savedFacts.length).toBeGreaterThan(0)
    expect(resp.recommendations.length).toBeGreaterThan(0)
    expect(resp.savedFacts.some((f) => f.includes('LLM APIs') || f.includes('Mastered / Confident'))).toBe(true)
  })
})
