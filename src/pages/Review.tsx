import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Layers, XCircle } from 'lucide-react'
import { LESSONS } from '../content/lessons'
import { dueCards, todayStr, useProgress } from '../store/progress'
import { Badge, Button, Card, ProgressBar, SectionHead } from '../components/ui'

/**
 * Spaced-repetition review session: due cards from every lesson quiz,
 * mixed together (interleaving), one at a time. Answering correctly/incorrectly
 * IS the grade — no self-assessment needed for objective MCQs.
 */
export default function Review() {
  const { data, gradeCard, logSession } = useProgress()
  const lessonById = useMemo(() => new Map(LESSONS.map((l) => [l.id, l])), [])

  const due = useMemo(() => {
    const cards = dueCards(data, todayStr())
    return cards
      .map((c) => {
        const lesson = lessonById.get(c.lessonId)
        const q = lesson?.quiz[c.qIndex]
        return lesson && q ? { ...c, lesson, q } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [data, lessonById])

  const [i, setI] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [done, setDone] = useState(false)

  const current = due[i]
  const revealed = selected !== null

  const finishCard = (correct: boolean) => {
    gradeCard(current.cardId, correct)
    const next = [...results, correct]
    setResults(next)
    if (i + 1 >= due.length) {
      logSession('review', Math.max(1, Math.round(due.length * 0.75)))
      setDone(true)
    } else {
      setI(i + 1)
      setSelected(null)
    }
  }

  if (due.length === 0) {
    return (
      <div className="py-16">
        <SectionHead
          eyebrow="Review"
          title="Nothing due right now"
          sub="Cards enter the queue when you complete a lesson quiz, and come back just before you're likely to forget. Take a lesson to seed your first cards."
        />
        <div className="flex flex-wrap gap-3">
          {LESSONS.map((l) => (
            <Link
              key={l.id}
              to={`/learn/${l.id}`}
              className="rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium shadow-soft transition-all hover:-translate-y-0.5 hover:text-accent"
            >
              {l.title} <ArrowRight size={13} className="ml-1 inline" />
            </Link>
          ))}
        </div>
      </div>
    )
  }

  if (done) {
    const correct = results.filter(Boolean).length
    return (
      <div className="mx-auto max-w-2xl py-16">
        <Card className="p-8 text-center">
          <CheckCircle2 size={36} className="mx-auto text-ok" />
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Review complete</h2>
          <p className="mt-2 text-ink-soft">
            {correct}/{results.length} correct — this session (~{Math.max(1, Math.round(due.length * 0.75))} min) was
            logged. Missed cards return tomorrow; correct ones grow their intervals.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/dashboard">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="mb-4 flex items-center justify-between">
        <SectionHead
          eyebrow="Spaced review"
          title="Today's cards"
          sub="Mixed across lessons — recognition practice, not re-reading."
        />
      </div>
      <div className="mb-4 flex items-center gap-3">
        <Badge tone="accent">
          <Layers size={12} /> {i + 1} / {due.length}
        </Badge>
        <ProgressBar value={(i / due.length) * 100} className="flex-1" />
      </div>

      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          from: {current.lesson.title}
        </p>
        <p className="mt-2 font-medium leading-relaxed">{current.q.q}</p>
        <div className="mt-4 space-y-2">
          {current.q.options.map((opt, oi) => {
            const isChosen = selected === oi
            const isCorrect = revealed && oi === current.q.answer
            const isWrong = revealed && isChosen && oi !== current.q.answer
            return (
              <button
                key={oi}
                disabled={revealed}
                onClick={() => setSelected(oi)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                  isCorrect
                    ? 'border-ok bg-ok/10'
                    : isWrong
                      ? 'border-bad bg-bad/10'
                      : isChosen
                        ? 'border-accent bg-accent-soft'
                        : 'border-line hover:border-line-strong hover:bg-raised'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {revealed && (
          <div className="mt-4 space-y-4">
            <p
              className={`rounded-xl px-4 py-3 text-sm ${
                selected === current.q.answer ? 'bg-ok/10 text-ink-soft' : 'bg-bad/10 text-ink-soft'
              }`}
            >
              <span className="font-semibold">
                {selected === current.q.answer ? (
                  <span className="inline-flex items-center gap-1 text-ok">
                    <CheckCircle2 size={14} /> Correct.{' '}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-bad">
                    <XCircle size={14} /> Not quite.{' '}
                  </span>
                )}
              </span>
              {current.q.explain}
            </p>
            <div className="flex items-center justify-between">
              <Link
                to={`/learn/${current.lesson.id}`}
                className="text-xs text-ink-faint hover:text-accent hover:underline"
              >
                re-read the lesson →
              </Link>
              <Button onClick={() => finishCard(selected === current.q.answer)}>
                {i + 1 >= due.length ? 'Finish session' : 'Next card'} <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
