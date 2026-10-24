import { MODULES } from '../content/roadmaps/ai-agents'
import {
  dueCards,
  moduleRecordOf,
  stageOf,
  todayStr,
  type DailyPlanRecord,
  type DailyTaskBlock,
  type ProgressData,
} from '../store/progress'
import { getRecommendations } from './recommend'

const modById = new Map(MODULES.map((m) => [m.id, m]))

/**
 * Generates a realistic, proportional 4-block daily study plan (Revise, Learn, Practise, Reflect)
 * tailored to `budgetMinutes` (e.g. 90m -> 15m revise / 30m learn / 30m practise / 15m reflect)
 * and anchored to the learner's real due cards and top recommended module.
 */
export function generateDailyPlan(
  data: ProgressData,
  date: string = todayStr(),
  budgetMinutes = 90,
): DailyPlanRecord {
  const safeBudget = Math.max(15, Math.min(360, Math.round(budgetMinutes)))
  const reviseMin = Math.max(5, Math.round((safeBudget * 15) / 90 / 5) * 5)
  const reflectMin = Math.max(5, Math.round((safeBudget * 15) / 90 / 5) * 5)
  const remaining = Math.max(10, safeBudget - reviseMin - reflectMin)
  const learnMin = Math.round(remaining / 2 / 5) * 5 || 5
  const practiseMin = Math.max(5, remaining - learnMin)

  const due = dueCards(data, date)
  const recs = getRecommendations(data, { dailyMinutes: safeBudget, limit: 2 })
  const topRec = recs[0]
  const primaryMod =
    topRec?.module ??
    (data.lastActiveModuleId ? modById.get(data.lastActiveModuleId) : undefined) ??
    MODULES[0]

  const modRec = moduleRecordOf(data, primaryMod.id)
  const nextObjective =
    primaryMod.objectives.find((_, idx) => !modRec.objectivesDone.includes(idx)) ??
    primaryMod.objectives[0]
  const nextCompletion =
    primaryMod.completion.find((_, idx) => !modRec.completionDone.includes(idx)) ??
    primaryMod.completion[0]

  // Check if there is a shaky/completed topic to revise when no SRS cards are due
  const completedOrShaky = MODULES.find(
    (m) =>
      data.confidence[m.id] === 'shaky' ||
      data.confidence[m.id] === 'lost' ||
      stageOf(data, m.id) === 'confident',
  )

  const blocks: DailyTaskBlock[] = [
    {
      id: `${date}-revise`,
      kind: 'revise',
      title:
        due.length > 0
          ? `Revise ${due.length} due recall card${due.length === 1 ? '' : 's'}`
          : completedOrShaky
            ? `Active recall: ${completedOrShaky.title}`
            : `Warm-up recall: ${primaryMod.title}`,
      subtitle:
        due.length > 0
          ? 'Spaced repetition queue — retrieve before learning new material'
          : 'Review key concepts or seed flashcards from your current module',
      moduleId: completedOrShaky?.id ?? primaryMod.id,
      route: due.length > 0 ? '/review' : `/roadmap/${completedOrShaky?.id ?? primaryMod.id}`,
      minutes: reviseMin,
      done: false,
    },
    {
      id: `${date}-learn`,
      kind: 'learn',
      title: `Learn concept: ${primaryMod.title}`,
      subtitle: `Focus objective: ${nextObjective}`,
      moduleId: primaryMod.id,
      route: primaryMod.lessonId ? `/learn/${primaryMod.lessonId}` : `/roadmap/${primaryMod.id}`,
      minutes: learnMin,
      done: false,
    },
    {
      id: `${date}-practise`,
      kind: 'practise',
      title: `Hands-on exercise: ${primaryMod.title}`,
      subtitle: `Practice target: ${nextCompletion}`,
      moduleId: primaryMod.id,
      route: `/roadmap/${primaryMod.id}`,
      minutes: practiseMin,
      done: false,
    },
    {
      id: `${date}-reflect`,
      kind: 'reflect',
      title: 'Document what I learned & open questions',
      subtitle: `Log a 3-line entry in your Learning Journal for ${primaryMod.title}`,
      moduleId: primaryMod.id,
      route: `/journal?module=${primaryMod.id}`,
      minutes: reflectMin,
      done: false,
    },
  ]

  return {
    date,
    budgetMinutes: blocks.reduce((s, b) => s + b.minutes, 0),
    blocks,
  }
}

export function getOrCreateDailyPlan(
  data: ProgressData,
  date: string = todayStr(),
  defaultBudget = 90,
): DailyPlanRecord {
  const existing = data.dailyPlans?.[date]
  if (existing && existing.blocks.length > 0) return existing
  return generateDailyPlan(data, date, defaultBudget)
}

/** Find unfinished non-skipped blocks from the most recent previous daily plan so they can be rolled over without guilt. */
export function findUnfinishedYesterdayBlocks(
  data: ProgressData,
  today: string = todayStr(),
): { fromDate: string; blocks: DailyTaskBlock[] } | null {
  const plans = data.dailyPlans ?? {}
  const prevDates = Object.keys(plans)
    .filter((d) => d < today)
    .sort((a, b) => b.localeCompare(a))
  if (prevDates.length === 0) return null
  const latestDate = prevDates[0]
  const unfinished = plans[latestDate].blocks.filter((b) => !b.done && !b.skipped)
  if (unfinished.length === 0) return null
  return { fromDate: latestDate, blocks: unfinished }
}

/** Move a block up (-1) or down (+1) in the daily plan. */
export function moveDailyBlock(
  plan: DailyPlanRecord,
  blockId: string,
  direction: -1 | 1,
): DailyPlanRecord {
  const idx = plan.blocks.findIndex((b) => b.id === blockId)
  if (idx < 0) return plan
  const target = idx + direction
  if (target < 0 || target >= plan.blocks.length) return plan
  const copy = [...plan.blocks]
  const [item] = copy.splice(idx, 1)
  copy.splice(target, 0, item)
  return { ...plan, blocks: copy }
}
