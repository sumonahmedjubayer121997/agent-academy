import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Flame,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react'
import { CURRICULUM_DECK, type DeckCard } from '../content/cards'
import { LESSONS } from '../content/lessons'
import { MODULES } from '../content/modules'
import { dueCards, stageOf, todayStr, useProgress } from '../store/progress'
import type { RecallGrade } from '../lib/srs'
import { Badge, Button, Card, ProgressBar, SectionHead } from '../components/ui'

/**
 * Spaced-repetition & active-recall review session:
 * - Snapshots the session card queue at start so grading a card (which moves its due date
 *   to the future in `data.srs`) NEVER shrinks the active array mid-session or skips cards.
 * - Supports both objective MCQs (`lesson:`, `assess:`) and active-recall flashcards
 *   (`module:`, `glossary:`, `edge:`, `custom:`) with 4-grade SM-2 scheduling.
 */
export default function Review() {
  const { data, gradeCard, logSession, seedModuleCards, addCustomCard, deleteCustomCard } =
    useProgress()

  // Build unified card catalog: curriculum deck + any lesson quizzes + user's custom flashcards
  const cardCatalog = useMemo(() => {
    const map = new Map<string, DeckCard>()
    for (const c of CURRICULUM_DECK) {
      map.set(c.cardId, c)
    }
    for (const l of LESSONS) {
      l.quiz.forEach((q, idx) => {
        const id = `lesson:${l.id}:q${idx}`
        if (!map.has(id)) {
          map.set(id, {
            cardId: id,
            moduleId: l.moduleId,
            moduleTitle: l.title,
            phase: 1,
            kind: 'mcq',
            prompt: q.q,
            answer: q.explain,
            options: q.options,
            correctOption: q.answer,
            lessonId: l.id,
          })
        }
      })
    }
    for (const custom of data.customCards ?? []) {
      const mod = MODULES.find((m) => m.id === custom.moduleId)
      map.set(custom.id, {
        cardId: custom.id,
        moduleId: custom.moduleId,
        moduleTitle: mod?.title ?? custom.moduleId,
        phase: mod?.phase ?? 1,
        kind: 'flashcard',
        prompt: custom.prompt,
        answer: custom.answer,
      })
    }
    return map
  }, [data.customCards])

  // Compute cards currently due in `data.srs`
  const dueNow = useMemo(() => {
    const rawDue = dueCards(data, todayStr())
    return rawDue
      .map((d) => cardCatalog.get(d.cardId))
      .filter((x): x is DeckCard => Boolean(x))
  }, [data, cardCatalog])

  // Snapshot the active session queue so grading cards does not mutate array indices mid-flight
  const [sessionQueue, setSessionQueue] = useState<DeckCard[]>(() => dueNow)
  const [sessionMode, setSessionMode] = useState<'due' | 'drill'>('due')
  const [i, setI] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [flashcardRevealed, setFlashcardRevealed] = useState(false)
  const [scratchAnswer, setScratchAnswer] = useState('')
  const [results, setResults] = useState<boolean[]>([])
  const [done, setDone] = useState(false)

  // Custom flashcard form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [customModId, setCustomModId] = useState(MODULES[0].id)
  const [customPrompt, setCustomPrompt] = useState('')
  const [customAnswer, setCustomAnswer] = useState('')

  // If the page loaded with an empty queue and cards were just seeded (while not mid-session), load them
  useEffect(() => {
    if (sessionQueue.length === 0 && !done && dueNow.length > 0) {
      setSessionQueue(dueNow)
      setI(0)
      setSelected(null)
      setFlashcardRevealed(false)
      setResults([])
    }
  }, [dueNow, sessionQueue.length, done])

  const startWeakSpotDrill = () => {
    // Score all catalog cards by weakness: high lapses, low ease, shaky/lost module, or active module
    const scored = Array.from(cardCatalog.values()).map((c) => {
      const srs = data.srs[c.cardId]
      const conf = data.confidence[c.moduleId]
      const st = stageOf(data, c.moduleId)
      let priority = 0
      if (srs) {
        priority += srs.lapses * 25
        priority += Math.round((2.5 - srs.ease) * 30)
      }
      if (conf === 'lost') priority += 40
      else if (conf === 'shaky') priority += 25
      if (st === 'learning' || st === 'practising') priority += 20
      else if (st === 'confident') priority += 10
      else if (c.phase === 1) priority += 5
      return { card: c, priority }
    })
    scored.sort((a, b) => b.priority - a.priority)
    const drillCards = scored.slice(0, 10).map((x) => x.card)
    setSessionMode('drill')
    setSessionQueue(drillCards)
    setI(0)
    setSelected(null)
    setFlashcardRevealed(false)
    setScratchAnswer('')
    setResults([])
    setDone(false)
  }

  const current = sessionQueue[i]
  const revealed = current?.kind === 'mcq' ? selected !== null : flashcardRevealed

  const finishCard = (grade: boolean | RecallGrade) => {
    if (!current) return
    gradeCard(current.cardId, grade)
    const isSuccess = typeof grade === 'boolean' ? grade : grade !== 'again'
    const next = [...results, isSuccess]
    setResults(next)
    if (i + 1 >= sessionQueue.length) {
      logSession('review', Math.max(1, Math.round(sessionQueue.length * 0.75)))
      setDone(true)
    } else {
      setI(i + 1)
      setSelected(null)
      setFlashcardRevealed(false)
      setScratchAnswer('')
    }
  }

  const handleCreateCustomCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (customPrompt.trim().length < 5 || customAnswer.trim().length < 3) return
    addCustomCard(customModId, customPrompt, customAnswer)
    setCustomPrompt('')
    setCustomAnswer('')
    setShowAddForm(false)
  }

  if (sessionQueue.length === 0) {
    return (
      <div className="py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHead
            eyebrow="Review & Spaced Repetition"
            title="Nothing due right now"
            sub="Cards enter your review queue automatically when you complete a lesson quiz, move a module to Practising/Confident, or create your own flashcards. You can also run a Weak-Spot Drill anytime."
          />
          <div className="mb-6 flex flex-wrap gap-2">
            <Button onClick={startWeakSpotDrill}>
              <Flame size={15} /> Drill Weak Spots (10 cards)
            </Button>
            <Button variant="secondary" onClick={() => setShowAddForm((v) => !v)}>
              <Plus size={15} /> New Flashcard
            </Button>
          </div>
        </div>

        {showAddForm && (
          <Card className="mb-8 p-6">
            <h3 className="font-semibold tracking-tight">Create a personal active-recall flashcard</h3>
            <form onSubmit={handleCreateCustomCard} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink-faint">Module</label>
                <select
                  value={customModId}
                  onChange={(e) => setCustomModId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm"
                >
                  {MODULES.map((m) => (
                    <option key={m.id} value={m.id}>
                      Phase {m.phase} · {m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-faint">
                  Front (Question or retrieval prompt)
                </label>
                <input
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Why must tool side-effects use idempotency keys when retries are enabled?"
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-faint">
                  Back (Concise answer / code snippet)
                </label>
                <textarea
                  value={customAnswer}
                  onChange={(e) => setCustomAnswer(e.target.value)}
                  rows={3}
                  placeholder="Write the exact insight you want to remember…"
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Save & schedule today
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-semibold tracking-tight">Seed recall cards by module</h3>
            <p className="mt-1 text-sm text-ink-soft">
              All 44 curriculum modules have active-recall cards ready. Seed any module you are
              currently studying into your SM-2 queue:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {MODULES.slice(0, 12).map((m) => (
                <button
                  key={m.id}
                  onClick={() => seedModuleCards(m.id, true)}
                  className="rounded-xl border border-line bg-raised/60 px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
                >
                  + P{m.phase} · {m.title}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold tracking-tight">Interactive lessons with quizzes</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Completing a lesson quiz automatically schedules its questions for spaced review:
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
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
          </Card>
        </div>
      </div>
    )
  }

  if (done || !current) {
    const correct = results.filter(Boolean).length
    return (
      <div className="mx-auto max-w-2xl py-16">
        <Card className="p-8 text-center">
          <CheckCircle2 size={36} className="mx-auto text-ok" />
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Review complete</h2>
          <p className="mt-2 text-ink-soft">
            {correct}/{results.length} recalled successfully — this session (~
            {Math.max(1, Math.round(sessionQueue.length * 0.75))} min) was logged. Missed cards return
            tomorrow; recalled ones grow their intervals according to your confidence rating.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/dashboard">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
            <Button onClick={startWeakSpotDrill}>
              <Sparkles size={14} /> Drill 10 Weak-Spot Cards
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const srsMeta = data.srs[current.cardId]
  const isCustom = current.cardId.startsWith('custom:')

  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SectionHead
          eyebrow={sessionMode === 'drill' ? 'Deliberate practice drill' : 'Spaced review'}
          title={sessionMode === 'drill' ? 'Weak-spot active recall' : "Today's cards"}
          sub="Mixed across modules — active retrieval strengthens memory far more than re-reading."
        />
        <Button variant="ghost" size="sm" onClick={() => setShowAddForm((v) => !v)}>
          <Plus size={14} /> Add card
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6 p-5">
          <h3 className="text-sm font-semibold">Quick-add custom flashcard</h3>
          <form onSubmit={handleCreateCustomCard} className="mt-3 space-y-2.5">
            <select
              value={customModId}
              onChange={(e) => setCustomModId(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs"
            >
              {MODULES.map((m) => (
                <option key={m.id} value={m.id}>
                  P{m.phase} · {m.title}
                </option>
              ))}
            </select>
            <input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Question / front prompt…"
              className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm"
            />
            <textarea
              value={customAnswer}
              onChange={(e) => setCustomAnswer(e.target.value)}
              rows={2}
              placeholder="Answer / back explanation…"
              className="w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Save card
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4 flex items-center gap-3">
        <Badge tone="accent">
          <Layers size={12} /> {i + 1} / {sessionQueue.length}
        </Badge>
        <Badge>{current.kind === 'mcq' ? 'Multiple choice' : 'Active-recall flashcard'}</Badge>
        {srsMeta && srsMeta.lapses > 0 && (
          <Badge tone="warn">{srsMeta.lapses} lapse{srsMeta.lapses === 1 ? '' : 's'}</Badge>
        )}
        <ProgressBar value={(i / sessionQueue.length) * 100} className="flex-1" />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            from: Phase {current.phase} · {current.moduleTitle}
          </p>
          {isCustom && (
            <button
              onClick={() => {
                deleteCustomCard(current.cardId)
                finishCard(true)
              }}
              className="inline-flex items-center gap-1 text-xs text-bad hover:underline"
              title="Delete custom flashcard"
            >
              <Trash2 size={12} /> delete
            </button>
          )}
        </div>

        <p className="mt-2 text-base font-medium leading-relaxed">{current.prompt}</p>

        {current.kind === 'mcq' && current.options ? (
          <>
            <div className="mt-4 space-y-2">
              {current.options.map((opt, oi) => {
                const isChosen = selected === oi
                const isCorrect = revealed && oi === current.correctOption
                const isWrong = revealed && isChosen && oi !== current.correctOption
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
                    selected === current.correctOption ? 'bg-ok/10 text-ink-soft' : 'bg-bad/10 text-ink-soft'
                  }`}
                >
                  <span className="font-semibold">
                    {selected === current.correctOption ? (
                      <span className="inline-flex items-center gap-1 text-ok">
                        <CheckCircle2 size={14} /> Correct.{' '}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-bad">
                        <XCircle size={14} /> Not quite.{' '}
                      </span>
                    )}
                  </span>
                  {current.answer}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    to={current.lessonId ? `/learn/${current.lessonId}` : `/roadmap/${current.moduleId}`}
                    className="text-xs text-ink-faint hover:text-accent hover:underline"
                  >
                    {current.lessonId ? 're-read the lesson →' : 'open module →'}
                  </Link>
                  <Button onClick={() => finishCard(selected === current.correctOption)}>
                    {i + 1 >= sessionQueue.length ? 'Finish session' : 'Next card'}{' '}
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Active-recall flashcard UI */
          <div className="mt-4 space-y-4">
            {!flashcardRevealed ? (
              <>
                <textarea
                  value={scratchAnswer}
                  onChange={(e) => setScratchAnswer(e.target.value)}
                  rows={2}
                  placeholder="Optional: jot your answer in your own words before revealing…"
                  className="w-full rounded-xl border border-line bg-raised/40 px-3.5 py-2.5 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none"
                />
                <Button onClick={() => setFlashcardRevealed(true)} className="w-full">
                  <Eye size={15} /> Reveal answer
                </Button>
              </>
            ) : (
              <>
                {scratchAnswer.trim() && (
                  <div className="rounded-xl border border-line bg-raised/50 px-4 py-2.5 text-xs text-ink-soft">
                    <span className="font-semibold text-ink">Your recall: </span>
                    {scratchAnswer}
                  </div>
                )}
                <div className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3.5 text-sm leading-relaxed text-ink">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
                    Reference Answer
                  </p>
                  {current.answer}
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-ink-faint">
                    Rate how well you recalled this concept (schedules next review):
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      onClick={() => finishCard('again')}
                      className="rounded-xl border border-bad/40 bg-bad/10 px-3 py-2 text-xs font-semibold text-bad transition-all hover:bg-bad/20"
                    >
                      Again (Forgot · 1d)
                    </button>
                    <button
                      onClick={() => finishCard('hard')}
                      className="rounded-xl border border-line-strong bg-surface px-3 py-2 text-xs font-semibold text-ink-soft transition-all hover:bg-raised"
                    >
                      Hard (Shaky)
                    </button>
                    <button
                      onClick={() => finishCard('good')}
                      className="rounded-xl border border-accent/40 bg-accent-soft px-3 py-2 text-xs font-semibold text-accent transition-all hover:bg-accent hover:text-accent-ink"
                    >
                      Good (Recalled)
                    </button>
                    <button
                      onClick={() => finishCard('easy')}
                      className="rounded-xl border border-ok/40 bg-ok/10 px-3 py-2 text-xs font-semibold text-ok transition-all hover:bg-ok/20"
                    >
                      Easy (Instant)
                    </button>
                  </div>
                </div>
                <div className="flex justify-between pt-1">
                  <Link
                    to={`/roadmap/${current.moduleId}`}
                    className="text-xs text-ink-faint hover:text-accent hover:underline"
                  >
                    open module page →
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
