import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, CheckCircle2, ExternalLink, Wrench } from 'lucide-react'
import { useActiveRoadmap } from '../store/activeRoadmap'
import {
  computeTaskAutonomy,
  taskDoneOf,
  taskRecordOf,
  useProgress,
  type TaskAutonomy,
} from '../store/progress'
import { Badge, Button, Card } from './ui'
import type { PracticeTaskSpec } from '../content/types'

const KIND_META: Record<
  PracticeTaskSpec['kind'],
  { label: string; tone: 'ok' | 'accent' | 'warn' }
> = {
  exercise: { label: 'Quick exercise', tone: 'ok' },
  guided: { label: 'Guided build', tone: 'accent' },
  project: { label: 'Mini-project', tone: 'warn' },
}

const AUTONOMY_META: Record<
  TaskAutonomy,
  { label: string; tone: 'ok' | 'accent' | 'neutral' | 'warn' }
> = {
  verified: { label: 'Verified', tone: 'ok' },
  independent: { label: 'Independent', tone: 'accent' },
  hinted: { label: 'Hinted', tone: 'neutral' },
  assisted: { label: 'Assisted', tone: 'warn' },
}

function TaskRow({ t }: { t: PracticeTaskSpec }) {
  const {
    data,
    toggleTask,
    toggleTaskCheck,
    recordTaskHint,
    recordTaskSolutionView,
    setTaskEvidence,
    addCustomCard,
    addEvidence,
  } = useProgress()
  const { LESSONS, META } = useActiveRoadmap()
  const location = useLocation()
  const rec = taskRecordOf(data, t.id)
  const done = rec.done
  const autonomy = computeTaskAutonomy(rec, t.checks.length)
  const lesson = t.lessonId ? LESSONS?.find((l) => l.id === t.lessonId) : undefined
  const kind = KIND_META[t.kind]
  const isDeepLinked = location.hash === '#' + t.id

  const [pitfallSaved, setPitfallSaved] = useState(false)
  const [evidenceUrl, setEvidenceUrl] = useState(rec.evidenceUrl ?? '')
  const [evidenceSaved, setEvidenceSaved] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isDeepLinked) rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [isDeepLinked])

  return (
    <div id={t.id} ref={rowRef} className="scroll-mt-24 rounded-xl border border-line bg-surface">
      <div className="flex items-start gap-3 px-4 py-3">
        <input
          type="checkbox"
          checked={done}
          onChange={() => toggleTask(t.id)}
          aria-label={`Mark task complete: ${t.title}`}
          className="mt-1 accent-[var(--accent)]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-sm font-medium ${done ? 'line-through text-ink-faint' : ''}`}>
              {t.title}
            </span>
            <Badge tone={kind.tone}>{kind.label}</Badge>
            <Badge>~{t.minutes} min</Badge>
            <Badge>{t.difficulty}</Badge>
            {t.offline && <Badge tone="ok">offline</Badge>}
            {done && autonomy && (
              <Badge tone={AUTONOMY_META[autonomy].tone}>
                {AUTONOMY_META[autonomy].label}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-faint">{t.task}</p>
        </div>
        {done && <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" aria-label="Task completed" />}
      </div>

      <details className="border-t border-line px-4 py-3" open={isDeepLinked || undefined}>
        <summary className="cursor-pointer select-none text-xs font-semibold text-accent">
          Instructions, checks &amp; hints
        </summary>
        <div className="mt-3 space-y-3.5 text-sm leading-relaxed">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Scenario</p>
            <p className="mt-1 text-ink-soft">{t.scenario}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Requirements</p>
            <ol className="mt-1 space-y-1.5 text-ink-soft">
              {t.requirements.map((r, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line font-mono text-[11px] font-bold text-ink-faint">
                    {i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ol>
          </div>
          <p className="rounded-lg bg-ok/10 px-3.5 py-2 text-ink-soft">
            <span className="font-semibold text-ok">Done when: </span>
            {t.doneWhen}
          </p>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Verify it — the checklist ({(rec.checksDone?.length ?? 0)}/{t.checks.length} checks
              verified)
            </p>
            <ul className="mt-1 space-y-1 text-ink-soft">
              {t.checks.map((c, i) => {
                const checked = rec.checksDone?.includes(i) ?? false
                return (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg p-1.5 transition-colors hover:bg-raised/60">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTaskCheck(t.id, i)}
                        aria-label={`Verify: ${c}`}
                        className="mt-1 accent-[var(--accent)]"
                      />
                      <span className={checked ? 'line-through text-ink-faint' : ''}>{c}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>

          {t.hints.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Hints — reveal one at a time
              </p>
              {t.hints.map((h, i) => (
                <details
                  key={i}
                  className="rounded-lg border border-line px-3 py-1.5"
                  onToggle={(e) => {
                    if ((e.target as HTMLDetailsElement).open) recordTaskHint(t.id, i + 1)
                  }}
                >
                  <summary className="cursor-pointer select-none text-xs font-medium text-ink-soft">
                    Hint {i + 1} of {t.hints.length}
                  </summary>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{h}</p>
                </details>
              ))}
            </div>
          )}

          {t.solution && (
            <details
              className="rounded-lg border border-line px-3 py-1.5"
              onToggle={(e) => {
                if ((e.target as HTMLDetailsElement).open) recordTaskSolutionView(t.id)
              }}
            >
              <summary className="cursor-pointer select-none text-xs font-semibold text-accent">
                Reference solution
              </summary>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{t.solution}</p>
              {t.pitfalls && (
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                  <span className="font-semibold text-bad">Common pitfalls: </span>
                  {t.pitfalls}
                </p>
              )}
            </details>
          )}

          {t.pitfalls && (
            <div>
              <button
                type="button"
                onClick={() => {
                  addCustomCard(
                    t.moduleId,
                    `Pitfalls to avoid in "${t.title}" (${t.moduleId})`,
                    t.pitfalls!,
                  )
                  setPitfallSaved(true)
                }}
                disabled={pitfallSaved}
                className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-raised disabled:text-ok disabled:opacity-100"
              >
                {pitfallSaved ? 'Saved to recall deck ✓' : '+ Add pitfall to recall deck'}
              </button>
            </div>
          )}

          <form
            className="rounded-lg border border-line px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault()
              const url = evidenceUrl.trim()
              if (!url) return
              setTaskEvidence(t.id, url)
              addEvidence(t.moduleId, { label: `Task: ${t.title}`, url })
              setEvidenceSaved(true)
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={evidenceUrl}
                onChange={(e) => {
                  setEvidenceUrl(e.target.value)
                  setEvidenceSaved(false)
                }}
                aria-label={`Evidence URL for ${t.title}`}
                placeholder="Evidence URL (repo / gist / PR)"
                className="min-w-[14rem] flex-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs"
              />
              <Button type="submit" size="sm" variant="secondary">
                Save &amp; attach to module evidence
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-ink-faint">
              {evidenceSaved
                ? 'Saved to the task record and the module’s evidence list ✓'
                : 'Optional — attach the repo/gist once the task is done; all checks + evidence earn the Verified badge.'}
            </p>
          </form>

          {t.extension && (
            <details className="rounded-lg border border-line px-3 py-1.5">
              <summary className="cursor-pointer select-none text-xs font-semibold text-ink-soft">
                Extension challenge (optional)
              </summary>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{t.extension}</p>
            </details>
          )}

          {(lesson || t.practiceId) && (
            <div className="flex flex-wrap gap-1.5 border-t border-line pt-2.5">
              {lesson && (
                <Link
                  to={`/r/${META.slug}/learn/${lesson.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-raised"
                >
                  <BookOpen size={12} /> Lesson: {lesson.title}
                </Link>
              )}
              {t.practiceId && (
                <Link
                  to={`/r/${META.slug}/projects#${t.practiceId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-raised"
                >
                  <Wrench size={12} /> Scale up: the matching practice build →
                </Link>
              )}
            </div>
          )}
        </div>
      </details>
    </div>
  )
}

/**
 * Practice & Build — the chapter-level practice section on a module page.
 * Renders nothing when the module has neither tasks nor linked practice
 * projects, so roadmaps without PRACTICE_TASKS are untouched.
 */
export default function PracticeTasks({ moduleId }: { moduleId: string }) {
  const { PRACTICE_TASKS, PRACTICE_PROJECTS, META } = useActiveRoadmap()
  const { data } = useProgress()
  const tasks = (PRACTICE_TASKS ?? []).filter((t) => t.moduleId === moduleId)
  const linkedPractice = PRACTICE_PROJECTS.filter((p) => p.modules.includes(moduleId))
  if (tasks.length === 0 && linkedPractice.length === 0) return null

  const doneCount = tasks.filter((t) => taskDoneOf(data, t.id)).length

  return (
    <Card className="mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold tracking-tight">
          <Wrench size={16} className="text-accent" /> Practice &amp; Build
        </h2>
        {tasks.length > 0 && (
          <span className="text-xs text-ink-faint">
            {doneCount}/{tasks.length} tasks done
          </span>
        )}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-faint">
        Practise this chapter before moving on. Checking a task never changes the module’s mastery
        stage, objectives, or review cards — those stay yours to set.
      </p>

      {tasks.length > 0 && (
        <div className="mt-4 space-y-3">
          {tasks.map((t) => (
            <TaskRow key={t.id} t={t} />
          ))}
        </div>
      )}

      {linkedPractice.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Matching practice builds
          </p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {linkedPractice.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/r/${META.slug}/projects#${p.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {p.title} <ExternalLink size={11} className="inline" aria-hidden="true" />
                </Link>
                <Badge
                  tone={p.difficulty === 'advanced' ? 'warn' : p.difficulty === 'starter' ? 'ok' : 'neutral'}
                >
                  {p.difficulty}
                </Badge>
                <span className="font-mono text-[11px] text-ink-faint">{p.hours}h</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
