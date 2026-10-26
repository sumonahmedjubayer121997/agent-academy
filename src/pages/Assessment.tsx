import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, Info } from 'lucide-react'
import { useActiveRoadmap } from '../store/activeRoadmap'
import { assessmentOf } from '../store/progress'
import { useProgress } from '../store/progress'
import { Badge, Button, Card, ProgressBar, SectionHead } from '../components/ui'

function recommendation(scores: Record<string, number>): string {
  const py = scores.python ?? 0
  const math = scores.math ?? 0
  const ml = scores.ml ?? 0
  if (py <= 1) return 'Start at Phase 1 · Python Core — the whole track stands on it.'
  if (math <= 1 || ml <= 1)
    return 'Fast-track Phase 1 (your software base is strong) and give Phase 2 real time — the diagnostic flagged math/ML methodology as your highest-leverage gap.'
  if ((scores.dl ?? 0) <= 1)
    return 'Strong foundations. Begin with Phase 3 — deep learning and transformers are your new territory, and Phase 4 (LLM APIs) is only weeks after.'
  return 'Strong across classical areas. You could open Phase 4 (LLM APIs) early for motivation, then circle back to close any remaining Phase 1–3 gaps.'
}

import { usePageMeta } from '../hooks/usePageMeta'
export default function Assessment() {
  const { ASSESSMENT, DOMAIN_CREDIT, DOMAIN_LABELS, MODULES, META } = useActiveRoadmap()
  usePageMeta('Diagnostic assessment', 'Find your real gaps across five domains and credit what you already know.')
  const { data, recordAssessment, applyAssessmentCredit } = useProgress()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [retaking, setRetaking] = useState(false)

  const scores = useMemo(() => {
    const byDomain: Record<string, number> = {}
    ASSESSMENT.forEach((q, i) => {
      byDomain[q.domain] = (byDomain[q.domain] ?? 0) + (answers[i] === q.answer ? 1 : 0)
    })
    return byDomain
  }, [answers])

  const allAnswered = Object.keys(answers).length === ASSESSMENT.length
  const stored = assessmentOf(data, useActiveRoadmap().META.slug)
  const showStored = stored.done && !retaking && !submitted

  if (showStored) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <SectionHead level="h1"
          eyebrow="Assessment"
          title="Your diagnostic results"
          sub="Retake it any time — scores update, and prior-knowledge credit is always yours to apply or ignore."
        />
        <ResultsView scores={stored.scores} applied={stored.applied} />
        <Card className="mt-6 p-6">
          <Button
            variant="secondary"
            onClick={() => {
              setAnswers({})
              setRetaking(true)
            }}
          >
            Retake the assessment
          </Button>
        </Card>
        <p className="mt-4 text-sm text-ink-faint">
          Next: open the{' '}
          <Link to={`/r/${META.slug}/roadmap`} className="text-accent hover:underline">
            roadmap
          </Link>{' '}
          or your{' '}
          <Link to="/dashboard" className="text-accent hover:underline">
            dashboard
          </Link>
          .
        </p>
      </div>
    )
  }

  if (!submitted) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <SectionHead
          eyebrow="Diagnostic assessment"
          title="Where do you actually stand?"
          sub="15 questions across five domains, about 10 minutes. There is no pass mark — this calibrates your starting point so you don't relearn what you know or skip what you don't. Answer honestly; guessing only misplaces you."
        />
        <div className="space-y-4">
          {ASSESSMENT.map((q, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">
                  {i + 1}. {q.q}
                </p>
                <Badge className="shrink-0">{DOMAIN_LABELS[q.domain]}</Badge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                      answers[i] === oi
                        ? 'border-accent bg-accent-soft'
                        : 'border-line hover:border-line-strong hover:bg-raised'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${i}`}
                      className="mt-1 accent-[var(--accent)]"
                      checked={answers[i] === oi}
                      onChange={() => setAnswers({ ...answers, [i]: oi })}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="sticky bottom-4 mt-6">
          <Card className="flex items-center justify-between p-4">
            <p className="text-sm text-ink-soft">
              {Object.keys(answers).length}/{ASSESSMENT.length} answered
            </p>
            <Button
              disabled={!allAnswered}
              onClick={() => {
                setSubmitted(true)
                recordAssessment(scores)
              }}
            >
              <ClipboardCheck size={15} /> Submit assessment
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const creditModules = Object.keys(DOMAIN_CREDIT).flatMap((d) => [
    ...DOMAIN_CREDIT[d].full.map((id) => ({ id, when: 'full' as const })),
    ...DOMAIN_CREDIT[d].partial.map((id) => ({ id, when: 'partial' as const })),
  ])

  return (
    <div className="mx-auto max-w-3xl py-10">
      <SectionHead eyebrow="Assessment" title="Your diagnostic results" />
      <ResultsView scores={scores} applied={false} />
      <Card className="mt-6 p-6">
        <h3 className="font-semibold tracking-tight">Apply prior-knowledge credit?</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          A perfect score in a domain marks its mapped modules <b>completed</b> (a 2/3 marks revision
          modules <b>in progress</b>). This affects:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
          {creditModules.map(({ id, when }) => {
            const m = MODULES.find((x) => x.id === id)!
            return (
              <li key={id} className="flex items-center gap-2">
                <CheckCircle2 size={13} className={when === 'full' ? 'text-ok' : 'text-accent'} />
                {m.title} — {when === 'full' ? 'completed' : 'in progress (revision)'}
              </li>
            )
          })}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => applyAssessmentCredit()}>
            Apply credit
          </Button>
          <Link to={`/r/${META.slug}/roadmap`}>
            <Button variant="secondary">Skip — I'll mark things myself</Button>
          </Link>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs text-ink-faint">
          <Info size={13} className="mt-0.5 shrink-0" />
          Credit is conservative on purpose: it only touches foundational modules you demonstrably
          know. Everything else waits for real completion.
        </p>
      </Card>
    </div>
  )
}

function ResultsView({
  scores,
  applied,
}: {
  scores: Record<string, number>
  applied: boolean
}) {
  const { DOMAIN_LABELS } = useActiveRoadmap()
  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          {Object.keys(DOMAIN_LABELS).map((d) => {
            const s = scores[d] ?? 0
            return (
              <div key={d}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{DOMAIN_LABELS[d]}</span>
                  <span className={`font-semibold ${s === 3 ? 'text-ok' : s === 2 ? 'text-accent' : 'text-bad'}`}>
                    {s}/3
                  </span>
                </div>
                <ProgressBar value={(s / 3) * 100} />
              </div>
            )
          })}
        </div>
      </Card>
      <Card className="mt-4 border-accent/30 bg-accent-soft p-5">
        <p className="text-sm leading-relaxed">
          <span className="font-semibold text-accent">Recommended starting point: </span>
          <span className="text-ink-soft">{recommendation(scores)}</span>
        </p>
        {applied && <p className="mt-2 text-xs text-ink-faint">Prior-knowledge credit applied ✓</p>}
      </Card>
    </>
  )
}
