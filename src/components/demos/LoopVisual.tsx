import { useEffect, useState } from 'react'

export const LOOP_STAGES = [
  {
    name: 'Observe',
    caption: 'Read the latest tool result or user message — this is all the agent "sees".',
  },
  {
    name: 'Reason',
    caption: 'The model decides: call a tool, or produce the final answer?',
  },
  {
    name: 'Act',
    caption: 'Your runtime executes the requested tool with real permissions and checks.',
  },
  {
    name: 'Evaluate',
    caption: 'Check progress, budgets, and stopping rules before looping again.',
  },
]

export default function LoopVisual({ compact = false }: { compact?: boolean }) {
  const [i, setI] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    if (mq.matches) return
    const t = setInterval(() => setI((v) => (v + 1) % LOOP_STAGES.length), 1300)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1.5">
        {LOOP_STAGES.map((s, idx) => (
          <div key={s.name} className="flex flex-1 items-center gap-1.5">
            <div
              className={`flex-1 rounded-xl border px-2 py-3 text-center text-[12px] font-semibold transition-all duration-300 ${
                idx === i
                  ? 'border-accent bg-accent-soft text-accent shadow-soft scale-[1.03]'
                  : 'border-line bg-surface text-ink-faint'
              }`}
            >
              {s.name}
              {idx === i && <span className="mt-1 block text-[10px] font-normal text-accent">● live</span>}
            </div>
            {idx < LOOP_STAGES.length - 1 && (
              <span className={`text-xs transition-colors ${idx < i ? 'text-accent' : 'text-ink-faint'}`}>→</span>
            )}
          </div>
        ))}
        <span className="ml-1 text-xs text-ink-faint" aria-hidden>
          ↺
        </span>
      </div>
      {!compact && (
        <p className="mt-4 rounded-xl bg-raised px-4 py-3 text-sm text-ink-soft">
          <span className="font-semibold text-ink">{LOOP_STAGES[i].name}: </span>
          {LOOP_STAGES[i].caption}
          {reduced && ' (animation reduced for accessibility — the loop is the idea, not the motion)'}
        </p>
      )}
    </div>
  )
}
