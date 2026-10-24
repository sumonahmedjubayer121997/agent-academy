import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  Code2,
  MessagesSquare,
  Sparkles,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { Badge, Card, SectionHead } from '../components/ui'
import { ROADMAPS, getRoadmap } from '../content/roadmaps/registry'
import { usePageMeta } from '../hooks/usePageMeta'

const ICONS: Record<string, LucideIcon> = {
  Bot,
  Sparkles,
  Code2,
  Workflow,
  MessagesSquare,
}

function StatusChip({ status }: { status: 'live' | 'coming-soon' }) {
  return status === 'live' ? (
    <Badge tone="ok">Live</Badge>
  ) : (
    <Badge>Coming soon</Badge>
  )
}

function RoadmapCard({ slug }: { slug: string }) {
  const r = getRoadmap(slug)
  if (!r) return null
  const Icon = ICONS[r.icon] ?? Bot
  const live = r.status === 'live'
  return (
    <Card className="group flex flex-col p-5 transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon size={17} />
        </span>
        <StatusChip status={r.status} />
      </div>
      <h3 className="mt-3 font-semibold tracking-tight">{r.title}</h3>
      <p className="mt-0.5 text-sm text-ink-soft">{r.tagline}</p>
      <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-ink-soft/90">{r.description}</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <span className="text-xs text-ink-faint">
          {r.stats ? (
            <>
              {r.stats.phases} phases · {r.stats.modules} modules · {r.stats.lessons} lessons · ~{r.stats.hours}h
            </>
          ) : (
            <>{r.plannedPhases?.length ?? 0} phases planned · {r.level}</>
          )}
        </span>
        <Link
          to={live ? '/roadmap' : `/roadmaps/${r.slug}`}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent hover:underline"
        >
          {live ? 'Open roadmap' : 'View plan'}
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </Card>
  )
}

export default function Roadmaps() {
  usePageMeta('Roadmaps', 'Structured roadmaps for AI skills — AI Agents is live now; AI Programming, AI Automation, Chatbot Development and Prompt Engineering are coming.')
  const live = ROADMAPS.filter((r) => r.status === 'live')
  const soon = ROADMAPS.filter((r) => r.status === 'coming-soon')
  return (
    <div className="py-10">
      <SectionHead
        eyebrow="Roadmaps"
        title="Pick a path, follow it to the end"
        sub="Every roadmap is a sequence of modules with lessons, spaced review, and portfolio projects. Start the live one today; the rest are being authored."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...live, ...soon].map((r) => (
          <RoadmapCard key={r.slug} slug={r.slug} />
        ))}
      </div>
    </div>
  )
}

export function RoadmapDetail() {
  const { slug } = useParams()
  const r = slug ? getRoadmap(slug) : undefined
  usePageMeta(
    r ? r.title : 'Roadmap not found',
    r?.description,
  )
  if (!r) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-soft">That roadmap doesn't exist.</p>
        <Link to="/roadmaps" className="mt-2 inline-block text-sm font-semibold text-accent hover:underline">
          ← All roadmaps
        </Link>
      </div>
    )
  }
  if (r.status === 'live') return <Navigate to="/roadmap" replace />
  const Icon = ICONS[r.icon] ?? Bot
  return (
    <div className="py-10">
      <Link to="/roadmaps" className="text-xs font-medium text-ink-faint hover:text-accent hover:underline">
        ← All roadmaps
      </Link>
      <div className="mt-4 flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon size={20} />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{r.title}</h1>
            <StatusChip status={r.status} />
          </div>
          <p className="mt-1 text-ink-soft">{r.tagline}</p>
        </div>
      </div>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">{r.description}</p>

      <div className="mt-8 max-w-2xl">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Planned phases</h2>
        <ol className="mt-3 space-y-2">
          {r.plannedPhases?.map((p, i) => (
            <li key={p.title} className="flex gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line font-mono text-[11px] font-bold text-ink-faint">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-sm leading-relaxed text-ink-soft">{p.blurb}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink-faint">
          Hours and lesson counts are set when authoring begins — no estimates until then.
        </p>
      </div>

      <Card className="mt-8 max-w-2xl p-5">
        <h3 className="font-semibold tracking-tight">Meanwhile, start the live roadmap</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          AI Agents covers the foundations most of these roadmaps assume — Python, ML rigour, retrieval, and
          tool-calling. Progress you make there carries over when {r.title} opens.
        </p>
        <Link
          to="/curriculum"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
        >
          Start AI Agents <ArrowRight size={13} />
        </Link>
      </Card>
    </div>
  )
}
