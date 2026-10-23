import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import { MODULES } from '../content/modules'
import { PRACTICE_PROJECTS } from '../content/practiceProjects'
import { GLOSSARY } from '../content/glossary'

interface PaletteItem {
  id: string
  label: string
  hint: string
  route: string
  keywords: string
}

const STATIC_ITEMS: PaletteItem[] = [
  { id: 'nav-dash', label: 'Today / Dashboard', hint: 'page', route: '/dashboard', keywords: 'today dashboard home continue plan' },
  { id: 'nav-learn', label: 'Curriculum', hint: 'page', route: '/curriculum', keywords: 'learn curriculum modules phases ask roadmap' },
  { id: 'nav-roadmap', label: 'Roadmap map', hint: 'page', route: '/roadmap', keywords: 'roadmap graph tracks bottlenecks' },
  { id: 'nav-review', label: 'Review cards', hint: 'page', route: '/review', keywords: 'review srs flashcards spaced due drill' },
  { id: 'nav-projects', label: 'Projects', hint: 'page', route: '/projects', keywords: 'projects build portfolio practice' },
  { id: 'nav-journal', label: 'Journal', hint: 'page', route: '/journal', keywords: 'journal notes reflection' },
  { id: 'nav-planner', label: 'Planner & settings', hint: 'page', route: '/planner', keywords: 'planner schedule export reset weekly hours' },
  { id: 'nav-playground', label: 'Agent playground', hint: 'page', route: '/playground', keywords: 'playground agent simulation live tools' },
  { id: 'nav-resources', label: 'Resources & glossary', hint: 'page', route: '/resources', keywords: 'resources links docs glossary' },
  { id: 'nav-assess', label: 'Diagnostic assessment', hint: 'page', route: '/assess', keywords: 'assessment diagnostic test' },
]

const ALL_ITEMS: PaletteItem[] = [
  ...STATIC_ITEMS,
  ...MODULES.map<PaletteItem>((m) => ({
    id: `mod-${m.id}`,
    label: m.title,
    hint: `P${m.phase} module · ${m.hours}h`,
    route: `/roadmap/${m.id}`,
    keywords: `${m.title} ${m.why} phase ${m.phase}`,
  })),
  ...PRACTICE_PROJECTS.map<PaletteItem>((p) => ({
    id: `pp-${p.id}`,
    label: p.title,
    hint: `P${p.phase} project · ${p.hours}h`,
    route: '/projects',
    keywords: `${p.title} ${p.brief}`,
  })),
  ...GLOSSARY.map<PaletteItem>((g) => ({
    id: `gloss-${g.term}`,
    label: g.term,
    hint: 'glossary',
    route: '/resources',
    keywords: `${g.term} ${g.def}`,
  })),
]

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return ALL_ITEMS.slice(0, 12)
    return ALL_ITEMS.filter(
      (i) => i.label.toLowerCase().includes(needle) || i.keywords.toLowerCase().includes(needle),
    ).slice(0, 12)
  }, [q])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => setActive(0), [q])

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const choose = (i: PaletteItem) => {
    onClose()
    navigate(i.route)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[12vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          <Search size={15} className="shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((v) => Math.min(results.length - 1, v + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((v) => Math.max(0, v - 1))
              } else if (e.key === 'Enter' && results[active]) {
                e.preventDefault()
                choose(results[active])
              } else if (e.key === 'Escape') {
                onClose()
              }
            }}
            placeholder="Search modules, projects, pages…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
            aria-label="Search everything"
            aria-controls="palette-results"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">esc</kbd>
        </div>
        <div ref={listRef} id="palette-results" role="listbox" className="max-h-[52vh] overflow-y-auto p-1.5">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-ink-faint">No matches — try a module or project name.</p>
          )}
          {results.map((item, idx) => (
            <button
              key={item.id}
              data-idx={idx}
              role="option"
              aria-selected={idx === active}
              onMouseEnter={() => setActive(idx)}
              onClick={() => choose(item)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                idx === active ? 'bg-raised text-ink' : 'text-ink-soft'
              }`}
            >
              <span className="truncate">{item.label}</span>
              <span className="flex shrink-0 items-center gap-2 text-[11px] text-ink-faint">
                {item.hint}
                {idx === active && <CornerDownLeft size={11} />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
