import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import RoadmapGraph from './RoadmapGraph'
import VectorSim from './demos/VectorSim'
import { ProgressProvider } from '../store/progress'
import { MODULES } from '../content/modules'

function LocationProbe() {
  const l = useLocation()
  return <div data-testid="loc">{l.pathname}</div>
}

describe('RoadmapGraph', () => {
  it('renders every module as a node with fresh progress', () => {
    localStorage.clear()
    render(
      <MemoryRouter>
        <ProgressProvider>
          <RoadmapGraph />
        </ProgressProvider>
      </MemoryRouter>,
    )
    const nodes = screen.getAllByRole('button')
    expect(nodes.length).toBe(MODULES.length)
    const labels = nodes.map((el) => el.getAttribute('aria-label') ?? '').join('||')
    for (const m of MODULES) {
      expect(labels).toContain(m.title)
    }
  })

  it('navigates to the module page when a node is clicked', () => {
    localStorage.clear()
    render(
      <MemoryRouter>
        <ProgressProvider>
          <RoadmapGraph />
          <LocationProbe />
        </ProgressProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Python Core, Idioms & OOP/ }))
    expect(screen.getByTestId('loc').textContent).toBe('/roadmap/p1-python-core')
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
