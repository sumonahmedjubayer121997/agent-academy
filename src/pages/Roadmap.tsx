import RoadmapGraph from '../components/RoadmapGraph'
import { SectionHead } from '../components/ui'

export default function Roadmap() {
  return (
    <div className="py-10">
      <SectionHead
        eyebrow="Interactive roadmap"
        title="The dependency map"
        sub="Phases flow left to right; arrows are hard prerequisites. Click any module to open it — locked modules are explorable with a warning, because learning is yours to direct. The graph is a recommendation of the efficient path, not a cage."
      />
      <RoadmapGraph />
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border-2 border-accent bg-accent-soft" /> completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-accent" /> in progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border-2 border-line-strong" /> not started
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border-2 border-dashed border-line-strong opacity-60" /> locked (explorable)
        </span>
        <span>↔ scroll horizontally to see all 8 phases</span>
      </div>
    </div>
  )
}
