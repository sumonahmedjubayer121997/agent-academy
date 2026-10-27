import { useState } from 'react'
import { CheckCircle2, TerminalSquare } from 'lucide-react'

/**
 * Fake Provider Console — pick a scripted behavior and see the deterministic
 * response your tests assert against. Offline, instant, reproducible.
 */
type Scenario = 'happy' | 'rate' | 'timeout' | 'malformed'

const SCENARIOS: Record<Scenario, { label: string; config: string; outcome: string; assertion: string }> = {
  happy: {
    label: 'Happy path',
    config: 'fake.responses = [{ text: "urgent", finishReason: "stop" }]',
    outcome: 'Result { text: "urgent", usage: { in: 142, out: 3 }, finishReason: "stop" }',
    assertion: 'expect(result.text).toBe("urgent")  ✓ deterministic — same every run',
  },
  rate: {
    label: '429 storm',
    config: 'fake.failNext(3, { status: 429 })',
    outcome: ' throws ProviderError { status: 429, retryable: true }  (3 times, then succeeds)',
    assertion: 'expect(calls).toHaveLength(4)  ✓ retry layer tested without one real request',
  },
  timeout: {
    label: 'Timeout',
    config: 'fake.delayNext(10_000)',
    outcome: ' aborts at the client read-timeout — no real clock waiting in tests (timers mocked)',
    assertion: 'expect(elapsed).toBeLessThan(50)  ✓ slow paths tested fast',
  },
  malformed: {
    label: 'Malformed JSON',
    config: 'fake.nextText = "{ urgent: " — broken JSON on purpose',
    outcome: ' validator raises: expected property name at position 2',
    assertion: 'expect(() => parse(result.text)).toThrow()  ✓ repair loop tested offline',
  },
}

export default function FakeProviderConsole() {
  const [scen, setScen] = useState<Scenario>('happy')
  const s = SCENARIOS[scen]

  return (
    <div className="rounded-xl border border-line bg-raised/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
        Fake provider console · scripted behaviors
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(Object.keys(SCENARIOS) as Scenario[]).map((k) => (
          <button
            key={k}
            onClick={() => setScen(k)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              scen === k ? 'bg-raised text-ink' : 'text-ink-faint hover:bg-raised'
            }`}
          >
            {SCENARIOS[k].label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2.5 text-[11px] leading-relaxed">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">1 · Test arranges the fake</p>
          <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-surface p-2.5 font-mono text-ink-soft">{s.config}</pre>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">2 · Code under test runs</p>
          <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-surface p-2.5 font-mono text-ink-soft">{s.outcome}</pre>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">3 · Assertion (offline, instant)</p>
          <pre className="mt-1 overflow-x-auto rounded-lg border border-ok/30 bg-ok/10 p-2.5 font-mono text-ink-soft">{s.assertion}</pre>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
        <CheckCircle2 size={13} className="text-ok" />
        Whole suite: no network, no API key, no flakiness — the same script replays identically in CI.
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-[10px] text-ink-faint">
        <TerminalSquare size={11} /> Scripted simulation — one real-provider smoke test runs separately, nightly.
      </p>
    </div>
  )
}
