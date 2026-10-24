import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Lock, Search, Sparkles } from 'lucide-react'
import { MODULES } from '../content/roadmaps/ai-agents'
import { TRACKS, trackForModule, type TrackId } from '../content/roadmaps/ai-agents'
import { ask } from '../lib/api'
import {
  answerPersonalAssistantQuery,
  type AssistantResponse,
} from '../lib/localSearch'
import { Badge, Card, ProgressBar, SectionHead, StatusBadge } from '../components/ui'
import {
  isUnlocked,
  phaseStats,
  stageOf,
  useProgress,
  type MasteryStage,
} from '../store/progress'

const QUICK_PROMPTS = [
  'What should I learn next, and why?',
  'Which concepts am I struggling with?',
  'What did I learn last week?',
  'Identify gaps between my current skills and my target role',
  'Why does cosine ignore document length?',
]

export function AskTheRoadmapAndAssistant() {
  const { data } = useProgress()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [response, setResponse] = useState<AssistantResponse | null>(null)

  const runQuery = async (queryText: string) => {
    const trimmed = queryText.trim()
    if (trimmed.length < 3) return
    setBusy(true)

    // Always compute grounded personal facts & local BM25 first
    const localAns = answerPersonalAssistantQuery(trimmed, data)

    // If the query is a general curriculum question, also check if optional backend is online
    if (localAns.intent === 'Curriculum & personal knowledge lookup') {
      const remote = await ask(trimmed)
      if (remote.ok) {
        setResponse({
          query: trimmed,
          intent: 'Curriculum RAG + Personal Status',
          savedFacts: localAns.savedFacts,
          recommendations: [remote.data.answer],
          citations: remote.data.citations.length > 0 ? remote.data.citations : localAns.citations,
          provider: `server (${remote.data.provider})`,
        })
        setBusy(false)
        return
      }
    }

    setResponse(localAns)
    setBusy(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await runQuery(q)
  }

  return (
    <Card className="mb-8 border-accent/30 bg-accent-soft p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold tracking-tight">
          <Sparkles size={16} className="text-accent" /> Ask the Roadmap & Personal Learning
          Assistant
        </h2>
        {response && (
          <Badge tone="neutral">
            engine: {response.provider} · {response.intent}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Ask about any curriculum topic, or ask about your own learning history, weak spots, and
        next steps. Strictly separates <b>Saved Facts</b> (from your progress store) from{' '}
        <b>Recommendations & Explanations</b>. Works 100% offline.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => {
              setQ(prompt)
              void runQuery(prompt)
            }}
            className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. What should I learn next? or why does cosine ignore document length?"
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-2 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || q.trim().length < 3}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-all hover:bg-accent-hover disabled:opacity-40"
        >
          {busy ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      {response && (
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ok">
              Saved Facts (verified from your learning records)
            </p>
            <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-ink-soft">
              {response.savedFacts.map((fact, idx) => (
                <li key={idx}>• {fact}</li>
              ))}
            </ul>
          </div>

          <div className="border-t border-line pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Guidance & Curriculum Answer
            </p>
            <ul className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-ink-soft">
              {response.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>

          {response.citations.length > 0 && (
            <div className="border-t border-line pt-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Citations & Relevant Modules
              </p>
              <div className="flex flex-wrap gap-1.5">
                {response.citations.map((c) => (
                  <Link key={c.id} to={c.route}>
                    <Badge>{c.title}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

const STAGE_SYMBOL: Record<MasteryStage, string> = {
  'not-started': '○',
  learning: '◔',
  practising: '◑',
  confident: '◕',
  mastered: '✓',
}

import { usePageMeta } from '../hooks/usePageMeta'
export default function Curriculum() {
  usePageMeta('Curriculum', 'All phases and modules of the AI Agents roadmap, with tracks and progress.')
  const { data, cycleStage } = useProgress()
  const stats = phaseStats(data)

  const [search, setSearch] = useState('')
  const [trackFilter, setTrackFilter] = useState<TrackId | 'all'>('all')
  const [stageFilter, setStageFilter] = useState<'all' | 'active' | 'unstarted' | 'done'>('all')

  return (
    <div className="py-10">
      <SectionHead
        eyebrow="Curriculum & personal AI assistant"
        title="Eight phases, forty-four modules, three career tracks"
        sub="Click a module title for interactive objectives, completion criteria, notes, and evidence links. The status button on the left cycles Not started → Learning → Practising → Confident → Mastered."
      />

      <AskTheRoadmapAndAssistant />

      {/* Search & Track/Stage Filter Bar */}
      <Card className="mb-8 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter modules by title, objective, or deliverable…"
              className="w-full rounded-xl border border-line bg-surface py-1.5 pl-8 pr-3 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTrackFilter('all')}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                trackFilter === 'all'
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line text-ink-soft hover:bg-raised'
              }`}
            >
              All Tracks
            </button>
            {TRACKS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTrackFilter(t.id)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                  trackFilter === t.id
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-line text-ink-soft hover:bg-raised'
                }`}
              >
                Track {t.code}: {t.shortTitle}
              </button>
            ))}
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as typeof stageFilter)}
            aria-label="Filter modules by stage"
            className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft"
          >
            <option value="all">All stages</option>
            <option value="active">In progress (Learning / Practising)</option>
            <option value="unstarted">Not started</option>
            <option value="done">Confident / Mastered</option>
          </select>
        </div>
      </Card>

      <div className="space-y-10">
        {stats.map(({ phase, modules, doneCount, doneEssentialHours, essentialHours }) => {
          const filteredModules = modules.filter((m) => {
            if (trackFilter !== 'all' && trackForModule(m.id) !== trackFilter) return false
            const st = stageOf(data, m.id)
            if (stageFilter === 'active' && st !== 'learning' && st !== 'practising') return false
            if (stageFilter === 'unstarted' && st !== 'not-started') return false
            if (stageFilter === 'done' && st !== 'confident' && st !== 'mastered') return false
            if (!search.trim()) return true
            const q = search.trim().toLowerCase()
            return (
              m.title.toLowerCase().includes(q) ||
              m.why.toLowerCase().includes(q) ||
              m.deliverable.toLowerCase().includes(q) ||
              m.objectives.some((o) => o.toLowerCase().includes(q))
            )
          })

          if (filteredModules.length === 0) return null

          return (
            <section key={phase.id} aria-labelledby={`phase-${phase.id}`}>
              <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-accent">
                      Phase {phase.n}
                    </p>
                    <h2
                      id={`phase-${phase.id}`}
                      className="mt-1 text-xl font-semibold tracking-tight"
                    >
                      {phase.title}
                    </h2>
                    <p className="mt-1 text-sm italic text-ink-faint">{phase.tagline}</p>
                  </div>
                  <div className="min-w-[180px] text-right text-sm text-ink-soft">
                    {doneCount}/{modules.length} modules Confident+
                    <ProgressBar
                      className="mt-1.5"
                      value={essentialHours ? (doneEssentialHours / essentialHours) * 100 : 100}
                    />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{phase.description}</p>
                <p className="mt-2 rounded-xl bg-raised px-4 py-2.5 text-sm">
                  <span className="font-semibold">Outcome: </span>
                  <span className="text-ink-soft">{phase.outcome}</span>
                </p>
              </Card>

              <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {filteredModules.map((m) => {
                  const stage = stageOf(data, m.id)
                  const unlocked = isUnlocked(data, m)
                  const tr = TRACKS.find((t) => t.id === trackForModule(m.id))!
                  return (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised/60"
                    >
                      <button
                        onClick={() => cycleStage(m.id)}
                        aria-label={`Cycle status for ${m.title} (currently ${stage.replace('-', ' ')})`}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${
                          stage === 'mastered'
                            ? 'border-ok bg-ok text-white'
                            : stage === 'confident'
                              ? 'border-accent bg-accent text-accent-ink'
                              : stage === 'practising' || stage === 'learning'
                                ? 'border-accent text-accent'
                                : 'border-line-strong text-ink-faint hover:border-accent hover:text-accent'
                        }`}
                      >
                        {STAGE_SYMBOL[stage]}
                      </button>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/roadmap/${m.id}`}
                          className="text-sm font-medium hover:text-accent hover:underline"
                        >
                          {m.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                          <span className="font-medium text-ink-soft">Track {tr.code}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {m.hours}h
                          </span>
                          {m.project && <span className="text-accent">◆ project checkpoint</span>}
                          {!m.essential && <span>◇ optional</span>}
                          {!unlocked && (
                            <span className="flex items-center gap-1">
                              <Lock size={11} /> prereqs open
                            </span>
                          )}
                          {m.lessonId && (
                            <Link
                              to={`/learn/${m.lessonId}`}
                              className="flex items-center gap-1 text-accent hover:underline"
                            >
                              <BookOpen size={11} /> lesson
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <StatusBadge status={stage} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      <p className="mt-8 text-center text-sm text-ink-faint">
        {MODULES.length} modules · {MODULES.reduce((s, m) => s + m.hours, 0)} guided hours · content
        lives separately from app code, so it grows without touching the platform.
      </p>
    </div>
  )
}
