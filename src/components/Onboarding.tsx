import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, GraduationCap, Layers, X } from 'lucide-react'
import { ROADMAPS } from '../content/roadmaps/registry'
import { useProgress } from '../store/progress'

const KEY = 'aa-onboarding'

export function onboardingDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === 'dismissed'
  } catch {
    return false
  }
}

export function showOnboardingAgain() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/**
 * First-visit introduction: what this is, pick a roadmap (registry data,
 * never hardcoded), how progress works, one clear action. Dismissible,
 * persisted in localStorage (the existing UI-pref pattern), never shown to
 * users who already have activity — and revisit-able from the footer link.
 */
export default function Onboarding() {
  const [visible, setVisible] = useState(false)
  const { data } = useProgress()

  useEffect(() => {
    if (!onboardingDismissed() && data.activity.length === 0) setVisible(true)
  }, [data.activity.length])

  if (!visible) return null

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, 'dismissed')
    } catch {
      /* ignore */
    }
    setVisible(false)
  }

  const openable = ROADMAPS.filter((r) => r.status === 'live' || r.status === 'beta')

  return (
    <section
      className="mt-8 rounded-xl border border-accent/25 bg-accent-soft px-5 py-5 sm:px-7"
      aria-label="Introduction"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <GraduationCap size={18} className="text-accent" />
          New here? Start in three steps.
        </h2>
        <button
          onClick={dismiss}
          aria-label="Skip introduction"
          className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-raised hover:text-ink"
        >
          <X size={15} />
        </button>
      </div>

      <ol className="mt-4 grid gap-3 text-sm leading-relaxed sm:grid-cols-3">
        <li className="flex gap-2.5">
          <span className="mt-0.5 font-mono text-xs font-bold text-accent">1</span>
          <span className="text-ink-soft">
            <b className="text-ink">Take a diagnostic.</b> A short assessment per roadmap credits
            what you already know — nothing is inflated.
          </span>
        </li>
        <li className="flex gap-2.5">
          <span className="mt-0.5 font-mono text-xs font-bold text-accent">2</span>
          <span className="text-ink-soft">
            <b className="text-ink">Follow the roadmap.</b> Lessons end in knowledge checks;
            modules move Learning → Practising → Confident → Mastered with evidence.
          </span>
        </li>
        <li className="flex gap-2.5">
          <span className="mt-0.5 font-mono text-xs font-bold text-accent">3</span>
          <span className="text-ink-soft">
            <b className="text-ink">Review sticks it.</b> Every quiz answer becomes a spaced-review
            card; the Today page plans each day for you.
          </span>
        </li>
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          {openable.length} roadmaps ready:
        </span>
        {openable.map((r) => (
          <Link
            key={r.slug}
            to={`/r/${r.slug}/assess`}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            {r.title}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          to="/r/ai-agents/assess"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
        >
          <GraduationCap size={15} /> Take the AI Agents diagnostic
        </Link>
        <Link
          to="/roadmaps"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <BookOpen size={14} /> Browse all roadmaps <ArrowRight size={12} />
        </Link>
        <button onClick={dismiss} className="text-xs text-ink-faint hover:text-ink hover:underline">
          <Layers size={11} className="mr-1 inline" />
          Skip — I will explore myself
        </button>
      </div>
    </section>
  )
}
