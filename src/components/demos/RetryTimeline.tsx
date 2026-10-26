import { useMemo, useState } from 'react'
import { RefreshCw, XCircle, Zap, CheckCircle2 } from 'lucide-react'

/**
 * Retry & Backoff Timeline — a deterministic, clearly-labelled sandbox.
 * Compose a response sequence for one logical call and watch the retry
 * policy decide: backoff schedule, elapsed time, and circuit-breaker state.
 */
type Resp = '429' | '500' | 'timeout' | '400' | '200'

const RESP_META: Record<Resp, { label: string; retryable: boolean; note: string }> = {
  '429': { label: '429 rate limit', retryable: true, note: 'Transient — retry after backoff (respect Retry-After when present)' },
  '500': { label: '500 server error', retryable: true, note: 'Transient — retry after backoff' },
  timeout: { label: 'timeout', retryable: true, note: 'Transient — retry after backoff (already cost the read-timeout)' },
  '400': { label: '400 bad request', retryable: false, note: 'Client error — will fail identically on retry. Fix the request.' },
  '200': { label: '200 success', retryable: false, note: 'Done — return the response' },
}

const MAX_ATTEMPTS = 4
const BASE_MS = 500
const READ_TIMEOUT_MS = 10_000
// Fixed pseudo-jitter so the timeline is deterministic between renders
const JITTER = [0.1, 0.4, 0.25, 0.35]

export default function RetryTimeline() {
  const [seq, setSeq] = useState<Resp[]>(['429', '429', '200'])

  const steps = useMemo(() => {
    const out: Array<{ resp: Resp; action: string; waitMs: number; elapsedMs: number; done: boolean }> = []
    let elapsed = 0
    let consecutiveFailures = 0
    let breaker = 'closed'
    for (let i = 0; i < seq.length; i++) {
      const resp = seq[i]
      const meta = RESP_META[resp]
      const attempt = i + 1
      elapsed += resp === 'timeout' ? READ_TIMEOUT_MS : 200
      consecutiveFailures = meta.retryable ? consecutiveFailures + 1 : 0
      if (consecutiveFailures >= 3 && breaker === 'closed') breaker = 'open (fail fast now)'
      const last = i === seq.length - 1
      if (!meta.retryable && resp === '200') {
        out.push({ resp, action: 'return response', waitMs: 0, elapsedMs: elapsed, done: true })
        break
      }
      if (!meta.retryable) {
        out.push({ resp, action: 'fail fast — no retry for client errors', waitMs: 0, elapsedMs: elapsed, done: true })
        break
      }
      if (attempt >= MAX_ATTEMPTS || last) {
        out.push({ resp, action: 'exhausted retries — surface the error (fallback ladder next)', waitMs: 0, elapsedMs: elapsed, done: true })
        break
      }
      const waitMs = Math.round(BASE_MS * 2 ** (attempt - 1) * (1 + JITTER[i % JITTER.length]))
      elapsed += waitMs
      out.push({ resp, action: `retry in ${waitMs} ms`, waitMs, elapsedMs: elapsed, done: false })
    }
    return { out, breaker }
  }, [seq])

  const total = steps.out.length ? steps.out[steps.out.length - 1].elapsedMs : 0
  const outcome = steps.out[steps.out.length - 1]

  return (
    <div className="rounded-xl border border-line bg-raised/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
        Retry &amp; backoff timeline · simulated policy
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {(['429', '500', 'timeout', '400', '200'] as Resp[]).map((r) => (
          <button
            key={r}
            onClick={() => setSeq((s) => [...s, r])}
            className="rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-raised"
          >
            + {RESP_META[r].label}
          </button>
        ))}
        <button
          onClick={() => setSeq(['429', '429', '200'])}
          className="rounded-md px-2 py-1 text-xs font-medium text-ink-faint hover:bg-raised"
        >
          reset
        </button>
      </div>

      <div className="mt-4 space-y-1.5">
        {steps.out.map((s, i) => {
          const Icon = s.resp === '200' ? CheckCircle2 : RESP_META[s.resp].retryable ? RefreshCw : XCircle
          return (
            <div key={i} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs">
              <span className="w-16 shrink-0 font-mono text-ink-faint">try {i + 1}</span>
              <Icon size={13} className={s.resp === '200' ? 'shrink-0 text-ok' : RESP_META[s.resp].retryable ? 'shrink-0 text-accent' : 'shrink-0 text-bad'} />
              <span className="w-24 shrink-0 font-mono">{RESP_META[s.resp].label}</span>
              <span className="min-w-0 flex-1 text-ink-soft">{s.action}</span>
              <span className="shrink-0 font-mono text-ink-faint">@ {(s.elapsedMs / 1000).toFixed(1)}s</span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs">
          <p className="text-ink-faint">Total elapsed</p>
          <p className="font-mono text-sm font-semibold">{(total / 1000).toFixed(1)}s</p>
        </div>
        <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs">
          <p className="text-ink-faint">Attempts used</p>
          <p className="font-mono text-sm font-semibold">{steps.out.length} / {MAX_ATTEMPTS}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs">
          <p className="text-ink-faint">Circuit breaker</p>
          <p className="font-mono text-sm font-semibold">{steps.breaker}</p>
        </div>
      </div>

      {outcome && (
        <p className="mt-3 rounded-lg bg-ok/10 px-3.5 py-2 text-xs leading-relaxed text-ink-soft">
          <Zap size={12} className="mr-1 inline text-ok" />
          {RESP_META[outcome.resp].note}
          {outcome.action.includes('exhausted') && ' — this is where the Phase-5 fallback ladder takes over.'}
        </p>
      )}
      <p className="mt-2 text-[10px] text-ink-faint">
        Deterministic simulation — base 500ms, exponential ×2 with fixed pseudo-jitter, read-timeout 10s, max 4 attempts.
      </p>
    </div>
  )
}
