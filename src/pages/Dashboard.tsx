import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ClipboardCheck, Flame, GraduationCap, Trophy } from 'lucide-react'
import { currentPhase, nextUp, phaseStats, streak, totals, useProgress } from '../store/progress'
import { Card, ProgressBar, SectionHead, Stat, StatusBadge } from '../components/ui'

export default function Dashboard() {
  const { data, logStudyDay } = useProgress()
  const t = totals(data)
  const stats = phaseStats(data)
  const cur = currentPhase(data)
  const upcoming = nextUp(data, 3)
  const days = streak(data.activity)
  const quizList = Object.entries(data.quiz).sort((a, b) => b[1].at.localeCompare(a[1].at))
  const quizAvg = quizList.length
    ? Math.round((quizList.reduce((s, [, q]) => s + q.score / q.total, 0) / quizList.length) * 100)
    : null
  const inProgress = stats
    .flatMap((s) => s.modules)
    .filter((m) => data.moduleStatus[m.id] === 'in-progress')

  return (
    <div className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHead
          eyebrow="Dashboard"
          title="Your learning picture"
          sub="Every number here is computed from your recorded activity — nothing is simulated."
        />
        <button
          onClick={logStudyDay}
          className="mb-6 rounded-xl border border-line-strong bg-surface px-4 py-2 text-sm font-medium transition-all hover:bg-raised active:scale-[0.98]"
        >
          Mark today as a study day
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Essential track"
          value={`${Math.round((t.essentialHoursDone / t.essentialHoursTotal) * 100)}%`}
          sub={`${t.essentialHoursDone}h of ${t.essentialHoursTotal}h guided`
          }
        />
        <Stat
          label="Full track (incl. optional)"
          value={`${Math.round((t.hoursDone / t.hoursTotal) * 100)}%`}
          sub={`${t.modulesDone} of ${t.modulesTotal} modules`}
        />
        <Stat
          label="Learning streak"
          value={days > 0 ? `${days} day${days === 1 ? '' : 's'}` : '—'}
          sub={days > 0 ? 'Keep it alive today' : 'Start one: mark a study day'}
        />
        <Stat
          label="Quiz performance"
          value={quizAvg === null ? '—' : `${quizAvg}%`}
          sub={`${quizList.length} quiz${quizList.length === 1 ? '' : 'zes'} taken`}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* Current phase */}
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
          <div className="mt-6 space-y-3">
            <p className="text-sm font-semibold">Up next on the essential track</p>
            {upcoming.length === 0 && (
              <p className="text-sm text-ink-soft">
                Everything essential is complete — outstanding. Visit the{' '}
                <Link to="/planner" className="text-accent hover:underline">
                  Planner
                </Link>
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
                  className="mt-3 inline-flex rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink shadow-soft transition-all hover:bg-accent-hover"
                >
                  Take the diagnostic
                </Link>
              </>
            )}
          </Card>

          {/* Resume / revision */}
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-accent-soft p-2.5 text-accent">
                <Flame size={18} />
              </span>
              <h3 className="font-semibold tracking-tight">In progress — resume?</h3>
            </div>
            {inProgress.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">
                Nothing mid-flight. Pick the next module from “Up next”.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {inProgress.slice(0, 4).map((m) => (
                  <li key={m.id}>
                    <Link to={`/roadmap/${m.id}`} className="text-sm text-ink-soft hover:text-accent hover:underline">
                      {m.title}
                    </Link>
                  </li>
                ))}
              </ul>
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
                className="rounded-2xl border border-line bg-surface p-4 shadow-soft transition-all hover:-translate-y-0.5"
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
