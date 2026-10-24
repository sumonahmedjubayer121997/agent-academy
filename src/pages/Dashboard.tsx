import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Flame,
  FolderGit2,
  GraduationCap,
  Layers,
  Play,
  Sparkles,
  Timer,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { LESSONS } from '../content/roadmaps/ai-agents'
import { MODULES } from '../content/roadmaps/ai-agents'
import { PROJECTS } from '../content/roadmaps/ai-agents'
import { TRACKS, trackForModule, waveForModule } from '../content/roadmaps/ai-agents'
import {
  currentPhase,
  dueCards,
  moduleMinutesLogged,
  moduleRecordOf,
  nextUp,
  phaseStats,
  stageOf,
  streak,
  todayStr,
  totals,
  useProgress,
  type Confidence,
} from '../store/progress'
import { dueForecast } from '../lib/srs'
import { getRecommendations } from '../lib/recommend'
import { getOrCreateDailyPlan } from '../lib/dailyPlan'
import { Badge, Card, ProgressBar, SectionHead, Stat, StatusBadge } from '../components/ui'

const CONF_LEVELS: { key: Confidence; label: string }[] = [
  { key: 'sure', label: 'Sure' },
  { key: 'shaky', label: 'Shaky' },
  { key: 'lost', label: 'Lost' },
]

export default function Dashboard() {
  const { data, logStudyDay, logSession, saveDailyPlan, toggleDailyBlock } = useProgress()
  const [reportWindow, setReportWindow] = useState<'7d' | '30d'>('7d')
  const [expandedRecIdx, setExpandedRecIdx] = useState<number>(0)

  const today = todayStr()
  const t = totals(data)
  const stats = phaseStats(data)
  const cur = currentPhase(data)
  const upcoming = nextUp(data, 3)
  const days = streak(data.activity)
  const due = dueCards(data, today)

  // Recommendations (Feature 3)
  const recommendations = getRecommendations(data, { limit: 3 })
  const topRec = recommendations[0]

  // Today's study plan (Feature 4)
  const defaultDailyBudget = Math.max(30, Math.round((data.weeklyHours * 60) / 5))
  const todayPlan = getOrCreateDailyPlan(data, today, defaultDailyBudget)
  const plannedMinutesToday = todayPlan.blocks
    .filter((b) => !b.skipped)
    .reduce((s, b) => s + b.minutes, 0)
  const completedMinutesToday = todayPlan.blocks
    .filter((b) => b.done)
    .reduce((s, b) => s + b.minutes, 0)

  // Modules by lifecycle stage (Feature 2)
  const activeModules = MODULES.filter((m) => {
    const st = stageOf(data, m.id)
    return st === 'learning' || st === 'practising' || st === 'confident'
  })
  const completedModules = MODULES.filter((m) => stageOf(data, m.id) === 'mastered')

  // Primary "Continue Learning" target (Feature 1)
  const continueModule = activeModules[0] ?? topRec?.module ?? upcoming[0]

  // Quiz performance
  const quizList = Object.entries(data.quiz).sort((a, b) => b[1].at.localeCompare(a[1].at))
  const quizAvg = quizList.length
    ? Math.round((quizList.reduce((s, [, q]) => s + q.score / q.total, 0) / quizList.length) * 100)
    : null

  // Analytics: forecast, weak spots, demonstrated pace (Fixed 14-day math: weeklyHours * 2)
  const forecast = dueForecast(data.srs, today)
  const lessonQuizRows = LESSONS.map((l) => {
    const q = data.quiz[`lesson:${l.id}`]
    return q ? { title: l.title, lessonId: l.id, moduleId: l.moduleId, pct: q.score / q.total } : null
  }).filter((x): x is NonNullable<typeof x> => x !== null)
  const weakest = lessonQuizRows.slice().sort((a, b) => a.pct - b.pct).slice(0, 3)

  const twoWeeksAgo = Date.now() - 14 * 86_400_000
  const recentSessions14d = data.sessions.filter((s) => Date.parse(s.at) >= twoWeeksAgo)
  const loggedHours14d = recentSessions14d.reduce((s, x) => s + x.minutes, 0) / 60
  const targetHours14d = Math.max(1, data.weeklyHours * 2)
  const paceReady = recentSessions14d.length >= 5

  // Revision & Retention Alerts (Feature 1 & 5)
  const shakyModules = MODULES.filter(
    (m) => data.confidence[m.id] === 'shaky' || data.confidence[m.id] === 'lost',
  )
  const openQuestionsCount =
    MODULES.reduce((acc, m) => acc + moduleRecordOf(data, m.id).questions.length, 0) +
    (data.journal ?? []).filter((j) => j.openQuestions.trim().length > 0 && !j.resolved).length

  // Active Projects & Next Milestone (Feature 1 & 6)
  const projectsWithProgress = PROJECTS.map((p) => {
    const rec = data.projects?.[p.id]
    const doneSteps = rec?.milestonesDone?.length ?? 0
    const nextStepIdx = p.milestones.findIndex((_, i: number) => !rec?.milestonesDone?.includes(i))
    return {
      project: p,
      autonomy: rec?.autonomy ?? 'planning',
      hasRecord: Boolean(rec),
      doneSteps,
      totalSteps: p.milestones.length,
      nextStep:
        nextStepIdx >= 0
          ? p.milestones[nextStepIdx]
          : 'All milestones complete — write final retrospective',
      repoUrl: rec?.repoUrl ?? '',
    }
  })
  const activeProjects = projectsWithProgress.filter((p) => p.hasRecord || p.doneSteps > 0)
  const featuredProjects = activeProjects.length > 0 ? activeProjects : projectsWithProgress.slice(0, 2)

  // Calibration
  const calibration = CONF_LEVELS.map(({ key, label }) => {
    const rows = MODULES.filter(
      (m) => data.confidence[m.id] === key && m.lessonId && data.quiz[`lesson:${m.lessonId}`],
    ).map((m) => data.quiz[`lesson:${m.lessonId}`])
    const avg = rows.length
      ? Math.round((rows.reduce((s, q) => s + q.score / q.total, 0) / rows.length) * 100)
      : null
    return { key, label, avg, n: rows.length }
  }).filter((c) => c.n > 0)

  // Feature 10: Weekly (7d) & Monthly (30d) Review Report metrics
  const windowDays = reportWindow === '7d' ? 7 : 30
  const windowCutoff = Date.now() - windowDays * 86_400_000
  const windowSessions = data.sessions.filter((s) => Date.parse(s.at) >= windowCutoff)
  const windowHours = windowSessions.reduce((s, x) => s + x.minutes, 0) / 60
  const windowTargetHours = reportWindow === '7d' ? data.weeklyHours : data.weeklyHours * 4
  const windowStudyDays = data.activity.filter((d) => {
    const ts = Date.parse(`${d}T00:00:00Z`)
    return !Number.isNaN(ts) && ts >= windowCutoff
  }).length
  const totalEvidenceLinks = MODULES.reduce(
    (acc, m) => acc + moduleRecordOf(data, m.id).evidenceUrls.length,
    0,
  )
  const totalFeynmanCount = Object.values(data.feynman).reduce((acc, arr) => acc + arr.length, 0)
  const srsCards = Object.values(data.srs)
  const avgEase = srsCards.length
    ? (srsCards.reduce((s, c) => s + c.ease, 0) / srsCards.length).toFixed(2)
    : '—'

  // Track breakdown (Track A / B / C)
  const trackSummary = TRACKS.map((track) => {
    const mods = MODULES.filter((m) => trackForModule(m.id) === track.id)
    const mastered = mods.filter((m) => stageOf(data, m.id) === 'mastered').length
    const active = mods.filter((m) => {
      const st = stageOf(data, m.id)
      return st === 'learning' || st === 'practising' || st === 'confident'
    }).length
    return { track, total: mods.length, mastered, active }
  })

  const handleToggleTodayBlock = (blockId: string) => {
    if (!data.dailyPlans?.[today]) {
      saveDailyPlan(todayPlan)
    }
    toggleDailyBlock(today, blockId)
  }

  return (
    <div className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead
          eyebrow="Personal Learning Operating System"
          title="Your learning picture"
          sub="Every number here is computed from your recorded activity — nothing is simulated."
        />
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {continueModule && (
            <Link
              to={`/roadmap/${continueModule.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-all hover:bg-accent-hover"
            >
              <Play size={15} />
              Continue: {continueModule.title}
            </Link>
          )}
          <button
            onClick={logStudyDay}
            className="rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium transition-all hover:bg-raised active:scale-[0.98]"
          >
            Mark today as a study day
          </button>
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Essential track"
          value={`${Math.round((t.essentialHoursDone / t.essentialHoursTotal) * 100)}%`}
          sub={`${t.essentialHoursDone}h of ${t.essentialHoursTotal}h guided`}
        />
        <Stat
          label="Modules mastered / active"
          value={`${completedModules.length} / ${activeModules.length}`}
          sub={`${completedModules.length} mastered · ${activeModules.length} in progress (of ${t.modulesTotal})`}
        />
        <Stat
          label="Study consistency"
          value={days > 0 ? `${days} day${days === 1 ? '' : 's'}` : '—'}
          sub={`${loggedHours14d.toFixed(1)}h logged in last 14d (target ${targetHours14d}h)`}
        />
        <Stat
          label="Retention & quizzes"
          value={quizAvg === null ? '—' : `${quizAvg}%`}
          sub={`${due.length} card${due.length === 1 ? '' : 's'} due today · ${quizList.length} quiz${quizList.length === 1 ? '' : 'zes'}`}
        />
      </div>

      {/* Feature 1: Primary Action Row — Today's Study Plan + Intelligent Next-Step Recommendation */}
      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        {/* Today's Study Plan Widget (5 cols) */}
        <Card className="flex flex-col justify-between p-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl bg-accent-soft p-2.5 text-accent">
                  <CalendarClock size={18} />
                </span>
                <div>
                  <h3 className="font-semibold tracking-tight">Today’s study plan</h3>
                  <p className="text-xs text-ink-faint">
                    {completedMinutesToday}m of {plannedMinutesToday}m completed ({today})
                  </p>
                </div>
              </div>
              <Link to="/planner" className="text-xs font-medium text-accent hover:underline">
                Customise →
              </Link>
            </div>

            <ProgressBar
              className="mt-3"
              value={plannedMinutesToday > 0 ? (completedMinutesToday / plannedMinutesToday) * 100 : 0}
            />

            <ul className="mt-4 space-y-2.5">
              {todayPlan.blocks
                .filter((b) => !b.skipped)
                .map((b) => (
                  <li
                    key={b.id}
                    className={`flex items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-all ${
                      b.done
                        ? 'border-ok/30 bg-ok/5 text-ink-faint line-through'
                        : 'border-line bg-raised/40 text-ink'
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={b.done}
                        onChange={() => handleToggleTodayBlock(b.id)}
                        className="mt-1 accent-[var(--accent)]"
                      />
                      <div>
                        <span className="font-medium">{b.title}</span>
                        {b.subtitle && <p className="text-xs text-ink-faint">{b.subtitle}</p>}
                      </div>
                    </label>
                    <span className="shrink-0 rounded-md bg-surface px-2 py-0.5 font-mono text-xs text-ink-soft">
                      {b.minutes}m
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-faint">
            <span>Missed a block? Unfinished tasks roll over calmly in Planner.</span>
            <Link to="/journal" className="font-medium text-accent hover:underline">
              Open journal →
            </Link>
          </div>
        </Card>

        {/* Feature 3: Intelligent Next-Step Recommendation Engine (7 cols) */}
        <Card className="p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="rounded-xl bg-accent-soft p-2.5 text-accent">
                <Sparkles size={18} />
              </span>
              <div>
                <h3 className="font-semibold tracking-tight">What should I learn next, and why?</h3>
                <p className="text-xs text-ink-faint">
                  Rule-based recommendations from your prerequisites, confidence, projects, and sequence mode
                </p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {recommendations.map((rec, idx) => (
                <button
                  key={rec.module.id}
                  onClick={() => setExpandedRecIdx(idx)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    expandedRecIdx === idx
                      ? 'bg-accent text-accent-ink'
                      : 'border border-line bg-surface text-ink-soft hover:bg-raised'
                  }`}
                >
                  #{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {recommendations.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              You have mastered every module in the curriculum. Focus on your capstone projects and spaced reviews!
            </p>
          ) : (
            (() => {
              const rec = recommendations[expandedRecIdx] ?? recommendations[0]
              const wave = waveForModule(rec.module.id)
              return (
                <div className="mt-4 rounded-xl border border-line bg-raised/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="accent">
                          Track {rec.track.code} · {rec.track.shortTitle}
                        </Badge>
                        <Badge>Wave {wave}</Badge>
                        <Badge>{rec.estimatedTime.remainingHours}h est. remaining</Badge>
                        {rec.unlocksCount > 0 && (
                          <Badge tone="ok">Unlocks {rec.unlocksCount} downstream</Badge>
                        )}
                      </div>
                      <Link
                        to={`/roadmap/${rec.module.id}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight text-ink hover:text-accent"
                      >
                        {rec.module.title}
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                    <Link
                      to={`/roadmap/${rec.module.id}`}
                      className="rounded-xl bg-accent px-3.5 py-2 text-xs font-semibold text-accent-ink transition-all hover:bg-accent-hover"
                    >
                      Open module
                    </Link>
                  </div>

                  {/* All 7 transparent fields required by Feature 3 */}
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl border border-line bg-surface p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                        Why recommended ({rec.headline})
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                        {rec.reasons.join(' ')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                        Expected outcome
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{rec.expectedOutcome}</p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                        Practical exercise
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{rec.practicalExercise}</p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                        How to demonstrate mastery
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{rec.masteryProof}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-faint">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-ink-soft">Prerequisites:</span>
                      {rec.prerequisites.length === 0 ? (
                        <span className="text-ok">None — ready immediately</span>
                      ) : (
                        rec.prerequisites.map((p) => (
                          <Link
                            key={p.id}
                            to={`/roadmap/${p.id}`}
                            className={`rounded-md px-2 py-0.5 font-medium ${
                              p.met ? 'bg-ok/10 text-ok' : 'bg-warn/15 text-warn'
                            }`}
                          >
                            {p.title} ({p.stage})
                          </Link>
                        ))
                      )}
                    </div>
                    <span>
                      Today’s slice: ~{rec.estimatedTime.todaySuggestedMinutes}m (of {rec.estimatedTime.moduleHours}h module)
                    </span>
                  </div>
                </div>
              )
            })()
          )}
        </Card>
      </div>

      {/* Track A / B / C Interconnected Direction Summary */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {trackSummary.map(({ track, total, mastered, active }) => {
          const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
          return (
            <Card key={track.id} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Track {track.code} · {track.shortTitle}
                </span>
                <span className="text-xs font-medium text-ink-faint">
                  {mastered}/{total} mastered · {active} active
                </span>
              </div>
              <h3 className="mt-1 font-semibold tracking-tight">{track.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{track.tagline}</p>
              <ProgressBar className="mt-3" value={pct} />
            </Card>
          )
        })}
      </div>

      {/* Reviews due + Study session logger */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className={`p-6 ${due.length > 0 || shakyModules.length > 0 ? 'border-accent/40' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-accent-soft p-2.5 text-accent">
                <Layers size={18} />
              </span>
              <div>
                <h3 className="font-semibold tracking-tight">Knowledge retention & revision alerts</h3>
                <p className="text-xs text-ink-faint">
                  SM-2 active recall queue + shaky concepts + open questions
                </p>
              </div>
            </div>
            {due.length > 0 ? (
              <Link
                to="/review"
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-all hover:bg-accent-hover"
              >
                Review {due.length} {due.length === 1 ? 'card' : 'cards'} (~{Math.max(1, Math.round(due.length * 0.75))} min)
              </Link>
            ) : (
              <Link
                to="/review"
                className="rounded-xl border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-raised"
              >
                Open Review Deck →
              </Link>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-raised/40 p-3">
              <p className="text-xs text-ink-faint">Cards due today</p>
              <p className="mt-1 text-lg font-semibold">{due.length}</p>
            </div>
            <div className="rounded-xl border border-line bg-raised/40 p-3">
              <p className="text-xs text-ink-faint">Shaky / lost modules</p>
              <p className="mt-1 text-lg font-semibold">{shakyModules.length}</p>
            </div>
            <div className="rounded-xl border border-line bg-raised/40 p-3">
              <p className="text-xs text-ink-faint">Open questions</p>
              <p className="mt-1 text-lg font-semibold">{openQuestionsCount}</p>
            </div>
          </div>

          {shakyModules.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 font-medium text-warn">
                <AlertTriangle size={13} /> Needs revision:
              </span>
              {shakyModules.slice(0, 4).map((m) => (
                <Link
                  key={m.id}
                  to={`/roadmap/${m.id}`}
                  className="rounded-md bg-warn/15 px-2 py-0.5 font-medium text-warn hover:underline"
                >
                  {m.title}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-accent-soft p-2.5 text-accent">
              <Timer size={18} />
            </span>
            <div>
              <h3 className="font-semibold tracking-tight">Log a study session</h3>
              <p className="text-xs text-ink-faint">Records real study minutes and marks today active</p>
            </div>
          </div>
          <form
            className="mt-3 flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const moduleId = String(fd.get('module') ?? '')
              const minutes = Number(fd.get('minutes') ?? 0)
              if (moduleId && minutes > 0) {
                logSession(moduleId, minutes)
                e.currentTarget.reset()
              }
            }}
          >
            <label className="text-xs text-ink-faint">
              Module
              <select
                name="module"
                defaultValue={continueModule?.id ?? MODULES[0].id}
                className="mt-1 block w-56 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink"
              >
                {MODULES.map((m) => (
                  <option key={m.id} value={m.id}>
                    P{m.phase} · {m.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-ink-faint">
              Minutes
              <input
                name="minutes"
                type="number"
                min={5}
                max={480}
                step={5}
                defaultValue={25}
                className="mt-1 block w-24 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium transition-all hover:bg-raised"
            >
              Log
            </button>
          </form>
          {calibration.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Calibration (confidence vs accuracy)
              </p>
              <div className="mt-2 space-y-1.5 text-sm">
                {calibration.map((c) => (
                  <div key={c.key} className="flex items-center justify-between">
                    <span className="text-ink-soft">
                      “{c.label}” × {c.n}
                    </span>
                    <span className={`font-semibold ${c.avg !== null && c.avg < 70 ? 'text-bad' : 'text-ok'}`}>
                      {c.avg}% actual
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Analytics Row (Always visible — un-gated so Demonstrated Pace & Weakest Topics work immediately) */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-semibold tracking-tight">Retention forecast</h3>
          <p className="mt-1 text-xs text-ink-faint">cards due, next 7 days</p>
          <div className="mt-4 flex h-24 items-end gap-1.5">
            {forecast.map((n, i) => {
              const max = Math.max(...forecast, 1)
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-md ${i === 0 ? 'bg-accent' : 'bg-accent/40'}`}
                    style={{ height: `${Math.max(4, (n / max) * 100)}%` }}
                    title={`${n} due`}
                  />
                  <span className="text-[10px] text-ink-faint">{i === 0 ? 'today' : `+${i}d`}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold tracking-tight">Weakest topics</h3>
          <p className="mt-1 text-xs text-ink-faint">lowest quiz accuracy first — drill these</p>
          {weakest.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              Take lesson quizzes or rate module confidence to populate weak-spot drills.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {weakest.map((w) => (
                <li key={w.lessonId} className="flex items-center justify-between gap-2 text-sm">
                  <Link to={`/learn/${w.lessonId}`} className="truncate text-ink-soft hover:text-accent hover:underline">
                    {w.title}
                  </Link>
                  <span className={`font-semibold ${w.pct < 0.7 ? 'text-bad' : 'text-ok'}`}>
                    {Math.round(w.pct * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-accent" />
            <h3 className="font-semibold tracking-tight">Demonstrated pace</h3>
          </div>
          <p className="mt-1 text-xs text-ink-faint">logged sessions, last 14 days (2 weeks)</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight">
            {loggedHours14d.toFixed(1)}h
            <span className="ml-2 text-sm font-normal text-ink-faint">
              vs {targetHours14d}h target
            </span>
          </p>
          <ProgressBar
            className="mt-3"
            value={targetHours14d ? (loggedHours14d / targetHours14d) * 100 : 0}
          />
          <p className="mt-2 text-xs text-ink-faint">
            {paceReady
              ? 'Planner estimates now use this real pace.'
              : `Log ${5 - recentSessions14d.length} more session${5 - recentSessions14d.length === 1 ? '' : 's'} to unlock pace-based planning.`}
          </p>
        </Card>
      </div>

      {/* Fixed P0 Grid Wrapper: Current Phase (2 cols) + Right Column (1 col) */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-accent-soft p-2.5 text-accent">
              <GraduationCap size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
                Current phase
              </p>
              <h3 className="font-semibold tracking-tight">
                Phase {cur.phase.n} — {cur.phase.title}
              </h3>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{cur.phase.description}</p>
          <ProgressBar
            className="mt-4"
            value={
              cur.essentialHours ? (cur.doneEssentialHours / cur.essentialHours) * 100 : 100
            }
          />

          {/* Active Projects & Next Milestone */}
          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <FolderGit2 size={15} className="text-accent" /> Active projects & next actions
              </p>
              <Link to="/projects" className="text-xs font-medium text-accent hover:underline">
                All projects →
              </Link>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {featuredProjects.slice(0, 2).map(({ project, autonomy, doneSteps, totalSteps, nextStep }) => (
                <Link
                  key={project.id}
                  to="/projects"
                  className="rounded-xl border border-line bg-raised/30 p-3.5 transition-all hover:border-accent/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{project.title}</span>
                    <Badge>{doneSteps}/{totalSteps}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">
                    Stage: <span className="font-medium capitalize text-ink-soft">{autonomy.replace(/-/g, ' ')}</span>
                  </p>
                  <p className="mt-2 text-xs text-ink-soft">
                    <span className="font-semibold text-accent">Next: </span>
                    {nextStep}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-line pt-5">
            <p className="text-sm font-semibold">Up next on the essential track</p>
            {upcoming.length === 0 && (
              <p className="text-sm text-ink-soft">
                Everything essential is complete — outstanding. Visit the{' '}
                <Link to="/planner" className="text-accent hover:underline">
                  Planner
                </Link>{' '}
                for what's left.
              </p>
            )}
            {upcoming.map((m) => (
              <Link
                key={m.id}
                to={`/roadmap/${m.id}`}
                className="group flex items-center justify-between rounded-xl border border-line px-4 py-3 transition-all hover:border-accent/40 hover:bg-accent-soft"
              >
                <div>
                  <p className="text-sm font-medium group-hover:text-accent">{m.title}</p>
                  <p className="text-xs text-ink-faint">
                    {m.hours}h · Phase {m.phase}
                  </p>
                </div>
                <ArrowRight size={15} className="text-ink-faint group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Topics in progress (with lifecycle stage & objective progress) */}
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-accent-soft p-2.5 text-accent">
                <Flame size={18} />
              </span>
              <div>
                <h3 className="font-semibold tracking-tight">Topics in progress</h3>
                <p className="text-xs text-ink-faint">Learning · Practising · Confident</p>
              </div>
            </div>
            {activeModules.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">
                Nothing mid-flight. Pick the recommended module above to begin.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {activeModules.slice(0, 5).map((m) => {
                  const rec = moduleRecordOf(data, m.id)
                  const st = stageOf(data, m.id)
                  const mins = moduleMinutesLogged(data, m.id)
                  return (
                    <li key={m.id} className="rounded-xl border border-line bg-raised/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/roadmap/${m.id}`}
                          className="truncate text-sm font-medium text-ink hover:text-accent hover:underline"
                        >
                          {m.title}
                        </Link>
                        <StatusBadge status={st} />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-xs text-ink-faint">
                        <span>
                          {rec.objectivesDone.length}/{m.objectives.length} objectives
                        </span>
                        <span>{mins > 0 ? `${(mins / 60).toFixed(1)}h logged` : `${m.hours}h est.`}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {completedModules.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  Recently mastered ({completedModules.length})
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {completedModules.slice(-4).map((m) => (
                    <Link
                      key={m.id}
                      to={`/roadmap/${m.id}`}
                      className="rounded-md bg-ok/10 px-2 py-0.5 text-xs font-medium text-ok hover:underline"
                    >
                      ✓ {m.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Assessment status */}
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-accent-soft p-2.5 text-accent">
                <ClipboardCheck size={18} />
              </span>
              <h3 className="font-semibold tracking-tight">Diagnostic assessment</h3>
            </div>
            {data.assessment.done ? (
              <div className="mt-3 space-y-2">
                {Object.entries(data.assessment.scores).map(([d, s]) => (
                  <div key={d} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-ink-soft">{d}</span>
                    <span className="font-semibold">{s}/3</span>
                  </div>
                ))}
                <Link to="/assess" className="mt-2 inline-block text-sm text-accent hover:underline">
                  Retake or review →
                </Link>
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-soft">
                  Not taken yet. It takes ~10 minutes and personalises your starting point.
                </p>
                <Link
                  to="/assess"
                  className="mt-3 inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-all hover:bg-accent-hover"
                >
                  Take the diagnostic
                </Link>
              </>
            )}
          </Card>

          {/* Recent quizzes */}
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-accent-soft p-2.5 text-accent">
                <Trophy size={18} />
              </span>
              <h3 className="font-semibold tracking-tight">Recent knowledge checks</h3>
            </div>
            {quizList.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">None yet — lessons have quizzes at the end.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {quizList.slice(0, 4).map(([id, q]) => (
                  <li key={id} className="flex items-center justify-between text-sm">
                    <span className="text-ink-soft">{id.replace(/^(lesson|assessment):/, '').replace(/-/g, ' ')}</span>
                    <span className={`font-semibold ${q.score / q.total >= 0.7 ? 'text-ok' : 'text-bad'}`}>
                      {q.score}/{q.total}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Feature 10: Personal Analytics & Review Report (Weekly / Monthly) */}
      <section className="mt-10">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-accent-soft p-2.5 text-accent">
                <BarChart3 size={18} />
              </span>
              <div>
                <h3 className="font-semibold tracking-tight">Personal analytics & learning review</h3>
                <p className="text-xs text-ink-faint">
                  Outcome-focused review of study hours, skills demonstrated, gaps, and next priorities
                </p>
              </div>
            </div>
            <div className="flex rounded-xl border border-line bg-raised p-1 text-xs font-medium">
              <button
                onClick={() => setReportWindow('7d')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  reportWindow === '7d' ? 'bg-surface text-ink' : 'text-ink-soft hover:text-ink'
                }`}
              >
                Weekly (7d)
              </button>
              <button
                onClick={() => setReportWindow('30d')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  reportWindow === '30d' ? 'bg-surface text-ink' : 'text-ink-soft hover:text-ink'
                }`}
              >
                Monthly (30d)
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-line bg-raised/30 p-4">
              <p className="text-xs text-ink-faint">Actual study time ({reportWindow})</p>
              <p className="mt-1 text-xl font-semibold">
                {windowHours.toFixed(1)}h{' '}
                <span className="text-xs font-normal text-ink-faint">/ {windowTargetHours}h target</span>
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Active on {windowStudyDays} day{windowStudyDays === 1 ? '' : 's'} · {windowSessions.length} session{windowSessions.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="rounded-xl border border-line bg-raised/30 p-4">
              <p className="text-xs text-ink-faint">Topics mastered & practised</p>
              <p className="mt-1 text-xl font-semibold">
                {completedModules.length} mastered · {activeModules.length} active
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {MODULES.filter((m) => stageOf(data, m.id) === 'practising' || stageOf(data, m.id) === 'confident').length}{' '}
                in hands-on practice/confident stage
              </p>
            </div>

            <div className="rounded-xl border border-line bg-raised/30 p-4">
              <p className="text-xs text-ink-faint">Skills demonstrated (evidence)</p>
              <p className="mt-1 text-xl font-semibold">
                {totalEvidenceLinks} repo/proof link{totalEvidenceLinks === 1 ? '' : 's'}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {totalFeynmanCount} Feynman write-up{totalFeynmanCount === 1 ? '' : 's'} · {activeProjects.length} active project{activeProjects.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="rounded-xl border border-line bg-raised/30 p-4">
              <p className="text-xs text-ink-faint">Revision & retention health</p>
              <p className="mt-1 text-xl font-semibold">
                {srsCards.length} card{srsCards.length === 1 ? '' : 's'} · ease {avgEase}
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                {shakyModules.length} shaky module{shakyModules.length === 1 ? '' : 's'} · {openQuestionsCount} open question{openQuestionsCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                <Compass size={14} className="text-accent" /> Next recommended priorities
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                {recommendations.map((r, i) => (
                  <li key={r.module.id} className="flex items-center justify-between gap-2">
                    <Link to={`/roadmap/${r.module.id}`} className="font-medium text-ink hover:text-accent hover:underline">
                      {i + 1}. {r.module.title}
                    </Link>
                    <span className="text-xs text-ink-faint">
                      {r.estimatedTime.remainingHours}h · Wave {waveForModule(r.module.id)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                <BookOpen size={14} className="text-accent" /> Knowledge gaps & postponed items
              </p>
              {shakyModules.length === 0 && weakest.length === 0 ? (
                <p className="mt-2 text-sm text-ink-soft">
                  No critical knowledge gaps flagged right now. Keep logging confidence ratings and quiz checks.
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                  {shakyModules.slice(0, 2).map((m) => (
                    <li key={m.id}>
                      • Confidence marked <span className="font-medium text-warn">{data.confidence[m.id]}</span> on{' '}
                      <Link to={`/roadmap/${m.id}`} className="text-accent hover:underline">
                        {m.title}
                      </Link>
                    </li>
                  ))}
                  {weakest.slice(0, 2).map((w) => (
                    <li key={w.lessonId}>
                      • Quiz score <span className="font-medium text-bad">{Math.round(w.pct * 100)}%</span> on{' '}
                      <Link to={`/learn/${w.lessonId}`} className="text-accent hover:underline">
                        {w.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* All phases */}
      <section className="mt-10">
        <h3 className="mb-4 text-lg font-semibold tracking-tight">Phase-by-phase progress</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {stats.map(({ phase, doneCount, modules, doneEssentialHours, essentialHours }) => {
            const pct = essentialHours ? (doneEssentialHours / essentialHours) * 100 : 100
            return (
              <Link
                key={phase.id}
                to="/curriculum"
                className="rounded-xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    <span className="mr-2 text-xs font-bold uppercase tracking-wide text-accent">
                      P{phase.n}
                    </span>
                    {phase.title}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-ink-faint">
                    {pct === 100 && <CheckCircle2 size={13} className="text-ok" />}
                    {doneCount}/{modules.length}
                  </span>
                </div>
                <ProgressBar className="mt-2.5" value={pct} />
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
