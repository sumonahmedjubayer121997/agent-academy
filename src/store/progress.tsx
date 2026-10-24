import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { MODULES } from '../content/roadmaps/ai-agents'
import { PHASES } from '../content/roadmaps/ai-agents'
import { DOMAIN_CREDIT, type Domain } from '../content/roadmaps/ai-agents'
import { cardsForModule } from '../content/roadmaps/ai-agents'
import type { SequenceMode } from '../content/roadmaps/ai-agents'
import type { LearningModule, Phase } from '../content/types'
import { isDue, newCard, review, reviewWithGrade, type RecallGrade, type SrsCard } from '../lib/srs'
import { addDays, dayStr } from '../lib/date'
import { saveIdbSnapshot } from '../lib/backupDb'

export type ModuleStatus = 'not-started' | 'in-progress' | 'completed'
export type MasteryStage = 'not-started' | 'learning' | 'practising' | 'confident' | 'mastered'
export type Confidence = 'sure' | 'shaky' | 'lost'

export const MASTERY_STAGES: {
  id: MasteryStage
  label: string
  short: string
  description: string
  weight: number
}[] = [
  {
    id: 'not-started',
    label: 'Not started',
    short: 'Not started',
    description: 'Not yet begun',
    weight: 0,
  },
  {
    id: 'learning',
    label: 'Learning',
    short: 'Learning',
    description: 'Studying concepts & reading material (exposure)',
    weight: 0.25,
  },
  {
    id: 'practising',
    label: 'Practising',
    short: 'Practising',
    description: 'Writing code & completing hands-on exercises',
    weight: 0.5,
  },
  {
    id: 'confident',
    label: 'Confident',
    short: 'Confident',
    description: 'Passed knowledge checks & met completion criteria',
    weight: 0.75,
  },
  {
    id: 'mastered',
    label: 'Mastered',
    short: 'Mastered',
    description: 'Proven in a practical project & can explain cold',
    weight: 1.0,
  },
]

export interface QuizResult {
  score: number
  total: number
  at: string
}

export interface FeynmanEntry {
  text: string
  at: string
}

export interface StudySession {
  moduleId: string | 'review'
  minutes: number
  at: string
  note?: string
}

export interface EvidenceLink {
  label: string
  url: string
}

export interface ModuleRecord {
  stage: MasteryStage
  startedAt?: string
  completedAt?: string
  objectivesDone: number[]
  completionDone: number[]
  notes: string
  questions: string[]
  evidenceUrls: EvidenceLink[]
  manualMinutes?: number
}

export interface CustomCard {
  id: string
  moduleId: string
  prompt: string
  answer: string
  createdAt: string
}

export type ProjectAutonomy =
  | 'planning'
  | 'tutorial-followed'
  | 'modified'
  | 'built-independently'
  | 'defensible'

export interface ProjectRecord {
  id: string
  moduleId: string
  autonomy: ProjectAutonomy
  milestonesDone: number[]
  repoUrl: string
  demoUrl: string
  architectureNotes: string
  problemsEncountered: string
  solutionsLearned: string
  evaluationEvidence: string
  retrospective: string
  interviewAnswers: Record<number, string>
  updatedAt: string
}

export interface JournalEntry {
  id: string
  date: string
  createdAt: string
  moduleIds: string[]
  learned: string
  built: string
  difficulties: string
  openQuestions: string
  nextSteps: string
  resolved?: boolean
}

export interface DailyTaskBlock {
  id: string
  kind: 'revise' | 'learn' | 'practise' | 'reflect'
  title: string
  subtitle?: string
  moduleId?: string
  route?: string
  minutes: number
  done: boolean
  skipped?: boolean
}

export interface DailyPlanRecord {
  date: string
  budgetMinutes: number
  blocks: DailyTaskBlock[]
}

export interface ProgressData {
  moduleStatus: Record<string, ModuleStatus>
  activity: string[] // ISO dates (yyyy-mm-dd) on which the learner did something
  quiz: Record<string, QuizResult>
  weeklyHours: number
  assessment: { done: boolean; applied: boolean; scores: Partial<Record<Domain, number>> }
  srs: Record<string, SrsCard>
  confidence: Record<string, Confidence>
  feynman: Record<string, FeynmanEntry[]>
  sessions: StudySession[]
  // v2 Personal Learning OS fields (optional in type for backward-compat with v1 test fixtures)
  schemaVersion?: number
  sequenceMode?: SequenceMode
  modules?: Record<string, ModuleRecord>
  customCards?: CustomCard[]
  projects?: Record<string, ProjectRecord>
  journal?: JournalEntry[]
  dailyPlans?: Record<string, DailyPlanRecord>
  lastActiveModuleId?: string
}

const KEY = 'aa-progress-v1'
export const BACKUP_KEY = 'aa-progress-backup-prev'

export const DEFAULT_DATA: ProgressData = {
  schemaVersion: 2,
  sequenceMode: 'agent-fast-track',
  moduleStatus: {},
  modules: {},
  activity: [],
  quiz: {},
  weeklyHours: 10,
  assessment: { done: false, applied: false, scores: {} },
  srs: {},
  customCards: [],
  confidence: {},
  feynman: {},
  sessions: [],
  projects: {},
  journal: [],
  dailyPlans: {},
}

export function emptyModuleRecord(stage: MasteryStage = 'not-started'): ModuleRecord {
  return {
    stage,
    objectivesDone: [],
    completionDone: [],
    notes: '',
    questions: [],
    evidenceUrls: [],
  }
}

export function emptyProjectRecord(id: string, moduleId: string): ProjectRecord {
  return {
    id,
    moduleId,
    autonomy: 'planning',
    milestonesDone: [],
    repoUrl: '',
    demoUrl: '',
    architectureNotes: '',
    problemsEncountered: '',
    solutionsLearned: '',
    evaluationEvidence: '',
    retrospective: '',
    interviewAnswers: {},
    updatedAt: new Date().toISOString(),
  }
}

export function stageToLegacyStatus(stage: MasteryStage): ModuleStatus {
  if (stage === 'confident' || stage === 'mastered') return 'completed'
  if (stage === 'learning' || stage === 'practising') return 'in-progress'
  return 'not-started'
}

export function legacyStatusToStage(status: ModuleStatus | undefined): MasteryStage {
  if (status === 'completed') return 'confident'
  if (status === 'in-progress') return 'learning'
  return 'not-started'
}

/** Validate and migrate raw JSON (from localStorage or imported file) into a safe ProgressData object. */
export function validateAndMigrateProgress(
  raw: unknown,
): { ok: true; data: ProgressData } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Invalid backup format: root must be a JSON object.' }
  }
  const obj = raw as Record<string, unknown>

  if (typeof obj.schemaVersion === 'number' && obj.schemaVersion > 2) {
    return {
      ok: false,
      error: `This export was written by a newer app version (schema ${obj.schemaVersion}); upgrade before importing.`,
    }
  }

  if (obj.moduleStatus !== undefined && (typeof obj.moduleStatus !== 'object' || Array.isArray(obj.moduleStatus))) {
    return { ok: false, error: 'Invalid backup format: moduleStatus must be an object.' }
  }
  if (obj.activity !== undefined && !Array.isArray(obj.activity)) {
    return { ok: false, error: 'Invalid backup format: activity must be an array of date strings.' }
  }
  if (obj.sessions !== undefined && !Array.isArray(obj.sessions)) {
    return { ok: false, error: 'Invalid backup format: sessions must be an array.' }
  }

  const moduleStatus: Record<string, ModuleStatus> = {}
  if (obj.moduleStatus && typeof obj.moduleStatus === 'object') {
    for (const [k, v] of Object.entries(obj.moduleStatus as Record<string, unknown>)) {
      if (v === 'not-started' || v === 'in-progress' || v === 'completed') {
        moduleStatus[k] = v
      }
    }
  }

  const modules: Record<string, ModuleRecord> = {}
  if (obj.modules && typeof obj.modules === 'object' && !Array.isArray(obj.modules)) {
    for (const [k, v] of Object.entries(obj.modules as Record<string, unknown>)) {
      if (v && typeof v === 'object') {
        const rec = v as Partial<ModuleRecord>
        const validStage: MasteryStage =
          rec.stage === 'learning' ||
          rec.stage === 'practising' ||
          rec.stage === 'confident' ||
          rec.stage === 'mastered'
            ? rec.stage
            : 'not-started'
        modules[k] = {
          stage: validStage,
          startedAt: typeof rec.startedAt === 'string' ? rec.startedAt : undefined,
          completedAt: typeof rec.completedAt === 'string' ? rec.completedAt : undefined,
          objectivesDone: Array.isArray(rec.objectivesDone)
            ? rec.objectivesDone.filter((n): n is number => typeof n === 'number')
            : [],
          completionDone: Array.isArray(rec.completionDone)
            ? rec.completionDone.filter((n): n is number => typeof n === 'number')
            : [],
          notes: typeof rec.notes === 'string' ? rec.notes : '',
          questions: Array.isArray(rec.questions)
            ? rec.questions.filter((s): s is string => typeof s === 'string')
            : [],
          evidenceUrls: Array.isArray(rec.evidenceUrls) ? rec.evidenceUrls : [],
          manualMinutes: typeof rec.manualMinutes === 'number' ? rec.manualMinutes : undefined,
        }
        moduleStatus[k] = stageToLegacyStatus(validStage)
      }
    }
  }

  // Migrate any v1 moduleStatus entries that don't yet have a v2 modules[id] record
  for (const [id, status] of Object.entries(moduleStatus)) {
    if (!modules[id] && status !== 'not-started') {
      modules[id] = emptyModuleRecord(legacyStatusToStage(status))
    }
  }

  const weeklyHours =
    typeof obj.weeklyHours === 'number' && obj.weeklyHours >= 1 && obj.weeklyHours <= 80
      ? obj.weeklyHours
      : DEFAULT_DATA.weeklyHours

  const sequenceMode: SequenceMode =
    obj.sequenceMode === 'phase-order' || obj.sequenceMode === 'ml-first' || obj.sequenceMode === 'agent-fast-track'
      ? obj.sequenceMode
      : 'agent-fast-track'

  const merged: ProgressData = {
    ...DEFAULT_DATA,
    schemaVersion: 2,
    sequenceMode,
    weeklyHours,
    moduleStatus,
    modules,
    activity: Array.isArray(obj.activity) ? obj.activity.filter((x): x is string => typeof x === 'string') : [],
    quiz: obj.quiz && typeof obj.quiz === 'object' && !Array.isArray(obj.quiz) ? (obj.quiz as Record<string, QuizResult>) : {},
    assessment:
      obj.assessment && typeof obj.assessment === 'object' && !Array.isArray(obj.assessment)
        ? {
            done: Boolean((obj.assessment as Record<string, unknown>).done),
            applied: Boolean((obj.assessment as Record<string, unknown>).applied),
            scores: ((obj.assessment as Record<string, unknown>).scores as Partial<Record<Domain, number>>) ?? {},
          }
        : DEFAULT_DATA.assessment,
    srs: obj.srs && typeof obj.srs === 'object' && !Array.isArray(obj.srs) ? (obj.srs as Record<string, SrsCard>) : {},
    customCards: Array.isArray(obj.customCards) ? (obj.customCards as CustomCard[]) : [],
    confidence:
      obj.confidence && typeof obj.confidence === 'object' && !Array.isArray(obj.confidence)
        ? (obj.confidence as Record<string, Confidence>)
        : {},
    feynman:
      obj.feynman && typeof obj.feynman === 'object' && !Array.isArray(obj.feynman)
        ? (obj.feynman as Record<string, FeynmanEntry[]>)
        : {},
    sessions: Array.isArray(obj.sessions) ? (obj.sessions as StudySession[]) : [],
    projects:
      obj.projects && typeof obj.projects === 'object' && !Array.isArray(obj.projects)
        ? (obj.projects as Record<string, ProjectRecord>)
        : {},
    journal: Array.isArray(obj.journal) ? (obj.journal as JournalEntry[]) : [],
    dailyPlans:
      obj.dailyPlans && typeof obj.dailyPlans === 'object' && !Array.isArray(obj.dailyPlans)
        ? (obj.dailyPlans as Record<string, DailyPlanRecord>)
        : {},
    lastActiveModuleId: typeof obj.lastActiveModuleId === 'string' ? obj.lastActiveModuleId : undefined,
  }

  return { ok: true, data: merged }
}

function load(): ProgressData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_DATA
    const parsed = JSON.parse(raw)
    const validated = validateAndMigrateProgress(parsed)
    return validated.ok ? validated.data : DEFAULT_DATA
  } catch {
    return DEFAULT_DATA
  }
}

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ── Pure helpers (also used outside React) ─────────────────────────── */

export function stageOf(data: ProgressData, id: string): MasteryStage {
  const rec = data.modules?.[id]
  if (rec?.stage) return rec.stage
  return legacyStatusToStage(data.moduleStatus[id])
}

export function moduleRecordOf(data: ProgressData, id: string): ModuleRecord {
  const existing = data.modules?.[id]
  if (existing) return existing
  return emptyModuleRecord(stageOf(data, id))
}

export function statusOf(data: ProgressData, id: string): ModuleStatus {
  const rec = data.modules?.[id]
  if (rec?.stage) return stageToLegacyStatus(rec.stage)
  return data.moduleStatus[id] ?? 'not-started'
}

export function isUnlocked(data: ProgressData, m: LearningModule): boolean {
  return m.prereqs.every((p) => statusOf(data, p) === 'completed')
}

export function moduleMinutesLogged(data: ProgressData, moduleId: string): number {
  const fromSessions = data.sessions
    .filter((s) => s.moduleId === moduleId)
    .reduce((sum, s) => sum + s.minutes, 0)
  const manual = data.modules?.[moduleId]?.manualMinutes ?? 0
  return fromSessions + manual
}

export interface PhaseStat {
  phase: Phase
  modules: LearningModule[]
  doneCount: number
  masteredCount: number
  inFlightCount: number
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
      masteredCount: modules.filter((m) => stageOf(data, m.id) === 'mastered').length,
      inFlightCount: modules.filter((m) => statusOf(data, m.id) === 'in-progress').length,
      hours: modules.reduce((s, m) => s + m.hours, 0),
      doneHours: modules.reduce((s, m) => s + done(m), 0),
      essentialHours: modules.filter((m) => m.essential).reduce((s, m) => s + m.hours, 0),
      doneEssentialHours: modules.filter((m) => m.essential).reduce((s, m) => s + done(m), 0),
    }
  })
}

export function totals(data: ProgressData) {
  const doneHours = MODULES.reduce((s, m) => s + (statusOf(data, m.id) === 'completed' ? m.hours : 0), 0)
  const essentialMods = MODULES.filter((m) => m.essential)
  const doneEssentialHours = essentialMods.reduce(
    (s, m) => s + (statusOf(data, m.id) === 'completed' ? m.hours : 0),
    0,
  )
  const stageCounts: Record<MasteryStage, number> = {
    'not-started': 0,
    learning: 0,
    practising: 0,
    confident: 0,
    mastered: 0,
  }
  for (const m of MODULES) {
    stageCounts[stageOf(data, m.id)]++
  }

  return {
    modulesTotal: MODULES.length,
    modulesDone: MODULES.filter((m) => statusOf(data, m.id) === 'completed').length,
    modulesMastered: stageCounts.mastered,
    modulesConfident: stageCounts.confident,
    modulesPractising: stageCounts.practising,
    modulesLearning: stageCounts.learning,
    stageCounts,
    hoursTotal: MODULES.reduce((s, m) => s + m.hours, 0),
    hoursDone: doneHours,
    essentialHoursTotal: essentialMods.reduce((s, m) => s + m.hours, 0),
    essentialHoursDone: doneEssentialHours,
    essentialRemaining: essentialMods.reduce((s, m) => s + m.hours, 0) - doneEssentialHours,
  }
}

export function streak(activity: string[], today: string = todayStr()): number {
  const days = new Set(activity)
  // Calendar-date arithmetic (Date setters) — immune to DST shifts.
  let [y, mo, d] = today.split('-').map(Number)
  let cursor = new Date(y, mo - 1, d, 12) // noon: safely inside the local day
  const has = (date: Date) => days.has(dayStr(date))
  // A streak survives if today has no activity yet but yesterday does.
  if (!has(cursor)) cursor = addDays(cursor, -1)
  let n = 0
  while (has(cursor)) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

export function nextUp(data: ProgressData, n = 3): LearningModule[] {
  return MODULES.filter(
    (m) => m.essential && statusOf(data, m.id) !== 'completed' && isUnlocked(data, m),
  ).slice(0, n)
}

export interface DueCard {
  cardId: string
  lessonId: string
  qIndex: number
  due: string
}

/** Cards due today (or overdue), oldest due first. Supports lesson:, module:, glossary:, edge:, assess:, and custom: cards. */
export function dueCards(data: ProgressData, today: string): DueCard[] {
  return Object.entries(data.srs)
    .filter(([, card]) => isDue(card, today))
    .map(([cardId, card]) => {
      if (cardId.startsWith('lesson:') && cardId.includes(':q')) {
        const lessonId = cardId.slice('lesson:'.length, cardId.lastIndexOf(':q'))
        const qIndex = Number(cardId.slice(cardId.lastIndexOf(':q') + 2))
        return { cardId, lessonId, qIndex, due: card.due }
      }
      return { cardId, lessonId: '', qIndex: 0, due: card.due }
    })
    .filter((c) => !c.cardId.startsWith('lesson:') || (Number.isFinite(c.qIndex) && c.lessonId.length > 0))
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0))
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
  setStage: (id: string, stage: MasteryStage) => void
  cycleStage: (id: string) => void
  updateModuleRecord: (id: string, patch: Partial<ModuleRecord>) => void
  toggleModuleObjective: (id: string, index: number) => void
  toggleModuleCompletion: (id: string, index: number) => void
  seedModuleCards: (moduleId: string, dueImmediate?: boolean) => number
  addCustomCard: (moduleId: string, prompt: string, answer: string) => void
  deleteCustomCard: (cardId: string) => void
  recordQuiz: (id: string, score: number, total: number, perQuestion?: boolean[]) => void
  setWeeklyHours: (h: number) => void
  setSequenceMode: (mode: SequenceMode) => void
  logStudyDay: () => void
  recordAssessment: (scores: Partial<Record<Domain, number>>) => void
  applyAssessmentCredit: () => void
  gradeCard: (cardId: string, gotIt: boolean | RecallGrade) => void
  setConfidence: (moduleId: string, level: Confidence) => void
  saveFeynman: (lessonId: string, text: string) => void
  logSession: (moduleId: string | 'review', minutes: number, note?: string) => void
  updateProject: (projectId: string, moduleId: string, patch: Partial<ProjectRecord>) => void
  toggleProjectMilestone: (projectId: string, moduleId: string, milestoneIndex: number) => void
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void
  updateJournalEntry: (id: string, patch: Partial<JournalEntry>) => void
  deleteJournalEntry: (id: string) => void
  saveDailyPlan: (plan: DailyPlanRecord) => void
  toggleDailyBlock: (date: string, blockId: string) => void
  importProgressJson: (jsonString: string) => { ok: true } | { ok: false; error: string }
  hasPreviousBackup: boolean
  restorePreviousBackup: () => boolean
  resetAll: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

function saveBackupToStorage(current: ProgressData) {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(current))
    void saveIdbSnapshot('backup', current)
  } catch {
    /* ignore */
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProgressData>(load)
  const [hasPreviousBackup, setHasPreviousBackup] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(BACKUP_KEY))
    } catch {
      return false
    }
  })

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

    const applyStageInternal = (d: ProgressData, id: string, stage: MasteryStage): ProgressData => {
      const prevRec = moduleRecordOf(d, id)
      const nowIso = new Date().toISOString()
      const nextRec: ModuleRecord = {
        ...prevRec,
        stage,
        startedAt: stage !== 'not-started' ? prevRec.startedAt ?? nowIso : prevRec.startedAt,
        completedAt:
          stage === 'confident' || stage === 'mastered' ? prevRec.completedAt ?? nowIso : undefined,
      }
      const nextLegacy = stageToLegacyStatus(stage)
      // Automatically seed module flashcards into SRS when a module enters practising/confident/mastered
      const nextSrs = { ...d.srs }
      if (stage === 'practising' || stage === 'confident' || stage === 'mastered') {
        const modCards = cardsForModule(id)
        const now = new Date()
        for (const c of modCards) {
          if (!nextSrs[c.cardId]) {
            nextSrs[c.cardId] = { ...newCard(now), due: todayStr() }
          }
        }
      }
      return touch({
        ...d,
        lastActiveModuleId: id,
        moduleStatus: { ...d.moduleStatus, [id]: nextLegacy },
        modules: { ...(d.modules ?? {}), [id]: nextRec },
        srs: nextSrs,
      })
    }

    return {
      data,
      setStatus: (id, status) =>
        setData((d) => applyStageInternal(d, id, legacyStatusToStage(status))),
      cycleStatus: (id) =>
        setData((d) => {
          const cur = statusOf(d, id)
          const next: ModuleStatus =
            cur === 'not-started' ? 'in-progress' : cur === 'in-progress' ? 'completed' : 'not-started'
          return applyStageInternal(d, id, legacyStatusToStage(next))
        }),
      setStage: (id, stage) => setData((d) => applyStageInternal(d, id, stage)),
      cycleStage: (id) =>
        setData((d) => {
          const order: MasteryStage[] = ['not-started', 'learning', 'practising', 'confident', 'mastered']
          const cur = stageOf(d, id)
          const next = order[(order.indexOf(cur) + 1) % order.length]
          return applyStageInternal(d, id, next)
        }),
      updateModuleRecord: (id, patch) =>
        setData((d) => {
          const prev = moduleRecordOf(d, id)
          const nextRec: ModuleRecord = { ...prev, ...patch }
          const nextLegacy = stageToLegacyStatus(nextRec.stage)
          return touch({
            ...d,
            lastActiveModuleId: id,
            moduleStatus: { ...d.moduleStatus, [id]: nextLegacy },
            modules: { ...(d.modules ?? {}), [id]: nextRec },
          })
        }),
      toggleModuleObjective: (id, index) =>
        setData((d) => {
          const prev = moduleRecordOf(d, id)
          const exists = prev.objectivesDone.includes(index)
          const objectivesDone = exists
            ? prev.objectivesDone.filter((i) => i !== index)
            : [...prev.objectivesDone, index].sort((a, b) => a - b)
          const nextStage: MasteryStage =
            prev.stage === 'not-started' && objectivesDone.length > 0 ? 'learning' : prev.stage
          const nextRec: ModuleRecord = {
            ...prev,
            stage: nextStage,
            startedAt: prev.startedAt ?? new Date().toISOString(),
            objectivesDone,
          }
          return touch({
            ...d,
            lastActiveModuleId: id,
            moduleStatus: { ...d.moduleStatus, [id]: stageToLegacyStatus(nextStage) },
            modules: { ...(d.modules ?? {}), [id]: nextRec },
          })
        }),
      toggleModuleCompletion: (id, index) =>
        setData((d) => {
          const prev = moduleRecordOf(d, id)
          const exists = prev.completionDone.includes(index)
          const completionDone = exists
            ? prev.completionDone.filter((i) => i !== index)
            : [...prev.completionDone, index].sort((a, b) => a - b)
          const nextStage: MasteryStage =
            prev.stage === 'not-started' || prev.stage === 'learning'
              ? completionDone.length > 0
                ? 'practising'
                : prev.stage
              : prev.stage
          const nextRec: ModuleRecord = {
            ...prev,
            stage: nextStage,
            startedAt: prev.startedAt ?? new Date().toISOString(),
            completionDone,
          }
          return touch({
            ...d,
            lastActiveModuleId: id,
            moduleStatus: { ...d.moduleStatus, [id]: stageToLegacyStatus(nextStage) },
            modules: { ...(d.modules ?? {}), [id]: nextRec },
          })
        }),
      seedModuleCards: (moduleId, dueImmediate = true) => {
        const modCards = cardsForModule(moduleId)
        setData((d) => {
          const nextSrs = { ...d.srs }
          const now = new Date()
          for (const c of modCards) {
            if (!nextSrs[c.cardId]) {
              nextSrs[c.cardId] = dueImmediate ? { ...newCard(now), due: todayStr() } : newCard(now)
            }
          }
          return touch({ ...d, srs: nextSrs })
        })
        return modCards.length
      },
      addCustomCard: (moduleId, prompt, answer) =>
        setData((d) => {
          const id = `custom:${moduleId}:${Date.now()}`
          const card: CustomCard = {
            id,
            moduleId,
            prompt: prompt.trim(),
            answer: answer.trim(),
            createdAt: new Date().toISOString(),
          }
          const now = new Date()
          return touch({
            ...d,
            customCards: [...(d.customCards ?? []), card],
            srs: { ...d.srs, [id]: { ...newCard(now), due: todayStr() } },
          })
        }),
      deleteCustomCard: (cardId) =>
        setData((d) => {
          const nextSrs = { ...d.srs }
          delete nextSrs[cardId]
          return {
            ...d,
            customCards: (d.customCards ?? []).filter((c) => c.id !== cardId),
            srs: nextSrs,
          }
        }),
      recordQuiz: (id, score, total, perQuestion) =>
        setData((d) => {
          const touched = touch({
            ...d,
            quiz: { ...d.quiz, [id]: { score, total, at: new Date().toISOString() } },
          })
          if (!id.startsWith('lesson:') || !perQuestion) return touched
          const now = new Date()
          const srs = { ...touched.srs }
          perQuestion.forEach((gotIt, i) => {
            const cardId = `${id}:q${i}`
            srs[cardId] = review(srs[cardId] ?? newCard(now), gotIt, now)
          })
          return { ...touched, srs }
        }),
      setWeeklyHours: (h) => setData((d) => ({ ...d, weeklyHours: h })),
      setSequenceMode: (mode) => setData((d) => ({ ...d, sequenceMode: mode })),
      logStudyDay: () => setData((d) => touch(d)),
      gradeCard: (cardId, gotItOrGrade) =>
        setData((d) => {
          const card = d.srs[cardId]
          if (!card) return d
          const now = new Date()
          const updated =
            typeof gotItOrGrade === 'boolean'
              ? review(card, gotItOrGrade, now)
              : reviewWithGrade(card, gotItOrGrade, now)
          return touch({ ...d, srs: { ...d.srs, [cardId]: updated } })
        }),
      setConfidence: (moduleId, level) =>
        setData((d) =>
          touch({
            ...d,
            lastActiveModuleId: moduleId,
            confidence: { ...d.confidence, [moduleId]: level },
          }),
        ),
      saveFeynman: (lessonId, text) =>
        setData((d) =>
          touch({
            ...d,
            feynman: {
              ...d.feynman,
              [lessonId]: [...(d.feynman[lessonId] ?? []), { text, at: new Date().toISOString() }],
            },
          }),
        ),
      logSession: (moduleId, minutes, note) =>
        setData((d) =>
          touch({
            ...d,
            lastActiveModuleId: moduleId !== 'review' ? moduleId : d.lastActiveModuleId,
            sessions: [
              ...d.sessions,
              { moduleId, minutes, at: new Date().toISOString(), ...(note ? { note } : {}) },
            ],
          }),
        ),
      updateProject: (projectId, moduleId, patch) =>
        setData((d) => {
          const prev = d.projects?.[projectId] ?? emptyProjectRecord(projectId, moduleId)
          const next: ProjectRecord = {
            ...prev,
            ...patch,
            updatedAt: new Date().toISOString(),
          }
          return touch({
            ...d,
            projects: { ...(d.projects ?? {}), [projectId]: next },
          })
        }),
      toggleProjectMilestone: (projectId, moduleId, milestoneIndex) =>
        setData((d) => {
          const prev = d.projects?.[projectId] ?? emptyProjectRecord(projectId, moduleId)
          const exists = prev.milestonesDone.includes(milestoneIndex)
          const milestonesDone = exists
            ? prev.milestonesDone.filter((i) => i !== milestoneIndex)
            : [...prev.milestonesDone, milestoneIndex].sort((a, b) => a - b)
          const next: ProjectRecord = {
            ...prev,
            milestonesDone,
            updatedAt: new Date().toISOString(),
          }
          return touch({
            ...d,
            projects: { ...(d.projects ?? {}), [projectId]: next },
          })
        }),
      addJournalEntry: (entry) =>
        setData((d) => {
          const newEntry: JournalEntry = {
            ...entry,
            id: `journal:${Date.now()}`,
            createdAt: new Date().toISOString(),
          }
          return touch({
            ...d,
            journal: [newEntry, ...(d.journal ?? [])],
          })
        }),
      updateJournalEntry: (id, patch) =>
        setData((d) => ({
          ...d,
          journal: (d.journal ?? []).map((j) => (j.id === id ? { ...j, ...patch } : j)),
        })),
      deleteJournalEntry: (id) =>
        setData((d) => ({
          ...d,
          journal: (d.journal ?? []).filter((j) => j.id !== id),
        })),
      saveDailyPlan: (plan) =>
        setData((d) => ({
          ...d,
          dailyPlans: { ...(d.dailyPlans ?? {}), [plan.date]: plan },
        })),
      toggleDailyBlock: (date, blockId) =>
        setData((d) => {
          const plan = d.dailyPlans?.[date]
          if (!plan) return d
          let loggedBlock: DailyTaskBlock | null = null
          const blocks = plan.blocks.map((b) => {
            if (b.id !== blockId) return b
            const nextDone = !b.done
            if (nextDone && !b.done) loggedBlock = b
            return { ...b, done: nextDone, skipped: false }
          })
          let nextState: ProgressData = {
            ...d,
            dailyPlans: { ...(d.dailyPlans ?? {}), [date]: { ...plan, blocks } },
          }
          if (loggedBlock) {
            const blk = loggedBlock as DailyTaskBlock
            nextState = touch({
              ...nextState,
              sessions: [
                ...nextState.sessions,
                {
                  moduleId: blk.moduleId ?? 'review',
                  minutes: blk.minutes,
                  at: new Date().toISOString(),
                  note: `Daily plan: ${blk.title}`,
                },
              ],
            })
          }
          return nextState
        }),
      recordAssessment: (scores) =>
        setData((d) => touch({ ...d, assessment: { ...d.assessment, done: true, scores } })),
      applyAssessmentCredit: () =>
        setData((d) => {
          let nextState = { ...d }
          for (const domain of Object.keys(DOMAIN_CREDIT) as Domain[]) {
            const score = d.assessment.scores[domain]
            if (score === undefined) continue
            if (score === 3) {
              DOMAIN_CREDIT[domain].full.forEach((id) => {
                nextState = applyStageInternal(nextState, id, 'confident')
              })
            }
            if (score === 2) {
              DOMAIN_CREDIT[domain].partial.forEach((id) => {
                nextState = applyStageInternal(nextState, id, 'learning')
              })
            }
          }
          return touch({ ...nextState, assessment: { ...d.assessment, applied: true } })
        }),
      importProgressJson: (jsonString) => {
        try {
          const parsed = JSON.parse(jsonString)
          const res = validateAndMigrateProgress(parsed)
          if (!res.ok) return res
          saveBackupToStorage(data)
          setHasPreviousBackup(true)
          setData(res.data)
          return { ok: true }
        } catch {
          return { ok: false, error: 'File is not valid JSON.' }
        }
      },
      hasPreviousBackup,
      restorePreviousBackup: () => {
        try {
          const raw = localStorage.getItem(BACKUP_KEY)
          if (!raw) return false
          const res = validateAndMigrateProgress(JSON.parse(raw))
          if (!res.ok) return false
          setData(res.data)
          return true
        } catch {
          return false
        }
      },
      resetAll: () => {
        saveBackupToStorage(data)
        setHasPreviousBackup(true)
        setData({ ...DEFAULT_DATA })
      },
    }
  }, [data, hasPreviousBackup])

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider')
  return ctx
}
