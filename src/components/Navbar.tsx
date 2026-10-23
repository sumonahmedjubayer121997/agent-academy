import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
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
  NotebookPen,
  Sun,
  X,
} from 'lucide-react'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/curriculum', label: 'Curriculum', icon: BookOpen },
  { to: '/review', label: 'Review', icon: Layers },
  { to: '/projects', label: 'Projects', icon: FolderGit2 },
  { to: '/journal', label: 'Journal', icon: NotebookPen },
  { to: '/planner', label: 'Planner', icon: CalendarClock },
  { to: '/playground', label: 'Playground', icon: Bot },
  { to: '/resources', label: 'Resources', icon: LibraryBig },
  { to: '/assess', label: 'Assessment', icon: ClipboardCheck },
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
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_4px_var(--accent-soft)]" />
          Agent Academy
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] font-medium transition-colors ${
                  isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-raised hover:text-ink'
                }`
              }
            >
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
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
