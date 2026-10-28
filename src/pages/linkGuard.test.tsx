import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { BUNDLES } from '../content/roadmaps/registry'
import { ActiveRoadmapProvider } from '../store/activeRoadmap'
import { DEFAULT_DATA, emptyModuleRecord, ProgressProvider, type ProgressData } from '../store/progress'
import { generateDailyPlan } from '../lib/dailyPlan'
import Curriculum from './Curriculum'
import ModuleDetail from './ModuleDetail'
import Projects from './Projects'
import Review from './Review'
import Assessment from './Assessment'
import Planner from './Planner'
import Journal from './Journal'
import Dashboard from './Dashboard'

/**
 * Link-harvest guard: on every roadmap-scoped page, every internal link must
 * either stay inside the ACTIVE roadmap's workspace (/r/<slug>/…) or point at
 * a known global route. This is the test that would have caught the P3-QA
 * critical bug: PE pages emitting legacy /roadmap/<pe-id> links that the
 * legacy redirect sent into the AI-Agents workspace ("Module not found").
 */
const GLOBAL_ROUTES = [
  '/',
  '/braindump',
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
  localStorage.setItem('aa-last-roadmap', slug)
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
  { name: 'dashboard', path: () => '/dashboard', el: <Dashboard /> },
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
    it(`${slug} · dashboard with active, mastered, shaky, lesson-quiz, and assessment links`, () => {
      const bundle = BUNDLES[slug]
      const m0 = bundle.MODULES[0]
      const m1 = bundle.MODULES[1] ?? m0
      const m2 = bundle.MODULES.find((m) => m.prereqs.length > 0) ?? m0
      const lesson = bundle.LESSONS?.[0]
      const seeded: ProgressData = {
        ...DEFAULT_DATA,
        moduleStatus: {
          [m0.id]: 'completed',
          [m1.id]: 'in-progress',
          [m2.id]: 'in-progress',
        },
        modules: {
          [m0.id]: emptyModuleRecord('mastered'),
          [m1.id]: emptyModuleRecord('learning'),
          [m2.id]: emptyModuleRecord('practising'),
        },
        confidence: {
          [m1.id]: 'shaky',
        },
        quiz: lesson
          ? { [`lesson:${lesson.id}`]: { score: 1, total: 4, at: '2026-10-28T00:00:00.000Z' } }
          : {},
        assessments: {
          [slug]: { done: true, applied: false, scores: { [Object.keys(bundle.DOMAIN_LABELS)[0]]: 2 } },
        },
      }
      localStorage.setItem('aa-progress-v1', JSON.stringify(seeded))
      expect(harvest('/dashboard', <Dashboard />, slug)).toEqual([])
      localStorage.removeItem('aa-progress-v1')
    })
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

describe('Dashboard multi-roadmap daily plan & diagnostic assessment isolation', () => {
  it('reads diagnostic assessment from the active roadmap rather than hardcoding ai-agents', () => {
    const seeded: ProgressData = {
      ...DEFAULT_DATA,
      assessments: {
        'ai-agents': { done: true, applied: true, scores: { python: 3, math: 2 } },
        'prompt-engineering': { done: false, applied: false, scores: {} },
      },
    }
    localStorage.setItem('aa-progress-v1', JSON.stringify(seeded))
    localStorage.setItem('aa-last-roadmap', 'prompt-engineering')

    const { unmount } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ActiveRoadmapProvider>
          <ProgressProvider>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </ProgressProvider>
        </ActiveRoadmapProvider>
      </MemoryRouter>,
    )

    // Since prompt-engineering assessment is not done, "Take the diagnostic" must render
    const takeLink = screen.getByRole('link', { name: /Take the diagnostic/i })
    expect(takeLink.getAttribute('href')).toBe('/r/prompt-engineering/assess')
    unmount()

    // Now mark prompt-engineering assessment as done with its own domain score
    const seededDone: ProgressData = {
      ...DEFAULT_DATA,
      assessments: {
        'ai-agents': { done: false, applied: false, scores: {} },
        'prompt-engineering': { done: true, applied: false, scores: { fundamentals: 3 } },
      },
    }
    localStorage.setItem('aa-progress-v1', JSON.stringify(seededDone))
    localStorage.setItem('aa-last-roadmap', 'prompt-engineering')

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ActiveRoadmapProvider>
          <ProgressProvider>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </ProgressProvider>
        </ActiveRoadmapProvider>
      </MemoryRouter>,
    )

    const retakeLink = screen.getByRole('link', { name: /Retake or review/i })
    expect(retakeLink.getAttribute('href')).toBe('/r/prompt-engineering/assess')
    expect(screen.getByText('fundamentals')).toBeTruthy()
    localStorage.removeItem('aa-progress-v1')
  })

  it('generates Today study plan for the active roadmap and does not leak a cached plan from another roadmap', () => {
    const today = new Date()
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const aiAgentsPlan = generateDailyPlan(DEFAULT_DATA, todayIso, 90, BUNDLES['ai-agents'])

    const seeded: ProgressData = {
      ...DEFAULT_DATA,
      dailyPlans: {
        [todayIso]: aiAgentsPlan,
      },
    }
    localStorage.setItem('aa-progress-v1', JSON.stringify(seeded))
    localStorage.setItem('aa-last-roadmap', 'chatbot-dev')

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ActiveRoadmapProvider>
          <ProgressProvider>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </ProgressProvider>
        </ActiveRoadmapProvider>
      </MemoryRouter>,
    )

    const cbFirstTitle = BUNDLES['chatbot-dev'].MODULES[0].title
    const aaFirstTitle = BUNDLES['ai-agents'].MODULES[0].title
    expect(screen.getByText(`Learn concept: ${cbFirstTitle}`)).toBeTruthy()
    expect(screen.queryByText(`Learn concept: ${aaFirstTitle}`)).toBeNull()
    localStorage.removeItem('aa-progress-v1')
  })
})
