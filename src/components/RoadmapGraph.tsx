import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MODULES } from '../content/modules'
import { PHASES } from '../content/phases'
import { isUnlocked, statusOf, useProgress } from '../store/progress'

const NODE_W = 224
const NODE_H = 58
const V_GAP = 26
const COL_GAP = 34
const TOP = 86
const LEFT = 20

const trunc = (s: string, n = 25) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

export default function RoadmapGraph() {
  const navigate = useNavigate()
  const { data } = useProgress()

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

  const moduleById = useMemo(() => new Map(MODULES.map((m) => [m.id, m])), [])

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
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-soft" role="img" aria-label="Interactive learning roadmap graph">
      <svg width={geom.width} height={geom.height} className="block min-w-full cursor-default select-none">
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
          const status = statusOf(data, m.id)
          const unlocked = isUnlocked(data, m)
          const stroke =
            status === 'not-started' ? 'var(--line-strong)' : 'var(--accent)'
          const title = `Phase ${m.phase} · ${m.title} · ${m.hours}h${unlocked ? '' : ' · locked: finish prerequisites first (you can still open it)'}`
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
              {/* Inner group carries the CSS hover-lift; the outer group owns the SVG position
                  transform, because a CSS transform would override it. */}
              <g className="rm-node">
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  fill={status === 'completed' ? 'var(--accent-soft)' : 'var(--surface)'}
                  stroke={stroke}
                  strokeWidth={status === 'not-started' ? 1 : 1.4}
                  strokeDasharray={unlocked ? undefined : '4 3'}
                  opacity={unlocked ? 1 : 0.62}
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(23,21,17,.06))' }}
                />
                <circle
                  cx={18}
                  cy={NODE_H / 2}
                  r={5.5}
                  fill={
                    status === 'completed'
                      ? 'var(--accent)'
                      : status === 'in-progress'
                        ? 'var(--surface)'
                        : 'var(--line-strong)'
                  }
                  stroke="var(--accent)"
                  strokeWidth={status === 'in-progress' ? 2 : 0}
                />
                <text x={34} y={NODE_H / 2 - 4} fontSize="12.5" fontWeight={600} fill="var(--ink)">
                  {trunc(m.title)}
                </text>
                <text x={34} y={NODE_H / 2 + 13} fontSize="10.5" fill="var(--ink-faint)">
                  {m.hours}h · {m.essential ? 'essential' : 'optional'}
                  {m.project ? ' · project' : ''}
                </text>
                {!unlocked && (
                  <text x={NODE_W - 18} y={NODE_H / 2 + 4} fontSize="11" fill="var(--ink-faint)">
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
