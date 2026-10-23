import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Braces,
  Building2,
  Calculator,
  CheckCircle2,
  Code2,
  Compass,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  PencilLine,
  Play,
} from 'lucide-react'
import { LESSONS } from '../content/lessons'
import type { QuizQ } from '../content/types'
import { statusOf, useProgress } from '../store/progress'
import { Badge, Button, Card } from '../components/ui'
import LoopVisual from '../components/demos/LoopVisual'
import VectorSim from '../components/demos/VectorSim'

function Section({
  n,
  icon: Icon,
  title,
  children,
}: {
  n: number
  icon: typeof BookOpen
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon size={16} />
        </span>
        <h2 className="font-semibold tracking-tight">
          <span className="mr-2 text-ink-faint">{n}.</span>
          {title}
        </h2>
      </div>
      {children}
    </Card>
  )
}

function LessonQuiz({ quiz, quizId, moduleId }: { quiz: QuizQ[]; quizId: string; moduleId: string }) {
  const { recordQuiz, setConfidence } = useProgress()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [confidence, setLocalConfidence] = useState<string | null>(null)
  const score = quiz.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0)
  const allAnswered = Object.keys(answers).length === quiz.length

  return (
    <div className="space-y-6">
      {!submitted && (
        <div>
          <p className="text-sm font-medium">Before you start — how confident are you in this material?</p>
          <div className="mt-2 flex gap-2">
            {(['sure', 'shaky', 'lost'] as const).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setLocalConfidence(c)
                  setConfidence(moduleId, c)
                }}
                className={`rounded-lg border px-3.5 py-1.5 text-sm capitalize transition-all ${
                  confidence === c
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-line-strong text-ink-soft hover:bg-raised'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      {quiz.map((q, i) => {
        const chosen = answers[i]
        return (
          <div key={i} className="rounded-xl border border-line bg-raised/50 p-5">
            <p className="font-medium">
              {i + 1}. {q.q}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => {
                const isChosen = chosen === oi
                const isCorrect = submitted && oi === q.answer
                const isWrong = submitted && isChosen && oi !== q.answer
                return (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-all ${
                      isCorrect
                        ? 'border-ok bg-ok/10'
                        : isWrong
                          ? 'border-bad bg-bad/10'
                          : isChosen
                            ? 'border-accent bg-accent-soft'
                            : 'border-line hover:border-line-strong hover:bg-raised'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${i}`}
                      className="mt-1 accent-[var(--accent)]"
                      checked={isChosen}
                      disabled={submitted}
                      onChange={() => setAnswers({ ...answers, [i]: oi })}
                    />
                    <span>{opt}</span>
                  </label>
                )
              })}
            </div>
            {submitted && (
              <p
                className={`mt-3 rounded-lg px-3.5 py-2.5 text-sm ${
                  chosen === q.answer ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-ink-soft'
                }`}
              >
                <span className="font-semibold">
                  {chosen === q.answer ? 'Correct. ' : 'Not quite. '}
                </span>
                {q.explain}
              </p>
            )}
          </div>
        )
      })}
      {!submitted ? (
        <Button
          disabled={!allAnswered}
          onClick={() => {
            setSubmitted(true)
            recordQuiz(quizId, score, quiz.length, quiz.map((q, i) => answers[i] === q.answer))
          }}
        >
          {allAnswered ? 'Check answers' : `Answer all ${quiz.length} questions`}
        </Button>
      ) : (
        <p className="flex items-center gap-2 font-semibold">
          <CheckCircle2 size={18} className={score === quiz.length ? 'text-ok' : 'text-accent'} />
          Score: {score}/{quiz.length} — recorded on your Dashboard. Re-read the section above and
          reload to retry.
        </p>
      )}
    </div>
  )
}

function PreQuestion({ q }: { q: NonNullable<import('../content/types').Lesson['pre']> }) {
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <Card className="border-accent/25 bg-accent-soft p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        Warm-up · retrieval before reading
      </p>
      <p className="mt-2 font-medium leading-relaxed">{q.q}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {q.options.map((opt, oi) => (
          <button
            key={oi}
            disabled={picked !== null}
            onClick={() => setPicked(oi)}
            className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-all ${
              picked === null
                ? 'border-line bg-surface hover:border-accent/50'
                : oi === q.answer
                  ? 'border-ok bg-ok/10'
                  : picked === oi
                    ? 'border-bad bg-bad/10'
                    : 'border-line bg-surface opacity-60'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {picked !== null && (
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          <span className="font-semibold">{picked === q.answer ? 'Right — ' : 'Good attempt — '}</span>
          {q.explain}
        </p>
      )}
    </Card>
  )
}

export default function LessonPage() {
  const { lessonId } = useParams()
  const { data, setStatus } = useProgress()
  const lesson = LESSONS.find((l) => l.id === lessonId)

  if (!lesson) {
    return (
      <div className="py-24 text-center">
        <p className="text-xl font-semibold">Lesson not found.</p>
        <Link to="/curriculum" className="mt-2 inline-block text-accent hover:underline">
          Back to curriculum
        </Link>
      </div>
    )
  }

  const moduleStatus = statusOf(data, lesson.moduleId)

  return (
    <article className="mx-auto max-w-3xl py-10">
      <Link
        to={`/roadmap/${lesson.moduleId}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent"
      >
        <ArrowLeft size={14} /> Module page
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">Interactive lesson</Badge>
          <Badge>~{lesson.minutes} min</Badge>
          {moduleStatus === 'not-started' && (
            <button
              onClick={() => setStatus(lesson.moduleId, 'in-progress')}
              className="text-xs font-medium text-accent hover:underline"
            >
              mark module in progress →
            </button>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{lesson.title}</h1>
        <p className="mt-2 text-lg text-ink-soft">{lesson.tagline}</p>
      </header>

      <div className="mt-8 space-y-6">
        {lesson.pre && <PreQuestion q={lesson.pre} />}

        <Section n={1} icon={BookOpen} title="Simple explanation">
          {lesson.simple.map((p, i) => (
            <p key={i} className="mb-3 leading-relaxed text-ink-soft last:mb-0">
              {p}
            </p>
          ))}
        </Section>

        <Section n={2} icon={Lightbulb} title={`Intuition — ${lesson.intuition.analogy}`}>
          {lesson.intuition.paragraphs.map((p, i) => (
            <p key={i} className="mb-3 leading-relaxed text-ink-soft last:mb-0">
              {p}
            </p>
          ))}
        </Section>

        <Section n={3} icon={Braces} title="Technical explanation">
          {lesson.technical.map((p, i) => (
            <p key={i} className="mb-3 leading-relaxed text-ink-soft last:mb-0">
              {p}
            </p>
          ))}
          {lesson.deeper && (
            <details className="group mt-5 rounded-xl border border-line">
              <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-accent">
                Go deeper — university-level layer (optional)
              </summary>
              <div className="border-t border-line px-4 py-4">
                {lesson.deeper.map((p, i) => (
                  <p key={i} className="mb-3 text-sm leading-relaxed text-ink-soft last:mb-0">
                    {p}
                  </p>
                ))}
              </div>
            </details>
          )}
        </Section>

        {lesson.numbers && (
          <Section n={4} icon={Calculator} title={lesson.numbers.title}>
            <table className="w-full text-sm">
              <tbody>
                {lesson.numbers.rows.map(([k, v]) => (
                  <tr key={k} className="border-b border-line last:border-0">
                    <td className="py-2.5 pr-4 text-ink-soft">{k}</td>
                    <td className="py-2.5 text-right font-mono text-[13px] font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm leading-relaxed text-ink-soft">
              <span className="font-semibold text-accent">Takeaway: </span>
              {lesson.numbers.takeaway}
            </p>
          </Section>
        )}

        {lesson.demo && (
          <Section n={lesson.numbers ? 5 : 4} icon={Play} title="Visualisation — try it yourself">
            {lesson.demo === 'agent-loop' ? <LoopVisual /> : <VectorSim />}
          </Section>
        )}

        <Section n={lesson.demo && lesson.numbers ? 6 : 5} icon={Code2} title="Code walkthrough">
          <pre className="overflow-x-auto rounded-xl bg-raised p-5 text-[13px] leading-relaxed">
            <code>{lesson.walkthrough.code}</code>
          </pre>
          <ol className="mt-5 space-y-3">
            {lesson.walkthrough.notes.map(([line, note]) => (
              <li key={line} className="flex gap-3 text-sm">
                <code className="mt-0.5 h-fit shrink-0 rounded bg-accent-soft px-2 py-0.5 font-mono text-[12px] text-accent">
                  {line}
                </code>
                <span className="leading-relaxed text-ink-soft">{note}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section n={lesson.demo && lesson.numbers ? 7 : 6} icon={PencilLine} title="Hands-on exercise">
          <p className="leading-relaxed text-ink-soft">{lesson.exercise.prompt}</p>
          <details className="group mt-4 rounded-xl border border-line">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-accent">
              Reveal a worked solution
            </summary>
            <pre className="overflow-x-auto border-t border-line px-4 py-4 text-[13px] leading-relaxed">
              <code>{lesson.exercise.solution}</code>
            </pre>
          </details>
        </Section>

        <Section n={lesson.demo && lesson.numbers ? 8 : 7} icon={HelpCircle} title="Knowledge check">
          <LessonQuiz quiz={lesson.quiz} quizId={`lesson:${lesson.id}`} moduleId={lesson.moduleId} />
        </Section>

        <Section n={lesson.demo && lesson.numbers ? 9 : 8} icon={Building2} title="Where you'll meet this in the real world">
          <ul className="space-y-2.5">
            {lesson.realWorld.map((p, i) => (
              <li key={i} className="flex gap-2.5 leading-relaxed text-ink-soft">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {p}
              </li>
            ))}
          </ul>
        </Section>

        <Section n={lesson.demo && lesson.numbers ? 10 : 9} icon={Compass} title="Further learning">
          <ul className="space-y-3">
            {lesson.further.map((f) => (
              <li key={f.url}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  {f.label} <ExternalLink size={12} className="ml-0.5 inline" />
                </a>
                <p className="mt-0.5 text-sm text-ink-soft">{f.note}</p>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </article>
  )
}
