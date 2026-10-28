import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, CheckCircle2, Eye, EyeOff, History, PencilLine } from 'lucide-react'
import { Badge, Button, Card, SectionHead } from '../components/ui'
import { useActiveRoadmap } from '../store/activeRoadmap'
import { useProgress, todayStr } from '../store/progress'
import { BUNDLES } from '../content/roadmaps/registry'
import { usePageMeta } from '../hooks/usePageMeta'

/**
 * Brain-dump ritual: four prompts answered from memory, optionally linked to
 * a roadmap + lesson, saved as drafts or completed reflections in the local
 * progress store. Self-assessment only — no grading, no auto-completion.
 */
interface BrainDumpForm {
  date: string
  slug: string
  moduleId: string
  lessonId: string
  learned: string
  explained: string
  confusing: string
  next: string
  status: 'draft' | 'completed'
}

const PROMPTS = [
  { key: 'learned', label: 'What did I learn today?' },
  { key: 'explained', label: 'What can I explain from memory, without looking at notes?' },
  { key: 'confusing', label: 'What still confuses me?' },
  { key: 'next', label: 'What should I learn or review next?' },
] as const

export default function BrainDump() {
  usePageMeta('Brain dump', 'A four-prompt reflection ritual — retrieval first, notes only if you choose.')
  const { data, addBrainDump, updateBrainDump } = useProgress()
  const active = useActiveRoadmap()

  const entries = data.brainDumps ?? []
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = entries.find((b) => b.id === editingId)

  const blank = () => ({
    date: todayStr(),
    slug: active.META.slug,
    moduleId: '',
    lessonId: '',
    learned: '',
    explained: '',
    confusing: '',
    next: '',
    status: 'draft' as const,
  })
  const [draft, setDraft] = useState<BrainDumpForm>(blank)
  const current = editing ?? draft
  const [reveal, setReveal] = useState(false)
  const [dirty, setDirty] = useState(false)

  const activeLessonOptions = useMemo(() => {
    const bundle = BUNDLES[current.slug ?? active.META.slug]
    return (bundle?.LESSONS ?? []).map((l) => ({ id: l.id, title: l.title, moduleId: l.moduleId }))
  }, [current.slug, active.META.slug])

  const revealLesson = useMemo(() => {
    if (!reveal || !current.lessonId) return null
    for (const b of Object.values(BUNDLES)) {
      const l = (b.LESSONS ?? []).find((x) => x.id === current.lessonId)
      if (l) return { title: l.title, simple: l.simple }
    }
    return null
  }, [reveal, current.lessonId])

  const set = (patch: Partial<typeof current>) => {
    setDirty(true)
    if (editing) {
      setDraft((d) => ({ ...d, ...patch }))
      updateBrainDump(editing.id, patch)
    } else {
      setDraft((d) => ({ ...d, ...patch }))
    }
  }

  const startNew = () => {
    setEditingId(null)
    setDraft(blank())
    setReveal(false)
    setDirty(false)
  }

  const finish = (status: 'draft' | 'completed') => {
    if (editing) {
      updateBrainDump(editing.id, { ...current, status })
    } else {
      addBrainDump({ ...current, status })
    }
    startNew()
  }

  const filled = PROMPTS.filter((p) => current[p.key].trim().length > 0).length

  return (
    <div className="mx-auto max-w-3xl py-10">
      <SectionHead
        level="h1"
        eyebrow="Brain dump ritual"
        title="Recall first, notes only if you choose"
        sub="Four prompts, three to five minutes. Write from memory — the goal is retrieval practice, not a graded answer. Reflections stay on this device, like the rest of your progress."
      />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{current.date}</Badge>
            <select
              value={current.slug}
              onChange={(e) => set({ slug: e.target.value, moduleId: '', lessonId: '' })}
              aria-label="Roadmap studied"
              className="rounded-lg border border-line bg-surface px-2 py-1 text-xs"
            >
              {Object.entries(BUNDLES).map(([slug, b]) => (
                <option key={slug} value={slug}>
                  {b.META.title}
                </option>
              ))}
            </select>
            <select
              value={current.lessonId}
              onChange={(e) => {
                const l = activeLessonOptions.find((x) => x.id === e.target.value)
                set({ lessonId: e.target.value, moduleId: l?.moduleId ?? '' })
              }}
              aria-label="Lesson studied (optional)"
              className="max-w-[16rem] rounded-lg border border-line bg-surface px-2 py-1 text-xs"
            >
              <option value="">No specific lesson</option>
              {activeLessonOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-ink-faint">
            {filled}/4 prompts answered {editing ? '· editing existing entry' : ''}
          </span>
        </div>

        {revealLesson && (
          <div className="mt-4 rounded-xl border border-line bg-raised/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Lesson notes — {revealLesson.title} (revealed by choice)
            </p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-soft">
              {revealLesson.simple.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {PROMPTS.map((p) => (
            <label key={p.key} className="block">
              <span className="text-sm font-medium">{p.label}</span>
              <textarea
                value={current[p.key]}
                onChange={(e) => set({ [p.key]: e.target.value } as Partial<typeof current>)}
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm leading-relaxed focus:border-accent focus:outline-none"
                placeholder="Write from memory…"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setReveal((v) => !v)}
            disabled={!current.lessonId}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-raised disabled:opacity-40"
          >
            {reveal ? <EyeOff size={12} /> : <Eye size={12} />}
            {reveal ? 'Hide lesson notes' : 'Reveal lesson notes'}
          </button>
          <div className="flex items-center gap-2">
            {editing && (
              <Button variant="ghost" size="sm" onClick={startNew}>
                Stop editing
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => finish('draft')} disabled={filled === 0}>
              Save draft
            </Button>
            <Button size="sm" onClick={() => finish('completed')} disabled={filled === 0}>
              <CheckCircle2 size={13} /> Finish reflection
            </Button>
          </div>
        </div>
        {dirty && filled === 0 && (
          <p className="mt-2 text-xs text-bad">
            Answer at least one prompt to save — the ritual only counts if you wrote something.
          </p>
        )}
      </Card>

      <div className="mt-10 flex items-end justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <History size={16} className="text-accent" /> Reflection history
        </h2>
        <span className="text-xs text-ink-faint">{entries.length} entries</span>
      </div>

      {entries.length === 0 ? (
        <Card className="mt-4 p-8 text-center">
          <Brain size={22} className="mx-auto text-ink-faint" />
          <p className="mt-2 text-sm text-ink-soft">
            No reflections yet. Your first brain dump after studying a lesson is the strongest
            three minutes of retention you can buy.
          </p>
        </Card>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {entries.map((b) => {
            const bundle = BUNDLES[b.slug ?? '']
            const lesson = (bundle?.LESSONS ?? []).find((l) => l.id === b.lessonId)
            return (
              <li key={b.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold">{b.date}</span>
                      {bundle && <Badge>{bundle.META.shortTitle ?? bundle.META.title}</Badge>}
                      {lesson && (
                        <Link
                          to={`/r/${b.slug}/learn/${b.lessonId}`}
                          className="text-accent hover:underline"
                        >
                          {lesson.title} →
                        </Link>
                      )}
                      {b.status === 'draft' ? <Badge>draft</Badge> : <Badge tone="ok">completed</Badge>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(b.id)
                        setDraft({
                          date: b.date,
                          slug: b.slug ?? active.META.slug,
                          moduleId: b.moduleId ?? '',
                          lessonId: b.lessonId ?? '',
                          learned: b.learned,
                          explained: b.explained,
                          confusing: b.confusing,
                          next: b.next,
                          status: b.status,
                        })
                        setReveal(false)
                        setDirty(false)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      <PencilLine size={12} /> Reopen & edit
                    </Button>
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm leading-relaxed sm:grid-cols-2">
                    {PROMPTS.map((p) =>
                      b[p.key].trim() ? (
                        <div key={p.key}>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                            {p.label}
                          </dt>
                          <dd className="mt-0.5 whitespace-pre-line text-ink-soft">{b[p.key]}</dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
