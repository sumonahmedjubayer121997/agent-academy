import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Square } from 'lucide-react'
import { useProgress } from '../store/progress'

const FOCUS_SECONDS = 25 * 60

/** 25-minute focus timer; completing (or ending early) logs a study session. */
export default function FocusTimer({ moduleId }: { moduleId: string }) {
  const { logSession } = useProgress()
  const [left, setLeft] = useState(FOCUS_SECONDS)
  const [running, setRunning] = useState(false)
  const [logged, setLogged] = useState(false)
  const startedRef = useRef(false)
  const endTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) {
      endTimeRef.current = null
      return
    }
    endTimeRef.current = Date.now() + left * 1000
    const t = setInterval(() => {
      setLeft((v) => {
        const byClock =
          endTimeRef.current !== null
            ? Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000))
            : v - 1
        const next = Math.min(v - 1, byClock)
        if (next <= 0) {
          setRunning(false)
          return 0
        }
        return next
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running])

  useEffect(() => {
    if (left === 0 && startedRef.current && !logged) {
      logSession(moduleId, 25)
      setLogged(true)
    }
  }, [left, logged, logSession, moduleId])

  const endEarly = () => {
    setRunning(false)
    if (startedRef.current && !logged) {
      const spent = Math.round((FOCUS_SECONDS - left) / 60)
      if (spent >= 5) logSession(moduleId, spent)
      setLogged(true)
    }
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const pct = ((FOCUS_SECONDS - left) / FOCUS_SECONDS) * 100

  return (
    <div className="flex items-center gap-3" role="timer" aria-label={`Focus timer ${mm}:${ss}`}>
      <div className="relative h-9 w-9" aria-hidden="true">
        <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--line)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="font-mono text-sm font-semibold tabular-nums">
        {mm}:{ss}
      </span>
      {logged ? (
        <span className="text-xs font-medium text-ok">session logged ✓</span>
      ) : running ? (
        <>
          <button
            type="button"
            onClick={() => setRunning(false)}
            aria-label="Pause focus timer"
            className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg p-2 text-ink-soft hover:bg-raised hover:text-ink"
          >
            <Pause size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={endEarly}
            aria-label="End and log session"
            className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg p-2 text-ink-soft hover:bg-raised hover:text-ink"
          >
            <Square size={14} aria-hidden="true" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => {
            startedRef.current = true
            setRunning(true)
          }}
          className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-soft transition-all hover:bg-raised hover:text-ink"
        >
          <Play size={12} aria-hidden="true" /> {left === FOCUS_SECONDS ? 'Focus 25′' : 'Resume'}
        </button>
      )}
    </div>
  )
}
