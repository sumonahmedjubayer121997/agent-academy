import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ActiveRoadmapProvider, useActiveRoadmap } from './activeRoadmap'
import { BUNDLES } from '../content/roadmaps/registry'

function Probe() {
  const r = useActiveRoadmap()
  return <div data-testid="probe">{`${r.META.slug}:${r.MODULES.length}:${r.PHASES.length}`}</div>
}

describe('active roadmap context', () => {
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

  it('falls back to the default bundle for unknown or not-yet-live /r/ slugs', () => {
    for (const entry of ['/r/prompt-engineering', '/r/nope']) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[entry]}>
          <ActiveRoadmapProvider>
            <Probe />
          </ActiveRoadmapProvider>
        </MemoryRouter>,
      )
      expect(screen.getByTestId('probe').textContent).toContain('ai-agents:')
      unmount()
    }
  })
})
