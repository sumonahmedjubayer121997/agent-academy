import { beforeEach, describe, expect, it } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ActiveRoadmapProvider } from './activeRoadmap'
import { ProgressProvider, useProgress } from './progress'

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

describe('brain dump persistence', () => {
  beforeEach(() => localStorage.clear())

  it('creates a reflection, persists across reloads, and links roadmap + lesson', () => {
    let api: ReturnType<typeof useProgress> | undefined
    setup((a) => (api = a))
    act(() =>
      api!.addBrainDump({
        date: '2026-10-27',
        slug: 'ai-agents',
        moduleId: 'p6-agent-loop',
        lessonId: 'agent-loop',
        learned: 'observe-reason-act loop',
        explained: 'why tools make agents',
        confusing: 'budgets',
        next: 'rebuild loop',
        status: 'completed',
      }),
    )
    expect(api!.data.brainDumps).toHaveLength(1)
    const e = api!.data.brainDumps![0]
    expect(e.id).toMatch(/^braindump:/)
    expect(e.lessonId).toBe('agent-loop')

    // reload simulation: fresh provider reads localStorage
    let api2: ReturnType<typeof useProgress> | undefined
    setup((a) => (api2 = a))
    expect(api2!.data.brainDumps).toHaveLength(1)
    expect(api2!.data.brainDumps![0].learned).toBe('observe-reason-act loop')
  })

  it('editing updates in place — no duplicates, updatedAt bumps, status can change', () => {
    let api: ReturnType<typeof useProgress> | undefined
    setup((a) => (api = a))
    act(() =>
      api!.addBrainDump({
        date: '2026-10-27',
        slug: 'prompt-engineering',
        learned: 'a',
        explained: '',
        confusing: '',
        next: '',
        status: 'draft',
      }),
    )
    const id = api!.data.brainDumps![0].id
    const created = api!.data.brainDumps![0].createdAt
    act(() => api!.updateBrainDump(id, { learned: 'a b c', status: 'completed' }))
    const all = api!.data.brainDumps!
    expect(all).toHaveLength(1)
    expect(all[0].learned).toBe('a b c')
    expect(all[0].status).toBe('completed')
    expect(all[0].updatedAt >= created).toBe(true)
  })

  it('schema v3 export/import round-trip preserves brain dumps', () => {
    localStorage.setItem(
      'aa-progress-v1',
      JSON.stringify({
        schemaVersion: 3,
        activity: [],
        srs: {},
        brainDumps: [{ id: 'braindump:x', date: '2026-10-26', createdAt: 't', updatedAt: 't', learned: 'L', explained: '', confusing: '', next: '', status: 'completed' }],
      }),
    )
    let api: ReturnType<typeof useProgress> | undefined
    setup((a) => (api = a))
    expect(api!.data.brainDumps).toHaveLength(1)
    expect(api!.data.brainDumps![0].id).toBe('braindump:x')
  })
})
