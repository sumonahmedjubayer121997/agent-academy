import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Cost Meter — a deterministic, clearly-labelled sandbox for unit economics
 * of a model-backed feature: usage sliders x illustrative price tables,
 * per-day and per-month cost, against a budget line.
 */
const MODELS = [
  { id: 'nano', label: 'illustrative-nano', inPerM: 0.15, outPerM: 0.6 },
  { id: 'standard', label: 'illustrative-standard', inPerM: 3, outPerM: 12 },
  { id: 'large', label: 'illustrative-large', inPerM: 15, outPerM: 60 },
]

export default function CostMeter() {
  const [model, setModel] = useState('standard')
  const [reqPerDay, setReqPerDay] = useState(500)
  const [inTokens, setInTokens] = useState(1200)
  const [outTokens, setOutTokens] = useState(400)
  const [budget, setBudget] = useState(50)

  const m = MODELS.find((x) => x.id === model) ?? MODELS[1]

  const calc = useMemo(() => {
    const perReq = (inTokens / 1e6) * m.inPerM + (outTokens / 1e6) * m.outPerM
    const perDay = perReq * reqPerDay
    return {
      perReq,
      perDay,
      perMonth: perDay * 30,
      tokensDay: (inTokens + outTokens) * reqPerDay,
      over: perDay * 30 > budget,
    }
  }, [inTokens, outTokens, reqPerDay, m])

  const fmt = (v: number) => (v >= 100 ? `$${v.toFixed(0)}` : v >= 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(4)}`)

  return (
    <div className="rounded-xl border border-line bg-raised/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
        Feature cost meter · illustrative prices
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {MODELS.map((x) => (
          <button
            key={x.id}
            onClick={() => setModel(x.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              model === x.id ? 'bg-raised text-ink' : 'text-ink-faint hover:bg-raised'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { label: 'Requests per day', value: reqPerDay, set: setReqPerDay, max: 20000, step: 100, suffix: 'req/day' },
          { label: 'Avg input tokens', value: inTokens, set: setInTokens, max: 8000, step: 50, suffix: 'tok in' },
          { label: 'Avg output tokens', value: outTokens, set: setOutTokens, max: 4000, step: 50, suffix: 'tok out' },
          { label: 'Monthly budget', value: budget, set: setBudget, max: 500, step: 5, suffix: 'USD/mo' },
        ].map((row) => (
          <label key={row.label} className="block text-xs text-ink-soft">
            <span className="flex items-center justify-between">
              <span>{row.label}</span>
              <span className="font-mono text-ink-faint">
                {row.value.toLocaleString()} {row.suffix}
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

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs">
          <p className="text-ink-faint">Per request</p>
          <p className="font-mono text-sm font-semibold">{fmt(calc.perReq)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs">
          <p className="text-ink-faint">Per day ({(calc.tokensDay / 1e6).toFixed(2)}M tokens)</p>
          <p className="font-mono text-sm font-semibold">{fmt(calc.perDay)}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs">
          <p className="text-ink-faint">Per 30 days</p>
          <p className={`font-mono text-sm font-semibold ${calc.over ? 'text-bad' : 'text-ok'}`}>{fmt(calc.perMonth)}</p>
        </div>
      </div>

      <p
        className={`mt-3 rounded-lg border px-3.5 py-2 text-xs leading-relaxed ${
          calc.over ? 'border-bad/30 bg-bad/10 text-ink-soft' : 'border-ok/30 bg-ok/10 text-ink-soft'
        }`}
      >
        {calc.over ? (
          <>
            <AlertTriangle size={12} className="mr-1 inline text-bad" />
            Over budget by {fmt(calc.perMonth - budget)}/mo. The levers, in order of leverage: cache repeated
            prefixes (Phase 2), route easy traffic to a smaller model, cap output tokens, then negotiate volume.
            This is the alert your gateway fires at 80%.
          </>
        ) : (
          <>
            Within budget, using {Math.round((calc.perMonth / Math.max(1, budget)) * 100)}% of the monthly line.
            Ledger attribution (feature + user tags) is what makes this number trustworthy instead of vibes.
          </>
        )}
      </p>
      <p className="mt-2 text-[10px] text-ink-faint">
        Illustrative prices only — real deployments read live per-model pricing into the same ledger math.
      </p>
    </div>
  )
}
