import { useRef, useState } from 'react'

const S = 320
const PAD = 24
const toPx = (f: number) => PAD + f * (S - 2 * PAD)
const toFrac = (px: number) => Math.min(1, Math.max(0, (px - PAD) / (S - 2 * PAD)))

export default function VectorSim() {
  const [a, setA] = useState({ x: 0.82, y: 0.62 })
  const [b, setB] = useState({ x: 0.3, y: 0.78 })
  const drag = useRef<null | 'a' | 'b'>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Math in "y-up" coordinates (screen y is flipped, but angles between vectors are preserved).
  const A = { x: a.x, y: a.y }
  const B = { x: b.x, y: b.y }
  const dot = A.x * B.x + A.y * B.y
  const na = Math.hypot(A.x, A.y)
  const nb = Math.hypot(B.x, B.y)
  const cos = na && nb ? dot / (na * nb) : 0
  const deg = Math.round((Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI)
  const verdict =
    cos > 0.92 ? 'nearly identical meaning' : cos > 0.6 ? 'related' : cos > 0.15 ? 'loosely related' : 'unrelated'

  const move = (e: React.PointerEvent) => {
    if (!drag.current || !svgRef.current) return
    const r = svgRef.current.getBoundingClientRect()
    const scale = S / r.width
    const fx = toFrac((e.clientX - r.left) * scale)
    const fy = toFrac((e.clientY - r.top) * scale)
    if (drag.current === 'a') setA({ x: fx, y: fy })
    else setB({ x: fx, y: fy })
  }

  const handle = (which: 'a' | 'b') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      drag.current = which
      ;(e.target as Element).setPointerCapture(e.pointerId)
    },
    onPointerMove: move,
    onPointerUp: () => (drag.current = null),
  })

  const a1 = Math.atan2(a.y, a.x)
  const a2 = Math.atan2(b.y, b.x)
  // Angle arc between the two vectors (screen coords: y flipped)
  const arcPath = (() => {
    const r = 44
    const s1 = { x: toPx(0) + r * Math.cos(-a1), y: S - toPx(0) + r * Math.sin(-a1) }
    const s2 = { x: toPx(0) + r * Math.cos(-a2), y: S - toPx(0) + r * Math.sin(-a2) }
    const large = 0
    const sweep = a2 > a1 ? 0 : 1
    return `M ${s1.x} ${s1.y} A ${r} ${r} 0 ${large} ${sweep} ${s2.x} ${s2.y}`
  })()

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${S} ${S}`}
        className="w-full max-w-[320px] cursor-crosshair touch-none select-none rounded-2xl border border-line bg-surface"
        aria-label="Interactive vector similarity playground — drag the two arrowheads"
      >
        {/* grid */}
        {Array.from({ length: 6 }, (_, i) => {
          const t = PAD + (i * (S - 2 * PAD)) / 5
          return (
            <g key={i} stroke="var(--line)" strokeWidth="1">
              <line x1={t} y1={PAD} x2={t} y2={S - PAD} />
              <line x1={PAD} y1={t} x2={S - PAD} y2={t} />
            </g>
          )
        })}
        {/* axes */}
        <line x1={PAD} y1={S - PAD} x2={S - PAD} y2={S - PAD} stroke="var(--line-strong)" strokeWidth="1.5" />
        <line x1={PAD} y1={S - PAD} x2={PAD} y2={PAD} stroke="var(--line-strong)" strokeWidth="1.5" />

        {/* angle arc */}
        <path d={arcPath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 3" opacity="0.8" />

        {/* vectors */}
        {(
          [
            { v: a, which: 'a' as const, color: 'var(--accent)', label: 'a' },
            { v: b, which: 'b' as const, color: 'var(--ink-soft)', label: 'b' },
          ] as const
        ).map(({ v, which, color, label }) => {
          const x2 = toPx(v.x)
          const y2 = S - toPx(v.y)
          return (
            <g key={which} {...handle(which)} className="cursor-grab">
              <line x1={toPx(0)} y1={S - toPx(0)} x2={x2} y2={y2} stroke={color} strokeWidth="2.5" />
              <circle cx={x2} cy={y2} r={10} fill={color} opacity={0.18} />
              <circle cx={x2} cy={y2} r={5} fill={color} />
              <text x={x2 + 10} y={y2 - 8} fontSize="13" fontWeight={700} fill={color}>
                {label}
              </text>
            </g>
          )
        })}
        <text x={S - PAD} y={S - 8} fontSize="10" fill="var(--ink-faint)" textAnchor="end">
          drag the arrowheads
        </text>
      </svg>

      <div className="flex-1 space-y-3 text-sm">
        <div className="rounded-xl border border-line bg-raised px-4 py-3 font-mono text-[13px] leading-7 text-ink-soft">
          <div>
            a = ({a.x.toFixed(2)}, {a.y.toFixed(2)}) &nbsp; |a| = {na.toFixed(2)}
          </div>
          <div>
            b = ({b.x.toFixed(2)}, {b.y.toFixed(2)}) &nbsp; |b| = {nb.toFixed(2)}
          </div>
          <div>
            a · b = <span className="text-ink">{dot.toFixed(3)}</span>
          </div>
          <div>
            cos θ = {dot.toFixed(2)} / {(na * nb).toFixed(2)} ={' '}
            <span className="font-semibold text-accent">{cos.toFixed(3)}</span>
          </div>
          <div>
            θ ≈ <span className="text-accent">{deg}°</span>
          </div>
        </div>
        <p className="text-ink-soft">
          Interpretation: these two “documents” are{' '}
          <span className="font-semibold text-ink">{verdict}</span>. Try making the vectors
          perpendicular (cos → 0), opposite (cos → −1), or scale one — same direction, same cosine.
        </p>
        <button
          className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink"
          onClick={() => {
            setA({ x: 0.82, y: 0.62 })
            setB({ x: 0.3, y: 0.78 })
          }}
        >
          Reset vectors
        </button>
      </div>
    </div>
  )
}
