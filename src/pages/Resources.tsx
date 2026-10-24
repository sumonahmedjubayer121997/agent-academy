import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { RESOURCES } from '../content/resources'
import { GLOSSARY } from '../content/glossary'
import { PHASES } from '../content/roadmaps/ai-agents'
import { Badge, Card, SectionHead } from '../components/ui'

export default function Resources() {
  const [filter, setFilter] = useState<number | 'all'>('all')
  const shown = RESOURCES.filter((r) => filter === 'all' || r.supports.includes(`Phase ${filter}`))

  return (
    <div className="py-10">
      <SectionHead
        eyebrow="Learning resources"
        title="Curated, verified, mostly free"
        sub="Official documentation and reputable providers only — every link verified 2026-10-21. Free unless marked paid. Each entry tells you why it's worth your time, what you need first, and which lesson it supports."
      />

      <div className="mb-6 flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === 'all' ? 'border-accent bg-accent text-accent-ink' : 'border-line text-ink-soft hover:bg-raised'
          }`}
        >
          All ({RESOURCES.length})
        </button>
        {PHASES.map((p) => {
          const count = RESOURCES.filter((r) => r.supports.includes(`Phase ${p.n}`)).length
          if (count === 0) return null
          return (
            <button
              key={p.id}
              onClick={() => setFilter(p.n)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === p.n ? 'border-accent bg-accent text-accent-ink' : 'border-line text-ink-soft hover:bg-raised'
              }`}
            >
              P{p.n} ({count})
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((r) => (
          <Card key={r.url} className="flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
            <div className="flex items-start justify-between gap-3">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold leading-snug tracking-tight text-ink hover:text-accent hover:underline"
              >
                {r.title} <ExternalLink size={12} className="ml-0.5 inline opacity-60" />
              </a>
              <Badge tone={r.free ? 'ok' : 'warn'} className="shrink-0">
                {r.free ? 'Free' : 'Paid'}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-ink-faint">{r.provider}</p>
            <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-soft">{r.why}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge>{r.supports}</Badge>
              <Badge>Prereqs: {r.prereqs}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-sm text-ink-faint">
        Note: the AI tooling ecosystem moves fast — LangChain's docs now live at docs.langchain.com
        and OpenAI's at developers.openai.com (both updated here). Deep links inside lessons are
        re-verified whenever content is updated. No fabricated courses or certificates.
      </p>

      <section className="mt-14">
        <SectionHead
          eyebrow="Glossary"
          title="The vocabulary of agent engineering"
          sub="Terms defined in two lines, each linked to the module that teaches it properly. If you can define every term cold, you speak the field."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GLOSSARY.map((g) => (
            <Card key={g.term} className="p-4 transition-all hover:-translate-y-0.5">
              <p className="font-semibold tracking-tight">{g.term}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{g.def}</p>
              <Link to={`/roadmap/${g.moduleId}`} className="mt-2 inline-block text-xs text-accent hover:underline">
                taught in this module →
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
