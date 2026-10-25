import { useState } from 'react'
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'

/**
 * Structured Output Step-Through — a scripted, clearly-labelled walk from a
 * prompt + schema to invalid output, validation errors, the repair prompt,
 * and a valid parsed record. Illustrates why JSON mode alone is not trust.
 */
const SCHEMA = `{
  "title": string,          // movie title, verbatim
  "year": number,           // release year
  "genre": "action" | "comedy" | "drama" | "sci-fi",
  "rating_out_of_10": number
}`

const INPUT = `Review: "Watched Dune Part Two again — honestly a 9.5, every frame
of that sci-fi epic earns its runtime. Better than the first one."`

const OUTPUT_V1 = `{
  "title": "Dune Part Two",
  "year": null,
  "genre": "science-fiction",
  "rating": "9.5/10"
}`

const ERRORS = [
  'year: expected number, received null — if unknown, omit the field (it is optional)',
  'genre: value must be one of ["action", "comedy", "drama", "sci-fi"], received "science-fiction"',
  'rating_out_of_10: field is missing (a stray "rating" key was found — check spelling)',
]

const REPAIR_PROMPT = `Your previous output failed schema validation. Fix ONLY the
errors below and return the corrected JSON, nothing else:

1. year: expected number, received null — omit if unknown
2. genre: must be one of ["action","comedy","drama","sci-fi"]
3. rating_out_of_10 is missing (found "rating" instead)`

const OUTPUT_V2 = `{
  "title": "Dune Part Two",
  "genre": "sci-fi",
  "rating_out_of_10": 9.5
}`

const STEPS = [
  { title: 'Task + schema', body: 'task' },
  { title: 'First output', body: 'v1' },
  { title: 'Validation', body: 'errors' },
  { title: 'Repair prompt', body: 'repair' },
  { title: 'Repaired output', body: 'v2' },
] as const

function Mono({ children }: { children: string }) {
  return (
    <pre className="mt-1 overflow-x-auto rounded-lg border border-line bg-surface p-3 font-mono text-xs leading-relaxed text-ink-soft">
      {children}
    </pre>
  )
}

export default function StructuredStepthrough() {
  const [i, setI] = useState(0)
  const step = STEPS[i]

  return (
    <div className="rounded-xl border border-line bg-raised/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
        Structured output step-through · scripted simulation
      </p>

      <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, idx) => (
          <button
            key={s.title}
            onClick={() => setI(idx)}
            className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              idx === i ? 'bg-raised text-ink' : 'text-ink-faint hover:bg-raised'
            }`}
          >
            <span className="font-mono">{idx + 1}</span> {s.title}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {step.body === 'task' && (
          <div className="text-sm leading-relaxed text-ink-soft">
            <p>
              Extract structured data from a movie review. JSON mode is ON — so the output is guaranteed to
              <i> parse</i>. The schema is the contract your program needs:
            </p>
            <Mono>{SCHEMA}</Mono>
            <p className="mt-2">Input text:</p>
            <Mono>{INPUT}</Mono>
          </div>
        )}
        {step.body === 'v1' && (
          <div className="text-sm leading-relaxed text-ink-soft">
            <p>
              The model returns valid JSON — and a program that trusts it crashes anyway. Three contract
              violations hide in here:
            </p>
            <Mono>{OUTPUT_V1}</Mono>
          </div>
        )}
        {step.body === 'errors' && (
          <div className="text-sm leading-relaxed text-ink-soft">
            <p>Validate programmatically (pydantic / zod). The errors are precise, actionable feedback:</p>
            <ul className="mt-2 space-y-1.5">
              {ERRORS.map((e) => (
                <li key={e} className="flex items-start gap-2 rounded-lg border border-bad/30 bg-bad/10 px-3 py-1.5">
                  <XCircle size={13} className="mt-0.5 shrink-0 text-bad" /> {e}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step.body === 'repair' && (
          <div className="text-sm leading-relaxed text-ink-soft">
            <p>
              Feed the errors back <b>verbatim</b> — specific feedback turns a hopeful re-roll into a targeted
              fix:
            </p>
            <Mono>{REPAIR_PROMPT}</Mono>
          </div>
        )}
        {step.body === 'v2' && (
          <div className="text-sm leading-relaxed text-ink-soft">
            <p>Repaired output — validates, parses, and the program proceeds:</p>
            <Mono>{OUTPUT_V2}</Mono>
            <p className="mt-2 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-ok" />
              <span>
                Passing it through the validator again is not optional — repair loops always end with a final
                check, or a loud failure.
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setI((v) => Math.max(0, v - 1))}
          disabled={i === 0}
          className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-raised disabled:opacity-40"
        >
          <ChevronLeft size={13} /> Back
        </button>
        <span className="text-xs text-ink-faint">
          {i + 1} / {STEPS.length}
        </span>
        <button
          onClick={() => setI((v) => Math.min(STEPS.length - 1, v + 1))}
          disabled={i === STEPS.length - 1}
          className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-raised disabled:opacity-40"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
      <p className="mt-2 flex items-center gap-1 text-[10px] text-ink-faint">
        <ArrowRight size={10} /> Scripted, deterministic example — no model is called.
      </p>
    </div>
  )
}
