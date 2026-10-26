import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, Map, ShieldCheck, Sparkles, Target } from 'lucide-react'
import { BUNDLES, ROADMAPS } from '../content/roadmaps/registry'
import { phaseStats, totals, useProgress } from '../store/progress'
import LoopVisual from '../components/demos/LoopVisual'
import { Card, ProgressBar } from '../components/ui'

import { usePageMeta } from '../hooks/usePageMeta'
export default function Landing() {
  // The landing page markets the default roadmap explicitly, whatever is active
  const { MODULES, PHASES, PROJECTS } = BUNDLES['ai-agents']
  usePageMeta('Become an AI Agent Engineer', 'A structured, project-driven path from React developer to production AI Agent Engineer — diagnostic-first, 60 modules, portfolio checkpoints.')
  const { data } = useProgress()
  const t = totals(data, MODULES)
  const stats = phaseStats(data, MODULES, PHASES)

  return (
    <div className="pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(600px 300px at 70% 0%, var(--accent-soft), transparent 70%)',
          }}
        />
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="fade-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-soft">
              <Sparkles size={13} className="text-accent" />
              Personalised curriculum · {PHASES.length} phases · {MODULES.length} modules ·{' '}
              {PROJECTS.length} portfolio projects
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
              Become an AI Agent Engineer.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              A structured, project-driven path from your React and ML foundations to designing,
              building, evaluating and deploying real-world AI agents. It starts with a diagnostic,
              not assumptions — and every module ends in something you actually shipped.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/assess"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition-all hover:bg-accent-hover active:scale-[0.98]"
              >
                <ClipboardCheck size={16} /> Start with the diagnostic
              </Link>
              <Link
                to="/roadmap"
                className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-5 py-2.5 text-sm font-semibold transition-all hover:bg-raised active:scale-[0.98]"
              >
                <Map size={16} /> Explore the roadmap
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-faint">
              ≈{t.essentialHoursTotal} guided hours on the essential track — see the Planner for
              honest timelines at 5, 10, or 15 hours per week.
            </p>
          </div>

          <Card className="p-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">
              The core idea you'll own
            </p>
            <h3 className="mb-4 text-lg font-semibold tracking-tight">The agent loop</h3>
            <LoopVisual />
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Every agent framework is this loop wearing a costume. You'll build it bare-metal in
              Phase 6, then again in LangGraph — and you can step through a simulation of it today
              in the{' '}
              <Link to="/playground" className="font-medium text-accent hover:underline">
                Playground
              </Link>
              .
            </p>
          </Card>
        </div>
      </section>

      {/* How it teaches */}
      <section className="py-14">
        <h2 className="text-2xl font-semibold tracking-tight">How this platform teaches</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: ClipboardCheck,
              title: 'Diagnose before you study',
              body: 'A 15-minute assessment across five domains finds your real gaps and credits prior knowledge — so you skip what you know and strengthen what you don\'t. Never fake progress.',
            },
            {
              icon: Target,
              title: 'Learn in nine layers',
              body: 'Every concept is taught the same way: simple explanation → intuition → technical depth → visualisation → code walkthrough → exercise → knowledge check → real-world use → further reading.',
            },
            {
              icon: ShieldCheck,
              title: 'Prove it with engineering',
              body: 'Each phase ends in a portfolio checkpoint with evaluation suites, measured cost/latency, trade-off write-ups and interview questions — engineering ability, not API glue.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-6">
              <div className="mb-3 inline-flex rounded-xl bg-accent-soft p-2.5 text-accent">
                <Icon size={18} />
              </div>
              <h3 className="font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Roadmap catalog teaser */}
      <section className="py-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            {ROADMAPS.filter((r) => r.status === 'live' || r.status === 'beta').length} roadmaps ready to start,{' '}
            {ROADMAPS.filter((r) => r.status === 'coming-soon').length} on the way
          </h2>
          <Link to="/roadmaps" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            All roadmaps <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAPS.filter((r) => r.status !== 'live').map((r) => (
            <Link
              key={r.slug}
              to={`/roadmaps/${r.slug}`}
              className="group rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold tracking-tight group-hover:text-accent">{r.title}</p>
                <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-faint">
                  {r.status === 'beta' ? 'beta' : 'soon'}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{r.tagline}</p>
              <p className="mt-2 text-[11px] text-ink-faint">
                {r.stats
                  ? `${r.stats.phases} phases · ${r.stats.modules} modules`
                  : `${r.plannedPhases?.length ?? 0} phases planned`}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Phase strip */}
      <section className="py-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">The {PHASES.length} phases</h2>
          <Link to="/curriculum" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            Full curriculum <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.map(({ phase, doneCount, modules, doneEssentialHours, essentialHours }) => (
            <Link
              key={phase.id}
              to="/curriculum"
              className="group rounded-xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">
                  Phase {phase.n}
                </p>
                <p className="text-xs text-ink-faint">
                  {doneCount}/{modules.length} modules
                </p>
              </div>
              <h3 className="mt-1 font-semibold tracking-tight group-hover:text-accent">
                {phase.title}
              </h3>
              <p className="mt-1 text-sm text-ink-soft">{phase.tagline}</p>
              <ProgressBar
                className="mt-3"
                value={essentialHours ? (doneEssentialHours / essentialHours) * 100 : 0}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="py-14">
        <Card className="p-8">
          <h2 className="text-xl font-semibold tracking-tight">Built on non-negotiables</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-ink-soft sm:grid-cols-2">
            <li>• <span className="font-medium text-ink">Essential vs optional, always marked.</span> Four specialisations are opt-in; nothing is padding.</li>
            <li>• <span className="font-medium text-ink">No fake progress.</span> Every statistic is computed from your recorded activity — nothing else.</li>
            <li>• <span className="font-medium text-ink">Honest simulations.</span> The Playground is clearly labelled as scripted until a real backend exists.</li>
            <li>• <span className="font-medium text-ink">Content separate from code.</span> The curriculum is data; it evolves without touching the app.</li>
          </ul>
        </Card>
      </section>
    </div>
  )
}
