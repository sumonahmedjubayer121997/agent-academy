import { useMemo, useState } from 'react'
import { CalendarClock, Download, Info, Trash2 } from 'lucide-react'
import { MODULES } from '../content/modules'
import { isUnlocked, statusOf, totals, useProgress } from '../store/progress'
import { Button, Card, SectionHead, Stat } from '../components/ui'

export default function Planner() {
  const { data, setWeeklyHours, resetAll } = useProgress()
  const [confirmReset, setConfirmReset] = useState(false)
  const t = totals(data)
  const hours = data.weeklyHours

  const weeksNeeded = Math.ceil(t.essentialRemaining / hours)
  const targetDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + weeksNeeded * 7)
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }, [weeksNeeded])

  const schedule = useMemo(() => {
    // Modules are stored in dependency order; take essential, unfinished ones.
    const queue = MODULES.filter(
      (m) => m.essential && statusOf(data, m.id) !== 'completed',
    )
    const weeks: { label: string; items: typeof MODULES; hours: number }[] = []
    let idx = 0
    let week = 1
    const completedIds = new Set(
      MODULES.filter((m) => statusOf(data, m.id) === 'completed').map((m) => m.id),
    )
    const virtualDone = new Set(completedIds)
    while (idx < queue.length && week <= 52) {
      let budget = hours
      const items: typeof MODULES = []
      // Prefer modules whose prerequisites are (now virtually) complete.
      while (budget > 0 && idx < queue.length) {
        const m = queue[idx]
        const ready = m.prereqs.every((p) => virtualDone.has(p))
        if (!ready || m.hours > budget + 2) break
        items.push(m)
        budget -= m.hours
        virtualDone.add(m.id)
        idx++
      }
      if (items.length === 0) {
        // Nothing fits (a module longer than the weekly budget): schedule it alone.
        const m = queue[idx]
        items.push(m)
        virtualDone.add(m.id)
        idx++
      }
      weeks.push({ label: `Week ${week}`, items, hours: hours - Math.max(0, budget) })
      week++
    }
    return weeks
  }, [data, hours])

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'agent-academy-progress.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="py-10">
      <SectionHead
        eyebrow="Study planner & settings"
        title="Turn hours into a schedule"
        sub="Pick your weekly budget. Estimates below are arithmetic on real curriculum hours minus your real completions — nothing else. Life happens; the plan recalculates every time you visit."
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm font-medium">Weekly study hours:</span>
          {[5, 10, 15].map((h) => (
            <button
              key={h}
              onClick={() => setWeeklyHours(h)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                hours === h
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line-strong text-ink-soft hover:bg-raised'
              }`}
            >
              {h}h
            </button>
          ))}
          <div className="ml-2 flex items-center gap-3">
            <input
              type="range"
              min={2}
              max={40}
              value={hours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className="w-40 accent-[var(--accent)]"
              aria-label="Custom weekly hours"
            />
            <span className="w-10 font-mono text-sm font-semibold">{hours}h</span>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Essential hours remaining"
          value={`${t.essentialRemaining}h`}
          sub={`${t.essentialHoursDone}h of ${t.essentialHoursTotal}h done`}
        />
        <Stat
          label="Weeks to finish (estimate)"
          value={`≈ ${weeksNeeded}`}
          sub={`at ${hours}h per week`}
        />
        <Stat
          label="Projected completion"
          value={t.essentialRemaining === 0 ? 'Done ✓' : targetDate}
          sub="estimate — updates as you progress"
        />
      </div>

      <Card className="mt-6 p-6">
        <h3 className="flex items-center gap-2 font-semibold tracking-tight">
          <CalendarClock size={16} className="text-accent" /> Suggested schedule (first weeks)
        </h3>
        <p className="mt-1.5 flex items-start gap-2 text-sm text-ink-faint">
          <Info size={14} className="mt-0.5 shrink-0" />
          Respects prerequisites; long modules may stretch across a week. This is a suggestion, not a
          contract.
        </p>
        <div className="mt-4 space-y-3">
          {schedule.slice(0, 8).map((w) => (
            <div key={w.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-xl border border-line px-4 py-3">
              <span className="w-16 shrink-0 text-sm font-semibold text-accent">{w.label}</span>
              <span className="flex-1 text-sm text-ink-soft">
                {w.items.map((m) => m.title).join(' → ')}
              </span>
              <span className="text-xs text-ink-faint">~{w.hours}h</span>
            </div>
          ))}
          {schedule.length > 8 && (
            <p className="text-sm text-ink-faint">…{schedule.length - 8} more weeks at this pace.</p>
          )}
          {schedule.length === 0 && (
            <p className="text-sm text-ok">Essential track complete. Outstanding! 🎓</p>
          )}
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h3 className="font-semibold tracking-tight">Settings & data</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={exportData}>
            <Download size={14} /> Export progress (JSON)
          </Button>
          {!confirmReset ? (
            <Button variant="ghost" onClick={() => setConfirmReset(true)}>
              <Trash2 size={14} /> Reset all progress…
            </Button>
          ) : (
            <span className="flex items-center gap-3 text-sm">
              <span className="text-bad">Erase all local progress?</span>
              <Button
                variant="secondary"
                onClick={() => {
                  resetAll()
                  setConfirmReset(false)
                }}
              >
                Yes, erase
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Theme toggle lives in the top bar. Progress is stored only in this browser (localStorage);
          export before switching machines. Cross-device sync via Firebase is planned for the next
          iteration.
        </p>
      </Card>
    </div>
  )
}
