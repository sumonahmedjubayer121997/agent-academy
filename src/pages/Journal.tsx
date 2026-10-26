import { useMemo, useState } from 'react'
import { useActiveRoadmap } from '../store/activeRoadmap'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BookMarked,
  CheckCircle2,
  HelpCircle,
  Layers,
  NotebookPen,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { Badge, Button, Card, SectionHead } from '../components/ui'
import { todayStr, useProgress } from '../store/progress'

import { usePageMeta } from '../hooks/usePageMeta'
export default function Journal() {
  const { MODULES, trackForModule, trackSpecFor, META } = useActiveRoadmap()
  usePageMeta('Journal', 'Study journal — entries, questions, and reflections.')
  const [searchParams] = useSearchParams()
  const initialMod = searchParams.get('module') ?? MODULES[0].id

  const {
    data,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    addCustomCard,
  } = useProgress()

  const [date, setDate] = useState(todayStr())
  const [selectedModules, setSelectedModules] = useState<string[]>([initialMod])
  const [learned, setLearned] = useState('')
  const [built, setBuilt] = useState('')
  const [difficulties, setDifficulties] = useState('')
  const [openQuestions, setOpenQuestions] = useState('')
  const [nextSteps, setNextSteps] = useState('')

  const [query, setQuery] = useState('')
  const [filterModule, setFilterModule] = useState<string>('all')
  const [onlyUnresolved, setOnlyUnresolved] = useState(false)

  const modById = useMemo(() => new Map(MODULES.map((m) => [m.id, m])), [])

  const toggleModuleTag = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!learned.trim() && !built.trim() && !openQuestions.trim()) return
    addJournalEntry({
      date,
      moduleIds: selectedModules.length > 0 ? selectedModules : [MODULES[0].id],
      learned: learned.trim(),
      built: built.trim(),
      difficulties: difficulties.trim(),
      openQuestions: openQuestions.trim(),
      nextSteps: nextSteps.trim(),
      resolved: false,
    })
    setLearned('')
    setBuilt('')
    setDifficulties('')
    setOpenQuestions('')
    setNextSteps('')
  }

  const entries = data.journal ?? []
  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      if (filterModule !== 'all' && !e.moduleIds.includes(filterModule)) return false
      if (onlyUnresolved && (!e.openQuestions.trim() || e.resolved)) return false
      if (!q) return true
      const hay = `${e.learned} ${e.built} ${e.difficulties} ${e.openQuestions} ${e.nextSteps}`.toLowerCase()
      return hay.includes(q)
    })
  }, [entries, filterModule, onlyUnresolved, query])

  // Also surface per-module notes saved on ModuleDetail pages
  const savedModuleNotes = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MODULES.map((m) => {
      const rec = data.modules?.[m.id]
      if (!rec || (!rec.notes.trim() && rec.questions.length === 0)) return null
      if (filterModule !== 'all' && m.id !== filterModule) return null
      const text = `${m.title} ${rec.notes} ${rec.questions.join(' ')}`.toLowerCase()
      if (q && !text.includes(q)) return null
      return { module: m, rec }
    }).filter((x): x is NonNullable<typeof x> => Boolean(x))
  }, [data.modules, filterModule, query])

  return (
    <div className="py-10">
      <SectionHead
        eyebrow="Personal learning journal & knowledge base"
        title="Reflect, connect concepts, and surface confusion"
        sub="Writing what you learned, what you built, and what still confuses you turns passive study into durable understanding. Entries link directly to curriculum modules and are searchable offline."
      />

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        {/* New Journal Entry Form */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center gap-2 font-semibold tracking-tight">
              <NotebookPen size={17} className="shrink-0 text-accent" /> Log today's reflection
            </h2>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Journal entry date"
              className="shrink-0 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink"
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Linked Topic(s)
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <select
                  value={selectedModules[0] ?? MODULES[0].id}
                  onChange={(e) => {
                    const val = e.target.value
                    if (!selectedModules.includes(val)) {
                      setSelectedModules([val, ...selectedModules])
                    }
                  }}
                  aria-label="Link module to journal entry"
                  className="flex-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-sm"
                >
                  {MODULES.map((m) => (
                    <option key={m.id} value={m.id}>
                      Phase {m.phase} · {m.title}
                    </option>
                  ))}
                </select>
              </div>
              {selectedModules.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedModules.map((id) => {
                    const m = modById.get(id)
                    if (!m) return null
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleModuleTag(id)}
                        className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
                        title="Click to remove tag"
                      >
                        {m.title} ×
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">
                1. What I learned today
              </label>
              <textarea
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
                rows={2}
                placeholder="Core concept, mental model, or insight in your own words…"
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">
                2. What I built or practised
              </label>
              <textarea
                value={built}
                onChange={(e) => setBuilt(e.target.value)}
                rows={2}
                placeholder="Code written, exercise solved, test added, or experiment run…"
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  3. What I found difficult
                </label>
                <textarea
                  value={difficulties}
                  onChange={(e) => setDifficulties(e.target.value)}
                  rows={2}
                  placeholder="Friction points, bugs, or slow steps…"
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  4. What I still do not understand
                </label>
                <textarea
                  value={openQuestions}
                  onChange={(e) => setOpenQuestions(e.target.value)}
                  rows={2}
                  placeholder="Unresolved question to revisit…"
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">
                5. What I should do next
              </label>
              <input
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="Concrete first step for your next study session…"
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              disabled={!learned.trim() && !built.trim() && !openQuestions.trim()}
            >
              <Plus size={15} /> Save journal entry
            </Button>
          </form>
        </Card>

        {/* Search, Filter & Saved Notes Overview */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-semibold tracking-tight">
              <Search size={16} className="text-accent" /> Search notes & reflections
            </h2>
            <div className="mt-3 space-y-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across journal entries, module notes, and open questions…"
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm placeholder:text-ink-faint focus:border-accent focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  aria-label="Filter journal by module"
                  className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs"
                >
                  <option value="all">All modules ({MODULES.length})</option>
                  {MODULES.map((m) => (
                    <option key={m.id} value={m.id}>
                      P{m.phase} · {m.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setOnlyUnresolved((v) => !v)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                    onlyUnresolved
                      ? 'border-bad bg-bad/10 text-bad'
                      : 'border-line text-ink-soft hover:bg-raised'
                  }`}
                >
                  <HelpCircle size={12} className="mr-1 inline" />
                  Unresolved questions only
                </button>
              </div>
            </div>
          </Card>

          {/* Module notes digest */}
          <Card className="p-6">
            <h3 className="flex items-center gap-2 font-semibold tracking-tight">
              <BookMarked size={16} className="text-accent" /> Module notes & open questions (
              {savedModuleNotes.length})
            </h3>
            {savedModuleNotes.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">
                Notes and questions you write on individual module pages appear here automatically.
              </p>
            ) : (
              <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
                {savedModuleNotes.map(({ module: m, rec }) => {
                  const tr = trackSpecFor(trackForModule(m.id))
                  return (
                    <div key={m.id} className="rounded-xl border border-line bg-raised/40 p-3.5 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          to={`/r/${META.slug}/roadmap/${m.id}`}
                          className="font-semibold text-ink hover:text-accent hover:underline"
                        >
                          P{m.phase} · {m.title}
                        </Link>
                        <Badge>Track {tr.code}</Badge>
                      </div>
                      {rec.notes && (
                        <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-ink-soft">
                          {rec.notes}
                        </p>
                      )}
                      {rec.questions.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-bad">
                          {rec.questions.map((q, qi) => (
                            <li key={qi}>? {q}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Timeline of Journal Entries */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Journal timeline ({filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'})
        </h2>
        {filteredEntries.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-ink-soft">
              No journal entries match your filter yet. Write a quick reflection after today's study
              session above.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">{entry.date}</Badge>
                    {entry.moduleIds.map((id) => {
                      const m = modById.get(id)
                      return (
                        <Link key={id} to={`/r/${META.slug}/roadmap/${id}`}>
                          <Badge>{m?.title ?? id}</Badge>
                        </Link>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => deleteJournalEntry(entry.id)}
                    className="text-xs text-ink-faint hover:text-bad"
                    aria-label="Delete journal entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                  {entry.learned && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                        What I learned
                      </p>
                      <p className="mt-1 leading-relaxed text-ink-soft">{entry.learned}</p>
                    </div>
                  )}
                  {entry.built && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                        What I built / practised
                      </p>
                      <p className="mt-1 leading-relaxed text-ink-soft">{entry.built}</p>
                    </div>
                  )}
                  {entry.difficulties && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                        What felt difficult
                      </p>
                      <p className="mt-1 leading-relaxed text-ink-soft">{entry.difficulties}</p>
                    </div>
                  )}
                  {entry.openQuestions && (
                    <div
                      className={`rounded-xl border p-3 ${
                        entry.resolved
                          ? 'border-ok/30 bg-ok/5'
                          : 'border-bad/30 bg-bad/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-bad">
                          {entry.resolved ? 'Resolved question' : 'Still do not understand'}
                        </p>
                        <div className="flex items-center gap-2">
                          {!entry.resolved && entry.learned && (
                            <button
                              onClick={() =>
                                addCustomCard(
                                  entry.moduleIds[0] ?? MODULES[0].id,
                                  entry.openQuestions,
                                  entry.learned,
                                )
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                              title="Create a spaced-repetition flashcard from this question"
                            >
                              <Layers size={11} /> + Flashcard
                            </button>
                          )}
                          <button
                            onClick={() =>
                              updateJournalEntry(entry.id, { resolved: !entry.resolved })
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-ok hover:underline"
                          >
                            <CheckCircle2 size={11} />{' '}
                            {entry.resolved ? 'Reopen' : 'Mark resolved'}
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-ink-soft">{entry.openQuestions}</p>
                    </div>
                  )}
                </div>

                {entry.nextSteps && (
                  <div className="mt-3 rounded-xl bg-raised px-3.5 py-2 text-xs text-ink-soft">
                    <span className="font-semibold text-ink">Next action: </span>
                    {entry.nextSteps}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
