import { BUNDLES } from '../content/roadmaps/registry'
import type { RoadmapBundle } from '../content/roadmaps/registry'
import {
  dailyPlanRoadmapOf,
  dueCards,
  moduleRecordOf,
  roadmapSlugOfModule,
  stageOf,
  todayStr,
  type DailyPlanRecord,
  type DailyTaskBlock,
  type ProgressData,
} from '../store/progress'
import { getRecommendations } from './recommend'

/**
 * Generates a realistic, proportional 4-block daily study plan (Revise, Learn, Practise, Reflect)
 * tailored to `budgetMinutes` (e.g. 90m -> 15m revise / 30m learn / 30m practise / 15m reflect)
 * and anchored to the learner's real due cards and top recommended module.
 */
export function generateDailyPlan(
  data: ProgressData,
  date: string = todayStr(),
  budgetMinutes = 90,
  bundle: RoadmapBundle = BUNDLES['ai-agents'],
): DailyPlanRecord {
  const { META, MODULES } = bundle
  const slug = META.slug
  const modById = new Map(MODULES.map((m) => [m.id, m]))
  const safeBudget = Math.max(15, Math.min(360, Math.round(budgetMinutes)))
  const reviseMin = Math.max(5, Math.round((safeBudget * 15) / 90 / 5) * 5)
  const reflectMin = Math.max(5, Math.round((safeBudget * 15) / 90 / 5) * 5)
  const remaining = Math.max(10, safeBudget - reviseMin - reflectMin)
  const learnMin = Math.round(remaining / 2 / 5) * 5 || 5
  const practiseMin = Math.max(5, remaining - learnMin)

  const due = dueCards(data, date)
  const recs = getRecommendations(data, { dailyMinutes: safeBudget, limit: 2, bundle })
  const topRec = recs[0]
  const lastActiveForSlug =
    data.lastActiveByRoadmap?.[slug] ??
    (data.lastActiveModuleId && modById.has(data.lastActiveModuleId)
      ? data.lastActiveModuleId
      : undefined)
  const primaryMod =
    topRec?.module ??
    (lastActiveForSlug ? modById.get(lastActiveForSlug) : undefined) ??
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
      ...(due.length === 0 && completedOrShaky ? { target: { slug: roadmapSlugOfModule(completedOrShaky.id), moduleId: completedOrShaky.id } } : primaryMod ? { target: { slug: roadmapSlugOfModule(primaryMod.id), moduleId: primaryMod.id } } : {}),
      minutes: reviseMin,
      done: false,
    },
    {
      id: `${date}-learn`,
      kind: 'learn',
      title: `Learn concept: ${primaryMod.title}`,
      subtitle: `Focus objective: ${nextObjective}`,
      moduleId: primaryMod.id,
      target: { slug: roadmapSlugOfModule(primaryMod.id), moduleId: primaryMod.id },
      minutes: learnMin,
      done: false,
    },
    {
      id: `${date}-practise`,
      kind: 'practise',
      title: `Hands-on exercise: ${primaryMod.title}`,
      subtitle: `Practice target: ${nextCompletion}`,
      moduleId: primaryMod.id,
      target: { slug: roadmapSlugOfModule(primaryMod.id), moduleId: primaryMod.id },
      minutes: practiseMin,
      done: false,
    },
    {
      id: `${date}-reflect`,
      kind: 'reflect',
      title: 'Document what I learned & open questions',
      subtitle: `Log a 3-line entry in your Learning Journal for ${primaryMod.title}`,
      moduleId: primaryMod.id,
      target: { slug: roadmapSlugOfModule(primaryMod.id), moduleId: primaryMod.id },
      minutes: reflectMin,
      done: false,
    },
  ]

  return {
    date,
    roadmap: slug,
    budgetMinutes: blocks.reduce((s, b) => s + b.minutes, 0),
    blocks,
  }
}

export function getSavedDailyPlan(
  data: ProgressData,
  date: string,
  slug: string,
): DailyPlanRecord | undefined {
  const scoped = data.dailyPlans?.[`${date}:${slug}`]
  if (scoped && scoped.blocks.length > 0) return scoped
  const byDate = data.dailyPlans?.[date]
  if (byDate && byDate.blocks.length > 0 && dailyPlanRoadmapOf(byDate) === slug) {
    return byDate
  }
  return undefined
}

export function getOrCreateDailyPlan(
  data: ProgressData,
  date: string = todayStr(),
  defaultBudget = 90,
  bundle: RoadmapBundle = BUNDLES['ai-agents'],
): DailyPlanRecord {
  const existing = getSavedDailyPlan(data, date, bundle.META.slug)
  if (existing) return existing
  return generateDailyPlan(data, date, defaultBudget, bundle)
}

/** Find unfinished non-skipped blocks from the most recent previous daily plan so they can be rolled over without guilt. */
export function findUnfinishedYesterdayBlocks(
  data: ProgressData,
  today: string = todayStr(),
  bundle?: RoadmapBundle,
): { fromDate: string; blocks: DailyTaskBlock[] } | null {
  const plans = data.dailyPlans ?? {}
  const matching = Object.values(plans).filter((p) => {
    if (!p || typeof p.date !== 'string' || p.date >= today) return false
    if (bundle && dailyPlanRoadmapOf(p) !== bundle.META.slug) return false
    return true
  })
  matching.sort((a, b) => b.date.localeCompare(a.date))
  if (matching.length === 0) return null
  const latest = matching[0]
  const unfinished = latest.blocks.filter((b) => !b.done && !b.skipped)
  if (unfinished.length === 0) return null
  return { fromDate: latest.date, blocks: unfinished }
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
