import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BUNDLES } from '../content/roadmaps/registry'
import { useActiveRoadmap } from './activeRoadmap'
import type { LearningModule, Phase } from '../content/types'
import { isDue, newCard, review, reviewWithGrade, type RecallGrade, type SrsCard } from '../lib/srs'
import { spreadBacklog as spreadBacklogFn } from '../lib/srsQueue'
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
  /** Roadmap this session belongs to ('review' sessions use the active roadmap). */
  roadmap?: string
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

/** Completion state of one practice task (PracticeTaskSpec.id keyed). v3-additive:
 * older { done, at? } records stay valid; every new field is optional. */
export type TaskAutonomy = 'assisted' | 'hinted' | 'independent' | 'verified'

export interface TaskRecord {
  done: boolean
  at?: string
  startedAt?: string
  /** Indices of the task's verification checklist that are ticked. */
  checksDone?: number[]
  /** Highest hint number opened before completion (0 = none). */
  hintsUsed?: number
  /** True when the reference solution was opened before completion. */
  solutionViewed?: boolean
  autonomy?: TaskAutonomy
  evidenceUrl?: string
  testOutputSummary?: string
}

export interface BrainDumpEntry {
  id: string
  date: string
  createdAt: string
  updatedAt: string
  slug?: string
  moduleId?: string
  lessonId?: string
  learned: string
  explained: string
  confusing: string
  next: string
  status: 'draft' | 'completed'
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
  /** New in v3: canonical link target; URLs are built at render time. */
  target?: { slug: string; moduleId: string; taskId?: string }
  /** Legacy v2 field, accepted on import and migrated to `target`. */
  route?: string
  minutes: number
  done: boolean
  skipped?: boolean
}

export interface DailyPlanRecord {
  date: string
  budgetMinutes: number
  blocks: DailyTaskBlock[]
  /** Roadmap slug this daily plan was generated for. */
  roadmap?: string
}

export interface ProgressData {
  moduleStatus: Record<string, ModuleStatus>
  activity: string[] // ISO dates (yyyy-mm-dd) on which the learner did something
  quiz: Record<string, QuizResult>
  weeklyHours: number
  srs: Record<string, SrsCard>
  confidence: Record<string, Confidence>
  feynman: Record<string, FeynmanEntry[]>
  sessions: StudySession[]
  // v2 Personal Learning OS fields (optional in type for backward-compat with older fixtures)
  schemaVersion?: number
  modules?: Record<string, ModuleRecord>
  customCards?: CustomCard[]
  projects?: Record<string, ProjectRecord>
  // Practice-task completion — v3-additive optional field, no schema bump:
  // absent means no tasks done; validated/sanitised on load like projects.
  tasks?: Record<string, TaskRecord>
  journal?: JournalEntry[]
  brainDumps?: BrainDumpEntry[]
  dailyPlans?: Record<string, DailyPlanRecord>
  lastActiveModuleId?: string
  // v3 multi-roadmap fields
  reviewSettings?: { maxReviewsPerDay?: number; newCardsPerDay?: Record<string, number> }
  assessments?: Record<string, { done: boolean; applied: boolean; scores: Record<string, number> }>
  sequenceModes?: Record<string, string>
  lastActiveByRoadmap?: Record<string, string>
  startedRoadmaps?: Record<string, string>
}

const KEY = 'aa-progress-v1'
export const BACKUP_KEY = 'aa-progress-backup-prev'

export const DEFAULT_DATA: ProgressData = {
  schemaVersion: 3,
  moduleStatus: {},
  modules: {},
  activity: [],
  quiz: {},
  weeklyHours: 10,
  srs: {},
  customCards: [],
  confidence: {},
  feynman: {},
  sessions: [],
  projects: {},
  journal: [],
  dailyPlans: {},
  assessments: {},
  sequenceModes: { 'ai-agents': 'agent-fast-track' },
  lastActiveByRoadmap: {},
  startedRoadmaps: {},
}

/** Which roadmap owns a module id — resolves via registered bundles, defaults to ai-agents. */
export function roadmapSlugOfModule(moduleId: string): string {
  for (const [slug, bundle] of Object.entries(BUNDLES)) {
    if (bundle.MODULES.some((m) => m.id === moduleId)) return slug
  }
  return 'ai-agents'
}

export function assessmentOf(
  data: ProgressData,
  slug: string,
): { done: boolean; applied: boolean; scores: Record<string, number> } {
  return data.assessments?.[slug] ?? { done: false, applied: false, scores: {} }
}

export function sequenceModeOf(data: ProgressData, slug: string): string {
  return data.sequenceModes?.[slug] ?? BUNDLES[slug]?.SEQUENCE_MODES?.[0]?.id ?? 'agent-fast-track'
}

export function dailyPlanRoadmapOf(plan: DailyPlanRecord): string {
  if (plan.roadmap && BUNDLES[plan.roadmap]) return plan.roadmap
  for (const b of plan.blocks) {
    if (b.target?.slug && BUNDLES[b.target.slug]) return b.target.slug
    if (b.moduleId) return roadmapSlugOfModule(b.moduleId)
  }
  return 'ai-agents'
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

  if (typeof obj.schemaVersion === 'number' && obj.schemaVersion > 3) {
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

  const sequenceModes: Record<string, string> = {}
  if (obj.sequenceModes && typeof obj.sequenceModes === 'object' && !Array.isArray(obj.sequenceModes)) {
    for (const [k, v] of Object.entries(obj.sequenceModes as Record<string, unknown>)) {
      if (typeof v === 'string' && v.length > 0) sequenceModes[k] = v
    }
  } else if (typeof obj.sequenceMode === 'string' && obj.sequenceMode.length > 0) {
    sequenceModes['ai-agents'] = obj.sequenceMode
  }
  if (!sequenceModes['ai-agents']) sequenceModes['ai-agents'] = 'agent-fast-track'

  const assessments: Record<string, { done: boolean; applied: boolean; scores: Record<string, number> }> = {}
  const readScores = (raw: unknown): Record<string, number> => {
    const out: Record<string, number> = {}
    if (raw && typeof raw === 'object') {
      for (const [dk, dv] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof dv === 'number') out[dk] = dv
      }
    }
    return out
  }
  if (obj.assessments && typeof obj.assessments === 'object' && !Array.isArray(obj.assessments)) {
    for (const [slug, v] of Object.entries(obj.assessments as Record<string, unknown>)) {
      if (v && typeof v === 'object') {
        const a = v as Record<string, unknown>
        assessments[slug] = { done: Boolean(a.done), applied: Boolean(a.applied), scores: readScores(a.scores) }
      }
    }
  } else if (obj.assessment && typeof obj.assessment === 'object' && !Array.isArray(obj.assessment)) {
    const a = obj.assessment as Record<string, unknown>
    assessments['ai-agents'] = { done: Boolean(a.done), applied: Boolean(a.applied), scores: readScores(a.scores) }
  }

  // daily plans: migrate legacy route strings to {slug, moduleId} targets
  const dailyPlans: Record<string, DailyPlanRecord> = {}
  if (obj.dailyPlans && typeof obj.dailyPlans === 'object' && !Array.isArray(obj.dailyPlans)) {
    for (const [dateKey, planRaw] of Object.entries(obj.dailyPlans as Record<string, unknown>)) {
      if (!planRaw || typeof planRaw !== 'object') continue
      const pl = planRaw as { date?: unknown; roadmap?: unknown; budgetMinutes?: unknown; blocks?: unknown }
      const blocksIn = Array.isArray(pl.blocks) ? (pl.blocks as Array<Record<string, unknown>>) : []
      const blocks: DailyTaskBlock[] = blocksIn.map((b) => {
        const rest = { ...b } as Partial<DailyTaskBlock>
        let tgt = rest.target
        if (!tgt && typeof rest.route === 'string') {
          const m = /^\/(?:roadmap|learn)\/([^/?]+)/.exec(rest.route)
          if (m) tgt = { slug: roadmapSlugOfModule(m[1]), moduleId: m[1] }
        }
        delete rest.route
        const block: DailyTaskBlock = {
          id: typeof b.id === 'string' ? b.id : `${dateKey}:${Math.random()}`,
          kind: (['revise', 'learn', 'practise', 'reflect'] as const).includes(b.kind as never)
            ? (b.kind as DailyTaskBlock['kind'])
            : 'learn',
          title: typeof b.title === 'string' ? b.title : '',
          minutes: typeof b.minutes === 'number' ? b.minutes : 0,
          done: Boolean(b.done),
          ...(typeof b.subtitle === 'string' ? { subtitle: b.subtitle } : {}),
          ...(typeof b.moduleId === 'string' ? { moduleId: b.moduleId } : {}),
          ...(tgt ? { target: tgt } : {}),
          ...(b.skipped !== undefined ? { skipped: Boolean(b.skipped) } : {}),
        }
        return block
      })
      dailyPlans[dateKey] = {
        date: typeof pl.date === 'string' ? pl.date : dateKey.split(':')[0],
        budgetMinutes: typeof pl.budgetMinutes === 'number' ? pl.budgetMinutes : 0,
        blocks,
        ...(typeof pl.roadmap === 'string' ? { roadmap: pl.roadmap } : {}),
      }
    }
  }

  // sessions: backfill roadmap attribution where derivable
  const sessionsRaw = Array.isArray(obj.sessions) ? (obj.sessions as Array<Record<string, unknown>>) : []
  const sessions: StudySession[] = sessionsRaw.map((s) => {
    const moduleId = (typeof s.moduleId === 'string' ? s.moduleId : 'review') as StudySession['moduleId']
    const roadmap =
      typeof s.roadmap === 'string'
        ? s.roadmap
        : moduleId !== 'review'
          ? roadmapSlugOfModule(moduleId)
          : undefined
    return {
      moduleId,
      minutes: typeof s.minutes === 'number' ? s.minutes : 0,
      at: typeof s.at === 'string' ? s.at : new Date().toISOString(),
      ...(typeof s.note === 'string' ? { note: s.note } : {}),
      ...(roadmap ? { roadmap } : {}),
    }
  })

  const lastActiveModuleId = typeof obj.lastActiveModuleId === 'string' ? obj.lastActiveModuleId : undefined
  const lastActiveByRoadmap: Record<string, string> =
    obj.lastActiveByRoadmap && typeof obj.lastActiveByRoadmap === 'object' && !Array.isArray(obj.lastActiveByRoadmap)
      ? { ...(obj.lastActiveByRoadmap as Record<string, string>) }
      : lastActiveModuleId
        ? { [roadmapSlugOfModule(lastActiveModuleId)]: lastActiveModuleId }
        : {}
  const startedRoadmaps: Record<string, string> =
    obj.startedRoadmaps && typeof obj.startedRoadmaps === 'object' && !Array.isArray(obj.startedRoadmaps)
      ? { ...(obj.startedRoadmaps as Record<string, string>) }
      : {}

  // practice tasks: sanitise entries — keep valid fields, drop malformed ones
  const TASK_AUTONOMIES = new Set(['assisted', 'hinted', 'independent', 'verified'])
  const tasks: Record<string, TaskRecord> = {}
  if (obj.tasks && typeof obj.tasks === 'object' && !Array.isArray(obj.tasks)) {
    for (const [k, v] of Object.entries(obj.tasks as Record<string, unknown>)) {
      if (v && typeof v === 'object') {
        const t = v as Record<string, unknown>
        tasks[k] = {
          done: Boolean(t.done),
          ...(typeof t.at === 'string' ? { at: t.at } : {}),
          ...(typeof t.startedAt === 'string' ? { startedAt: t.startedAt } : {}),
          ...(Array.isArray(t.checksDone)
            ? { checksDone: t.checksDone.filter((n): n is number => typeof n === 'number') }
            : {}),
          ...(typeof t.hintsUsed === 'number' ? { hintsUsed: t.hintsUsed } : {}),
          ...(typeof t.solutionViewed === 'boolean' ? { solutionViewed: t.solutionViewed } : {}),
          ...(typeof t.autonomy === 'string' && TASK_AUTONOMIES.has(t.autonomy)
            ? { autonomy: t.autonomy as TaskAutonomy }
            : {}),
          ...(typeof t.evidenceUrl === 'string' ? { evidenceUrl: t.evidenceUrl } : {}),
          ...(typeof t.testOutputSummary === 'string' ? { testOutputSummary: t.testOutputSummary } : {}),
        }
      }
    }
  }

  const merged: ProgressData = {
    ...DEFAULT_DATA,
    schemaVersion: 3,
    sequenceModes: { ...DEFAULT_DATA.sequenceModes, ...sequenceModes },
    assessments: { ...DEFAULT_DATA.assessments, ...assessments },
    startedRoadmaps,
    lastActiveByRoadmap,
    weeklyHours,
    moduleStatus,
    modules,
    activity: Array.isArray(obj.activity) ? obj.activity.filter((x): x is string => typeof x === 'string') : [],
    dailyPlans,
    quiz: obj.quiz && typeof obj.quiz === 'object' && !Array.isArray(obj.quiz) ? (obj.quiz as Record<string, QuizResult>) : {},
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
    sessions,
    projects:
      obj.projects && typeof obj.projects === 'object' && !Array.isArray(obj.projects)
        ? (obj.projects as Record<string, ProjectRecord>)
        : {},
    tasks,
    journal: Array.isArray(obj.journal) ? (obj.journal as JournalEntry[]) : [],
    brainDumps: Array.isArray(obj.brainDumps) ? (obj.brainDumps as BrainDumpEntry[]) : [],
    lastActiveModuleId: typeof obj.lastActiveModuleId === 'string' ? obj.lastActiveModuleId : undefined,
  }

  return { ok: true, data: merged }
}

/** Keep daily plans from the last 60 days only — localStorage quota headroom. */
function prunePlans(data: ProgressData): ProgressData {
  const plans = data.dailyPlans
  if (!plans || Object.keys(plans).length === 0) return data
  const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000
  const kept: Record<string, DailyPlanRecord> = {}
  for (const [k, v] of Object.entries(plans)) {
    const t = Date.parse(v?.date || k.split(':')[0])
    if (Number.isNaN(t) || t >= cutoff) kept[k] = v
  }
  return { ...data, dailyPlans: kept }
}

function load(): ProgressData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_DATA
    const parsed = JSON.parse(raw)
    const validated = validateAndMigrateProgress(parsed)
    return validated.ok ? prunePlans(validated.data) : DEFAULT_DATA
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

export function taskDoneOf(data: ProgressData, taskId: string): boolean {
  return Boolean(data.tasks?.[taskId]?.done)
}

export function taskRecordOf(data: ProgressData, taskId: string): TaskRecord {
  return data.tasks?.[taskId] ?? { done: false }
}

/** Honest-completion tier: solution beats hints beats cold work; all checks +
 * evidence upgrade independent work to verified. */
export function computeTaskAutonomy(
  rec: TaskRecord,
  totalChecks: number,
): TaskAutonomy | undefined {
  if (!rec.done) return undefined
  if (rec.solutionViewed) return 'assisted'
  if ((rec.hintsUsed ?? 0) > 0) return 'hinted'
  const allChecked = totalChecks > 0 && (rec.checksDone?.length ?? 0) >= totalChecks
  if (allChecked && (rec.evidenceUrl || rec.testOutputSummary)) return 'verified'
  return 'independent'
}

export interface ModuleTaskStats {
  total: number
  done: number
  verified: number
  nextTask: import('../content/types').PracticeTaskSpec | undefined
}

/** Practice-task census for one module over a bundle's optional task list. */
export function moduleTaskStats(
  data: ProgressData,
  tasks: import('../content/types').PracticeTaskSpec[] | undefined,
  moduleId: string,
): ModuleTaskStats {
  const mine = (tasks ?? []).filter((t) => t.moduleId === moduleId)
  let done = 0
  let verified = 0
  let nextTask: ModuleTaskStats['nextTask']
  for (const t of mine) {
    const rec = taskRecordOf(data, t.id)
    if (rec.done) done++
    else if (!nextTask) nextTask = t
    if (computeTaskAutonomy(rec, t.checks.length) === 'verified') verified++
  }
  return { total: mine.length, done, verified, nextTask }
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

export function phaseStats(
  data: ProgressData,
  allModules: LearningModule[] = BUNDLES['ai-agents'].MODULES,
  phases: Phase[] = BUNDLES['ai-agents'].PHASES,
): PhaseStat[] {
  return phases.map((phase) => {
    const modules = allModules.filter((m) => m.phase === phase.n)
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


export function totals(
  data: ProgressData,
  mods: LearningModule[] = BUNDLES['ai-agents'].MODULES,
) {
  const MODULE_LIST = mods
  const MODULES = MODULE_LIST
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

export function nextUp(
  data: ProgressData,
  n = 3,
  mods: LearningModule[] = BUNDLES['ai-agents'].MODULES,
): LearningModule[] {
  return mods.filter(
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

export function currentPhase(
  data: ProgressData,
  modules: LearningModule[] = BUNDLES['ai-agents'].MODULES,
  phases: Phase[] = BUNDLES['ai-agents'].PHASES,
): PhaseStat {
  const stats = phaseStats(data, modules, phases)
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
  setSequenceMode: (mode: string) => void
  logStudyDay: () => void
  recordAssessment: (scores: Record<string, number>) => void
  applyAssessmentCredit: () => void
  gradeCard: (cardId: string, gotIt: boolean | RecallGrade) => void
  setConfidence: (moduleId: string, level: Confidence) => void
  saveFeynman: (lessonId: string, text: string) => void
  logSession: (moduleId: string | 'review', minutes: number, note?: string) => void
  updateProject: (projectId: string, moduleId: string, patch: Partial<ProjectRecord>) => void
  toggleProjectMilestone: (projectId: string, moduleId: string, milestoneIndex: number) => void
  toggleTask: (taskId: string) => void
  toggleTaskCheck: (taskId: string, checkIndex: number) => void
  recordTaskHint: (taskId: string, hintNumber: number) => void
  recordTaskSolutionView: (taskId: string) => void
  setTaskEvidence: (taskId: string, evidenceUrl: string, testOutputSummary?: string) => void
  addEvidence: (moduleId: string, evidence: EvidenceLink) => void
  addBrainDump: (entry: Omit<BrainDumpEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateBrainDump: (id: string, patch: Partial<BrainDumpEntry>) => void
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void
  updateJournalEntry: (id: string, patch: Partial<JournalEntry>) => void
  deleteJournalEntry: (id: string) => void
  saveDailyPlan: (plan: DailyPlanRecord) => void
  toggleDailyBlock: (date: string, blockId: string) => void
  importProgressJson: (jsonString: string) => { ok: true } | { ok: false; error: string }
  hasPreviousBackup: boolean
  restorePreviousBackup: () => boolean
  markRoadmapStarted: (slug: string) => void
  updateReviewSettings: (patch: { maxReviewsPerDay?: number; newCardsPerDay?: Record<string, number> }) => void
  spreadReviewBacklog: () => number
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
  // The store is roadmap-blind: content-dependent operations use the ACTIVE roadmap bundle.
  const activeBundle = useActiveRoadmap()
  const activeSlug = activeBundle.META.slug
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

  // Multi-tab safety: rehydrate when another tab writes the same key.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return
      try {
        const res = validateAndMigrateProgress(JSON.parse(e.newValue))
        if (res.ok) setData(res.data)
      } catch {
        /* ignore malformed external writes */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<ProgressContextValue>(() => {
    const touch = (d: ProgressData): ProgressData => {
      const t = todayStr()
      return d.activity.includes(t) ? d : { ...d, activity: [...d.activity, t] }
    }

    const withLastActive = (d: ProgressData, id: string): ProgressData => ({
      ...d,
      lastActiveModuleId: id,
      lastActiveByRoadmap: { ...(d.lastActiveByRoadmap ?? {}), [roadmapSlugOfModule(id)]: id },
    })

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
        const modCards = activeBundle.cardsForModule(id)
        const now = new Date()
        for (const c of modCards) {
          if (!nextSrs[c.cardId]) {
            nextSrs[c.cardId] = { ...newCard(now), due: todayStr() }
          }
        }
      }
      return touch({
        ...withLastActive(d, id),
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
            ...withLastActive(d, id),
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
            ...withLastActive(d, id),
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
            ...withLastActive(d, id),
            moduleStatus: { ...d.moduleStatus, [id]: stageToLegacyStatus(nextStage) },
            modules: { ...(d.modules ?? {}), [id]: nextRec },
          })
        }),
      seedModuleCards: (moduleId, dueImmediate = true) => {
        // Cross-roadmap equivalents: if an equivalent module is Confident+, this
        // roadmap's deck seeds without a same-day flood (the learner has seen the ideas).
        const equivalents = (activeBundle as unknown as { EQUIVALENTS?: Record<string, string[]> }).EQUIVALENTS
        const eqIds = equivalents?.[moduleId] ?? []
        const eqConfident = eqIds.some((eid) => {
          const st = stageOf(data, eid)
          return st === 'confident' || st === 'mastered'
        })
        const modCards = activeBundle.cardsForModule(moduleId)
        if (eqConfident) dueImmediate = false
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
      setSequenceMode: (mode) =>
        setData((d) => ({
          ...d,
          sequenceModes: { ...(d.sequenceModes ?? {}), [activeSlug]: mode },
        })),
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
            ...withLastActive(d, moduleId),
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
            ...(moduleId !== 'review' ? withLastActive(d, moduleId) : d),
            sessions: [
              ...d.sessions,
              {
                moduleId,
                minutes,
                at: new Date().toISOString(),
                roadmap: moduleId === 'review' ? activeSlug : roadmapSlugOfModule(moduleId),
                ...(note ? { note } : {}) },
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
      toggleTask: (taskId) =>
        setData((d) => {
          const prev = d.tasks?.[taskId]
          const next: TaskRecord = prev?.done
            ? { done: false }
            : { done: true, at: new Date().toISOString() }
          return touch({ ...d, tasks: { ...(d.tasks ?? {}), [taskId]: next } })
        }),
      toggleTaskCheck: (taskId, checkIndex) =>
        setData((d) => {
          const prev = taskRecordOf(d, taskId)
          const has = prev.checksDone?.includes(checkIndex)
          const checksDone = has
            ? prev.checksDone!.filter((i) => i !== checkIndex)
            : [...(prev.checksDone ?? []), checkIndex].sort((a, b) => a - b)
          return touch({
            ...d,
            tasks: {
              ...(d.tasks ?? {}),
              [taskId]: {
                ...prev,
                checksDone,
                startedAt: prev.startedAt ?? new Date().toISOString(),
              },
            },
          })
        }),
      recordTaskHint: (taskId, hintNumber) =>
        setData((d) => {
          const prev = taskRecordOf(d, taskId)
          if (prev.done) return d
          return touch({
            ...d,
            tasks: {
              ...(d.tasks ?? {}),
              [taskId]: {
                ...prev,
                hintsUsed: Math.max(prev.hintsUsed ?? 0, hintNumber),
                startedAt: prev.startedAt ?? new Date().toISOString(),
              },
            },
          })
        }),
      recordTaskSolutionView: (taskId) =>
        setData((d) => {
          const prev = taskRecordOf(d, taskId)
          if (prev.done || prev.solutionViewed) return d
          return touch({
            ...d,
            tasks: {
              ...(d.tasks ?? {}),
              [taskId]: {
                ...prev,
                solutionViewed: true,
                startedAt: prev.startedAt ?? new Date().toISOString(),
              },
            },
          })
        }),
      setTaskEvidence: (taskId, evidenceUrl, testOutputSummary) =>
        setData((d) => {
          const prev = taskRecordOf(d, taskId)
          return touch({
            ...d,
            tasks: {
              ...(d.tasks ?? {}),
              [taskId]: {
                ...prev,
                evidenceUrl,
                ...(testOutputSummary ? { testOutputSummary } : {}),
              },
            },
          })
        }),
      addEvidence: (moduleId, evidence) =>
        setData((d) => {
          const prev = moduleRecordOf(d, moduleId)
          if (prev.evidenceUrls.some((e) => e.url === evidence.url)) return d
          return touch({
            ...withLastActive(d, moduleId),
            modules: {
              ...(d.modules ?? {}),
              [moduleId]: { ...prev, evidenceUrls: [...prev.evidenceUrls, evidence] },
            },
          })
        }),
      addBrainDump: (entry) =>
        setData((d) => {
          const e: BrainDumpEntry = {
            ...entry,
            id: `braindump:${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          return { ...d, brainDumps: [e, ...(d.brainDumps ?? [])] }
        }),
      updateBrainDump: (id, patch) =>
        setData((d) => ({
          ...d,
          brainDumps: (d.brainDumps ?? []).map((b) =>
            b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b,
          ),
        })),
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
        setData((d) => {
          const slug = dailyPlanRoadmapOf(plan)
          const withRoadmap: DailyPlanRecord = { ...plan, roadmap: slug }
          const nextPlans: Record<string, DailyPlanRecord> = {
            ...(d.dailyPlans ?? {}),
            [`${plan.date}:${slug}`]: withRoadmap,
          }
          const existingDatePlan = d.dailyPlans?.[plan.date]
          if (!existingDatePlan || dailyPlanRoadmapOf(existingDatePlan) === slug) {
            nextPlans[plan.date] = withRoadmap
          }
          return {
            ...d,
            dailyPlans: nextPlans,
          }
        }),
      toggleDailyBlock: (date, blockId) =>
        setData((d) => {
          const scopedKey = `${date}:${activeSlug}`
          const plan =
            d.dailyPlans?.[scopedKey] ??
            (d.dailyPlans?.[date] && dailyPlanRoadmapOf(d.dailyPlans[date]) === activeSlug
              ? d.dailyPlans[date]
              : undefined)
          if (!plan) return d
          let loggedBlock: DailyTaskBlock | null = null
          const blocks = plan.blocks.map((b) => {
            if (b.id !== blockId) return b
            const nextDone = !b.done
            if (nextDone && !b.done) loggedBlock = b
            return { ...b, done: nextDone, skipped: false }
          })
          const updatedPlan: DailyPlanRecord = { ...plan, roadmap: activeSlug, blocks }
          const nextPlans: Record<string, DailyPlanRecord> = {
            ...(d.dailyPlans ?? {}),
            [scopedKey]: updatedPlan,
          }
          const existingDatePlan = d.dailyPlans?.[date]
          if (!existingDatePlan || dailyPlanRoadmapOf(existingDatePlan) === activeSlug) {
            nextPlans[date] = updatedPlan
          }
          let nextState: ProgressData = {
            ...d,
            dailyPlans: nextPlans,
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
                  roadmap: blk.moduleId ? roadmapSlugOfModule(blk.moduleId) : activeSlug,
                },
              ],
            })
          }
          return nextState
        }),
      recordAssessment: (scores) =>
        setData((d) =>
          touch({
            ...d,
            assessments: {
              ...(d.assessments ?? {}),
              [activeSlug]: {
                ...(d.assessments?.[activeSlug] ?? { done: false, applied: false, scores: {} }),
                done: true,
                scores,
              },
            },
          }),
        ),
      applyAssessmentCredit: () =>
        setData((d) => {
          const stored = d.assessments?.[activeSlug]
          if (!stored) return d
          const credit = activeBundle.DOMAIN_CREDIT
          let nextState = { ...d }
          for (const domain of Object.keys(credit)) {
            const score = stored.scores[domain]
            if (score === undefined) continue
            if (score === 3) {
              credit[domain].full.forEach((id) => {
                nextState = applyStageInternal(nextState, id, 'confident')
              })
            }
            if (score === 2) {
              credit[domain].partial.forEach((id) => {
                nextState = applyStageInternal(nextState, id, 'learning')
              })
            }
          }
          return touch({
            ...nextState,
            assessments: {
              ...(d.assessments ?? {}),
              [activeSlug]: { ...stored, applied: true },
            },
          })
        }),
      updateReviewSettings: (patch) =>
        setData((d) => ({
          ...d,
          reviewSettings: {
            ...d.reviewSettings,
            ...patch,
            newCardsPerDay: { ...(d.reviewSettings?.newCardsPerDay ?? {}), ...(patch.newCardsPerDay ?? {}) },
          },
        })),
      spreadReviewBacklog: () => {
        const { next, spread } = spreadBacklogFn(data.srs, todayStr(), (t, n) =>
          dayStr(addDays(new Date(Date.parse(t)), n)),
        )
        if (spread > 0) setData((d) => touch({ ...d, srs: next }))
        return spread
      },
      markRoadmapStarted: (slug) =>
        setData((d) =>
          d.startedRoadmaps?.[slug]
            ? d
            : { ...d, startedRoadmaps: { ...(d.startedRoadmaps ?? {}), [slug]: new Date().toISOString() } },
        ),
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
