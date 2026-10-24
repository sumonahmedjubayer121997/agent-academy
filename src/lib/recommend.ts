import { sequenceModeOf } from '../store/progress'
import { BUNDLES } from '../content/roadmaps/registry'
import type { RoadmapBundle } from '../content/roadmaps/registry'
import { assessmentOf } from '../store/progress'
import type { SequenceMode, TrackId } from '../content/roadmaps/ai-agents'
import type { LearningModule, TrackSpecCommon } from '../content/types'
import {
  isUnlocked,
  moduleMinutesLogged,
  moduleRecordOf,
  stageOf,
  statusOf,
  type MasteryStage,
  type ProgressData,
} from '../store/progress'

export type RecommendationKind =
  | 'revise-foundation'
  | 'finish-active'
  | 'unblock-project'
  | 'start-next'
  | 'Optional-deepening'

export interface PrereqStatus {
  id: string
  title: string
  stage: MasteryStage
  met: boolean
}

export interface TopicRecommendation {
  module: LearningModule
  kind: RecommendationKind
  headline: string
  reasons: string[]
  prerequisites: PrereqStatus[]
  estimatedTime: {
    moduleHours: number
    loggedHours: number
    remainingHours: number
    todaySuggestedMinutes: number
  }
  expectedOutcome: string
  practicalExercise: string
  masteryProof: string
  track: TrackSpecCommon
  unlocksCount: number
  score: number
}

export interface RecommendationOptions {
  /** Content bundle to reason over — defaults to AI Agents; pages pass the active roadmap. */
  bundle?: RoadmapBundle
  dailyMinutes?: number
  filterTrack?: TrackId | 'all'
  limit?: number
}

const modById = new Map(BUNDLES['ai-agents'].MODULES.map((m) => [m.id, m]))
const lessonByModId = new Map((BUNDLES['ai-agents'].LESSONS ?? []).map((l) => [l.moduleId, l]))

/**
 * Transparent, rule-based recommendation engine.
 * Evaluates prerequisite readiness, shaky foundations, WIP momentum, project coupling,
 * downstream bottleneck unlocks, career track sequence mode, and study time budget.
 */
export function getRecommendations(
  data: ProgressData,
  options: RecommendationOptions = {},
): TopicRecommendation[] {
  const {
    MODULES, LESSONS, PROJECTS, downstreamUnlockCount, trackForModule, trackSpecFor, waveForModule,
  } = options.bundle ?? BUNDLES['ai-agents']
  const dailyMinutes = options.dailyMinutes ?? Math.max(30, Math.round((data.weeklyHours * 60) / 5))
  const filterTrack = options.filterTrack ?? 'all'
  const limit = options.limit ?? 3
  const mode: string = sequenceModeOf(data, 'ai-agents')

  // Identify active projects (started milestones or non-planning autonomy)
  const activeProjectModuleIds = new Set<string>()
  for (const p of PROJECTS) {
    const rec = data.projects?.[p.id]
    if (rec && (rec.autonomy !== 'planning' || rec.milestonesDone.length > 0)) {
      activeProjectModuleIds.add(p.moduleId)
      const projMod = modById.get(p.moduleId)
      projMod?.prereqs.forEach((preId) => activeProjectModuleIds.add(preId))
    }
  }

  // Count currently active (learning / practising) modules for WIP awareness
  const inFlightIds = new Set(
    MODULES.filter((m) => {
      const st = stageOf(data, m.id)
      return st === 'learning' || st === 'practising'
    }).map((m) => m.id),
  )

  const candidates: TopicRecommendation[] = []

  for (const m of MODULES) {
    const trackId = trackForModule(m.id)
    if (filterTrack !== 'all' && trackId !== filterTrack) continue

    const stage = stageOf(data, m.id)
    const confidence = data.confidence[m.id]
    const lesson = lessonByModId.get(m.id)
    const quizResult = lesson ? data.quiz[`lesson:${lesson.id}`] : undefined
    const quizPct = quizResult ? quizResult.score / quizResult.total : undefined
    const unlocked = isUnlocked(data, m)

    // Skip modules that are already mastered (unless confidence is shaky/lost or quiz < 70%)
    const needsRevision =
      confidence === 'lost' ||
      confidence === 'shaky' ||
      (quizPct !== undefined && quizPct < 0.7)

    if (stage === 'mastered' && !needsRevision) continue
    if (stage === 'confident' && !needsRevision) continue

    // Check if a prerequisite is completed in status but shaky/lost in confidence
    const shakyPrereqs = m.prereqs
      .map((pid) => modById.get(pid))
      .filter((p): p is LearningModule => Boolean(p))
      .filter(
        (p) =>
          data.confidence[p.id] === 'lost' ||
          data.confidence[p.id] === 'shaky' ||
          statusOf(data, p.id) !== 'completed',
      )

    // We only recommend locked modules if they are already in-flight; otherwise we recommend their prerequisites first
    if (!unlocked && stage === 'not-started') continue

    const reasons: string[] = []
    let score = 0
    let kind: RecommendationKind = 'start-next'
    let headline = `Start next: ${m.title}`

    // Rule 1: Needs revision (completed/in-flight topic with low quiz score or shaky confidence)
    if (needsRevision && stage !== 'not-started') {
      kind = 'revise-foundation'
      headline = `Strengthen weak spot: ${m.title}`
      score += 95
      if (confidence === 'lost' || confidence === 'shaky') {
        reasons.push(`You rated your confidence on this topic as "${confidence}".`)
      }
      if (quizPct !== undefined && quizPct < 0.7) {
        reasons.push(`Quiz score was ${Math.round(quizPct * 100)}% — reviewing before building on it prevents compounding gaps.`)
      }
    }

    // Rule 2: Finish active work-in-progress before opening new topics (WIP limit = 2)
    if (stage === 'learning' || stage === 'practising') {
      if (kind !== 'revise-foundation') {
        kind = 'finish-active'
        headline =
          stage === 'learning'
            ? `Move from theory to practice: ${m.title}`
            : `Complete criteria & prove confidence: ${m.title}`
      }
      score += stage === 'practising' ? 88 : 80
      const rec = moduleRecordOf(data, m.id)
      const objDone = rec.objectivesDone.length
      const compDone = rec.completionDone.length
      reasons.push(
        `Currently ${stage} (${objDone}/${m.objectives.length} objectives, ${compDone}/${m.completion.length} completion checks done) — finishing active work beats context switching.`,
      )
    } else if (inFlightIds.size >= 2) {
      // Penalise starting brand-new modules when 2+ are already mid-flight
      score -= 25
    }

    // Rule 3: Unblocks an active project
    if (activeProjectModuleIds.has(m.id)) {
      if (kind === 'start-next') {
        kind = 'unblock-project'
        headline = `Unblock active project: ${m.title}`
      }
      score += 35
      reasons.push('Directly required for the checkpoint project you have in flight.')
    }

    // Rule 4: Essential vs optional
    if (m.essential) {
      score += 30
    } else {
      kind = 'Optional-deepening'
      score -= 20
      reasons.push('Optional specialisation — tackle after core path milestones.')
    }

    // Rule 5: Sequence mode & career track priority
    const wave = waveForModule(m.id)
    if (mode === 'agent-fast-track') {
      score += (5 - wave) * 14
      if (wave === 1) {
        reasons.push('Wave 1 Core Engineering foundation — required by every downstream LLM and Agent module.')
      } else if (wave === 2) {
        reasons.push('Wave 2 Applied LLM & RAG fast-track — builds immediate AI engineering capability.')
      } else if (wave === 3) {
        reasons.push('Wave 3 Agentic Workflows & Production deployment core.')
      }
    } else if (mode === 'phase-order') {
      score += (9 - m.phase) * 10
      reasons.push(`Follows Phase ${m.phase} sequential curriculum order.`)
    } else if (mode === 'ml-first') {
      if (trackId === 'ml-ds') {
        score += 28
        reasons.push('Prioritised for your Machine Learning & Data Science track focus.')
      }
      score += (9 - m.phase) * 8
    }

    // Rule 6: Bottleneck / downstream unlock leverage
    const unlocksCount = downstreamUnlockCount(m.id, MODULES)
    if (unlocksCount > 0) {
      score += Math.min(25, unlocksCount * 2)
      reasons.push(
        `High-leverage bottleneck: completing this unlocks ${unlocksCount} downstream essential module${unlocksCount === 1 ? '' : 's'}.`,
      )
    }

    // Rule 7: Diagnostic gap alignment
    if (assessmentOf(data, 'ai-agents').done) {
      const s = assessmentOf(data, 'ai-agents').scores
      if (m.phase === 1 && (s.python ?? 3) <= 1) {
        score += 12
        reasons.push('Addresses the Python & Software gap flagged in your diagnostic assessment.')
      } else if (m.phase === 2 && ((s.math ?? 3) <= 1 || (s.ml ?? 3) <= 1)) {
        score += 12
        reasons.push('Addresses the Math / ML methodology gap flagged in your diagnostic.')
      }
    }

    // Rule 8: Warn if any prerequisite is shaky
    if (shakyPrereqs.length > 0 && stage === 'not-started') {
      score -= 15
    }

    const loggedMinutes = moduleMinutesLogged(data, m.id)
    const loggedHours = Math.round((loggedMinutes / 60) * 10) / 10
    const remainingHours = Math.max(1, Math.round((m.hours - loggedHours) * 10) / 10)
    const todaySuggestedMinutes = Math.min(dailyMinutes, remainingHours * 60)

    const rec = moduleRecordOf(data, m.id)
    const nextUncheckedCompletion =
      m.completion.find((_, idx) => !rec.completionDone.includes(idx)) ?? m.completion[0]
    const practicalExercise = lesson ? lesson.exercise.prompt : nextUncheckedCompletion

    const nextUncheckedObjective =
      m.objectives.find((_, idx) => !rec.objectivesDone.includes(idx)) ?? m.objectives[0]

    const prerequisites: PrereqStatus[] = m.prereqs.map((pid) => {
      const pm = modById.get(pid)
      const pStage = stageOf(data, pid)
      return {
        id: pid,
        title: pm?.title ?? pid,
        stage: pStage,
        met: pStage === 'confident' || pStage === 'mastered',
      }
    })

    if (reasons.length === 0) {
      reasons.push(`All prerequisites satisfied; next logical step in Phase ${m.phase}.`)
    }

    candidates.push({
      module: m,
      kind,
      headline,
      reasons: reasons.slice(0, 3),
      prerequisites,
      estimatedTime: {
        moduleHours: m.hours,
        loggedHours,
        remainingHours,
        todaySuggestedMinutes,
      },
      expectedOutcome: `Master "${nextUncheckedObjective}" and move ${m.title} toward ${
        stage === 'not-started' ? 'Learning / Practising' : 'Confident / Mastered'
      }.`,
      practicalExercise,
      masteryProof: `Ship deliverable: ${m.deliverable} (and check off all ${m.completion.length} completion criteria with a repo/evidence link).`,
      track: trackSpecFor(trackId),
      unlocksCount,
      score,
    })
  }

  candidates.sort((a, b) => b.score - a.score)
  return candidates.slice(0, limit)
}
