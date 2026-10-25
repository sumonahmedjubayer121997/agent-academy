import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

/**
 * Few-Shot Context Window Inspector — a deterministic, clearly-labelled sandbox.
 * Allocate a fixed token budget across system instructions, few-shot examples,
 * retrieved data and the user question, and see what survives.
 */
const BUDGETS = [
  { label: '4k', tokens: 4096 },
  { label: '8k', tokens: 8192 },
  { label: '32k', tokens: 32768 },
  { label: '128k', tokens: 131072 },
]

const PRESETS = {
  frugal: { system: 120, examples: 1, exampleTokens: 110, data: 300 },
  balanced: { system: 260, examples: 3, exampleTokens: 130, data: 1200 },
  bloated: { system: 700, examples: 7, exampleTokens: 150, data: 2600 },
}

export default function ContextInspector() {
  const [budget, setBudget] = useState(8192)
  const [system, setSystem] = useState(260)
  const [examples, setExamples] = useState(3)
  const [exampleTokens, setExampleTokens] = useState(130)
  const [data, setData] = useState(1200)

  const exampleTotal = examples * exampleTokens
  // Reserve room for the answer: 15% of budget, always protected
  const answerReserve = Math.round(budget * 0.15)
  const usable = budget - answerReserve
  const used = system + exampleTotal + data
  const over = used - usable

  // What gets cut when over budget (mirrors real truncation order)
  const cuts = useMemo(() => {
    if (over <= 0) return []
    const out: string[] = []
    let excess = over
    const dataCut = Math.min(data, excess)
    if (dataCut > 0) {
      out.push(`${Math.round((dataCut / Math.max(1, data)) * 100)}% of retrieved data truncated (middle-first)`)
      excess -= dataCut
    }
    const exCut = Math.min(exampleTotal, excess)
    if (exCut > 0) {
      const drop = Math.max(1, Math.ceil(exCut / exampleTokens))
      out.push(`${Math.min(drop, examples)} of ${examples} examples silently dropped`)
      excess -= exCut
    }
    if (excess > 0) out.push('system instructions clipped — rules lose their tail')
    return out
  }, [over, data, examples, exampleTotal, exampleTokens])

  const seg = (v: number, color: string, title: string) => {
    const pct = Math.min(100, (v / budget) * 100)
    return (
      <div
        title={title}
        className="h-full min-w-[2px] transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
      />
    )
  }

  return (
    <div className="rounded-xl border border-line bg-raised/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
          Context window inspector · simulated budget
        </p>
        <div className="flex gap-1">
          {BUDGETS.map((b) => (
            <button
              key={b.label}
              onClick={() => setBudget(b.tokens)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                budget === b.tokens ? 'bg-raised text-ink' : 'text-ink-faint hover:bg-raised'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-1.5">
        {[
          { k: 'Frugal' as const, v: 'frugal' },
          { k: 'Balanced' as const, v: 'balanced' },
          { k: 'Bloated' as const, v: 'bloated' },
        ].map(({ k, v }) => (
          <button
            key={v}
            onClick={() => {
              const p = PRESETS[v as keyof typeof PRESETS]
              setSystem(p.system)
              setExamples(p.examples)
              setExampleTokens(p.exampleTokens)
              setData(p.data)
            }}
            className="rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft transition-colors hover:bg-raised"
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { label: `System instructions`, value: system, set: setSystem, max: 2000, step: 20, suffix: 'tok' },
          { label: `Examples (${examples} × ${exampleTokens} = ${exampleTotal} tok)`, value: examples, set: (n: number) => setExamples(Math.max(0, Math.min(10, n))), max: 10, step: 1, suffix: 'count' },
          { label: `Tokens per example`, value: exampleTokens, set: setExampleTokens, max: 400, step: 10, suffix: 'tok' },
          { label: `Retrieved data pasted in`, value: data, set: setData, max: 6000, step: 100, suffix: 'tok' },
        ].map((row) => (
          <label key={row.label} className="block text-xs text-ink-soft">
            <span className="flex items-center justify-between">
              <span>{row.label}</span>
              <span className="font-mono text-ink-faint">
                {row.value} {row.suffix}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={row.max}
              step={row.step}
              value={row.value}
              onChange={(e) => row.set(Number(e.target.value))}
              className="mt-1.5 w-full accent-[var(--accent)]"
            />
          </label>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex h-6 w-full overflow-hidden rounded-md border border-line bg-surface">
          {seg(answerReserve, 'var(--line-strong)', `Answer reserve: ${answerReserve} tok (15%, protected)`)}
          {seg(Math.min(system, Math.max(0, usable)), 'var(--accent)', `System: ${system} tok`)}
          {seg(Math.min(exampleTotal, Math.max(0, usable - system)), 'var(--ok)', `Examples: ${exampleTotal} tok`)}
          {seg(Math.min(data, Math.max(0, usable - system - exampleTotal)), 'var(--ink-soft)', `Data: ${data} tok`)}
          {over > 0 && <div className="h-full flex-1 bg-bad/30" title={`${over} tok over budget`} />}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ink-faint">
          <span>■ answer (protected)</span>
          <span className="text-accent">■ system</span>
          <span className="text-ok">■ examples</span>
          <span>■ data</span>
          {over > 0 && <span className="text-bad">■ over budget</span>}
        </div>
      </div>

      <div
        className={`mt-3 rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed ${
          over <= 0 ? 'border-ok/30 bg-ok/10 text-ink-soft' : 'border-bad/30 bg-bad/10 text-ink-soft'
        }`}
      >
        {over <= 0 ? (
          <span className="flex items-start gap-2">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-ok" />
            Fits: {used.toLocaleString()} of {usable.toLocaleString()} usable tokens ({budget.toLocaleString()} minus a{' '}
            {answerReserve.toLocaleString()}-token answer reserve). Left over: {(usable - used).toLocaleString()} tok.
          </span>
        ) : (
          <span className="flex items-start gap-2">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-bad" />
            <span>
              Over budget by {over.toLocaleString()} tokens. In real pipelines nobody warns you — this happens
              silently:
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {cuts.map((cut) => (
                  <li key={cut}>{cut}</li>
                ))}
              </ul>
            </span>
          </span>
        )}
      </div>
      <p className="mt-2 text-[10px] text-ink-faint">
        Deterministic simulation — token figures are illustrative estimates, not real tokenizer output.
      </p>
    </div>
  )
}
