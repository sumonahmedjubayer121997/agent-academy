import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RoadmapBundle } from '../content/roadmaps/registry'
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
  filterTrack?: string | 'all' | 'bottlenecks' | 'revision'
  bundle: RoadmapBundle
}

export default function RoadmapGraph({ filterTrack = 'all', bundle }: RoadmapGraphProps) {
  const navigate = useNavigate()
  const { data } = useProgress()
  const today = todayStr()
  const { MODULES, PHASES, downstreamUnlockCount, trackForModule, trackSpecFor, cardsForModule } = bundle
  const nodeRefs = useRef<Map<string, SVGGElement>>(new Map())
  const [activeId, setActiveId] = useState<string>(() => MODULES[0]?.id ?? '')
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const modById = useMemo(() => new Map(MODULES.map((m) => [m.id, m])), [MODULES])

  const geom = useMemo(() => {
    const cols = PHASES.map((phase) => MODULES.filter((m) => m.phase === phase.n)).filter(
      (col) => col.length > 0,
    )
    const width = LEFT * 2 + PHASES.length * NODE_W + (PHASES.length - 1) * COL_GAP
    const tallest = Math.max(1, ...cols.map((c) => c.length))
    const height = TOP + tallest * (NODE_H + V_GAP) + 30
    const pos = new Map<string, { x: number; y: number }>()
    const coords = new Map<string, { ci: number; ri: number }>()
    cols.forEach((col, ci) => {
      col.forEach((m, ri) => {
        pos.set(m.id, { x: LEFT + ci * (NODE_W + COL_GAP), y: TOP + ri * (NODE_H + V_GAP) })
        coords.set(m.id, { ci, ri })
      })
    })
    return { cols, width, height, pos, coords }
  }, [MODULES, PHASES])

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
  }, [data, MODULES, downstreamUnlockCount])

  const matchesActiveFilter = (moduleId: string): boolean => {
    if (filterTrack === 'all') return true
    if (filterTrack === 'bottlenecks') return bottleneckIds.has(moduleId)
    if (filterTrack === 'revision') {
      const stage = stageOf(data, moduleId)
      const modCardIds = cardsForModule(moduleId).map((c) => c.cardId)
      const hasDueSrs = modCardIds.some((cid) => data.srs[cid] && isDue(data.srs[cid], today))
      const isShaky = data.confidence[moduleId] === 'shaky' || data.confidence[moduleId] === 'lost'
      return hasDueSrs || (stage !== 'not-started' && isShaky)
    }
    return trackForModule(moduleId) === filterTrack
  }

  useEffect(() => {
    const firstMatch = MODULES.find((m) => matchesActiveFilter(m.id)) ?? MODULES[0]
    if (firstMatch) {
      setActiveId(firstMatch.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTrack, bundle.META.slug])

  const effectiveActiveId = modById.has(activeId) ? activeId : (MODULES[0]?.id ?? '')

  const focusNode = (targetId: string | undefined) => {
    if (!targetId) return
    setActiveId(targetId)
    setFocusedId(targetId)
    const el = nodeRefs.current.get(targetId)
    el?.focus()
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }

  const handleNodeKeyDown = (e: React.KeyboardEvent<SVGGElement>, moduleId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/r/${bundle.META.slug}/roadmap/${moduleId}`)
      return
    }
    const coord = geom.coords.get(moduleId)
    if (!coord) return
    const { ci, ri } = coord
    const col = geom.cols[ci]
    if (!col) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = col[Math.min(col.length - 1, ri + 1)]
      focusNode(next?.id)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = col[Math.max(0, ri - 1)]
      focusNode(prev?.id)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      const nextCol = geom.cols[ci + 1]
      if (nextCol && nextCol.length > 0) {
        const target = nextCol[Math.min(ri, nextCol.length - 1)]
        focusNode(target?.id)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevCol = geom.cols[ci - 1]
      if (prevCol && prevCol.length > 0) {
        const target = prevCol[Math.min(ri, prevCol.length - 1)]
        focusNode(target?.id)
      }
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusNode(geom.cols[0]?.[0]?.id)
    } else if (e.key === 'End') {
      e.preventDefault()
      const lastCol = geom.cols[geom.cols.length - 1]
      focusNode(lastCol?.[lastCol.length - 1]?.id)
    }
  }

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
  }, [data, geom, MODULES])

  return (
    <div
      className="overflow-x-auto rounded-xl border border-line bg-surface"
      role="region"
      aria-label={`${bundle.META.title} dependency and mastery map`}
    >
      {/* The graph is interactive, so no role="img" here — that would hide the
          labelled node buttons from assistive technology. The sr-only line gives
          context; the Curriculum page is the full text alternative. */}
      <span className="sr-only">
        Interactive roadmap: {PHASES.length} phase columns and {MODULES.length} module buttons
        connected by prerequisite lines. Use Tab to enter the map, Arrow keys to move between
        modules within and across phases, and Enter or Space to open a module. A full text version
        is on the Curriculum page.
      </span>
      <svg
        width={geom.width}
        height={geom.height}
        className="block min-w-full cursor-default select-none"
      >
        {/* Phase headers (decorative visual column headers; phase is announced in each node's label) */}
        <g aria-hidden="true">
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
        </g>

        {/* Dependency edges (decorative SVG paths; prerequisites are announced on each node) */}
        <g aria-hidden="true">
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
        </g>

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

          const matchesFilter = matchesActiveFilter(m.id)

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

          const statusSummary =
            stage === 'mastered'
              ? 'completed (demonstrated mastery)'
              : stage === 'confident'
                ? rec.completionDone.length > 0
                  ? 'completed (practised & confident)'
                  : 'completed (understood theoretically)'
                : stage === 'practising'
                  ? 'in progress (practising)'
                  : stage === 'learning'
                    ? 'in progress (learning)'
                    : unlocked
                      ? 'available (not started)'
                      : 'locked (not started)'

          const prereqTitles = m.prereqs.map((pid) => modById.get(pid)?.title ?? pid)
          const missingPrereqTitles = m.prereqs
            .filter((pid) => statusOf(data, pid) !== 'completed')
            .map((pid) => modById.get(pid)?.title ?? pid)

          const prereqDescription = !unlocked
            ? `Locked: requires ${missingPrereqTitles.join(', ')} (you can still open it).`
            : prereqTitles.length > 0
              ? `Prerequisites completed: ${prereqTitles.join(', ')}.`
              : 'No prerequisites.'

          const flagsDescription = `${isBottleneck ? ' Key bottleneck.' : ''}${
            dueForRevision ? ' Due for revision.' : ''
          }`

          const label = `Phase ${m.phase} · ${m.title} · Track ${trackSpec.code} · ${m.hours}h · ${statusSummary}${
            unlocked ? '' : ' · locked: finish prerequisites first (you can still open it)'
          }`
          const description = `${prereqDescription}${flagsDescription}`
          const descId = `rm-desc-${m.id}`

          const baseOpacity = unlocked ? 1 : 0.62
          const finalOpacity = matchesFilter ? baseOpacity : 0.22
          const isTabStop = m.id === effectiveActiveId
          const isFocused = focusedId === m.id

          return (
            <g
              key={m.id}
              ref={(el) => {
                if (el) nodeRefs.current.set(m.id, el)
                else nodeRefs.current.delete(m.id)
              }}
              transform={`translate(${p.x}, ${p.y})`}
              onClick={() => {
                setActiveId(m.id)
                navigate(`/r/${bundle.META.slug}/roadmap/${m.id}`)
              }}
              onFocus={() => {
                setActiveId(m.id)
                setFocusedId(m.id)
              }}
              onBlur={() => {
                setFocusedId((prev) => (prev === m.id ? null : prev))
              }}
              role="button"
              tabIndex={isTabStop ? 0 : -1}
              data-module-id={m.id}
              data-state={unlocked ? status : 'locked'}
              data-focused={isFocused ? 'true' : 'false'}
              aria-label={label}
              aria-describedby={descId}
              className="rm-node-btn outline-none"
              onKeyDown={(e) => handleNodeKeyDown(e, m.id)}
            >
              <title>{`${label} — ${description}`}</title>
              <desc id={descId}>{description}</desc>
              <g className="rm-node" aria-hidden="true">
                {isFocused && (
                  <rect
                    className="rm-focus-ring"
                    x={-3}
                    y={-3}
                    width={NODE_W + 6}
                    height={NODE_H + 6}
                    rx={13}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                  />
                )}
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
                {status === 'completed' && (
                  <text
                    x={18}
                    y={NODE_H / 2 + 3}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight={700}
                    fill="var(--accent-ink)"
                    opacity={finalOpacity}
                  >
                    ✓
                  </text>
                )}
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
                  <g opacity={finalOpacity}>
                    <circle cx={NODE_W - 14} cy={14} r={5} fill="var(--bad)" />
                    <text
                      x={NODE_W - 14}
                      y={17}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight={700}
                      fill="#ffffff"
                    >
                      !
                    </text>
                  </g>
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
