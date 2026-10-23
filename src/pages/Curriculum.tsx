import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Lock, Search } from 'lucide-react'
import { MODULES } from '../content/modules'
import { isUnlocked, phaseStats, statusOf, useProgress } from '../store/progress'
import { ask, type AskResult } from '../lib/api'
import { Badge, Card, ProgressBar, SectionHead } from '../components/ui'

function AskTheRoadmap() {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<AskResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim().length < 3) return
    setBusy(true)
    setError(null)
    setResult(null)
    const r = await ask(q.trim())
    setBusy(false)
    if (r.ok) setResult(r.data)
    else setError(r.error)
  }

  return (
    <Card className="mb-8 border-accent/30 bg-accent-soft p-6">
      <h2 className="flex items-center gap-2 font-semibold tracking-tight">
        <Search size={16} className="text-accent" /> Ask the Roadmap
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Ask anything about the curriculum — answers cite the exact sections they came from.
        {result && (
          <span className="ml-1 text-xs text-ink-faint">
            (provider: {result.provider}
            {result.provider === 'fake' ? ' — extractive demo, connect a real provider for generated answers' : ''})
          </span>
        )}
      </p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. why does cosine ignore document length?"
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-2 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || q.trim().length < 3}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink shadow-soft transition-all hover:bg-accent-hover disabled:opacity-40"
        >
          {busy ? 'Searching…' : 'Ask'}
        </button>
      </form>
      {error && <p className="mt-3 rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{error}</p>}
      {result && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          <p className="text-sm leading-relaxed text-ink-soft">{result.answer}</p>
          {result.citations.length > 0 && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Citations</p>
              <div className="flex flex-wrap gap-1.5">
                {result.citations.map((c) => (
                  <Link key={c.id} to={c.route}>
                    <Badge>{c.title}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function Curriculum() {
  const { data, cycleStatus } = useProgress()
  const stats = phaseStats(data)

  return (
    <div className="py-10">
      <SectionHead
        eyebrow="Curriculum"
        title="Eight phases, forty-four modules"
        sub="Click a module title for objectives, criteria, deliverables and dependencies. The status button on the left cycles Not started → In progress → Completed."
      />

      <AskTheRoadmap />

      <div className="space-y-10">
        {stats.map(({ phase, modules, doneCount, doneEssentialHours, essentialHours }) => (
          <section key={phase.id} aria-labelledby={`phase-${phase.id}`}>
            <Card className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-accent">
                    Phase {phase.n}
                  </p>
                  <h2 id={`phase-${phase.id}`} className="mt-1 text-xl font-semibold tracking-tight">
                    {phase.title}
                  </h2>
                  <p className="mt-1 text-sm italic text-ink-faint">{phase.tagline}</p>
                </div>
                <div className="min-w-[180px] text-right text-sm text-ink-soft">
                  {doneCount}/{modules.length} modules
                  <ProgressBar
                    className="mt-1.5"
                    value={essentialHours ? (doneEssentialHours / essentialHours) * 100 : 100}
                  />
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{phase.description}</p>
              <p className="mt-2 rounded-xl bg-raised px-4 py-2.5 text-sm">
                <span className="font-semibold">Outcome: </span>
                <span className="text-ink-soft">{phase.outcome}</span>
              </p>
            </Card>

            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
              {modules.map((m) => {
                const status = statusOf(data, m.id)
                const unlocked = isUnlocked(data, m)
                return (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised/60">
                    <button
                      onClick={() => cycleStatus(m.id)}
                      aria-label={`Cycle status for ${m.title} (currently ${status.replace('-', ' ')})`}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${
                        status === 'completed'
                          ? 'border-accent bg-accent text-accent-ink'
                          : status === 'in-progress'
                            ? 'border-accent text-accent'
                            : 'border-line-strong text-ink-faint hover:border-accent hover:text-accent'
                      }`}
                    >
                      {status === 'completed' ? '✓' : status === 'in-progress' ? '◐' : '○'}
                    </button>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/roadmap/${m.id}`}
                        className="text-sm font-medium hover:text-accent hover:underline"
                      >
                        {m.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {m.hours}h
                        </span>
                        {m.project && <span className="text-accent">◆ project checkpoint</span>}
                        {!m.essential && <span>◇ optional</span>}
                        {!unlocked && (
                          <span className="flex items-center gap-1">
                            <Lock size={11} /> prereqs open
                          </span>
                        )}
                        {m.lessonId && (
                          <Link
                            to={`/learn/${m.lessonId}`}
                            className="flex items-center gap-1 text-accent hover:underline"
                          >
                            <BookOpen size={11} /> lesson
                          </Link>
                        )}
                      </div>
                    </div>
                    <Badge
                      tone={
                        status === 'completed' ? 'ok' : status === 'in-progress' ? 'accent' : 'neutral'
                      }
                      className="hidden sm:inline-flex"
                    >
                      {status.replace('-', ' ')}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-ink-faint">
        {MODULES.length} modules · {MODULES.reduce((s, m) => s + m.hours, 0)} guided hours ·
        {' '}content lives separately from app code, so it grows without touching the platform.
      </p>
    </div>
  )
}
