import { useMemo, useRef, useState } from 'react'
import { BUNDLES } from '../content/roadmaps/registry'
import { shortTitleOf } from '../store/activeRoadmap'
import { useActiveRoadmap } from '../store/activeRoadmap'
import { sequenceModeOf } from '../store/progress'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  CheckCircle2,
  Download,
  Info,
  RefreshCw,
  RotateCcw,
  SkipForward,
  Timer,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  findUnfinishedYesterdayBlocks,
  generateDailyPlan,
  getOrCreateDailyPlan,
  getSavedDailyPlan,
  moveDailyBlock,
} from '../lib/dailyPlan'
import { buildSchedule } from '../lib/schedule'
import { dueForecast } from '../lib/srs'
import { Badge, Button, Card, ProgressBar, SectionHead, Stat } from '../components/ui'
import {
  dueCards,
  statusOf,
  todayStr,
  totals,
  useProgress,
} from '../store/progress'

import { usePageMeta } from '../hooks/usePageMeta'
export default function Planner() {
  const activeBundle = useActiveRoadmap()
  const { MODULES, SEQUENCE_MODES } = activeBundle
  usePageMeta('Planner & settings', 'Weekly hours, pace forecasts, export and backup.')
  const {
    data,
    setWeeklyHours,
    updateReviewSettings,
    setSequenceMode,
    saveDailyPlan,
    toggleDailyBlock,
    importProgressJson,
    hasPreviousBackup,
    restorePreviousBackup,
    resetAll,
  } = useProgress()

  const [confirmReset, setConfirmReset] = useState(false)
  const [dailyBudget, setDailyBudget] = useState<number>(
    () => getSavedDailyPlan(data, todayStr(), activeBundle.META.slug)?.budgetMinutes ?? 90,
  )
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const today = todayStr()
  const t = totals(data, MODULES)
  const hours = data.weeklyHours
  const seqMode = sequenceModeOf(data, useActiveRoadmap().META.slug)

  // Daily study plan
  const todayPlan = useMemo(
    () => getOrCreateDailyPlan(data, today, dailyBudget, activeBundle),
    [data, today, dailyBudget, activeBundle],
  )
  const unfinishedYesterday = useMemo(
    () => findUnfinishedYesterdayBlocks(data, today, activeBundle),
    [data, today, activeBundle],
  )

  const plannedDoneMin = todayPlan.blocks
    .filter((b) => b.done)
    .reduce((s, b) => s + b.minutes, 0)
  const actualTodayMin = data.sessions
    .filter((s) => s.at.startsWith(today))
    .reduce((s, x) => s + x.minutes, 0)

  // Review load: cards due within the next 7 days
  const forecast = dueForecast(data.srs, today)
  const reviewsThisWeek = forecast.reduce((s, n) => s + n, 0)
  const reviewMinutes = Math.round(reviewsThisWeek * 0.75)
  const dueToday = dueCards(data, today).length

  // Demonstrated pace: sessions from the last 14 days (needs >= 5 to activate)
  const twoWeeksAgo = Date.now() - 14 * 86_400_000
  const recent = data.sessions.filter((s) => Date.parse(s.at) >= twoWeeksAgo)
  const paceHoursPerWeek =
    recent.length >= 5 ? (recent.reduce((s, x) => s + x.minutes, 0) / 60) * (7 / 14) : null
  const effectiveWeekly = paceHoursPerWeek && paceHoursPerWeek > 0 ? paceHoursPerWeek : hours

  const weeksNeeded = Math.ceil(t.essentialRemaining / effectiveWeekly)
  const weeksPlanned = Math.ceil(t.essentialRemaining / hours)
  const usingPace = paceHoursPerWeek !== null
  const targetDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + weeksNeeded * 7)
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }, [weeksNeeded])

  const schedule = useMemo(
    () =>
      buildSchedule(
        MODULES,
        new Set(MODULES.filter((m) => statusOf(data, m.id) === 'completed').map((m) => m.id)),
        hours,
      ),
    [data, hours],
  )

  const handleSetDailyBudget = (mins: number) => {
    setDailyBudget(mins)
    saveDailyPlan(generateDailyPlan(data, today, mins, activeBundle))
  }

  const handleSkipBlock = (blockId: string) => {
    const updated = {
      ...todayPlan,
      blocks: todayPlan.blocks.map((b) =>
        b.id === blockId ? { ...b, skipped: !b.skipped, done: false } : b,
      ),
    }
    saveDailyPlan(updated)
  }

  const handleMoveBlock = (blockId: string, dir: -1 | 1) => {
    saveDailyPlan(moveDailyBlock(todayPlan, blockId, dir))
  }

  const handleRolloverYesterday = () => {
    if (!unfinishedYesterday) return
    const existingIds = new Set(todayPlan.blocks.map((b) => b.title))
    const toAdd = unfinishedYesterday.blocks
      .filter((b) => !existingIds.has(b.title))
      .map((b, idx) => ({
        ...b,
        id: `${today}-rollover-${idx}`,
        done: false,
        skipped: false,
      }))
    const nextBlocks = [...toAdd, ...todayPlan.blocks]
    saveDailyPlan({
      date: today,
      budgetMinutes: nextBlocks.reduce((s, b) => s + b.minutes, 0),
      blocks: nextBlocks,
    })
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-academy-progress-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const content = String(reader.result ?? '')
      const res = importProgressJson(content)
      if (res.ok) {
        setImportStatus({
          ok: true,
          msg: 'Progress backup restored! Previous state was also saved to recovery slot.',
        })
      } else {
        setImportStatus({ ok: false, msg: res.error })
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="py-10">
      <SectionHead level="h1"
        eyebrow="Daily & weekly study planner"
        title="Plan today's session and calibrate your long-term pace"
        sub="Break today's available study time into concrete Revise, Learn, Practise, and Document blocks. Rearrange or skip tasks anytime without guilt — missed blocks can be rolled over with one click."
      />

      {/* Daily Study Planner (Feature 4) */}
      <Card className="mb-8 border-accent/30 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Today's Study Plan ({today})
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Realistic time-blocked session
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-faint">Available today:</span>
            {[30, 60, 90, 120].map((m) => (
              <button
                key={m}
                onClick={() => handleSetDailyBudget(m)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                  todayPlan.budgetMinutes === m
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-line bg-surface text-ink-soft hover:bg-raised'
                }`}
              >
                {m}m
              </button>
            ))}
            <button
              onClick={() => saveDailyPlan(generateDailyPlan(data, today, dailyBudget, activeBundle))}
              title="Regenerate today's blocks from latest recommendations"
              className="rounded-lg border border-line bg-surface p-1.5 text-ink-soft hover:bg-raised hover:text-ink"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {unfinishedYesterday && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-raised/60 px-4 py-2.5 text-xs text-ink-soft">
            <span>
              You had {unfinishedYesterday.blocks.length} unfinished task block
              {unfinishedYesterday.blocks.length === 1 ? '' : 's'} from {unfinishedYesterday.fromDate}
              . Life happens — want to roll them into today or leave them behind?
            </span>
            <Button size="sm" variant="secondary" onClick={handleRolloverYesterday}>
              Roll over to today
            </Button>
          </div>
        )}

        <div className="mt-4 space-y-2.5">
          {todayPlan.blocks.map((block, idx) => (
            <div
              key={block.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all ${
                block.done
                  ? 'border-ok/30 bg-ok/5'
                  : block.skipped
                    ? 'border-line bg-raised/30 opacity-60'
                    : 'border-line bg-surface'
              }`}
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <button
                  onClick={() => {
                    if (!getSavedDailyPlan(data, today, activeBundle.META.slug)) saveDailyPlan(todayPlan)
                    toggleDailyBlock(today, block.id)
                  }}
                  aria-label={`Mark "${block.title}" as done`}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                    block.done
                      ? 'border-ok bg-ok text-white'
                      : 'border-line-strong text-ink-faint hover:border-accent hover:text-accent'
                  }`}
                >
                  {block.done ? '✓' : ''}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={block.done ? 'ok' : 'accent'}>{block.minutes} min</Badge>
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      {block.kind}
                    </span>
                    {block.skipped && <Badge>Skipped</Badge>}
                  </div>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      block.done || block.skipped ? 'line-through text-ink-faint' : 'text-ink'
                    }`}
                  >
                    {block.title}
                  </p>
                  {block.subtitle && (
                    <p className="mt-0.5 text-xs text-ink-soft">{block.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {block.target && !block.done && !block.skipped && (
                  <Link
                    to={`/r/${block.target.slug}/roadmap/${block.target.moduleId}`}
                    className="mr-1 rounded-lg bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent hover:bg-accent hover:text-accent-ink"
                  >
                    Open →
                  </Link>
                )}
                <button
                  onClick={() => handleMoveBlock(block.id, -1)}
                  disabled={idx === 0}
                  aria-label="Move task up"
                  className="rounded p-1 text-ink-faint hover:bg-raised hover:text-ink disabled:opacity-30"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  onClick={() => handleMoveBlock(block.id, 1)}
                  disabled={idx === todayPlan.blocks.length - 1}
                  aria-label="Move task down"
                  className="rounded p-1 text-ink-faint hover:bg-raised hover:text-ink disabled:opacity-30"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  onClick={() => handleSkipBlock(block.id)}
                  title={block.skipped ? 'Unskip task' : 'Skip for today without penalty'}
                  className="rounded p-1 text-ink-faint hover:bg-raised hover:text-ink"
                >
                  <SkipForward size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-ink-soft">
          <span>
            Planned today: <b>{todayPlan.budgetMinutes} min</b> · Checked off:{' '}
            <b>{plannedDoneMin} min</b> · Total logged today: <b>{actualTodayMin} min</b>
          </span>
          <span className="text-ink-faint">
            Checking off a block automatically logs its minutes into your study history.
          </span>
        </div>
      </Card>

      {/* Sequence Mode & Weekly Study Hours */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-sm font-semibold tracking-tight">Weekly study budget</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
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
                className="w-36 accent-[var(--accent)]"
                aria-label="Custom weekly hours"
              />
              <span className="w-10 font-mono text-sm font-semibold">{hours}h</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold tracking-tight">Review health (daily caps)</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-faint">
            New cards enter each roadmap's deck slowly, and total reviews stay bounded — the Anki-style
            guard against review bankruptcy now that several decks are live.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <span className="text-xs text-ink-soft">Max reviews/day</span>
              <input
                type="number"
                min={10}
                max={500}
                value={data.reviewSettings?.maxReviewsPerDay ?? 100}
                onChange={(e) => updateReviewSettings({ maxReviewsPerDay: Number(e.target.value) })}
                className="w-20 rounded-lg border border-line bg-surface px-2 py-1 text-xs"
              />
            </label>
            {Object.keys(BUNDLES).map((slug) => (
              <label key={slug} className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">New/day · {shortTitleOf(BUNDLES[slug].META)}</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={data.reviewSettings?.newCardsPerDay?.[slug] ?? 10}
                  onChange={(e) =>
                    updateReviewSettings({ newCardsPerDay: { [slug]: Number(e.target.value) } })
                  }
                  className="w-16 rounded-lg border border-line bg-surface px-2 py-1 text-xs"
                />
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold tracking-tight">
            Recommendation sequence mode (Career direction)
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {SEQUENCE_MODES.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSequenceMode(opt.id)}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  seqMode === opt.id
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line text-ink-soft hover:bg-raised'
                }`}
              >
                <p className="text-xs font-semibold">{opt.label}</p>
                <p className="mt-0.5 text-[11px] opacity-80">{opt.sub}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Essential hours remaining"
          value={`${t.essentialRemaining}h`}
          sub={`${t.essentialHoursDone}h of ${t.essentialHoursTotal}h done`}
        />
        <Stat
          label="Weeks to finish (estimate)"
          value={`≈ ${weeksNeeded}`}
          sub={
            usingPace
              ? `at your demonstrated ${paceHoursPerWeek!.toFixed(1)}h/wk pace`
              : `at ${hours}h per week`
          }
        />
        <Stat
          label="Projected completion"
          value={t.essentialRemaining === 0 ? 'Done ✓' : targetDate}
          sub={
            usingPace
              ? `from logged sessions (planned: ${weeksPlanned} wk)`
              : 'estimate — updates as you progress'
          }
        />
      </div>

      {/* Minimum viable session + review load */}
      <Card className="mt-6 border-accent/30 bg-accent-soft p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 font-semibold tracking-tight">
              <Timer size={16} className="text-accent" /> Today's minimum viable session (~15 min)
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              {dueToday > 0
                ? `${dueToday} review card${dueToday === 1 ? '' : 's'} (~${Math.max(
                    1,
                    Math.round(dueToday * 0.75),
                  )} min) + one module objective. Busy days keep momentum alive — perfection can wait.`
                : 'No cards due today — study one module objective or log a quick reflection.'}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">
              {reviewsThisWeek} review{reviewsThisWeek === 1 ? '' : 's'} this week
            </p>
            <p className="text-xs text-ink-faint">≈{reviewMinutes} min total, spread across days</p>
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h3 className="flex items-center gap-2 font-semibold tracking-tight">
          <CalendarClock size={16} className="text-accent" /> Suggested weekly schedule (macro
          view)
        </h3>
        <p className="mt-1.5 flex items-start gap-2 text-sm text-ink-faint">
          <Info size={14} className="mt-0.5 shrink-0" />
          Respects prerequisites; long modules may stretch across a week. This is a suggestion, not
          a contract.
        </p>
        <div className="mt-4 space-y-3">
          {schedule.slice(0, 8).map((w) => (
            <div
              key={w.label}
              className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-xl border border-line px-4 py-3"
            >
              <span className="w-16 shrink-0 text-sm font-semibold text-accent">{w.label}</span>
              <span className="flex-1 text-sm text-ink-soft">
                {w.items.map((m) => m.title).join(' → ')}
              </span>
              <span className="text-xs text-ink-faint">~{w.hours}h</span>
            </div>
          ))}
          {schedule.length > 8 && (
            <p className="text-sm text-ink-faint">
              …{schedule.length - 8} more weeks at this pace.
            </p>
          )}
          {schedule.length === 0 && (
            <p className="text-sm text-ok">Essential track complete. Outstanding! 🎓</p>
          )}
        </div>
      </Card>

      {/* Settings, Export, Import & Backup Recovery */}
      <Card className="mt-6 p-6">
        <h3 className="font-semibold tracking-tight">
          Personal Data Ownership, Backup & Recovery
        </h3>
        <p className="mt-1 text-xs text-ink-faint">
          All learning records live locally in your browser (`localStorage` + `IndexedDB` snapshots).
          Export a JSON backup anytime or restore from a saved file.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={exportData}>
            <Download size={14} /> Export progress (JSON)
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Import / Restore JSON…
          </Button>

          {hasPreviousBackup && (
            <Button
              variant="secondary"
              onClick={() => {
                if (restorePreviousBackup()) {
                  setImportStatus({
                    ok: true,
                    msg: 'Restored from previous automatic backup slot.',
                  })
                }
              }}
            >
              <RotateCcw size={14} /> Restore previous backup
            </Button>
          )}

          {!confirmReset ? (
            <Button variant="ghost" onClick={() => setConfirmReset(true)}>
              <Trash2 size={14} /> Reset all progress…
            </Button>
          ) : (
            <span className="flex items-center gap-3 text-sm">
              <span className="text-bad">Erase all local progress? (Auto-backup will be saved)</span>
              <Button
                variant="secondary"
                onClick={() => {
                  resetAll()
                  setConfirmReset(false)
                  setImportStatus({
                    ok: true,
                    msg: 'Progress reset. Click "Restore previous backup" if this was accidental.',
                  })
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

        {importStatus && (
          <p
            className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium ${
              importStatus.ok ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad'
            }`}
          >
            {importStatus.ok && <CheckCircle2 size={14} />}
            {importStatus.msg}
          </p>
        )}
      </Card>
    </div>
  )
}
