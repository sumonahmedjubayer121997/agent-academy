import { useMemo, useState } from 'react'
import { useActiveRoadmap } from '../store/activeRoadmap'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, Layers, Sparkles } from 'lucide-react'
import RoadmapGraph, { type RoadmapGraphProps } from '../components/RoadmapGraph'
import { Badge, Card, ProgressBar, SectionHead } from '../components/ui'
import {
  isUnlocked,
  moduleRecordOf,
  stageOf,
  statusOf,
  useProgress,
} from '../store/progress'

import { usePageMeta } from '../hooks/usePageMeta'
export default function Roadmap() {
  const activeBundle = useActiveRoadmap()
  const { MODULES, downstreamUnlockCount, PRACTICE_TASKS, TRACKS, trackForModule, META } = activeBundle
  usePageMeta('Roadmap map', 'The full dependency graph of the AI Agents curriculum.')
  const { data } = useProgress()
  const [filter, setFilter] = useState<NonNullable<RoadmapGraphProps['filterTrack']>>('all')

  // Bottleneck modules: unlocked, essential, not yet completed, sorted by downstream unlocks
  const bottlenecks = useMemo(() => {
    return MODULES.filter(
      (m) => m.essential && statusOf(data, m.id) !== 'completed' && isUnlocked(data, m),
    )
      .map((m) => ({
        module: m,
        unlocks: downstreamUnlockCount(m.id, MODULES),
        stage: stageOf(data, m.id),
      }))
      .filter((x) => x.unlocks > 0)
      .sort((a, b) => b.unlocks - a.unlocks)
      .slice(0, 4)
  }, [data])

  // Track breakdown with transparent methodology
  const trackStats = useMemo(() => {
    return TRACKS.map((tr) => {
      const mods = MODULES.filter((m) => m.essential && trackForModule(m.id) === tr.id)
      const learning = mods.filter((m) => stageOf(data, m.id) === 'learning').length
      const practising = mods.filter((m) => stageOf(data, m.id) === 'practising').length
      const confident = mods.filter((m) => stageOf(data, m.id) === 'confident').length
      const mastered = mods.filter((m) => stageOf(data, m.id) === 'mastered').length
      const evidenceBacked = mods.filter(
        (m) => moduleRecordOf(data, m.id).evidenceUrls.length > 0 || stageOf(data, m.id) === 'mastered',
      ).length
      return {
        track: tr,
        total: mods.length,
        learning,
        practising,
        confident,
        mastered,
        confidentOrMastered: confident + mastered,
        evidenceBacked,
      }
    })
  }, [data])

  return (
    <div className="py-10">
      <SectionHead level="h1"
        eyebrow="Interactive roadmap & skills gap map"
        title="The dependency & mastery map"
        sub="Phases flow left to right; arrows are hard prerequisites. Filter by this roadmap's career tracks, spot high-leverage bottlenecks, and see which skills are only understood theoretically versus demonstrated through a project."
      />

      {/* Track & Bottleneck Filter Bar */}
      <div
        className="mb-4 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter roadmap modules"
      >
        {(
          [
            { id: 'all', label: `All ${MODULES.length} Modules` },
            ...TRACKS.map((t) => ({ id: t.id, label: `${t.code} · ${t.title}` })),
            { id: 'bottlenecks', label: 'KEY Bottlenecks' },
            { id: 'revision', label: 'Due for Revision / Shaky' },
            ...((PRACTICE_TASKS?.length ?? 0) > 0
              ? [{ id: 'practice', label: 'Needs Practice' }]
              : []),
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === item.id
                ? 'border-accent bg-accent text-accent-ink'
                : 'border-line bg-surface text-ink-soft hover:bg-raised'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <RoadmapGraph bundle={activeBundle} filterTrack={filter} />

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border-2 border-ok bg-ok/20" /> demonstrated
          mastery (project-proven)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border-2 border-accent bg-accent-soft" />{' '}
          confident / understood
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-accent bg-accent-soft" />{' '}
          practising
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-accent" /> currently
          learning
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border-2 border-line-strong" /> not started
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-bad" /> due for revision / shaky
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] font-bold text-accent">KEY</span> bottleneck
          (unlocks downstream modules)
        </span>
        <span>↔ scroll horizontally to inspect all 8 phases</span>
      </div>

      {/* Bottlenecks & Track Skill Breakdown */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <AlertCircle size={17} className="text-accent" />
            <h2 className="font-semibold tracking-tight">
              Current bottlenecks (highest downstream leverage)
            </h2>
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            These unlocked modules currently block the largest number of advanced modules in your
            skill tree.
          </p>
          <div className="mt-4 space-y-2.5">
            {bottlenecks.map(({ module: m, unlocks, stage }) => (
              <Link
                key={m.id}
                to={`/r/${META.slug}/roadmap/${m.id}`}
                className="group flex items-center justify-between rounded-xl border border-line px-4 py-3 transition-all hover:border-accent/40 hover:bg-accent-soft"
              >
                <div>
                  <p className="text-sm font-medium group-hover:text-accent">
                    P{m.phase} · {m.title}
                  </p>
                  <p className="text-xs text-ink-faint">
                    Status: <span className="capitalize">{stage}</span> · {m.hours}h
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="accent">Unlocks {unlocks} modules</Badge>
                  <ArrowRight size={14} className="text-ink-faint group-hover:text-accent" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Layers size={17} className="text-accent" />
            <h2 className="font-semibold tracking-tight">
              Track coverage & demonstrated skill gap
            </h2>
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            Methodology: counts essential modules per track at <b>Confident+</b> vs{' '}
            <b>Demonstrated (Mastered / Evidence-linked)</b>. No black-box percentages.
          </p>
          <div className="mt-4 space-y-4">
            {trackStats.map((ts) => (
              <div key={ts.track.id} className="rounded-xl border border-line bg-raised/30 p-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    Track {ts.track.code} · {ts.track.title}
                  </p>
                  <span className="text-xs text-ink-faint">
                    {ts.confidentOrMastered}/{ts.total} Confident+ ·{' '}
                    <strong className="text-ok">{ts.evidenceBacked} Project-Proven</strong>
                  </span>
                </div>
                <ProgressBar
                  className="mt-2"
                  value={(ts.confidentOrMastered / Math.max(1, ts.total)) * 100}
                />
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-ink-faint">
                  <span>Learning: {ts.learning}</span>
                  <span>Practising: {ts.practising}</span>
                  <span>Confident: {ts.confident}</span>
                  <span className="text-ok">
                    <Sparkles size={10} className="inline" /> Mastered: {ts.mastered}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
