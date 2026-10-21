import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { MODULES } from '../content/modules'
import { PHASES } from '../content/phases'
import { DOMAIN_CREDIT, type Domain } from '../content/assessment'
import type { LearningModule, Phase } from '../content/types'

export type ModuleStatus = 'not-started' | 'in-progress' | 'completed'

export interface QuizResult {
  score: number
  total: number
  at: string
}

export interface ProgressData {
  moduleStatus: Record<string, ModuleStatus>
  activity: string[] // ISO dates (yyyy-mm-dd) on which the learner did something
  quiz: Record<string, QuizResult>
  weeklyHours: number
  assessment: { done: boolean; applied: boolean; scores: Partial<Record<Domain, number>> }
}

const KEY = 'aa-progress-v1'

const DEFAULT_DATA: ProgressData = {
  moduleStatus: {},
  activity: [],
  quiz: {},
  weeklyHours: 10,
  assessment: { done: false, applied: false, scores: {} },
}

function load(): ProgressData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_DATA
    return { ...DEFAULT_DATA, ...(JSON.parse(raw) as ProgressData) }
  } catch {
    return DEFAULT_DATA
  }
}

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ── Pure helpers (also used outside React) ─────────────────────────── */

export function statusOf(data: ProgressData, id: string): ModuleStatus {
  return data.moduleStatus[id] ?? 'not-started'
}

export function isUnlocked(data: ProgressData, m: LearningModule): boolean {
  return m.prereqs.every((p) => statusOf(data, p) === 'completed')
}

export interface PhaseStat {
  phase: Phase
  modules: LearningModule[]
  doneCount: number
  hours: number
  doneHours: number
  essentialHours: number
  doneEssentialHours: number
}

export function phaseStats(data: ProgressData): PhaseStat[] {
  return PHASES.map((phase) => {
    const modules = MODULES.filter((m) => m.phase === phase.n)
    const done = (m: LearningModule) => (statusOf(data, m.id) === 'completed' ? m.hours : 0)
    return {
      phase,
      modules,
      doneCount: modules.filter((m) => statusOf(data, m.id) === 'completed').length,
      hours: modules.reduce((s, m) => s + m.hours, 0),
      doneHours: modules.reduce((s, m) => s + done(m), 0),
      essentialHours: modules.filter((m) => m.essential).reduce((s, m) => s + m.hours, 0),
      doneEssentialHours: modules.filter((m) => m.essential).reduce((s, m) => s + done(m), 0),
    }
  })
}

export function totals(data: ProgressData) {
  const doneHours = MODULES.reduce((s, m) => s + (statusOf(data, m.id) === 'completed' ? m.hours : 0), 0)
  const essentialHours = MODULES.filter((m) => m.essential)
  const doneEssentialHours = essentialHours.reduce((s, m) => s + (statusOf(data, m.id) === 'completed' ? m.hours : 0), 0)
  return {
    modulesTotal: MODULES.length,
    modulesDone: MODULES.filter((m) => statusOf(data, m.id) === 'completed').length,
    hoursTotal: MODULES.reduce((s, m) => s + m.hours, 0),
    hoursDone: doneHours,
    essentialHoursTotal: essentialHours.reduce((s, m) => s + m.hours, 0),
    essentialHoursDone: doneEssentialHours,
    essentialRemaining: essentialHours.reduce((s, m) => s + m.hours, 0) - doneEssentialHours,
  }
}

export function streak(activity: string[]): number {
  const days = new Set(activity)
  const oneDay = 86_400_000
  let cursor = new Date()
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  // A streak survives if today has no activity yet but yesterday does.
  if (!days.has(fmt(cursor))) cursor = new Date(cursor.getTime() - oneDay)
  let n = 0
  while (days.has(fmt(cursor))) {
    n++
    cursor = new Date(cursor.getTime() - oneDay)
  }
  return n
}

export function nextUp(data: ProgressData, n = 3): LearningModule[] {
  return MODULES.filter(
    (m) => m.essential && statusOf(data, m.id) !== 'completed' && isUnlocked(data, m),
  ).slice(0, n)
}

export function currentPhase(data: ProgressData): PhaseStat {
  const stats = phaseStats(data)
  return stats.find((s) => s.doneEssentialHours < s.essentialHours) ?? stats[stats.length - 1]
}

/* ── Context ────────────────────────────────────────────────────────── */

interface ProgressContextValue {
  data: ProgressData
  setStatus: (id: string, status: ModuleStatus) => void
  cycleStatus: (id: string) => void
  recordQuiz: (id: string, score: number, total: number) => void
  setWeeklyHours: (h: number) => void
  logStudyDay: () => void
  recordAssessment: (scores: Partial<Record<Domain, number>>) => void
  applyAssessmentCredit: () => void
  resetAll: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProgressData>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      /* storage full or unavailable — the app still works in-session */
    }
  }, [data])

  const value = useMemo<ProgressContextValue>(() => {
    const touch = (d: ProgressData): ProgressData => {
      const t = todayStr()
      return d.activity.includes(t) ? d : { ...d, activity: [...d.activity, t] }
    }
    return {
      data,
      setStatus: (id, status) =>
        setData((d) => touch({ ...d, moduleStatus: { ...d.moduleStatus, [id]: status } })),
      cycleStatus: (id) =>
        setData((d) => {
          const cur = d.moduleStatus[id] ?? 'not-started'
          const next: ModuleStatus =
            cur === 'not-started' ? 'in-progress' : cur === 'in-progress' ? 'completed' : 'not-started'
          return touch({ ...d, moduleStatus: { ...d.moduleStatus, [id]: next } })
        }),
      recordQuiz: (id, score, total) =>
        setData((d) => touch({ ...d, quiz: { ...d.quiz, [id]: { score, total, at: new Date().toISOString() } } })),
      setWeeklyHours: (h) => setData((d) => ({ ...d, weeklyHours: h })),
      logStudyDay: () => setData((d) => touch(d)),
      recordAssessment: (scores) =>
        setData((d) => touch({ ...d, assessment: { ...d.assessment, done: true, scores } })),
      applyAssessmentCredit: () =>
        setData((d) => {
          const next = { ...d.moduleStatus }
          for (const domain of Object.keys(DOMAIN_CREDIT) as Domain[]) {
            const score = d.assessment.scores[domain]
            if (score === undefined) continue
            if (score === 3) DOMAIN_CREDIT[domain].full.forEach((id) => (next[id] = 'completed'))
            if (score === 2) DOMAIN_CREDIT[domain].partial.forEach((id) => (next[id] = 'in-progress'))
          }
          return touch({ ...d, moduleStatus: next, assessment: { ...d.assessment, applied: true } })
        }),
      resetAll: () => setData({ ...DEFAULT_DATA }),
    }
  }, [data])

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider')
  return ctx
}
