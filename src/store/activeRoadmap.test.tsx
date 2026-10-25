import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ActiveRoadmapProvider, useActiveRoadmap } from './activeRoadmap'
import { BUNDLES } from '../content/roadmaps/registry'

function Probe() {
  const r = useActiveRoadmap()
  return <div data-testid="probe">{`${r.META.slug}:${r.MODULES.length}:${r.PHASES.length}`}</div>
}

describe('active roadmap context', () => {
  beforeEach(() => {
    localStorage.removeItem('aa-last-roadmap')
  })
  it('defaults to the ai-agents bundle on legacy routes', () => {
    render(
      <MemoryRouter initialEntries={['/curriculum']}>
        <ActiveRoadmapProvider>
          <Probe />
        </ActiveRoadmapProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('probe').textContent).toBe(
      `ai-agents:${BUNDLES['ai-agents'].MODULES.length}:${BUNDLES['ai-agents'].PHASES.length}`,
    )
  })

  it('resolves a registered bundle slug and falls back for unknown /r/ slugs', () => {
    // prompt-engineering has a registered bundle — it resolves even while its routes land later
    const { unmount } = render(
      <MemoryRouter initialEntries={['/r/prompt-engineering/curriculum']}>
        <ActiveRoadmapProvider>
          <Probe />
        </ActiveRoadmapProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('probe').textContent).toContain('prompt-engineering:')
    unmount()
    // unknown slugs fall back to the remembered roadmap; with none remembered, the default
    localStorage.removeItem('aa-last-roadmap')
    const second = render(
      <MemoryRouter initialEntries={['/r/nope']}>
        <ActiveRoadmapProvider>
          <Probe />
        </ActiveRoadmapProvider>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('probe').textContent).toContain('ai-agents:')
    second.unmount()
  })
})
