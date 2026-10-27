import { useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

/**
 * Prompt Anatomy Builder — assemble a prompt from its four parts and see the
 * skeleton form (or fail to). Deterministic, clearly-labelled sandbox.
 */
const PARTS = {
  instruction: {
    label: 'Instruction',
    color: 'var(--accent)',
    text: 'Extract the sender name, email address, and urgency from the support email below. Use only what is stated.',
  },
  context: {
    label: 'Context',
    color: 'var(--ok)',
    text: 'Urgency levels: urgent (today), normal (this week), low (whenever). If the email does not state a deadline, urgency is normal.',
  },
  input: {
    label: 'Input data',
    color: 'var(--ink-soft)',
    text: '<email>\nHi, this is Dana from Acme. My dashboard has shown a blank page since 9am and we have a client demo today at 4pm — please help! dana@acme.co\n</email>',
  },
  format: {
    label: 'Output format',
    color: 'var(--line-strong)',
    text: 'Return exactly one JSON object with keys: sender (string), email (string), urgency ("urgent" | "normal" | "low"). No prose, no markdown fences.',
  },
} as const

type PartKey = keyof typeof PARTS

const PRESETS: Record<string, Record<PartKey, boolean>> = {
  Vague: { instruction: true, context: false, input: true, format: false },
  Skeleton: { instruction: true, context: true, input: true, format: true },
  Overloaded: { instruction: true, context: true, input: true, format: true },
}

export default function AnatomyBuilder() {
  const [on, setOn] = useState<Record<PartKey, boolean>>(PRESETS.Vague)

  const missing: string[] = []
  if (!on.instruction) missing.push('No instruction — the model must guess the task itself.')
  if (!on.format) missing.push('No output format — parsing the result is hope-based.')
  if (!on.input) missing.push('No input marked — instructions and data blur together.')
  if (on.context && on.instruction === false) missing.push('Context without instruction is a history lesson, not a task.')

  const order: PartKey[] = ['instruction', 'context', 'input', 'format']
  const score = order.filter((k) => on[k]).length

  return (
    <div className="rounded-xl border border-line bg-raised/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
        Prompt anatomy builder · one task, four parts
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            onClick={() => setOn(PRESETS[name])}
            className="rounded-md border border-line px-2.5 py-1 text-xs text-ink-soft transition-colors hover:bg-raised"
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {order.map((key) => (
          <label
            key={key}
            className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs transition-colors ${
              on[key] ? 'border-line bg-surface' : 'border-dashed border-line bg-transparent opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={on[key]}
              onChange={(e) => setOn((s) => ({ ...s, [key]: e.target.checked }))}
              className="mt-0.5 accent-[var(--accent)]"
            />
            <span>
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: PARTS[key].color }}>
                <span className="inline-block h-2 w-2 rounded-sm" style={{ background: PARTS[key].color }} />
                {PARTS[key].label}
              </span>
              <span className="mt-1 block whitespace-pre-wrap leading-relaxed text-ink-soft">{PARTS[key].text}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
          Assembled prompt ({score}/4 parts)
        </p>
        <pre className="mt-1.5 overflow-x-auto rounded-lg border border-line bg-surface p-3 font-mono text-[11px] leading-relaxed text-ink-soft">
          {order.filter((k) => on[k]).map((k) => `[${PARTS[k].label}]\n${PARTS[k].text}`).join('\n\n') || '(empty — nothing sent)'}
        </pre>
      </div>

      <div
        className={`mt-3 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${
          missing.length === 0 ? 'border-ok/30 bg-ok/10 text-ink-soft' : 'border-bad/30 bg-bad/10 text-ink-soft'
        }`}
      >
        {missing.length === 0 ? (
          <span className="flex items-start gap-2">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-ok" />
            Complete skeleton: task, rules, data, and contract all present. Order matters — instructions
            first, data last, so the contract is set before the noise arrives.
          </span>
        ) : (
          <span className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-bad" />
            <ul className="list-disc space-y-0.5 pl-4">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </span>
        )}
      </div>
      <p className="mt-2 text-[10px] text-ink-faint">Static example texts — toggle the parts, not the words.</p>
    </div>
  )
}
