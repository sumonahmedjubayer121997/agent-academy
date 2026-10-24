import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Bot,
  CalendarClock,
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

// Five primary pillars (Linear-style) + everything else via ⌘K.
const PRIMARY_LINKS = [
  { to: '/dashboard', label: 'Today', icon: Gauge },
  { to: '/curriculum', label: 'Learn', icon: BookOpen },
  { to: '/review', label: 'Review', icon: Layers },
  { to: '/projects', label: 'Build', icon: FolderGit2 },
  { to: '/journal', label: 'Journal', icon: NotebookPen },
]

const MORE_LINKS = [
  { to: '/roadmaps', label: 'All roadmaps', icon: Compass },
  { to: '/roadmap', label: 'Roadmap map', icon: Map },
  { to: '/planner', label: 'Planner & settings', icon: CalendarClock },
  { to: '/playground', label: 'Playground', icon: Bot },
  { to: '/resources', label: 'Resources', icon: LibraryBig },
  { to: '/assess', label: 'Assessment', icon: ClipboardCheck },
]

const MOBILE_LINKS = [...PRIMARY_LINKS, ...MORE_LINKS]

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

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => setMoreOpen(false), [pathname])

  // Close the More dropdown on outside click or Escape
  const moreRef = useRef<HTMLDivElement>(null)
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

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/80 backdrop-blur-md">
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_4px_var(--accent-soft)]" />
          Agent Academy
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {PRIMARY_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                  isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'
                }`
              }
            >
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                MORE_LINKS.some((l) => l.to === pathname)
                  ? 'bg-raised text-ink'
                  : 'text-ink-soft hover:bg-raised hover:text-ink'
              }`}
            >
              More
              <ChevronDown size={12} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-lift"
              >
                {MORE_LINKS.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    role="menuitem"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                        isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'
                      }`
                    }
                  >
                    <Icon size={14} />
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette (Ctrl+K)"
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
        <nav
          className="border-t border-line bg-surface px-4 py-3 lg:hidden"
          aria-label="Mobile"
        >
          <div className="grid grid-cols-2 gap-1">
            {MOBILE_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
