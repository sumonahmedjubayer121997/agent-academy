import { createContext, useContext, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { BUNDLES, type RoadmapBundle } from '../content/roadmaps/registry'

const DEFAULT_SLUG = 'ai-agents'

/**
 * The content bundle the learning engine is currently operating on.
 * Legacy paths (/dashboard, /curriculum, …) always mean the default roadmap;
 * future per-roadmap routes mount under /r/:slug/… and switch this context.
 */
const ActiveRoadmapContext = createContext<RoadmapBundle>(BUNDLES[DEFAULT_SLUG])

export function ActiveRoadmapProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const slug = pathname.match(/^\/r\/([^/]+)/)?.[1] ?? DEFAULT_SLUG
  const bundle = BUNDLES[slug] ?? BUNDLES[DEFAULT_SLUG]
  return <ActiveRoadmapContext.Provider value={bundle}>{children}</ActiveRoadmapContext.Provider>
}

export function useActiveRoadmap(): RoadmapBundle {
  return useContext(ActiveRoadmapContext)
}
