import { describe, beforeEach, expect, it } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ActiveRoadmapProvider } from './activeRoadmap'
import { ProgressProvider, useProgress } from './progress'
import { BUNDLES } from '../content/roadmaps/registry'

function Probe({ on }: { on: (api: ReturnType<typeof useProgress>) => void }) {
  on(useProgress())
  return null
}

function setup(on: (api: ReturnType<typeof useProgress>) => void) {
  render(
    <MemoryRouter>
      <ActiveRoadmapProvider>
        <ProgressProvider>
          <Probe on={on} />
        </ProgressProvider>
      </ActiveRoadmapProvider>
    </MemoryRouter>,
  )
}

describe('review health (P6)', () => {
  beforeEach(() => localStorage.clear())

  it('updateReviewSettings persists caps', () => {
    let api: ReturnType<typeof useProgress> | undefined
    setup((a) => (api = a))
    act(() => api!.updateReviewSettings({ maxReviewsPerDay: 40, newCardsPerDay: { 'ai-agents': 5 } }))
    expect(api!.data.reviewSettings?.maxReviewsPerDay).toBe(40)
    expect(api!.data.reviewSettings?.newCardsPerDay?.['ai-agents']).toBe(5)
    act(() => api!.updateReviewSettings({ newCardsPerDay: { 'prompt-engineering': 8 } }))
    expect(api!.data.reviewSettings?.newCardsPerDay).toEqual({ 'ai-agents': 5, 'prompt-engineering': 8 })
    expect(api!.data.reviewSettings?.maxReviewsPerDay).toBe(40) // patch merge keeps the rest
  })

  it('spreadReviewBacklog redistributes overdue cards and reports the count', () => {
    // seed 70 overdue cards BEFORE any provider mounts — single deterministic load
    const mk = () => ({ ease: 2.5, intervalDays: 3, due: '2026-10-01', reps: 2, lapses: 0 })
    const srs: Record<string, ReturnType<typeof mk>> = {}
    for (let i = 0; i < 70; i++) srs[`ai-agents/x:${i}`] = mk()
    localStorage.setItem(
      'aa-progress-v1',
      JSON.stringify({ schemaVersion: 3, srs, activity: [], sessions: [] }),
    )
    let api: ReturnType<typeof useProgress> | undefined
    setup((a) => (api = a))
    expect(Object.keys(api!.data.srs).length).toBe(70)

    const today = new Date()
    const t = (offset: number) => {
      const d = new Date(today.getTime() + offset * 86400000)
      return d.toISOString().slice(0, 10)
    }

    let spread = 0
    act(() => {
      spread = api!.spreadReviewBacklog()
    })
    expect(spread).toBe(70)
    const dues = Object.values(api!.data.srs).map((c) => c.due).sort()
    expect(dues[dues.length - 1] <= t(6)).toBe(true) // within 6 days
    const stillToday = dues.filter((d) => d <= t(0)).length
    expect(stillToday).toBeGreaterThan(0)
    expect(stillToday).toBeLessThanOrEqual(12) // roughly one chunk stays today
  })

  it('equivalents: seeding a PE module whose AI-Agents equivalent is Confident avoids a same-day flood', () => {
    let api: ReturnType<typeof useProgress> | undefined
    // active roadmap: prompt-engineering
    render(
      <MemoryRouter initialEntries={['/r/prompt-engineering/curriculum']}>
        <ActiveRoadmapProvider>
          <ProgressProvider>
            <Probe on={(a) => (api = a)} />
          </ProgressProvider>
        </ActiveRoadmapProvider>
      </MemoryRouter>,
    )
    // mark the AA equivalent of pe-schemas confident
    act(() => api!.setStage('p4-structured-outputs', 'confident'))
    const today = new Date()
    const tstr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    let seeded = 0
    act(() => {
      seeded = api!.seedModuleCards('pe-schemas') // default dueImmediate = true
    })
    expect(seeded).toBeGreaterThan(0)
    // none of the freshly seeded PE cards are due TODAY (the flood was defused)
    const dueToday = Object.entries(api!.data.srs).filter(
      ([id, c]) => id.startsWith('prompt-engineering/') && c.due === tstr,
    )
    expect(dueToday.length).toBe(0)
    expect(BUNDLES['prompt-engineering'].CURRICULUM_DECK.length).toBeGreaterThan(0)
  })
})
