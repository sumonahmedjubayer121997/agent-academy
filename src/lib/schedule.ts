import type { LearningModule } from '../content/types'

export interface ScheduleWeek {
  label: string
  items: LearningModule[]
  hours: number
}

/**
 * Greedy weekly plan over essential, unfinished modules in dependency order.
 * - Prefers modules whose prerequisites are (virtually) complete.
 * - Allows +2h of overshoot when a module nearly fits the weekly budget.
 * - A module longer than the budget gets a week of its own rather than blocking.
 * - Caps at 52 weeks; the UI shows "…more" beyond that.
 */
export function buildSchedule(
  modules: LearningModule[],
  completedIds: ReadonlySet<string>,
  weeklyHours: number,
): ScheduleWeek[] {
  const queue = modules.filter((m) => m.essential && !completedIds.has(m.id))
  const virtualDone = new Set(completedIds)
  const weeks: ScheduleWeek[] = []
  let idx = 0
  let week = 1

  while (idx < queue.length && week <= 52) {
    let budget = weeklyHours
    const items: LearningModule[] = []
    while (budget > 0 && idx < queue.length) {
      const m = queue[idx]
      const ready = m.prereqs.every((p) => virtualDone.has(p))
      if (!ready || m.hours > budget + 2) break
      items.push(m)
      budget -= m.hours
      virtualDone.add(m.id)
      idx++
    }
    if (items.length === 0 && idx < queue.length) {
      const m = queue[idx]
      items.push(m)
      virtualDone.add(m.id)
      idx++
    }
    weeks.push({
      label: `Week ${week}`,
      items,
      hours: items.reduce((s, m) => s + m.hours, 0),
    })
    week++
  }
  return weeks
}
