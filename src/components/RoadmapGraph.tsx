import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { cardsForModule } from '../content/cards'
import { MODULES } from '../content/modules'
import { PHASES } from '../content/phases'
import {
  downstreamUnlockCount,
  trackForModule,
  trackSpecFor,
  type TrackId,
} from '../content/tracks'
import { isDue } from '../lib/srs'
import {
  isUnlocked,
  moduleRecordOf,
  stageOf,
  statusOf,
  todayStr,
  useProgress,
} from '../store/progress'

const NODE_W = 224
const NODE_H = 58
const V_GAP = 26
const COL_GAP = 34
const TOP = 86
const LEFT = 20

const trunc = (s: string, n = 25) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

export interface RoadmapGraphProps {
  filterTrack?: TrackId | 'all' | 'bottlenecks' | 'revision'
}

export default function RoadmapGraph({ filterTrack = 'all' }: RoadmapGraphProps) {
  const navigate = useNavigate()
  const { data } = useProgress()
  const today = todayStr()

  const geom = useMemo(() => {
    const cols = PHASES.map((phase) => MODULES.filter((m) => m.phase === phase.n))
    const width = LEFT * 2 + PHASES.length * NODE_W + (PHASES.length - 1) * COL_GAP
    const tallest = Math.max(...cols.map((c) => c.length))
    const height = TOP + tallest * (NODE_H + V_GAP) + 30
    const pos = new Map<string, { x: number; y: number }>()
    cols.forEach((col, ci) => {
      col.forEach((m, ri) => {
        pos.set(m.id, { x: LEFT + ci * (NODE_W + COL_GAP), y: TOP + ri * (NODE_H + V_GAP) })
      })
    })
    return { cols, width, height, pos }
  }, [])

  // Compute top bottleneck module IDs (unlocked, not yet completed, highest downstream unlock count)
  const bottleneckIds = useMemo(() => {
    const unlockedIncomplete = MODULES.filter(
      (m) => m.essential && statusOf(data, m.id) !== 'completed' && isUnlocked(data, m),
    )
      .map((m) => ({ id: m.id, unlocks: downstreamUnlockCount(m.id, MODULES) }))
      .filter((x) => x.unlocks >= 2)
      .sort((a, b) => b.unlocks - a.unlocks)
      .slice(0, 4)
    return new Set(unlockedIncomplete.map((x) => x.id))
  }, [data])

  const edges = useMemo(() => {
    const out: { d: string; active: boolean }[] = []
    for (const m of MODULES) {
      const to = geom.pos.get(m.id)
      if (!to) continue
      for (const p of m.prereqs) {
        const from = geom.pos.get(p)
        if (!from) continue
        const sameCol = Math.abs(from.x - to.x) < 1
        let d: string
        if (sameCol) {
          const x = from.x + NODE_W / 2
          d = `M ${x} ${from.y + NODE_H} L ${x} ${to.y}`
        } else {
          const x1 = from.x + NODE_W
          const x2 = to.x
          const mid = (x1 + x2) / 2
          d = `M ${x1} ${from.y + NODE_H / 2} C ${mid} ${from.y + NODE_H / 2}, ${mid} ${to.y + NODE_H / 2}, ${x2} ${to.y + NODE_H / 2}`
        }
        const active =
          statusOf(data, p) === 'completed' && statusOf(data, m.id) !== 'not-started'
        out.push({ d, active })
      }
    }
    return out
  }, [data, geom])

  return (
    <div
      className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-soft"
      role="img"
      aria-label="Interactive learning roadmap graph"
    >
      <svg
        width={geom.width}
        height={geom.height}
        className="block min-w-full cursor-default select-none"
      >
        {/* Phase headers */}
        {PHASES.map((p, i) => {
          const x = LEFT + i * (NODE_W + COL_GAP)
          const hours = MODULES.filter((m) => m.phase === p.n).reduce((s, m) => s + m.hours, 0)
          return (
            <g key={p.id}>
              <rect x={x - 6} y={40} width={NODE_W + 12} height={34} rx={8} fill="var(--raised)" />
              <text x={x + 4} y={55} fontSize="11" fontWeight={700} fill="var(--accent)">
                PHASE {p.n}
              </text>
              <text x={x + 4} y={68} fontSize="11" fill="var(--ink-faint)">
                {trunc(p.title, 26)} · {hours}h
              </text>
            </g>
          )
        })}

        {/* Dependency edges */}
        {edges.map((e, i) => (
          <path
            key={i}
            d={e.d}
            fill="none"
            stroke={e.active ? 'var(--accent)' : 'var(--line-strong)'}
            strokeWidth={e.active ? 1.6 : 1}
            opacity={e.active ? 0.85 : 0.6}
          />
        ))}

        {/* Module nodes */}
        {MODULES.map((m) => {
          const p = geom.pos.get(m.id)!
          const stage = stageOf(data, m.id)
          const status = statusOf(data, m.id)
          const rec = moduleRecordOf(data, m.id)
          const unlocked = isUnlocked(data, m)
          const trackId = trackForModule(m.id)
          const trackSpec = trackSpecFor(trackId)
          const isBottleneck = bottleneckIds.has(m.id)

          const modCardIds = cardsForModule(m.id).map((c) => c.cardId)
          const hasDueSrs = modCardIds.some((cid) => data.srs[cid] && isDue(data.srs[cid], today))
          const isShaky = data.confidence[m.id] === 'shaky' || data.confidence[m.id] === 'lost'
          const dueForRevision = hasDueSrs || (stage !== 'not-started' && isShaky)

          const matchesFilter =
            filterTrack === 'all'
              ? true
              : filterTrack === 'bottlenecks'
                ? isBottleneck
                : filterTrack === 'revision'
                  ? dueForRevision
                  : trackId === filterTrack

          const stroke =
            stage === 'mastered'
              ? 'var(--ok)'
              : status === 'not-started'
                ? isBottleneck
                  ? 'var(--accent)'
                  : 'var(--line-strong)'
                : 'var(--accent)'

          const fill =
            stage === 'mastered'
              ? 'rgba(47, 125, 91, 0.10)'
              : status === 'completed'
                ? 'var(--accent-soft)'
                : 'var(--surface)'

          const stageLabel =
            stage === 'mastered'
              ? 'demonstrated mastery'
              : stage === 'confident'
                ? rec.completionDone.length > 0
                  ? 'practised & confident'
                  : 'understood theoretically'
                : stage === 'practising'
                  ? 'practising'
                  : stage === 'learning'
                    ? 'learning'
                    : 'not started'

          const title = `Phase ${m.phase} · ${m.title} · ${m.hours}h · ${stageLabel}${
            unlocked ? '' : ' · locked: finish prerequisites first (you can still open it)'
          }`

          const baseOpacity = unlocked ? 1 : 0.62
          const finalOpacity = matchesFilter ? baseOpacity : 0.22

          return (
            <g
              key={m.id}
              transform={`translate(${p.x}, ${p.y})`}
              onClick={() => navigate(`/roadmap/${m.id}`)}
              role="button"
              tabIndex={0}
              aria-label={title}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/roadmap/${m.id}`)}
            >
              <title>{title}</title>
              <g className="rm-node">
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={status === 'not-started' && !isBottleneck ? 1 : 1.5}
                  strokeDasharray={unlocked ? undefined : '4 3'}
                  opacity={finalOpacity}
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(23,21,17,.06))' }}
                />
                <circle
                  cx={18}
                  cy={NODE_H / 2}
                  r={5.5}
                  opacity={finalOpacity}
                  fill={
                    stage === 'mastered'
                      ? 'var(--ok)'
                      : status === 'completed'
                        ? 'var(--accent)'
                        : stage === 'practising'
                          ? 'var(--accent-soft)'
                          : status === 'in-progress'
                            ? 'var(--surface)'
                            : 'var(--line-strong)'
                  }
                  stroke={stage === 'mastered' ? 'var(--ok)' : 'var(--accent)'}
                  strokeWidth={status === 'in-progress' ? 2 : 0}
                />
                <text
                  x={34}
                  y={NODE_H / 2 - 4}
                  fontSize="12.5"
                  fontWeight={600}
                  fill="var(--ink)"
                  opacity={finalOpacity}
                >
                  {trunc(m.title)}
                </text>
                <text
                  x={34}
                  y={NODE_H / 2 + 13}
                  fontSize="10.5"
                  fill="var(--ink-faint)"
                  opacity={finalOpacity}
                >
                  [{trackSpec.code}] {m.hours}h · {stage === 'not-started' ? (m.essential ? 'essential' : 'optional') : stage}
                  {m.project ? ' · proj' : ''}
                </text>
                {dueForRevision && (
                  <circle
                    cx={NODE_W - 14}
                    cy={14}
                    r={4.5}
                    fill="var(--bad)"
                    opacity={finalOpacity}
                  />
                )}
                {isBottleneck && !dueForRevision && (
                  <text
                    x={NODE_W - 22}
                    y={17}
                    fontSize="9"
                    fontWeight={700}
                    fill="var(--accent)"
                    opacity={finalOpacity}
                  >
                    KEY
                  </text>
                )}
                {!unlocked && (
                  <text
                    x={NODE_W - 18}
                    y={NODE_H / 2 + 14}
                    fontSize="11"
                    fill="var(--ink-faint)"
                    opacity={finalOpacity}
                  >
                    🔒
                  </text>
                )}
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
