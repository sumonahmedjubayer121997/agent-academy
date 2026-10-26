import { useState } from 'react'
import { useActiveRoadmap } from '../store/activeRoadmap'
import { Link, useParams } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Layers,
  Link2,
  NotebookPen,
  Package,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react'
import { RESOURCES } from '../content/resources'
import { masteryGate } from '../lib/mastery'
import FocusTimer from '../components/FocusTimer'
import { Badge, Button, Card, ProgressBar, StatusBadge } from '../components/ui'
import {
  isUnlocked,
  MASTERY_STAGES,
  moduleMinutesLogged,
  moduleRecordOf,
  stageOf,
  statusOf,
  useProgress,
  type Confidence,
} from '../store/progress'

export default function ModuleDetail() {
  const { cardsForModule, EDGE_WHY, MODULES, PHASES, trackForModule, trackSpecFor, META } = useActiveRoadmap()
  const { moduleId } = useParams()
  const {
    data,
    setStage,
    updateModuleRecord,
    toggleModuleObjective,
    toggleModuleCompletion,
    setConfidence,
    seedModuleCards,
    addCustomCard,
    logSession,
  } = useProgress()

  const m = MODULES.find((x) => x.id === moduleId)
  usePageMeta(m ? `${m.title} — module` : 'Module not found', m?.why)

  const [newQuestion, setNewQuestion] = useState('')
  const [masterPrompt, setMasterPrompt] = useState<string[] | null>(null)
  const [evidenceLabel, setEvidenceLabel] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [customMinutes, setCustomMinutes] = useState(25)
  const [cardFront, setCardFront] = useState('')
  const [cardBack, setCardBack] = useState('')
  const [seededNotice, setSeededNotice] = useState(false)

  if (!m) {
    return (
      <div className="py-24 text-center">
        <p className="text-xl font-semibold">Module not found.</p>
        <Link to={`/r/${META.slug}/curriculum`} className="mt-2 inline-block text-accent hover:underline">
          Back to curriculum
        </Link>
      </div>
    )
  }

  const phase = PHASES.find((p) => p.n === m.phase)!
  const track = trackSpecFor(trackForModule(m.id))
  const stage = stageOf(data, m.id)
  const rec = moduleRecordOf(data, m.id)
  const confidence = data.confidence[m.id]
  const unlocked = isUnlocked(data, m)
  const prereqs = m.prereqs.map((id) => MODULES.find((x) => x.id === id)!)
  const unlocks = MODULES.filter((x) => x.prereqs.includes(m.id))
  const loggedMinutes = moduleMinutesLogged(data, m.id)
  const loggedHours = (loggedMinutes / 60).toFixed(1)
  const modCards = cardsForModule(m.id)
  const srsSeededCount = modCards.filter((c) => Boolean(data.srs[c.cardId])).length
  // Resources are roadmap-scoped: absent `roadmap` field means ai-agents (legacy data).
  // Better none than wrong-roadmap recommendations.
  const relatedResources = RESOURCES.filter(
    (r) => (r.roadmap ?? 'ai-agents') === META.slug && r.supports.includes(`Phase ${m.phase}`),
  )
  const linkedJournal = (data.journal ?? []).filter((j) => j.moduleIds.includes(m.id))

  const allObjectivesChecked = rec.objectivesDone.length >= m.objectives.length
  const allCompletionChecked = rec.completionDone.length >= m.completion.length
  const hasEvidence = rec.evidenceUrls.length > 0
  const masteryVerified = allCompletionChecked && hasEvidence

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault()
    if (!evidenceUrl.trim()) return
    const next = [
      ...rec.evidenceUrls,
      {
        label: evidenceLabel.trim() || 'Code / Deliverable Repository',
        url: evidenceUrl.trim(),
      },
    ]
    updateModuleRecord(m.id, { evidenceUrls: next })
    setEvidenceLabel('')
    setEvidenceUrl('')
  }

  const handleRemoveEvidence = (idx: number) => {
    updateModuleRecord(m.id, {
      evidenceUrls: rec.evidenceUrls.filter((_, i) => i !== idx),
    })
  }

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return
    updateModuleRecord(m.id, { questions: [...rec.questions, newQuestion.trim()] })
    setNewQuestion('')
  }

  const handleRemoveQuestion = (idx: number) => {
    updateModuleRecord(m.id, {
      questions: rec.questions.filter((_, i) => i !== idx),
    })
  }

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (cardFront.trim().length < 3 || cardBack.trim().length < 2) return
    addCustomCard(m.id, cardFront, cardBack)
    setCardFront('')
    setCardBack('')
  }

  return (
    <div className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/r/${META.slug}/roadmap`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent"
        >
          <ArrowLeft size={14} /> Roadmap & Skills Map
        </Link>
        <FocusTimer moduleId={m.id} />
      </div>

      {!unlocked && (
        <Card className="mt-4 border-bad/30 bg-bad/5 p-4">
          <p className="flex items-start gap-2 text-sm text-ink-soft">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-bad" />
            <span>
              <span className="font-semibold text-ink">Prerequisites not yet Confident/Mastered.</span>{' '}
              You can still explore freely — the recommended path finishes first:{' '}
              {prereqs
                .filter((p) => statusOf(data, p.id) !== 'completed')
                .map((p) => p.title)
                .join(', ')}
              .
            </span>
          </p>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">
              Phase {m.phase} · {phase.title}
            </Badge>
            <Badge>
              Track {track.code} · {track.shortTitle}
            </Badge>
            <Badge>{m.difficulty}</Badge>
            <Badge tone={m.essential ? 'ok' : 'neutral'}>
              {m.essential ? 'Essential' : 'Optional specialisation'}
            </Badge>
            {m.project && <Badge tone="accent">Checkpoint project</Badge>}
            <Badge>
              <Clock size={11} /> {loggedHours}h logged / {m.hours}h est.
            </Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{m.title}</h1>
          <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">
            <span className="font-semibold text-ink">Why it matters: </span>
            {m.why}
          </p>
        </div>
        <StatusBadge status={stage} />
      </div>

      {/* 5-Stage Mastery Lifecycle + Confidence & Dates */}
      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              5-Stage Learning Lifecycle (Exposure → Understanding → Practice → Demonstrated Mastery)
            </p>
            <div
              className="mt-2 inline-flex flex-wrap rounded-xl border border-line bg-raised/50 p-1"
              role="group"
              aria-label="Module mastery lifecycle"
            >
              {MASTERY_STAGES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    if (st.id === 'mastered') {
                      const gate = masteryGate({ completion: m.completion, record: rec })
                      if (!gate.ready) {
                        setMasterPrompt(gate.missing)
                        return
                      }
                    }
                    setStage(m.id, st.id)
                  }}
                  title={st.description}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                    stage === st.id
                      ? 'bg-accent text-accent-ink'
                      : 'text-ink-soft hover:bg-surface hover:text-ink'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Self-Assessed Confidence
            </p>
            <div className="mt-2 inline-flex rounded-xl border border-line bg-raised/50 p-1">
              {(
                [
                  { id: 'lost', label: 'Lost' },
                  { id: 'shaky', label: 'Shaky' },
                  { id: 'sure', label: 'Sure' },
                ] as { id: Confidence; label: string }[]
              ).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setConfidence(m.id, c.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                    confidence === c.id
                      ? c.id === 'sure'
                        ? 'bg-ok text-white'
                        : c.id === 'shaky'
                          ? 'bg-accent text-accent-ink'
                          : 'bg-bad text-white'
                      : 'text-ink-soft hover:bg-surface'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mastered promotion gate — evidence first, explicit self-assessment as the only override */}
        {masterPrompt !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Mastery evidence check"
            onClick={() => setMasterPrompt(null)}
          >
            <Card variant="overlay" className="max-w-md p-6">
              <div onClick={(e) => e.stopPropagation()}>
                <p className="flex items-center gap-2 font-semibold tracking-tight">
                  <Sparkles size={16} className="text-accent" /> Mastered means demonstrated — not
                  declared
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Before marking <b>{m.title}</b> as Mastered, close these gaps:
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                  {masterPrompt.map((miss) => (
                    <li key={miss} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {miss}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setMasterPrompt(null)}>
                    Add evidence first
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setStage(m.id, 'mastered')
                      setMasterPrompt(null)
                    }}
                  >
                    Mark as self-assessed anyway
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Honest Mastery Guard */}
        {stage === 'mastered' && !masteryVerified && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-xs text-ink-soft">
            <Sparkles size={15} className="mt-0.5 shrink-0 text-accent" />
            <span>
              <strong className="text-ink">Self-marked as Mastered:</strong> To turn this into{' '}
              <b>Verified Mastery</b>, check off all {m.completion.length} completion criteria below
              and attach at least one repository or deliverable link as practical proof.
            </span>
          </div>
        )}
        {stage === 'mastered' && masteryVerified && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-ok/30 bg-ok/10 px-4 py-2.5 text-xs font-medium text-ok">
            <CheckCircle2 size={14} /> Verified Mastery — all completion criteria checked and
            practical evidence linked.
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-3 text-xs text-ink-faint">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Started:{' '}
              <strong className="text-ink-soft">
                {rec.startedAt ? new Date(rec.startedAt).toLocaleDateString() : 'Not started'}
              </strong>
            </span>
            <span>
              Confident/Mastered:{' '}
              <strong className="text-ink-soft">
                {rec.completedAt ? new Date(rec.completedAt).toLocaleDateString() : '—'}
              </strong>
            </span>
            <span>
              Time logged: <strong className="text-ink-soft">{loggedMinutes} min ({loggedHours}h)</strong>
            </span>
          </div>

          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (customMinutes > 0) logSession(m.id, customMinutes)
            }}
          >
            <input
              type="number"
              min={5}
              max={480}
              step={5}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              aria-label="Study session minutes"
              className="w-16 rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink"
            />
            <button
              type="submit"
              className="rounded-lg border border-line-strong bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-raised hover:text-ink"
            >
              + Log min
            </button>
          </form>
        </div>
      </Card>

      {m.lessonId && (
        <Card className="mt-6 border-accent/30 bg-accent-soft p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-semibold tracking-tight">
                <BookOpen size={16} className="text-accent" /> Full interactive lesson available
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                This module has a complete nine-section lesson: explanation → intuition →
                visualisation → code walkthrough → exercise → knowledge check.
              </p>
            </div>
            <Link to={`/r/${META.slug}/learn/${m.lessonId}`}>
              <Button>
                Open lesson <ArrowLeft size={14} className="rotate-180" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Interactive Objectives & Completion Criteria Checklists */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold tracking-tight">
              <Target size={16} className="text-accent" /> Learning objectives
            </h2>
            <span className="text-xs text-ink-faint">
              {rec.objectivesDone.length}/{m.objectives.length} checked
            </span>
          </div>
          <ProgressBar
            className="mt-2"
            value={(rec.objectivesDone.length / Math.max(1, m.objectives.length)) * 100}
          />
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed">
            {m.objectives.map((o, idx) => {
              const checked = rec.objectivesDone.includes(idx)
              return (
                <li key={o}>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-raised/60">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModuleObjective(m.id, idx)}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <span className={checked ? 'line-through text-ink-faint' : 'text-ink-soft'}>
                      {o}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
          {allObjectivesChecked && stage === 'learning' && (
            <p className="mt-3 text-xs text-ok">
              All theoretical objectives checked — move status to <b>Practising</b> while working on
              the completion exercises!
            </p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold tracking-tight">
              <CheckCircle2 size={16} className="text-accent" /> Practical completion criteria
            </h2>
            <span className="text-xs text-ink-faint">
              {rec.completionDone.length}/{m.completion.length} verified
            </span>
          </div>
          <ProgressBar
            className="mt-2"
            value={(rec.completionDone.length / Math.max(1, m.completion.length)) * 100}
          />
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed">
            {m.completion.map((c, idx) => {
              const checked = rec.completionDone.includes(idx)
              return (
                <li key={c}>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-raised/60">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModuleCompletion(m.id, idx)}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <span className={checked ? 'line-through text-ink-faint' : 'text-ink-soft'}>
                      {c}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 rounded-xl bg-raised/70 p-3.5 text-sm">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
              <Package size={13} /> Required Deliverable for Mastery
            </p>
            <p className="mt-1 text-ink-soft">{m.deliverable}</p>
          </div>
        </Card>
      </div>

      {/* Personal Notes, Evidence Links & Remaining Questions */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-semibold tracking-tight">
            <NotebookPen size={16} className="text-accent" /> Notes & key takeaways
          </h2>
          <p className="mt-1 text-xs text-ink-faint">
            Summarise the core mental model, gotchas, or commands in your own words. Saved
            automatically.
          </p>
          <textarea
            value={rec.notes}
            onChange={(e) => updateModuleRecord(m.id, { notes: e.target.value })}
            rows={5}
            placeholder="Key takeaways, formulas, code snippets, or architecture notes for this topic…"
            className="mt-3 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm leading-relaxed placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />

          <div className="mt-5 border-t border-line pt-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <HelpCircle size={14} className="text-accent" /> Remaining questions & difficulties
            </h3>
            <form onSubmit={handleAddQuestion} className="mt-2 flex gap-2">
              <input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="What still feels unclear or needs testing?"
                className="flex-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none"
              />
              <Button type="submit" size="sm" variant="secondary">
                Add
              </Button>
            </form>
            {rec.questions.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {rec.questions.map((q, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-line bg-raised/40 px-3 py-1.5 text-ink-soft"
                  >
                    <span>? {q}</span>
                    <button
                      onClick={() => handleRemoveQuestion(i)}
                      className="text-xs text-ink-faint hover:text-bad"
                      aria-label="Resolve and remove question"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-semibold tracking-tight">
              <Link2 size={16} className="text-accent" /> Practical evidence & repositories
            </h2>
            <p className="mt-1 text-xs text-ink-faint">
              Attach GitHub repositories, Jupyter notebooks, PRs, or deployed demos that prove you built
              the deliverable.
            </p>
            <form onSubmit={handleAddEvidence} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.3fr_auto]">
              <input
                value={evidenceLabel}
                onChange={(e) => setEvidenceLabel(e.target.value)}
                placeholder="Label (e.g. GitHub repo)"
                className="rounded-xl border border-line bg-surface px-3 py-1.5 text-sm"
              />
              <input
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="rounded-xl border border-line bg-surface px-3 py-1.5 text-sm"
              />
              <Button type="submit" size="sm">
                Link
              </Button>
            </form>
            {rec.evidenceUrls.length === 0 ? (
              <p className="mt-3 text-xs text-ink-faint">
                No evidence linked yet. Add your repo or notebook URL once you start coding.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {rec.evidenceUrls.map((ev, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-xl border border-line px-3.5 py-2"
                  >
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-medium text-accent hover:underline"
                    >
                      {ev.label} <ExternalLink size={12} className="ml-0.5 inline" />
                    </a>
                    <button
                      onClick={() => handleRemoveEvidence(i)}
                      className="text-xs text-ink-faint hover:text-bad"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 font-semibold tracking-tight">
                  <Layers size={16} className="text-accent" /> Spaced-repetition cards ({srsSeededCount}/
                  {modCards.length} active)
                </h2>
                <p className="mt-0.5 text-xs text-ink-faint">
                  Seed this module’s recall prompts or add your own flashcard.
                </p>
              </div>
              {srsSeededCount < modCards.length ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    seedModuleCards(m.id, true)
                    setSeededNotice(true)
                  }}
                >
                  Seed {modCards.length} cards to Review
                </Button>
              ) : (
                <Link to="/review" className="text-xs font-semibold text-ok hover:underline">
                  In review queue ✓
                </Link>
              )}
            </div>
            {seededNotice && (
              <p className="mt-2 text-xs text-ok">
                Cards added to today’s <Link to="/review" className="underline">Review queue</Link>!
              </p>
            )}

            <form onSubmit={handleCreateCard} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                value={cardFront}
                onChange={(e) => setCardFront(e.target.value)}
                placeholder="Flashcard question…"
                className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs"
              />
              <input
                value={cardBack}
                onChange={(e) => setCardBack(e.target.value)}
                placeholder="Flashcard answer…"
                className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs"
              />
              <Button type="submit" size="sm" variant="secondary">
                <Plus size={13} /> Card
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Dependencies & Curated Resources */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold tracking-tight">Dependencies & Prerequisite Why</h2>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Requires
              </p>
              {prereqs.length === 0 ? (
                <p className="text-ink-soft">No prerequisites — start anytime.</p>
              ) : (
                <div className="space-y-2">
                  {prereqs.map((p) => {
                    const why = EDGE_WHY[`${p.id}->${m.id}`]
                    const pDone = statusOf(data, p.id) === 'completed'
                    return (
                      <div key={p.id} className="rounded-xl border border-line px-3 py-2">
                        <Link to={`/r/${META.slug}/roadmap/${p.id}`} className="inline-flex items-center gap-1.5">
                          <Badge tone={pDone ? 'ok' : 'neutral'}>
                            {pDone ? '✓ ' : ''}
                            {p.title} ({stageOf(data, p.id)})
                          </Badge>
                        </Link>
                        {why && (
                          <details className="mt-1.5">
                            <summary className="cursor-pointer select-none text-xs font-medium text-accent">
                              why does this require it?
                            </summary>
                            <p className="mt-1 pl-1 text-xs leading-relaxed text-ink-soft">{why}</p>
                          </details>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {unlocks.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Unlocks ({unlocks.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unlocks.map((u) => (
                    <Link key={u.id} to={`/r/${META.slug}/roadmap/${u.id}`}>
                      <Badge>{u.title}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold tracking-tight">Supporting resources & journal entries</h2>
          {relatedResources.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm">
              {relatedResources.slice(0, 4).map((r) => (
                <li key={r.url} className="flex items-start justify-between gap-2">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent hover:underline"
                  >
                    {r.title} <ExternalLink size={11} className="inline" />
                  </a>
                  <span className="shrink-0 text-xs text-ink-faint">{r.provider}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-line pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Journal reflections linked to this module ({linkedJournal.length})
              </p>
              <Link
                to={`/journal?module=${m.id}`}
                className="text-xs font-medium text-accent hover:underline"
              >
                + Write journal entry →
              </Link>
            </div>
            {linkedJournal.length > 0 && (
              <ul className="mt-2 space-y-2 text-xs text-ink-soft">
                {linkedJournal.slice(0, 3).map((j) => (
                  <li key={j.id} className="rounded-lg bg-raised/60 px-3 py-2">
                    <span className="font-semibold text-ink">{j.date}:</span> {j.learned}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
