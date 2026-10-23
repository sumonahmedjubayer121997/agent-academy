import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CheckCircle2, CircleDot, Circle, Sparkles, Code2, BookOpen } from 'lucide-react'
import type { MasteryStage, ModuleStatus } from '../store/progress'

/**
 * Card — one component, three elevations (Linear/Geist discipline):
 *  flat (default) resting content: border only, no shadow
 *  raised        hover/active surfaces: subtle raised background
 *  overlay       floating layers only (modals, dropdowns, palettes): shadow
 */
export function Card({
  children,
  className = '',
  variant = 'flat',
}: {
  children: ReactNode
  className?: string
  variant?: 'flat' | 'raised' | 'overlay'
}) {
  const variants = {
    flat: 'border border-line bg-surface',
    raised: 'border border-line bg-raised',
    overlay: 'border border-line bg-surface shadow-lift',
  }
  return <div className={`rounded-xl ${variants[variant]} ${className}`}>{children}</div>
}

const badgeTones: Record<string, string> = {
  neutral: 'bg-transparent text-ink-soft border-line',
  accent: 'bg-transparent text-accent border-accent/25',
  ok: 'bg-transparent text-ok border-ok/25',
  warn: 'bg-transparent text-bad border-bad/25',
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode
  tone?: keyof typeof badgeTones
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none'
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm' }
  const variants = {
    primary: 'bg-accent text-accent-ink hover:bg-accent-hover',
    secondary: 'border border-line-strong bg-surface text-ink hover:bg-raised',
    ghost: 'text-ink-soft hover:text-ink hover:bg-raised',
  }
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest} />
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)))
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-raised ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function StatusBadge({ status }: { status: ModuleStatus | MasteryStage }) {
  if (status === 'mastered')
    return (
      <Badge tone="ok">
        <Sparkles size={12} /> Mastered
      </Badge>
    )
  if (status === 'confident' || status === 'completed')
    return (
      <Badge tone="ok">
        <CheckCircle2 size={12} /> {status === 'confident' ? 'Confident' : 'Completed'}
      </Badge>
    )
  if (status === 'practising')
    return (
      <Badge tone="accent">
        <Code2 size={12} /> Practising
      </Badge>
    )
  if (status === 'learning' || status === 'in-progress')
    return (
      <Badge tone="accent">
        {status === 'learning' ? <BookOpen size={12} /> : <CircleDot size={12} />}{' '}
        {status === 'learning' ? 'Learning' : 'In progress'}
      </Badge>
    )
  return (
    <Badge>
      <Circle size={12} /> Not started
    </Badge>
  )
}

export function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string
  title: string
  sub?: string
}) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>}
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {sub && <p className="mt-2 max-w-2xl text-ink-soft">{sub}</p>}
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-sm text-ink-soft">{sub}</p>}
    </Card>
  )
}
