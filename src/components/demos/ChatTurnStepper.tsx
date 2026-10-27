import { useState } from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'

/**
 * Chat Turn Stepper — walk a 6-turn conversation and see exactly what the
 * model receives each turn: persona, memory, retrieved docs, history, message.
 * Deterministic, clearly-labelled simulation of per-turn assembly.
 */
type Slot = { label: string; color: string }

const TURNS: Array<{
  user: string
  bot: string
  slots: Slot[]
  retrieved: number // chunks
  historyTurns: number
  tokens: number
  note?: string
}> = [
  {
    user: 'hi, I need help with my order',
    bot: 'Happy to help — could I get your order number?',
    slots: [{ label: 'intent: order-help', color: 'var(--accent)' }],
    retrieved: 0,
    historyTurns: 0,
    tokens: 210,
  },
  {
    user: 'order 55421',
    bot: 'Found it — it ships Thursday. Anything else about this order?',
    slots: [
      { label: 'intent: order-help', color: 'var(--accent)' },
      { label: 'order_id: 55421', color: 'var(--ok)' },
    ],
    retrieved: 1,
    historyTurns: 2,
    tokens: 480,
  },
  {
    user: 'can I change the delivery address?',
    bot: 'Yes — what is the new address?',
    slots: [
      { label: 'intent: change-address', color: 'var(--accent)' },
      { label: 'order_id: 55421', color: 'var(--ok)' },
    ],
    retrieved: 1,
    historyTurns: 4,
    tokens: 705,
  },
  {
    user: '12 Station Road, and I asked you to use bullet points — remember that',
    bot: 'Updated:\n- New address: 12 Station Road\n- Ships Thursday',
    slots: [
      { label: 'intent: change-address', color: 'var(--accent)' },
      { label: 'order_id: 55421', color: 'var(--ok)' },
      { label: 'address: 12 Station Rd', color: 'var(--ok)' },
      { label: 'CONSTRAINT: bullets', color: 'var(--bad)' },
    ],
    retrieved: 1,
    historyTurns: 6,
    tokens: 980,
    note: 'The user just set a CONSTRAINT. Where it lives decides whether it survives turn 20.',
  },
  {
    user: 'great. also, is the battery covered by warranty?',
    bot: '- Checking the warranty page...\n- Battery: 2-year warranty, applies to your order.',
    slots: [
      { label: 'order_id: 55421', color: 'var(--ok)' },
      { label: 'address: 12 Station Rd', color: 'var(--ok)' },
      { label: 'CONSTRAINT: bullets', color: 'var(--bad)' },
    ],
    retrieved: 2,
    historyTurns: 8,
    tokens: 1310,
    note: 'A new topic — retrieval runs AGAIN this turn. The constraint held because it is stored, not remembered.',
  },
  {
    user: 'perfect, summarize everything we did',
    bot: '- Changed delivery address on order 55421\n- Confirmed 2-year battery warranty\n- Ships Thursday',
    slots: [
      { label: 'order_id: 55421', color: 'var(--ok)' },
      { label: 'address: 12 Station Rd', color: 'var(--ok)' },
      { label: 'CONSTRAINT: bullets', color: 'var(--bad)' },
    ],
    retrieved: 0,
    historyTurns: 10,
    tokens: 1650,
    note: 'Full history would keep growing ~300 tokens/turn — this is where compaction and slots pay for themselves.',
  },
]

const BUDGET = 2048

export default function ChatTurnStepper() {
  const [i, setI] = useState(0)
  const t = TURNS[i]
  const pct = Math.min(100, Math.round((t.tokens / BUDGET) * 100))

  return (
    <div className="rounded-xl border border-line bg-raised/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
        Chat turn stepper · what the model receives per turn
      </p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-medium text-ink-soft">Turn {i + 1} of {TURNS.length}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setI((v) => Math.max(0, v - 1))}
            disabled={i === 0}
            className="rounded-lg border border-line p-1.5 text-ink-soft transition-colors hover:bg-raised disabled:opacity-40"
            aria-label="Previous turn"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => setI((v) => Math.min(TURNS.length - 1, v + 1))}
            disabled={i === TURNS.length - 1}
            className="rounded-lg border border-line p-1.5 text-ink-soft transition-colors hover:bg-raised disabled:opacity-40"
            aria-label="Next turn"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">User says</p>
          <p className="mt-1 leading-relaxed text-ink">{t.user}</p>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Bot answers</p>
          <p className="mt-1 whitespace-pre-line leading-relaxed text-ink-soft">{t.bot}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Assembled context</p>
          <ul className="mt-1.5 space-y-1.5 leading-relaxed text-ink-soft">
            <li>Persona + rules <span className="text-ink-faint">(~150 tok, every turn)</span></li>
            <li>Structured slots: {t.slots.length > 0 ? '' : 'none yet'}
              <span className="ml-1 inline-flex flex-wrap gap-1">
                {t.slots.map((s) => (
                  <span key={s.label} className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px]" style={{ color: s.color }}>
                    {s.label}
                  </span>
                ))}
              </span>
            </li>
            <li>Retrieved chunks: <span className="font-mono">{t.retrieved}</span></li>
            <li>Recent history: <span className="font-mono">{t.historyTurns}</span> turns</li>
            <li>New message <span className="text-ink-faint">({t.user.length} chars)</span></li>
          </ul>
          <div className="mt-3">
            <div className="flex h-4 w-full overflow-hidden rounded border border-line">
              <div className="h-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 font-mono text-[10px] text-ink-faint">
              ~{t.tokens} / {BUDGET} tok context budget ({pct}%)
            </p>
          </div>
        </div>
      </div>

      {t.note && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-surface px-3.5 py-2.5 text-xs leading-relaxed text-ink-soft">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-accent" />
          {t.note}
        </p>
      )}
      <p className="mt-2 text-[10px] text-ink-faint">
        Deterministic simulation — one designed conversation; real token counts vary by model.
      </p>
    </div>
  )
}
