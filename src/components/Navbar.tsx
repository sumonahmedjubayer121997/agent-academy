import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  BookOpen,
  Bot,
  CalendarClock,
  ClipboardCheck,
  FolderGit2,
  Gauge,
  Layers,
  LibraryBig,
  Map,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/curriculum', label: 'Curriculum', icon: BookOpen },
  { to: '/review', label: 'Review', icon: Layers },
  { to: '/playground', label: 'Playground', icon: Bot },
  { to: '/projects', label: 'Projects', icon: FolderGit2 },
  { to: '/resources', label: 'Resources', icon: LibraryBig },
  { to: '/assess', label: 'Assessment', icon: ClipboardCheck },
  { to: '/planner', label: 'Planner', icon: CalendarClock },
]

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
  useEffect(() => setOpen(false), [location.pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_4px_var(--accent-soft)]" />
          Agent Academy
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                  isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-raised hover:text-ink'
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            className="rounded-lg p-2 text-ink-soft hover:bg-raised hover:text-ink xl:hidden"
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
          className="border-t border-line bg-surface px-4 py-3 xl:hidden"
          aria-label="Mobile"
        >
          <div className="grid grid-cols-2 gap-1">
            {LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-raised hover:text-ink'
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
