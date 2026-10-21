import { Link } from 'react-router-dom'
import { PROJECTS } from '../content/projects'
import { MODULES } from '../content/modules'
import { statusOf, useProgress } from '../store/progress'
import { Badge, Card, SectionHead, StatusBadge } from '../components/ui'

export default function Projects() {
  const { data } = useProgress()

  return (
    <div className="py-10">
      <SectionHead
        eyebrow="Projects & portfolio"
        title="Five projects that prove engineering"
        sub="Depth beats quantity. Each project maps to a phase checkpoint, targets a distinct skill, and ships with an evaluation plan, published metrics, trade-offs and interview stories — the difference between a portfolio and a list of integrations."
      />

      <div className="space-y-6">
        {PROJECTS.map((p, i) => {
          const module = MODULES.find((m) => m.id === p.moduleId)
          return (
            <Card key={p.id} className="tilt-card overflow-hidden">
              <div className="border-b border-line bg-raised/60 px-6 py-5 sm:px-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-accent">
                      Project {i + 1} · proves {p.proves}
                    </p>
                    <h2 className="mt-1.5 text-xl font-semibold tracking-tight">{p.title}</h2>
                  </div>
                  {module && (
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={statusOf(data, module.id)} />
                      <Link
                        to={`/roadmap/${module.id}`}
                        className="text-xs text-ink-faint hover:text-accent hover:underline"
                      >
                        checkpoint: {module.title} →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-2">
                <div className="space-y-5 text-sm leading-relaxed">
                  <div>
                    <h3 className="mb-1 font-semibold">Problem</h3>
                    <p className="text-ink-soft">{p.problem}</p>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">Target users</h3>
                    <p className="text-ink-soft">{p.users}</p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">Stack</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {p.stack.map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1.5 font-semibold">Milestones</h3>
                    <ol className="space-y-1.5 text-ink-soft">
                      {p.milestones.map((m) => (
                        <li key={m} className="flex gap-2">
                          <span className="font-mono text-xs text-accent">▸</span>
                          {m}
                        </li>
                      ))}
                    </ol>
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
                    <h3 className="mb-1.5 font-semibold">README skeleton</h3>
                    <ol className="space-y-1 text-ink-soft">
                      {p.readme.map((r, ri) => (
                        <li key={r} className="flex gap-2">
                          <span className="font-mono text-xs text-ink-faint">{ri + 1}.</span>
                          {r}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">Demo plan</h3>
                    <p className="text-ink-soft">{p.demo}</p>
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">Key trade-offs</h3>
                    <p className="text-ink-soft">{p.tradeoffs}</p>
                  </div>
                  <div>
                    <h3 className="mb-1.5 font-semibold">Interview questions it must survive</h3>
                    <ul className="space-y-1.5 text-ink-soft">
                      {p.interview.map((q) => (
                        <li key={q} className="flex gap-2">
                          <span className="text-accent">?</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="mt-8 p-6">
        <h3 className="font-semibold tracking-tight">Every README follows one skeleton</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Problem → Demo (GIF/video) → Architecture diagram → Quickstart → Design decisions &
          trade-offs → Evaluation results table (latency, cost, quality) → Limitations → What I'd do
          next. A recruiter should understand the project in 90 seconds; an engineer should respect
          it in 10 minutes.
        </p>
        <p className="mt-3 text-sm text-ink-faint">
          Full portfolio strategy and role-mapping (AI Agent Engineer / LLM Engineer / Applied AI
          Engineer) is in <code>docs/ROADMAP_REPORT.md</code> in this repository.
        </p>
      </Card>
    </div>
  )
}
