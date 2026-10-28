import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Bot,
  CalendarClock,
  Brain,
  ChevronDown,
  ClipboardCheck,
  Compass,
  FolderGit2,
  Gauge,
  Layers,
  LibraryBig,
  Map,
  Menu,
  Moon,
  NotebookPen,
  Search,
  Sun,
  X,
} from 'lucide-react'
import CommandPalette from './CommandPalette'
import { BUNDLES, ROADMAPS } from '../content/roadmaps/registry'
import { useActiveRoadmap, shortTitleOf } from '../store/activeRoadmap'
import { useProgress } from '../store/progress'

const SCOPED_LINKS = [
  { section: 'curriculum', to: 'curriculum', label: 'Learn', icon: BookOpen },
  { section: 'review', to: 'review', label: 'Review', icon: Layers },
  { section: 'projects', to: 'projects', label: 'Build', icon: FolderGit2 },
]
// Journal is global (reflection is per day, not per roadmap) but sits in the same row.
const JOURNAL_LINK = { to: '/journal', label: 'Journal', icon: NotebookPen }

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('aa-theme', dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])
  return (
    <button
      onClick={() => setDark((v) => !v)}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-raised hover:text-ink"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

/** Roadmap switcher — started roadmaps first, keeps the current section when switching. */
function RoadmapSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { META } = useActiveRoadmap()
  const { data, markRoadmapStarted } = useProgress()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const started = Object.keys(data.startedRoadmaps ?? {})
  const slugs = [
    META.slug,
    ...started.filter((s) => s !== META.slug && BUNDLES[s]),
    ...ROADMAPS.filter((r) => r.status === 'live' || r.status === 'beta').map((r) => r.slug).filter((s) => s !== META.slug && !started.includes(s)),
  ].filter((s, i, arr) => arr.indexOf(s) === i)

  const switchTo = (slug: string) => {
    markRoadmapStarted(slug)
    // keep the current section when it exists for the new roadmap, else Learn
    const section = pathname.match(/^\/r\/[^/]+\/(curriculum|roadmap|review|projects|planner|assess)/)?.[1]
    navigate(section ? `/r/${slug}/${section}` : `/r/${slug}/curriculum`)
    setOpen(false)
    onNavigate?.()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex max-w-[11rem] items-center gap-1 truncate rounded-lg px-2 py-1.5 text-[13px] font-semibold text-ink transition-colors hover:bg-raised"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        <span className="truncate">{shortTitleOf(META)}</span>
        <ChevronDown size={12} className={`shrink-0 text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-lift"
        >
          <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
            Roadmaps
          </p>
          {slugs.map((slug) => (
            <button
              key={slug}
              role="menuitem"
              onClick={() => switchTo(slug)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                slug === META.slug ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'
              }`}
            >
              {shortTitleOf(BUNDLES[slug].META)}
              {data.startedRoadmaps?.[slug] && <span className="text-[10px] text-ink-faint">started</span>}
            </button>
          ))}
          <div className="my-1 border-t border-line" />
          <Link
            to="/roadmaps"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onNavigate?.()
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink"
          >
            <Compass size={14} /> All roadmaps
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { pathname } = useLocation()
  const { META } = useActiveRoadmap()
  const { markRoadmapStarted } = useProgress()
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => setMoreOpen(false), [pathname])

  // Remember that this roadmap has been visited (switcher ordering + analytics honesty)
  useEffect(() => {
    if (pathname.startsWith('/r/')) markRoadmapStarted(META.slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [META.slug])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!moreOpen) return
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [moreOpen])

  const base = `/r/${META.slug}`
  const scopedActive = pathname.startsWith('/r/')

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/80 backdrop-blur-md">
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_4px_var(--accent-soft)]" />
          <span className="hidden xl:inline">Agent Academy</span>
        </Link>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] font-medium transition-colors ${
              isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'
            }`
          }
        >
          <Gauge size={13} />
          Today
        </NavLink>

        {/* Scope divider: everything right of this line follows the active roadmap */}
        <span className="hidden h-5 w-px bg-line lg:block" aria-hidden="true" />

        <RoadmapSwitcher />

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Roadmap sections">
          {SCOPED_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={`${base}/${to}`}
              className={({ isActive }) =>
                `flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] font-medium transition-colors ${
                  isActive || (!scopedActive && to === 'curriculum')
                    ? 'bg-raised text-ink'
                    : 'text-ink-soft hover:bg-raised hover:text-ink'
                }`
              }
            >
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
          <NavLink
            to={JOURNAL_LINK.to}
            className={({ isActive }) =>
              `flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] font-medium transition-colors ${
                isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'
              }`
            }
          >
            <JOURNAL_LINK.icon size={13} />
            {JOURNAL_LINK.label}
          </NavLink>
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] font-medium transition-colors ${
                moreOpen ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'
              }`}
            >
              More
              <ChevronDown size={12} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-lift"
              >
                <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                  This roadmap
                </p>
                <NavLink to={`${base}/roadmap`} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink">
                  <Map size={14} /> Roadmap map
                </NavLink>
                <NavLink to={`${base}/assess`} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink">
                  <ClipboardCheck size={14} /> Assessment
                </NavLink>
                <NavLink to={`${base}/planner`} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink">
                  <CalendarClock size={14} /> Planner & settings
                </NavLink>
                <div className="my-1 border-t border-line" />
                <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-faint">
                  Everywhere
                </p>
                <NavLink to="/roadmaps" role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink">
                  <Compass size={14} /> All roadmaps
                </NavLink>
                <NavLink to="/braindump" role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink">
                  <Brain size={14} /> Brain dump
                </NavLink>
                <NavLink to="/playground" role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink">
                  <Bot size={14} /> Playground
                </NavLink>
                <NavLink to="/resources" role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-raised hover:text-ink">
                  <LibraryBig size={14} /> Resources & glossary
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Search (Ctrl+K)"
            className="hidden items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-xs text-ink-faint transition-colors hover:bg-raised hover:text-ink-soft md:flex"
          >
            <Search size={12} />
            Search…
            <kbd className="rounded border border-line px-1 font-mono text-[10px]">⌘K</kbd>
          </button>
          <ThemeToggle />
          <button
            className="rounded-lg p-2 text-ink-soft hover:bg-raised hover:text-ink lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-surface px-4 py-3 lg:hidden" aria-label="Mobile">
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-line bg-raised/50 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Roadmap</span>
            <RoadmapSwitcher onNavigate={() => setOpen(false)} />
          </div>
          <button
            onClick={() => {
              setOpen(false)
              setPaletteOpen(true)
            }}
            className="mb-3 flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink-soft"
          >
            <Search size={15} /> Search everything
          </button>
          <div className="grid grid-cols-2 gap-1">
            <NavLink to="/dashboard" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'}`}>
              <Gauge size={15} /> Today
            </NavLink>
            {SCOPED_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={`${base}/${to}`}
                className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'}`}
              >
                <Icon size={15} /> {label}
              </NavLink>
            ))}
            <NavLink to="/journal" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'}`}>
              <NotebookPen size={15} /> Journal
            </NavLink>
            <NavLink to={`${base}/roadmap`} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'}`}>
              <Map size={15} /> Map
            </NavLink>
            <NavLink to={`${base}/assess`} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'}`}>
              <ClipboardCheck size={15} /> Assessment
            </NavLink>
            <NavLink to={`${base}/planner`} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'}`}>
              <CalendarClock size={15} /> Planner
            </NavLink>
            <NavLink to="/playground" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'}`}>
              <Bot size={15} /> Playground
            </NavLink>
            <NavLink to="/resources" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'}`}>
              <LibraryBig size={15} /> Resources
            </NavLink>
            <NavLink to="/roadmaps" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'}`}>
              <Compass size={15} /> All roadmaps
            </NavLink>
          </div>
        </nav>
      )}
    </header>
  )
}
