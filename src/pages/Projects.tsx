import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FolderGit2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { MODULES } from '../content/roadmaps/ai-agents'
import { PROJECTS } from '../content/roadmaps/ai-agents'
import { PRACTICE_PROJECTS, type PracticeProject } from '../content/roadmaps/ai-agents'
import { Badge, Button, Card, ProgressBar, SectionHead, StatusBadge } from '../components/ui'
import {
  emptyProjectRecord,
  stageOf,
  useProgress,
  type ProjectAutonomy,
} from '../store/progress'

const AUTONOMY_LEVELS: {
  id: ProjectAutonomy
  label: string
  hint: string
  tone: 'neutral' | 'accent' | 'ok' | 'warn'
}[] = [
  {
    id: 'planning',
    label: 'Planning',
    hint: 'Not built yet — reviewing requirements & prerequisites',
    tone: 'neutral',
  },
  {
    id: 'tutorial-followed',
    label: 'Tutorial / Guided',
    hint: 'Followed a guide or reference closely — need to modify & rebuild solo',
    tone: 'warn',
  },
  {
    id: 'modified',
    label: 'Modified & Extended',
    hint: 'Adapted architecture, dataset, or tools beyond any tutorial',
    tone: 'accent',
  },
  {
    id: 'built-independently',
    label: 'Built Independently',
    hint: 'Designed and coded from scratch with tests & evaluation',
    tone: 'ok',
  },
  {
    id: 'defensible',
    label: 'Interview-Defensible',
    hint: 'Shipped, evaluated, and can explain every trade-off & failure mode cold',
    tone: 'ok',
  },
]

function PracticeProjectRow({ p }: { p: PracticeProject }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-line last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-raised/60"
      >
        <span className="w-7 shrink-0 font-mono text-[11px] font-semibold text-ink-faint">P{p.phase}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.title}</span>
        <span className="hidden max-w-[38%] shrink-0 truncate text-xs text-ink-faint lg:block">
          {p.modules.map((id) => MODULES.find((x) => x.id === id)?.title).filter(Boolean).join(' · ')}
        </span>
        <Badge
          tone={p.difficulty === 'advanced' ? 'warn' : p.difficulty === 'starter' ? 'ok' : 'neutral'}
          className="hidden shrink-0 sm:inline-flex"
        >
          {p.difficulty}
        </Badge>
        <span className="w-12 shrink-0 text-right font-mono text-[11px] text-ink-faint">{p.hours}h</span>
        {open ? (
          <ChevronUp size={13} className="shrink-0 text-ink-faint" />
        ) : (
          <ChevronDown size={13} className="shrink-0 text-ink-faint" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1">
          <p className="text-sm leading-relaxed text-ink-soft">{p.brief}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.stack.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Step by step</p>
          <ol className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-ink-soft">
            {p.steps.map((s, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line font-mono text-[11px] font-bold text-ink-faint">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-lg bg-ok/10 px-3.5 py-2 text-sm text-ink-soft">
            <span className="font-semibold text-ok">Done when: </span>
            {p.doneWhen}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {p.modules.map((id) => {
              const m = MODULES.find((x) => x.id === id)
              return m ? (
                <Link key={id} to={`/roadmap/${id}`}>
                  <Badge>↗ {m.title}</Badge>
                </Link>
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PracticeProjectsSection() {
  const [phase, setPhase] = useState<number | 'all'>('all')
  const shown = PRACTICE_PROJECTS.filter((p) => phase === 'all' || p.phase === phase)
  const phaseHours = (n: number) =>
    PRACTICE_PROJECTS.filter((p) => p.phase === n).reduce((s, p) => s + p.hours, 0)

  return (
    <section className="mt-14" aria-labelledby="practice-projects">
      <SectionHead
        eyebrow="Practice projects · 40"
        title="The reps between milestones"
        sub="Five step-by-step projects per phase — small, concrete builds that exercise exactly what the phase teaches. The five flagship projects above remain your portfolio pieces; these are how you earn them."
      />
      <div className="mb-4 flex flex-wrap gap-1">
        <button
          onClick={() => setPhase('all')}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            phase === 'all' ? 'bg-raised text-ink' : 'text-ink-faint hover:bg-raised hover:text-ink'
          }`}
        >
          All 40
        </button>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <button
            key={n}
            onClick={() => setPhase(n)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              phase === n ? 'bg-raised text-ink' : 'text-ink-faint hover:bg-raised hover:text-ink'
            }`}
          >
            P{n} <span className="text-ink-faint">{phaseHours(n)}h</span>
          </button>
        ))}
      </div>
      <Card className="overflow-hidden">
        {shown.map((p) => (
          <PracticeProjectRow key={p.id} p={p} />
        ))}
      </Card>
    </section>
  )
}

export default function Projects() {
  const { data, updateProject, toggleProjectMilestone, setStage } = useProgress()
  const [expandedLog, setExpandedLog] = useState<Record<string, boolean>>({
    [PROJECTS[0].id]: true,
  })

  return (
    <div className="py-10">
      <SectionHead
        eyebrow="Projects & portfolio tracker"
        title="Five flagship projects that prove engineering"
        sub="Distinguish between a tutorial you followed and a system you can independently explain, modify, and defend. Check off milestones, attach your GitHub repository and evaluation metrics, log engineering problems & solutions, and rehearse each project's interview questions."
      />

      <div className="space-y-6">
        {PROJECTS.map((p, i) => {
          const module = MODULES.find((m) => m.id === p.moduleId)
          const rec = data.projects?.[p.id] ?? emptyProjectRecord(p.id, p.moduleId)
          const milestonesPct = (rec.milestonesDone.length / Math.max(1, p.milestones.length)) * 100
          const isExpanded = Boolean(expandedLog[p.id])
          const currentAutonomy =
            AUTONOMY_LEVELS.find((a) => a.id === rec.autonomy) ?? AUTONOMY_LEVELS[0]
          const allMilestonesDone = rec.milestonesDone.length === p.milestones.length
          const hasRepo = Boolean(rec.repoUrl.trim())
          const modStage = module ? stageOf(data, module.id) : 'not-started'

          return (
            <Card key={p.id} className="overflow-hidden">
              <div className="border-b border-line bg-raised/60 px-6 py-5 sm:px-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-accent">
                        Project {i + 1} · proves {p.proves}
                      </p>
                      <Badge tone={currentAutonomy.tone}>{currentAutonomy.label}</Badge>
                    </div>
                    <h2 className="mt-1.5 text-xl font-semibold tracking-tight">{p.title}</h2>
                  </div>
                  {module && (
                    <div className="flex flex-row flex-wrap items-center gap-x-2 gap-y-1 sm:flex-col sm:items-end sm:gap-1.5">
                      <StatusBadge status={modStage} />
                      <Link
                        to={`/roadmap/${module.id}`}
                        className="text-xs text-ink-faint hover:text-accent hover:underline"
                      >
                        checkpoint: {module.title} →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Autonomy selector */}
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    Independence & Mastery Level — {currentAutonomy.hint}
                  </p>
                  <div className="mt-1.5 inline-flex max-w-full flex-wrap rounded-xl border border-line bg-surface p-1">
                    {AUTONOMY_LEVELS.map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => updateProject(p.id, p.moduleId, { autonomy: lvl.id })}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          rec.autonomy === lvl.id
                            ? 'bg-accent text-accent-ink'
                            : 'text-ink-soft hover:bg-raised'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-2">
                <div className="space-y-5 text-sm leading-relaxed">
                  <div>
                    <h3 className="mb-1 font-semibold">Objective & problem</h3>
                    <p className="text-ink-soft">{p.problem}</p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">Required stack & skills</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {p.stack.map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Milestones */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <h3 className="font-semibold">Interactive milestones</h3>
                      <span className="text-xs text-ink-faint">
                        {rec.milestonesDone.length}/{p.milestones.length} completed
                      </span>
                    </div>
                    <ProgressBar value={milestonesPct} className="mb-3" />
                    <ol className="space-y-2 text-ink-soft">
                      {p.milestones.map((ms, mi) => {
                        const checked = rec.milestonesDone.includes(mi)
                        return (
                          <li key={ms}>
                            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-raised/60">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleProjectMilestone(p.id, p.moduleId, mi)}
                                className="mt-1 accent-[var(--accent)]"
                              />
                              <span className={checked ? 'line-through text-ink-faint' : ''}>
                                {ms}
                              </span>
                            </label>
                          </li>
                        )
                      })}
                    </ol>
                  </div>

                  {/* Repository & Demo URLs */}
                  <div className="rounded-xl border border-line bg-raised/40 p-4">
                    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      <FolderGit2 size={13} className="text-accent" /> Repository & Demo Evidence
                    </h3>
                    <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] text-ink-faint">GitHub Repository URL</label>
                        <input
                          value={rec.repoUrl}
                          onChange={(e) =>
                            updateProject(p.id, p.moduleId, { repoUrl: e.target.value })
                          }
                          placeholder="https://github.com/..."
                          className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-ink-faint">Live Demo / Video URL</label>
                        <input
                          value={rec.demoUrl}
                          onChange={(e) =>
                            updateProject(p.id, p.moduleId, { demoUrl: e.target.value })
                          }
                          placeholder="https://..."
                          className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      {rec.repoUrl && (
                        <a
                          href={rec.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-accent hover:underline"
                        >
                          Open repository <ExternalLink size={11} className="inline" />
                        </a>
                      )}
                      {rec.demoUrl && (
                        <a
                          href={rec.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-accent hover:underline"
                        >
                          Open live demo <ExternalLink size={11} className="inline" />
                        </a>
                      )}
                    </div>
                    {allMilestonesDone && hasRepo && module && modStage !== 'mastered' && (
                      <div className="mt-3 flex items-center justify-between rounded-lg border border-ok/30 bg-ok/10 px-3 py-2 text-xs">
                        <span className="text-ok">
                          All milestones & repository linked! Promote checkpoint to Mastered?
                        </span>
                        <Button size="sm" onClick={() => setStage(module.id, 'mastered')}>
                          <Sparkles size={12} /> Mark Mastered
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-5 text-sm leading-relaxed">
                  <div>
                    <h3 className="mb-1 font-semibold">Testing & evaluation strategy</h3>
                    <p className="text-ink-soft">{p.evaluation}</p>
                  </div>
                  <div>
                    <h3 className="mb-1.5 font-semibold">Metrics to publish</h3>
                    <ul className="flex flex-wrap gap-1.5">
                      {p.metrics.map((m) => (
                        <Badge key={m} tone="accent">
                          {m}
                        </Badge>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">Key trade-offs</h3>
                    <p className="text-ink-soft">{p.tradeoffs}</p>
                  </div>
                  <div>
                    <h3 className="mb-1.5 font-semibold">
                      Interview questions it must survive (click log below to draft your answers)
                    </h3>
                    <ul className="space-y-2 text-ink-soft">
                      {p.interview.map((q, qi) => (
                        <li key={q} className="rounded-lg border border-line bg-raised/30 px-3 py-2">
                          <p className="flex gap-2 font-medium text-ink">
                            <span className="text-accent">?</span>
                            {q}
                          </p>
                          {rec.interviewAnswers[qi] && (
                            <p className="mt-1 text-xs text-ok">
                              ✓ Your defence: {rec.interviewAnswers[qi]}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Collapsible Engineering Log, Problems/Solutions & Retrospective */}
              <div className="border-t border-line bg-raised/30 px-6 py-3 sm:px-8">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedLog((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                  }
                  className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-accent"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Engineering Log, Evaluation Evidence, Retrospective &
                    Interview Rehearsal
                  </span>
                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {isExpanded && (
                  <div className="mt-4 grid gap-4 pb-3 text-sm sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-ink-faint">
                        Implementation notes & architecture decisions
                      </label>
                      <textarea
                        value={rec.architectureNotes}
                        onChange={(e) =>
                          updateProject(p.id, p.moduleId, {
                            architectureNotes: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder="Why you chose this schema, model, or state-machine design…"
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-faint">
                        Testing & evaluation evidence (numbers achieved)
                      </label>
                      <textarea
                        value={rec.evaluationEvidence}
                        onChange={(e) =>
                          updateProject(p.id, p.moduleId, {
                            evaluationEvidence: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder="e.g. hit-rate@5 = 86% on 30 golden questions, p95 = 740ms, $0.004/query…"
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-faint">
                        Problems encountered & bugs hit
                      </label>
                      <textarea
                        value={rec.problemsEncountered}
                        onChange={(e) =>
                          updateProject(p.id, p.moduleId, {
                            problemsEncountered: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder="What broke in practice (rate limits, bad chunks, tool loops)?"
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-faint">
                        Solutions, lessons learned & final retrospective
                      </label>
                      <textarea
                        value={rec.solutionsLearned}
                        onChange={(e) =>
                          updateProject(p.id, p.moduleId, {
                            solutionsLearned: e.target.value,
                          })
                        }
                        rows={3}
                        placeholder="How you fixed those problems and what you would design differently next time…"
                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs leading-relaxed"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <p className="mb-2 text-xs font-semibold text-ink-faint">
                        Interview Defence Self-Check (write your 2-sentence answer to each question):
                      </p>
                      <div className="space-y-2.5">
                        {p.interview.map((q, qi) => (
                          <div key={q}>
                            <label className="block text-xs text-ink-soft">
                              {qi + 1}. {q}
                            </label>
                            <input
                              value={rec.interviewAnswers[qi] ?? ''}
                              onChange={(e) =>
                                updateProject(p.id, p.moduleId, {
                                  interviewAnswers: {
                                    ...rec.interviewAnswers,
                                    [qi]: e.target.value,
                                  },
                                })
                              }
                              placeholder="Your concise engineering answer with numbers/trade-offs…"
                              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-1.5 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <PracticeProjectsSection />

      <Card className="mt-8 p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-ok" />
          <h3 className="font-semibold tracking-tight">Every README follows one skeleton</h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Problem → Demo (GIF/video) → Architecture diagram → Quickstart → Design decisions &
          trade-offs → Evaluation results table (latency, cost, quality) → Limitations → What I'd do
          next. A recruiter should understand the project in 90 seconds; an engineer should respect
          it in 10 minutes.
        </p>
      </Card>
    </div>
  )
}
