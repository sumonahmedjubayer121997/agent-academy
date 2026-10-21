import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, Clock, Package, Target } from 'lucide-react'
import { MODULES } from '../content/modules'
import { PHASES } from '../content/phases'
import { isUnlocked, statusOf, useProgress } from '../store/progress'
import { Badge, Button, Card, StatusBadge } from '../components/ui'

export default function ModuleDetail() {
  const { moduleId } = useParams()
  const { data, setStatus } = useProgress()
  const m = MODULES.find((x) => x.id === moduleId)

  if (!m) {
    return (
      <div className="py-24 text-center">
        <p className="text-xl font-semibold">Module not found.</p>
        <Link to="/curriculum" className="mt-2 inline-block text-accent hover:underline">
          Back to curriculum
        </Link>
      </div>
    )
  }

  const phase = PHASES.find((p) => p.n === m.phase)!
  const status = statusOf(data, m.id)
  const unlocked = isUnlocked(data, m)
  const prereqs = m.prereqs.map((id) => MODULES.find((x) => x.id === id)!)
  const unlocks = MODULES.filter((x) => x.prereqs.includes(m.id))

  return (
    <div className="py-10">
      <Link to="/roadmap" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent">
        <ArrowLeft size={14} /> Roadmap
      </Link>

      {!unlocked && (
        <Card className="mt-4 border-bad/30 bg-bad/5 p-4">
          <p className="flex items-start gap-2 text-sm text-ink-soft">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-bad" />
            <span>
              <span className="font-semibold text-ink">Prerequisites not completed.</span> You can
              still explore freely — the recommended path finishes first:{' '}
              {prereqs.filter((p) => statusOf(data, p.id) !== 'completed').map((p) => p.title).join(', ')}.
            </span>
          </p>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Phase {m.phase} · {phase.title}</Badge>
            <Badge>{m.difficulty}</Badge>
            <Badge tone={m.essential ? 'ok' : 'neutral'}>
              {m.essential ? 'Essential' : 'Optional specialisation'}
            </Badge>
            {m.project && <Badge tone="accent">Checkpoint project</Badge>}
            <Badge>
              <Clock size={11} /> {m.hours}h
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{m.title}</h1>
          <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">
            <span className="font-semibold text-ink">Why it matters: </span>
            {m.why}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Status control */}
      <div className="mt-6 inline-flex rounded-xl border border-line bg-surface p-1 shadow-soft">
        {(['not-started', 'in-progress', 'completed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(m.id, s)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium capitalize transition-all ${
              status === s ? 'bg-accent text-accent-ink shadow-soft' : 'text-ink-soft hover:bg-raised'
            }`}
          >
            {s.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-semibold tracking-tight">
            <Target size={16} className="text-accent" /> Learning objectives
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
            {m.objectives.map((o) => (
              <li key={o} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {o}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-semibold tracking-tight">
            <CheckCircle2 size={16} className="text-accent" /> Completion criteria
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
            {m.completion.map((c) => (
              <li key={c} className="flex gap-2">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-ok" />
                {c}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-semibold tracking-tight">
            <Package size={16} className="text-accent" /> Portfolio deliverable
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{m.deliverable}</p>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold tracking-tight">Dependencies</h2>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Requires
              </p>
              {prereqs.length === 0 ? (
                <p className="text-ink-soft">No prerequisites — start anytime.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {prereqs.map((p) => (
                    <Link key={p.id} to={`/roadmap/${p.id}`}>
                      <Badge tone={statusOf(data, p.id) === 'completed' ? 'ok' : 'neutral'}>
                        {statusOf(data, p.id) === 'completed' ? '✓ ' : ''}
                        {p.title}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {unlocks.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Unlocks
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unlocks.map((u) => (
                    <Link key={u.id} to={`/roadmap/${u.id}`}>
                      <Badge>{u.title}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {m.lessonId && (
        <Card className="mt-6 border-accent/30 bg-accent-soft p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-semibold tracking-tight">
                <BookOpen size={16} className="text-accent" /> Full interactive lesson available
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                This module has a complete nine-section lesson: explanation → intuition →
                visualisation → code walkthrough → exercise → knowledge check.
              </p>
            </div>
            <Link to={`/learn/${m.lessonId}`}>
              <Button>
                Open lesson <ArrowLeft size={14} className="rotate-180" />
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
