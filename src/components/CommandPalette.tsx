import { useEffect, useMemo, useRef, useState } from 'react'
import { useActiveRoadmap } from '../store/activeRoadmap'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import { BUNDLES } from '../content/roadmaps/registry'
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
  { id: 'nav-roadmaps', label: 'All roadmaps', hint: 'page', route: '/roadmaps', keywords: 'roadmaps catalog ai programming automation chatbot prompt engineering coming soon' },
  { id: 'nav-braindump', label: 'Brain dump', hint: 'page', route: '/braindump', keywords: 'brain dump reflection ritual recall memory anki export' },
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

/** Modules + practice projects from every live bundle; caller order is not roadmap-aware,
 * so we sort the active roadmap first via the provider context at render time. */
function moduleAndProjectItems(focus: string): PaletteItem[] {
  const slugs = Object.keys(BUNDLES).sort((a, b) => (a === focus ? -1 : b === focus ? 1 : 0))
  const items: PaletteItem[] = []
  for (const slug of slugs) {
    const b = BUNDLES[slug]
    const name = (b.META as { shortTitle?: string }).shortTitle ?? b.META.title
    for (const m of b.MODULES) {
      items.push({
        id: `mod-${slug}-${m.id}`,
        label: m.title,
        hint: `${name} · P${m.phase} · ${m.hours}h`,
        route: `/r/${slug}/roadmap/${m.id}`,
        keywords: `${m.title} ${m.why} ${name} phase ${m.phase}`,
      })
    }
    for (const pp of b.PRACTICE_PROJECTS) {
      items.push({
        id: `pp-${slug}-${pp.id}`,
        label: pp.title,
        hint: `${name} · practice · ${pp.hours}h`,
        route: `/r/${slug}/projects`,
        keywords: `${pp.title} ${pp.brief} ${name}`,
      })
    }
  }
  return items
}

function glossaryItems(): PaletteItem[] {
  return GLOSSARY.map<PaletteItem>((g) => ({
    id: `gloss-${g.term}`,
    label: g.term,
    hint: 'glossary',
    route: '/resources',
    keywords: `${g.term} ${g.def}`,
  }))
}

function isFocusable(el: HTMLElement | null): el is HTMLElement {
  if (!el || !el.isConnected) return false
  if ('disabled' in el && Boolean((el as HTMLButtonElement).disabled)) return false
  if (el.getAttribute('aria-hidden') === 'true') return false
  return typeof el.focus === 'function'
}

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)

  const focus = useActiveRoadmap().META.slug
  const ALL_ITEMS = useMemo(
    () => [...STATIC_ITEMS, ...moduleAndProjectItems(focus), ...glossaryItems()],
    [focus],
  )
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return ALL_ITEMS.slice(0, 12)
    return ALL_ITEMS.filter(
      (i) => i.label.toLowerCase().includes(needle) || i.keywords.toLowerCase().includes(needle),
    ).slice(0, 12)
  }, [q, ALL_ITEMS])

  const activeIndex = results.length === 0 ? -1 : Math.min(active, results.length - 1)
  const activeItem = activeIndex >= 0 ? results[activeIndex] : undefined

  const restoreFocus = () => {
    const target = triggerRef.current
    triggerRef.current = null
    if (isFocusable(target)) {
      target.focus()
      return
    }
    const fallback = document.querySelector<HTMLElement>(
      '[data-palette-trigger]:not([disabled]), [data-palette-fallback]:not([disabled])',
    )
    if (isFocusable(fallback)) {
      fallback.focus()
    }
  }

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      const currentActive = document.activeElement
      if (
        currentActive instanceof HTMLElement &&
        currentActive !== document.body &&
        !dialogRef.current?.contains(currentActive)
      ) {
        triggerRef.current = currentActive
      }
      setQ('')
      setActive(0)
      inputRef.current?.focus()
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false
      restoreFocus()
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (wasOpenRef.current) {
        wasOpenRef.current = false
        restoreFocus()
      }
    }
  }, [])

  useEffect(() => setActive(0), [q])

  useEffect(() => {
    if (activeIndex < 0) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`)
    el?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex])

  useEffect(() => {
    if (!open) return
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target
      if (
        dialogRef.current &&
        target instanceof Node &&
        !dialogRef.current.contains(target)
      ) {
        inputRef.current?.focus()
      }
    }
    document.addEventListener('focusin', onFocusIn)
    return () => document.removeEventListener('focusin', onFocusIn)
  }, [open])

  if (!open) return null

  const choose = (i: PaletteItem) => {
    onClose()
    navigate(i.route)
  }

  const getFocusableControls = (): HTMLElement[] => {
    if (!dialogRef.current) return []
    return Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]):not([tabindex="-1"]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => isFocusable(el))
  }

  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key === 'Tab') {
      const focusables = getFocusableControls()
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const current = document.activeElement as HTMLElement | null
      const idx = current ? focusables.indexOf(current) : -1
      if (e.shiftKey) {
        if (idx <= 0) {
          e.preventDefault()
          focusables[focusables.length - 1].focus()
        }
      } else {
        if (idx === -1 || idx >= focusables.length - 1) {
          e.preventDefault()
          focusables[0].focus()
        }
      }
    }
  }

  const statusText =
    results.length === 0
      ? 'No matches found.'
      : `${results.length} ${results.length === 1 ? 'result' : 'results'} available.`

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[12vh]"
      onClick={onClose}
      onKeyDown={handleDialogKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
          <Search size={15} className="shrink-0 text-ink-faint" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="palette-results"
            aria-activedescendant={activeItem ? `palette-option-${activeItem.id}` : undefined}
            aria-label="Search everything"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && !e.altKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault()
                if (results.length > 0) {
                  setActive((v) => Math.min(results.length - 1, Math.max(0, v) + 1))
                }
              } else if (e.key === 'ArrowUp' && !e.altKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault()
                if (results.length > 0) {
                  setActive((v) => Math.max(0, Math.min(results.length - 1, v) - 1))
                }
              } else if (e.key === 'Enter' && activeItem) {
                e.preventDefault()
                choose(activeItem)
              }
            }}
            placeholder="Search modules, projects, pages…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint transition-colors hover:bg-raised hover:text-ink"
          >
            esc
          </button>
        </div>
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {statusText}
        </div>
        <div
          ref={listRef}
          id="palette-results"
          role="listbox"
          aria-label="Search results"
          className="max-h-[52vh] overflow-y-auto p-1.5"
        >
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-ink-faint">
              No matches — try a module or project name.
            </p>
          )}
          {results.map((item, idx) => (
            <button
              key={item.id}
              id={`palette-option-${item.id}`}
              type="button"
              tabIndex={-1}
              data-idx={idx}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseEnter={() => setActive(idx)}
              onClick={() => choose(item)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                idx === activeIndex ? 'bg-raised text-ink' : 'text-ink-soft'
              }`}
            >
              <span className="truncate">{item.label}</span>
              <span className="flex shrink-0 items-center gap-2 text-[11px] text-ink-faint">
                {item.hint}
                {idx === activeIndex && <CornerDownLeft size={11} aria-hidden="true" />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
