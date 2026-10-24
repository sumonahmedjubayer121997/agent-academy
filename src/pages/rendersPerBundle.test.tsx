import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { BUNDLES } from '../content/roadmaps/registry'
import { ActiveRoadmapProvider } from '../store/activeRoadmap'
import { ProgressProvider } from '../store/progress'
import Curriculum from './Curriculum'
import Projects from './Projects'
import Assessment from './Assessment'
import Review from './Review'
import Planner from './Planner'
import Journal from './Journal'
import Dashboard from './Dashboard'
import ModuleDetail from './ModuleDetail'

/**
 * The engine must render every page for every live bundle — a roadmap that
 * lacks lessons (PE today) must degrade gracefully, not throw.
 */
function renderAt(slug: string, path: string, element: React.ReactElement) {
  render(
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
}

const pages: Array<{ name: string; path: (slug: string) => string; el: React.ReactElement }> = [
  { name: 'curriculum', path: (s) => `/r/${s}/curriculum`, el: <Curriculum /> },
  { name: 'projects', path: (s) => `/r/${s}/projects`, el: <Projects /> },
  { name: 'assess', path: (s) => `/r/${s}/assess`, el: <Assessment /> },
  { name: 'review', path: (s) => `/r/${s}/review`, el: <Review /> },
  { name: 'planner', path: (s) => `/r/${s}/planner`, el: <Planner /> },
  { name: 'dashboard', path: () => '/dashboard', el: <Dashboard /> },
  { name: 'journal', path: () => '/journal', el: <Journal /> },
]

describe('every page renders for every live bundle', () => {
  for (const slug of Object.keys(BUNDLES)) {
    for (const { name, path, el } of pages) {
      it(`${slug} · ${name}`, () => {
        expect(() => renderAt(slug, path(slug), el)).not.toThrow()
      })
    }
    it(`${slug} · module detail`, () => {
      const first = BUNDLES[slug].MODULES[0]
      expect(() => renderAt(slug, `/r/${slug}/roadmap/${first.id}`, <ModuleDetail />)).not.toThrow()
    })
  }
})
