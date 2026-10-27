import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ActiveRoadmapProvider } from '../store/activeRoadmap'
import { ProgressProvider } from '../store/progress'
import Onboarding, { onboardingDismissed, showOnboardingAgain } from './Onboarding'

function mount() {
  return render(
    <MemoryRouter>
      <ActiveRoadmapProvider>
        <ProgressProvider>
          <Onboarding />
        </ProgressProvider>
      </ActiveRoadmapProvider>
    </MemoryRouter>,
  )
}

describe('Onboarding (first-run introduction)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows for a fresh user with no activity and no dismissal', () => {
    mount()
    expect(screen.getByText(/New here\? Start in three steps/i)).toBeTruthy()
    expect(screen.getByRole('link', { name: /Browse all roadmaps/i })).toBeTruthy()
  })

  it('dismiss persists across remounts (localStorage)', () => {
    const { unmount } = mount()
    fireEvent.click(screen.getByRole('button', { name: /Skip introduction/i }))
    expect(screen.queryByText(/New here\?/i)).toBeNull()
    unmount()

    mount()
    expect(screen.queryByText(/New here\?/i)).toBeNull()
    expect(onboardingDismissed()).toBe(true)
  })

  it('stays hidden for returning users who already studied (activity exists)', () => {
    localStorage.setItem('aa-progress-v1', JSON.stringify({ schemaVersion: 3, activity: ['2026-10-27'], srs: {} }))
    mount()
    expect(screen.queryByText(/New here\?/i)).toBeNull()
  })

  it('revisit affordance clears the flag so the intro shows again', () => {
    localStorage.setItem('aa-onboarding', 'dismissed')
    mount()
    expect(screen.queryByText(/New here\?/i)).toBeNull()
    showOnboardingAgain()
    mount()
    expect(screen.getByText(/New here\? Start in three steps/i)).toBeTruthy()
  })

  it('links roadmaps from registry data (beta included, skeleton excluded)', () => {
    mount()
    expect(screen.getByRole('link', { name: /^Chatbot Development$/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /^AI Programming$/i })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /^AI Automation/i })).toBeNull()
  })
})
