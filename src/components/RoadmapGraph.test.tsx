import { describe, expect, it } from 'vitest'
import { BUNDLES } from '../content/roadmaps/registry'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import RoadmapGraph from './RoadmapGraph'
import VectorSim from './demos/VectorSim'
import { ProgressProvider, useProgress } from '../store/progress'
import { MODULES } from '../content/roadmaps/ai-agents'

function LocationProbe() {
  const l = useLocation()
  return <div data-testid="loc">{l.pathname}</div>
}

function StageSetter({ moduleId, stage }: { moduleId: string; stage: 'learning' | 'practising' | 'confident' | 'mastered' }) {
  const { setStage } = useProgress()
  return (
    <button type="button" onClick={() => setStage(moduleId, stage)}>
      Set {moduleId} to {stage}
    </button>
  )
}

describe('RoadmapGraph', () => {
  it('renders every module as a node with fresh progress and roving tabIndex', () => {
    localStorage.clear()
    render(
      <MemoryRouter>
        <ProgressProvider>
          <RoadmapGraph bundle={BUNDLES['ai-agents']} />
        </ProgressProvider>
      </MemoryRouter>,
    )
    const nodes = screen.getAllByRole('button')
    expect(nodes.length).toBe(MODULES.length)
    const labels = nodes.map((el) => el.getAttribute('aria-label') ?? '').join('||')
    for (const m of MODULES) {
      expect(labels).toContain(m.title)
    }

    // Roving tabIndex: exactly one node has tabIndex=0 on initial render
    const tabStops = nodes.filter((el) => el.getAttribute('tabindex') === '0')
    expect(tabStops.length).toBe(1)
    expect(tabStops[0].getAttribute('data-module-id')).toBe(MODULES[0].id)

    // Interactive nodes must never have aria-hidden="true"
    for (const node of nodes) {
      expect(node.getAttribute('aria-hidden')).not.toBe('true')
    }
  })

  it('navigates to the module page when a node is clicked', () => {
    localStorage.clear()
    render(
      <MemoryRouter>
        <ProgressProvider>
          <RoadmapGraph bundle={BUNDLES['ai-agents']} />
          <LocationProbe />
        </ProgressProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Python Core, Idioms & OOP/ }))
    expect(screen.getByTestId('loc').textContent).toBe('/r/ai-agents/roadmap/p1-python-core')
  })

  it('supports arrow-key movement within and across phase columns plus Home/End and Enter/Space activation', () => {
    localStorage.clear()
    render(
      <MemoryRouter>
        <ProgressProvider>
          <RoadmapGraph bundle={BUNDLES['ai-agents']} />
          <LocationProbe />
        </ProgressProvider>
      </MemoryRouter>,
    )

    const phase1Mods = MODULES.filter((m) => m.phase === 1)
    const phase2Mods = MODULES.filter((m) => m.phase === 2)
    const firstNode = screen.getByRole('button', { name: new RegExp(phase1Mods[0].title) })
    const secondRowPhase1 = screen.getByRole('button', { name: new RegExp(phase1Mods[1].title) })
    const secondRowPhase2 = screen.getByRole('button', { name: new RegExp(phase2Mods[1].title) })

    firstNode.focus()
    fireEvent.focus(firstNode)
    expect(document.activeElement).toBe(firstNode)
    expect(firstNode.getAttribute('data-focused')).toBe('true')
    expect(firstNode.querySelector('.rm-focus-ring')).not.toBeNull()

    // ArrowDown moves to second module in Phase 1 and updates roving tabIndex
    const prevented = !fireEvent.keyDown(firstNode, { key: 'ArrowDown' })
    expect(prevented).toBe(true)
    expect(document.activeElement).toBe(secondRowPhase1)
    expect(secondRowPhase1.getAttribute('tabindex')).toBe('0')
    expect(firstNode.getAttribute('tabindex')).toBe('-1')

    // ArrowRight moves to Phase 2 at the same row index
    fireEvent.keyDown(secondRowPhase1, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(secondRowPhase2)
    expect(secondRowPhase2.getAttribute('tabindex')).toBe('0')

    // ArrowLeft returns to Phase 1 at the same row index
    fireEvent.keyDown(secondRowPhase2, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(secondRowPhase1)

    // ArrowUp returns to first module in Phase 1
    fireEvent.keyDown(secondRowPhase1, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(firstNode)

    // End jumps to the last module in the final phase, Home jumps back to the first
    const lastMod = MODULES[MODULES.length - 1]
    const lastNode = screen.getByRole('button', { name: new RegExp(lastMod.title) })
    fireEvent.keyDown(firstNode, { key: 'End' })
    expect(document.activeElement).toBe(lastNode)

    fireEvent.keyDown(lastNode, { key: 'Home' })
    expect(document.activeElement).toBe(firstNode)

    // Enter activates the focused node
    fireEvent.keyDown(firstNode, { key: 'Enter' })
    expect(screen.getByTestId('loc').textContent).toBe(`/r/ai-agents/roadmap/${phase1Mods[0].id}`)

    // Space also activates a focused node (including a locked node)
    fireEvent.keyDown(secondRowPhase2, { key: ' ' })
    expect(screen.getByTestId('loc').textContent).toBe(`/r/ai-agents/roadmap/${phase2Mods[1].id}`)
  })

  it('exposes accurate accessible names, states (available, in progress, completed, locked), and prerequisite reasons', () => {
    localStorage.clear()
    const rootMod = MODULES.find((m) => m.prereqs.length === 0)!
    const dependentMod = MODULES.find((m) => m.prereqs.length === 1 && m.prereqs[0] === rootMod.id)!

    render(
      <MemoryRouter>
        <ProgressProvider>
          <StageSetter moduleId={rootMod.id} stage="learning" />
          <StageSetter moduleId={rootMod.id} stage="confident" />
          <StageSetter moduleId={rootMod.id} stage="mastered" />
          <RoadmapGraph bundle={BUNDLES['ai-agents']} />
        </ProgressProvider>
      </MemoryRouter>,
    )

    const rootNode = () =>
      document.querySelector<SVGGElement>(`[data-module-id="${rootMod.id}"]`)!
    const depNode = () =>
      document.querySelector<SVGGElement>(`[data-module-id="${dependentMod.id}"]`)!

    // Initial state: root is available with no prerequisites; dependent is locked naming rootMod in its accessible description
    expect(rootNode().getAttribute('aria-label')).toContain('available (not started)')
    expect(rootNode().querySelector('desc')?.textContent).toContain('No prerequisites.')
    expect(rootNode().getAttribute('data-state')).toBe('not-started')

    expect(depNode().getAttribute('aria-label')).toContain('locked (not started)')
    expect(depNode().querySelector('desc')?.textContent).toContain(
      `Locked: requires ${rootMod.title}`,
    )
    expect(depNode().getAttribute('data-state')).toBe('locked')

    // Move rootMod to learning -> in progress
    fireEvent.click(screen.getByRole('button', { name: `Set ${rootMod.id} to learning` }))
    expect(rootNode().getAttribute('aria-label')).toContain('in progress (learning)')
    expect(rootNode().getAttribute('data-state')).toBe('in-progress')

    // Move rootMod to confident -> completed, which unlocks dependentMod
    fireEvent.click(screen.getByRole('button', { name: `Set ${rootMod.id} to confident` }))
    expect(rootNode().getAttribute('aria-label')).toContain('completed (understood theoretically)')
    expect(rootNode().getAttribute('data-state')).toBe('completed')

    expect(depNode().getAttribute('aria-label')).toContain('available (not started)')
    expect(depNode().querySelector('desc')?.textContent).toContain(
      `Prerequisites completed: ${rootMod.title}`,
    )
    expect(depNode().getAttribute('data-state')).toBe('not-started')

    // Move rootMod to mastered -> demonstrated mastery
    fireEvent.click(screen.getByRole('button', { name: `Set ${rootMod.id} to mastered` }))
    expect(rootNode().getAttribute('aria-label')).toContain('completed (demonstrated mastery)')
  })
})

describe('VectorSim', () => {
  it('shows hand-checkable cosine math for the default vectors', () => {
    const a = { x: 0.82, y: 0.62 }
    const b = { x: 0.3, y: 0.78 }
    const dot = a.x * b.x + a.y * b.y
    const na = Math.hypot(a.x, a.y)
    const nb = Math.hypot(b.x, b.y)
    const cos = dot / (na * nb)
    render(<VectorSim />)
    // The numbers live in nested spans, so match the line by its label text and
    // assert on the full line's text content.
    const dotLine = screen.getByText(/a · b =/)
    expect(dotLine.textContent).toContain(dot.toFixed(3))
    const cosLine = screen.getByText(/cos θ =/)
    expect(cosLine.textContent).toContain(`${dot.toFixed(2)} / ${(na * nb).toFixed(2)}`)
    expect(cosLine.textContent).toContain(cos.toFixed(3))
  })
})
