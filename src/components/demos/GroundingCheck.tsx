import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

/**
 * Grounding Check — classify answers against their sources: grounded,
 * contradicts, or not-in-sources. Deterministic, clearly-labelled drill
 * teaching the grounding contract by judgment, not lecture.
 */
type Verdict = 'grounded' | 'contradicts' | 'absent'

const CASES: Array<{
  question: string
  source: string
  answer: string
  correct: Verdict
  why: string
}> = [
  {
    question: 'What is the battery warranty?',
    source: 'Warranty page: "All bikes include a 2-year battery warranty from the delivery date."',
    answer: 'The battery is covered for two years from the delivery date. [1]',
    correct: 'grounded',
    why: 'Every claim restates the source faithfully and cites it — this is the contract working.',
  },
  {
    question: 'Can I return a used bike?',
    source: 'Returns policy: "Used or ridden bikes cannot be returned. Unridden bikes: 30 days."',
    answer: 'You can return it within 30 days, no problem! [1]',
    correct: 'contradicts',
    why: 'The source excludes used bikes; the answer dropped the exclusion and over-generalized the 30-day rule. A grounded bot must refuse this specific case.',
  },
  {
    question: 'Does the warranty cover water damage?',
    source: 'Warranty page: "All bikes include a 2-year battery warranty from the delivery date." (nothing about water)',
    answer: 'Water damage is covered for the first year. [1]',
    correct: 'absent',
    why: 'The source says nothing about water damage — the answer invented a policy and attached a citation to hide it. This is the most dangerous failure class: plausible + cited + false.',
  },
]

const VERDICTS: Array<{ id: Verdict; label: string }> = [
  { id: 'grounded', label: 'Grounded — answer from source' },
  { id: 'contradicts', label: 'Contradicts the source' },
  { id: 'absent', label: 'Not in the sources' },
]

export default function GroundingCheck() {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<Verdict | null>(null)
  const c = CASES[i]
  const done = picked !== null
  const right = picked === c.correct

  return (
    <div className="rounded-xl border border-line bg-raised/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
        Grounding check · judge the answer against its source
      </p>

      <div className="mt-3 flex items-center gap-1.5">
        {CASES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setI(idx)
              setPicked(null)
            }}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              idx === i ? 'bg-raised text-ink' : 'text-ink-faint hover:bg-raised'
            }`}
          >
            Case {idx + 1}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2.5 text-xs leading-relaxed">
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">User asks</p>
          <p className="mt-1 text-ink">{c.question}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Retrieved source</p>
          <p className="mt-1 text-ink-soft">{c.source}</p>
        </div>
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Bot answer</p>
          <p className="mt-1 text-ink">{c.answer}</p>
        </div>
      </div>

      {!done ? (
        <div className="mt-3 space-y-1.5">
          {VERDICTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setPicked(v.id)}
              className="w-full rounded-lg border border-line px-3 py-2 text-left text-xs font-medium text-ink-soft transition-colors hover:bg-raised"
            >
              {v.label}
            </button>
          ))}
        </div>
      ) : (
        <div
          className={`mt-3 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${
            right ? 'border-ok/30 bg-ok/10 text-ink-soft' : 'border-bad/30 bg-bad/10 text-ink-soft'
          }`}
        >
          <p className="flex items-center gap-1.5 font-semibold">
            {right ? <CheckCircle2 size={13} className="text-ok" /> : <XCircle size={13} className="text-bad" />}
            {right ? 'Correct — ' : 'Not quite — '}
            this answer {c.correct === 'grounded' ? 'is grounded' : c.correct === 'contradicts' ? 'contradicts the source' : 'invents what the sources never said'}.
          </p>
          <p className="mt-1.5">{c.why}</p>
          <button
            onClick={() => {
              setPicked(null)
              if (i < CASES.length - 1) setI(i + 1)
            }}
            className="mt-2 text-accent hover:underline"
          >
            {i < CASES.length - 1 ? 'Next case →' : 'Replay case →'}
          </button>
        </div>
      )}
      <p className="mt-2 text-[10px] text-ink-faint">Three fixed cases — the skill is the judgment, not the clicks.</p>
    </div>
  )
}
