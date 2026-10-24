import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { BUNDLES, type RoadmapBundle } from '../content/roadmaps/registry'
import type { RoadmapMeta } from '../content/types'

const DEFAULT_SLUG = 'ai-agents'
const LAST_KEY = 'aa-last-roadmap'

function readLastRoadmap(): string {
  try {
    const v = localStorage.getItem(LAST_KEY)
    return v && BUNDLES[v] ? v : DEFAULT_SLUG
  } catch {
    return DEFAULT_SLUG
  }
}

/**
 * ONE RULE: the active roadmap is the slug in the URL under /r/:slug —
 * otherwise the remembered last roadmap. There is no second source of truth.
 */
export function resolveActiveSlug(pathname: string): string {
  const slug = pathname.match(/^\/r\/([^/]+)/)?.[1]
  if (slug && BUNDLES[slug]) return slug
  return readLastRoadmap()
}

/**
 * The content bundle the learning engine is currently operating on.
 * Legacy global routes (/, /dashboard, /journal, /resources, /playground) fall
 * back to the remembered roadmap; scoped routes live under /r/:slug/…
 */
const ActiveRoadmapContext = createContext<RoadmapBundle>(BUNDLES[DEFAULT_SLUG])

export function ActiveRoadmapProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const slug = resolveActiveSlug(pathname)

  useEffect(() => {
    try {
      localStorage.setItem(LAST_KEY, slug)
    } catch {
      /* ignore */
    }
  }, [slug])

  const bundle = BUNDLES[slug] ?? BUNDLES[DEFAULT_SLUG]
  return <ActiveRoadmapContext.Provider value={bundle}>{children}</ActiveRoadmapContext.Provider>
}

export function useActiveRoadmap(): RoadmapBundle {
  return useContext(ActiveRoadmapContext)
}

/** Short display name for the switcher (falls back to title). */
export function shortTitleOf(meta: RoadmapMeta): string {
  return (meta as RoadmapMeta & { shortTitle?: string }).shortTitle ?? meta.title
}
