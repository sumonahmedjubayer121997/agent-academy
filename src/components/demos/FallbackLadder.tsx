import { useState } from 'react'
import { Cpu, Zap, Database, Clock, XCircle, Send, RotateCcw, Eye } from 'lucide-react'

/**
 * Fallback Ladder — a deterministic, clearly-labelled sandbox for degradation
 * design. Pick a failure scenario, send requests one at a time, and watch each
 * descend the rungs: which rung served it, what it cost, and exactly what the
 * user was told. No timers, no randomness — every outcome is scripted data.
 */
type RungId = 'primary' | 'small' | 'cache' | 'queue' | 'apology'

const RUNGS: Array<{
  id: RungId
  label: string
  icon: typeof Cpu
  latency: string
  quality: string
  costX: string
  message: string
}> = [
  { id: 'primary', label: 'Rung 1 · Primary model', icon: Cpu, latency: '~1.8 s', quality: '0.94', costX: '1.0×', message: '' },
  { id: 'small', label: 'Rung 2 · Smaller model', icon: Zap, latency: '~1.1 s', quality: '0.88', costX: '0.1×', message: 'Answering with our lighter assistant.' },
  { id: 'cache', label: 'Rung 3 · Cached answer', icon: Database, latency: '~40 ms', quality: '0.80', costX: '~0×', message: 'Showing a recent answer to a similar question (3 days old).' },
  { id: 'queue', label: 'Rung 4 · Queued + notify', icon: Clock, latency: '~10 min, async', quality: '0.90 later', costX: '0.4×', message: 'High demand — your answer will arrive in ~10 minutes.' },
  { id: 'apology', label: 'Rung 5 · Honest apology', icon: XCircle, latency: 'instant', quality: 'nothing served', costX: '0×', message: 'We cannot answer right now. Try again shortly — here is what you can do meanwhile.' },
]

type Req = { rung: RungId; why: string }

type Scenario = { id: string; label: string; blurb: string; script: Req[] }

const SCENARIOS: Scenario[] = [
  {
    id: 'healthy',
    label: 'Healthy traffic',
    blurb: 'Everything nominal — the ladder exists but stays invisible.',
    script: [
      { rung: 'primary', why: 'primary answers in ~1.8 s' },
      { rung: 'primary', why: 'primary answers in ~1.8 s' },
      { rung: 'primary', why: 'primary answers in ~1.8 s' },
    ],
  },
  {
    id: 'brownout',
    label: 'Rate-limit storm',
    blurb: '429s on the primary, retries exhaust, the breaker flaps — and recovers mid-scenario.',
    script: [
      { rung: 'primary', why: 'primary answers before the limits bite' },
      { rung: 'small', why: 'primary 429 ×4 → retries exhausted → smaller model serves, badge shown' },
      { rung: 'small', why: 'half-open probe fails again → smaller model serves once more' },
      { rung: 'primary', why: 'limits lift — probe succeeds, breaker closes, primary resumes' },
    ],
  },
  {
    id: 'outage',
    label: 'Provider outage (2 h)',
    blurb: 'Primary and small model both down, breaker open — cache and queue carry the load.',
    script: [
      { rung: 'cache', why: 'breaker open (fail fast) · small model also down → cache hit, staleness labeled' },
      { rung: 'cache', why: 'another cached answer, age shown to the user' },
      { rung: 'queue', why: 'cache miss → queued with a ~10 min expectation + notification' },
      { rung: 'apology', why: 'queue backing up past its promise → honest apology with a next action' },
    ],
  },
  {
    id: 'blackout',
    label: 'Total blackout',
    blurb: 'Every rung but the last is down — the apology earns its keep.',
    script: [
      { rung: 'queue', why: 'cache cold → queue the request, notify on completion' },
      { rung: 'apology', why: 'queue full → apology, retry affordance, alternative flow offered' },
      { rung: 'apology', why: 'apology again — designed copy, no raw error, no spinner' },
    ],
  },
]

const RUNG_TONE: Record<RungId, string> = {
  primary: 'text-ok',
  small: 'text-accent',
  cache: 'text-accent',
  queue: 'text-accent',
  apology: 'text-bad',
}

export default function FallbackLadder() {
  const [scenarioId, setScenarioId] = useState('brownout')
  const [sent, setSent] = useState(0)

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[1]
  const served = scenario.script.slice(0, sent)
  const current = served[served.length - 1]

  const counts: Record<RungId, number> = { primary: 0, small: 0, cache: 0, queue: 0, apology: 0 }
  for (const r of served) counts[r.rung] += 1
  const degradedPct = sent > 0 ? Math.round(((sent - counts.primary) / sent) * 100) : 0

  return (
    <div className="rounded-xl border border-line bg-raised/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
        Fallback ladder · simulated degradation
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setScenarioId(s.id)
              setSent(0)
            }}
            className={
              'rounded-md border px-2 py-1 text-xs font-medium transition-colors ' +
              (s.id === scenarioId
                ? 'border-accent text-accent'
                : 'border-line text-ink-soft hover:bg-raised')
            }
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-faint">{scenario.blurb}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSent((n) => Math.min(n + 1, scenario.script.length))}
          disabled={sent >= scenario.script.length}
          className={
            'inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-raised ' +
            (sent >= scenario.script.length ? 'cursor-not-allowed opacity-50' : '')
          }
        >
          <Send size={12} />
          {sent >= scenario.script.length ? 'scenario complete — pick another' : 'send next request'}
        </button>
        <button
          onClick={() => setSent(0)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-faint hover:bg-raised"
        >
          <RotateCcw size={11} /> reset
        </button>
      </div>

      <div className="mt-4 space-y-1.5">
        {RUNGS.map((r) => {
          const active = current?.rung === r.id
          return (
            <div
              key={r.id}
              className={
                'flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border px-3 py-2 text-xs ' +
                (active ? 'border-accent bg-accent-soft/40' : 'border-line bg-surface')
              }
            >
              <r.icon size={13} className={'shrink-0 ' + (active ? RUNG_TONE[r.id] : 'text-ink-faint')} />
              <span className="w-40 shrink-0 font-medium">{r.label}</span>
              <span className="w-24 shrink-0 font-mono text-ink-faint">{r.latency}</span>
              <span className="w-20 shrink-0 font-mono text-ink-faint">q {r.quality}</span>
              <span className="w-12 shrink-0 font-mono text-ink-faint">{r.costX}</span>
              <span className="ml-auto shrink-0 font-mono text-ink-faint">
                {counts[r.id] > 0 ? '×' + counts[r.id] : '—'}
              </span>
            </div>
          )
        })}
      </div>

      {current && (
        <div className="mt-3 space-y-1.5">
          <p className="rounded-lg bg-surface px-3.5 py-2 text-xs leading-relaxed text-ink-soft">
            <span className="font-mono text-ink-faint">request {sent}:</span> {current.why}
          </p>
          <p className="rounded-lg bg-accent-soft/30 px-3.5 py-2 text-xs leading-relaxed text-ink-soft">
            <Eye size={12} className="mr-1 inline text-accent" />
            <span className="font-medium">User saw:</span>{' '}
            {current.rung === 'primary'
              ? 'Nothing unusual — a normal answer.'
              : '“' + RUNGS.find((r) => r.id === current.rung)!.message + '”'}
          </p>
        </div>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs">
          <p className="text-ink-faint">Requests sent</p>
          <p className="font-mono text-sm font-semibold">
            {sent} / {scenario.script.length}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs">
          <p className="text-ink-faint">Served degraded (rung 2+)</p>
          <p className="font-mono text-sm font-semibold">{sent > 0 ? degradedPct + '%' : '—'}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs">
          <p className="text-ink-faint">Raw errors shown</p>
          <p className="font-mono text-sm font-semibold">0 — by design</p>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-ink-faint">
        Deterministic simulation — scripted scenarios, no live model calls. Latency, quality, and cost
        figures are illustrative teaching values, not measurements of any real provider.
      </p>
    </div>
  )
}
