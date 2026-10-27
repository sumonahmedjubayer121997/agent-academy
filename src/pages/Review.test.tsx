import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DEFAULT_DATA, ProgressProvider } from '../store/progress'
import Review from './Review'

describe('Review page (Feature 5 & P0 multi-card session fix)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('completes a multi-card review session without skipping cards or crashing when dueCards updates', () => {
    const seeded = {
      ...DEFAULT_DATA,
      srs: {
        'lesson:agent-loop:q0': {
          ease: 2.5,
          interval: 0,
          reps: 0,
          due: '2020-01-01',
          lapses: 0,
        },
        'lesson:agent-loop:q1': {
          ease: 2.5,
          interval: 0,
          reps: 0,
          due: '2020-01-01',
          lapses: 0,
        },
      },
    }
    localStorage.setItem('aa-progress-v1', JSON.stringify(seeded))

    render(
      <MemoryRouter initialEntries={['/review']}>
        <ProgressProvider>
          <Review />
        </ProgressProvider>
      </MemoryRouter>,
    )

    // P6 UI present: global counts bar + scope chips
    expect(screen.getByRole('button', { name: /All roadmaps/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /This roadmap/i })).toBeTruthy()
    expect(screen.getByText(/due across all roadmaps/i)).toBeTruthy()

    // Card 1 of 2 is shown ("1 / 2")
    expect(screen.getByText(/1\s*\/\s*2/)).toBeTruthy()
    expect(screen.getByText(/When does the agent loop stop\?/i)).toBeTruthy()

    // Select an option on Card 1, which grades and reveals the explanation
    fireEvent.click(
      screen.getByRole('button', {
        name: /When it returns a final answer OR hits a step\/budget limit/i,
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: /Next card/i }))

    // Must advance to Card 2 of 2 ("2 / 2") without skipping or crashing
    expect(screen.getByText(/2\s*\/\s*2/)).toBeTruthy()

    // Answer Card 2 and finish session
    const optionButtons = screen
      .getAllByRole('button')
      .filter(
        (b) =>
          !/Add card|All roadmaps|This roadmap|Next card|Drill|Spread/i.test(b.textContent ?? ''),
      )
    fireEvent.click(optionButtons[0])
    fireEvent.click(screen.getByRole('button', { name: /Finish session/i }))

    // Session summary is displayed
    expect(screen.getByText(/Review complete/i)).toBeTruthy()
  })
})
