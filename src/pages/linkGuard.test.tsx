import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { BUNDLES } from '../content/roadmaps/registry'
import { ActiveRoadmapProvider } from '../store/activeRoadmap'
import { ProgressProvider } from '../store/progress'
import Curriculum from './Curriculum'
import ModuleDetail from './ModuleDetail'
import Projects from './Projects'
import Review from './Review'
import Assessment from './Assessment'
import Planner from './Planner'
import Journal from './Journal'

/**
 * Link-harvest guard: on every roadmap-scoped page, every internal link must
 * either stay inside the ACTIVE roadmap's workspace (/r/<slug>/…) or point at
 * a known global route. This is the test that would have caught the P3-QA
 * critical bug: PE pages emitting legacy /roadmap/<pe-id> links that the
 * legacy redirect sent into the AI-Agents workspace ("Module not found").
 */
const GLOBAL_ROUTES = [
  '/',
  '/dashboard',
  '/journal',
  '/playground',
  '/resources',
  '/roadmaps',
]

function isAllowed(href: string, slug: string): boolean {
  if (/^(https?:|mailto:|tel:)/.test(href)) return true
  if (href.startsWith(`#/`) || href === '#') return true
  if (href.startsWith(`/r/${slug}/`)) return true
  if (href.startsWith('/m/') || href.startsWith('/l/')) return true
  if (href.startsWith('/roadmaps/')) return true
  if (GLOBAL_ROUTES.includes(href)) return true
  // AA's catalog entry intentionally links to its graph via the legacy alias
  if (slug === 'ai-agents' && href === '/roadmap') return true
  return false
}

function harvest(path: string, element: React.ReactElement, slug: string): string[] {
  const { container } = render(
    <MemoryRouter initialEntries={[path]}>
      <ActiveRoadmapProvider>
        <ProgressProvider>
          <Routes>
            <Route path={path} element={element} />
          </Routes>
        </ProgressProvider>
      </ActiveRoadmapProvider>
    </MemoryRouter>,
  )
  return Array.from(container.querySelectorAll('a[href]'))
    .map((a) => a.getAttribute('href') ?? '')
    .filter((h) => !isAllowed(h, slug))
}

const cases: Array<{ name: string; path: (s: string) => string; el: React.ReactElement }> = [
  { name: 'curriculum', path: (s) => `/r/${s}/curriculum`, el: <Curriculum /> },
  { name: 'projects', path: (s) => `/r/${s}/projects`, el: <Projects /> },
  { name: 'review', path: (s) => `/r/${s}/review`, el: <Review /> },
  { name: 'assess', path: (s) => `/r/${s}/assess`, el: <Assessment /> },
  { name: 'planner', path: (s) => `/r/${s}/planner`, el: <Planner /> },
  { name: 'journal', path: () => '/journal', el: <Journal /> },
]

describe('link-harvest guard: no link escapes the active workspace', () => {
  for (const slug of Object.keys(BUNDLES)) {
    for (const { name, path, el } of cases) {
      it(`${slug} · ${name}`, () => {
        expect(harvest(path(slug), el, slug)).toEqual([])
      })
    }
    it(`${slug} · module detail`, () => {
      const first = BUNDLES[slug].MODULES[0]
      expect(harvest(`/r/${slug}/roadmap/${first.id}`, <ModuleDetail />, slug)).toEqual([])
    })
    it(`${slug} · module detail (cross-links via prereqs)`, () => {
      const withPrereqs = BUNDLES[slug].MODULES.find((m) => m.prereqs.length > 0) ?? BUNDLES[slug].MODULES[0]
      expect(harvest(`/r/${slug}/roadmap/${withPrereqs.id}`, <ModuleDetail />, slug)).toEqual([])
    })
  }
})
