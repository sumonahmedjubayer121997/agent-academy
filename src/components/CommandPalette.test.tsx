import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import CommandPalette from './CommandPalette'
import Navbar from './Navbar'
import { ActiveRoadmapProvider } from '../store/activeRoadmap'
import { ProgressProvider } from '../store/progress'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="loc">{location.pathname}</div>
}

function PaletteHarness({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen)
  const [showTrigger, setShowTrigger] = useState(true)
  return (
    <MemoryRouter initialEntries={['/']}>
      <ActiveRoadmapProvider>
        <ProgressProvider>
          <div>
            {showTrigger && (
              <button type="button" onClick={() => setOpen(true)}>
                Open palette
              </button>
            )}
            <button
              type="button"
              data-palette-fallback="fallback-btn"
              onClick={() => {
                setShowTrigger(false)
                setOpen(true)
              }}
            >
              Open and unmount trigger
            </button>
            <button type="button">Background action</button>
            <CommandPalette open={open} onClose={() => setOpen(false)} />
            <LocationProbe />
          </div>
        </ProgressProvider>
      </ActiveRoadmapProvider>
    </MemoryRouter>
  )
}

describe('CommandPalette accessibility (Workstream A)', () => {
  it('moves focus to the search combobox on open and exposes dialog/combobox/listbox semantics', () => {
    render(<PaletteHarness />)
    const trigger = screen.getByRole('button', { name: 'Open palette' })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Command palette' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')

    const input = screen.getByRole('combobox', { name: 'Search everything' })
    expect(document.activeElement).toBe(input)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(input.getAttribute('aria-controls')).toBe('palette-results')

    const listbox = screen.getByRole('listbox', { name: 'Search results' })
    expect(listbox.id).toBe('palette-results')

    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(0)
    expect(options[0].getAttribute('aria-selected')).toBe('true')
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id)

    // Interactive elements must never have aria-hidden="true"
    expect(dialog.getAttribute('aria-hidden')).not.toBe('true')
    expect(input.getAttribute('aria-hidden')).not.toBe('true')
    expect(options[0].getAttribute('aria-hidden')).not.toBe('true')
  })

  it('closes on Escape and restores focus to the opener button', () => {
    render(<PaletteHarness />)
    const trigger = screen.getByRole('button', { name: 'Open palette' })
    trigger.focus()
    fireEvent.click(trigger)

    const input = screen.getByRole('combobox', { name: 'Search everything' })
    expect(document.activeElement).toBe(input)

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('restores focus to fallback when the original trigger unmounts while open', () => {
    render(<PaletteHarness />)
    const trigger = screen.getByRole('button', { name: 'Open palette' })
    trigger.focus()
    fireEvent.click(trigger)

    const input = screen.getByRole('combobox', { name: 'Search everything' })
    // Simulate opener disappearing before close
    trigger.remove()

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    const fallback = screen.getByRole('button', { name: 'Open and unmount trigger' })
    expect(document.activeElement).toBe(fallback)
  })

  it('contains Tab and Shift+Tab inside the modal dialog and prevents background focus', () => {
    render(<PaletteHarness />)
    const trigger = screen.getByRole('button', { name: 'Open palette' })
    trigger.focus()
    fireEvent.click(trigger)

    const input = screen.getByRole('combobox', { name: 'Search everything' })
    const closeBtn = screen.getByRole('button', { name: 'Close command palette' })
    const backgroundBtn = screen.getByRole('button', { name: 'Background action' })

    expect(document.activeElement).toBe(input)

    // Shift+Tab from first control wraps to last control (Close button)
    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(closeBtn)

    // Tab from last control wraps back to first control (Search input)
    fireEvent.keyDown(closeBtn, { key: 'Tab' })
    expect(document.activeElement).toBe(input)

    // Escape from Close button also closes the dialog
    closeBtn.focus()
    fireEvent.keyDown(closeBtn, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)

    // Reopen and verify background focus redirection
    fireEvent.click(trigger)
    const reopenedInput = screen.getByRole('combobox', { name: 'Search everything' })
    backgroundBtn.focus()
    expect(document.activeElement).toBe(reopenedInput)
  })

  it('navigates results with ArrowDown/ArrowUp without interfering with ArrowLeft/ArrowRight and activates with Enter', () => {
    render(<PaletteHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Open palette' }))

    const input = screen.getByRole('combobox', { name: 'Search everything' })
    const options = screen.getAllByRole('option')

    // ArrowUp at index 0 clamps at 0
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(options[0].getAttribute('aria-selected')).toBe('true')

    // ArrowDown moves to index 1, then index 2
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(options[0].getAttribute('aria-selected')).toBe('false')
    expect(options[1].getAttribute('aria-selected')).toBe('true')
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id)

    // ArrowLeft and ArrowRight do not change the active option or prevent default text editing
    const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
    input.dispatchEvent(leftEvent)
    expect(leftEvent.defaultPrevented).toBe(false)
    expect(options[1].getAttribute('aria-selected')).toBe('true')

    // Enter activates the selected option ("All roadmaps" at index 1 -> /roadmaps)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('loc').textContent).toBe('/roadmaps')
  })

  it('updates result counts, resets active selection on query change, and handles empty results gracefully', () => {
    render(<PaletteHarness initialOpen />)
    const input = screen.getByRole('combobox', { name: 'Search everything' })
    const status = screen.getByRole('status')

    expect(status.textContent).toBe('12 results available.')

    // Move to second option, then type a query -> active resets to first matching result
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.change(input, { target: { value: 'Brain dump' } })

    const filteredOptions = screen.getAllByRole('option')
    expect(filteredOptions.length).toBeGreaterThan(0)
    expect(filteredOptions[0].getAttribute('aria-selected')).toBe('true')
    expect(input.getAttribute('aria-activedescendant')).toBe(filteredOptions[0].id)

    // Filter to an empty result list
    fireEvent.change(input, { target: { value: 'zzzz-no-such-module-9999' } })
    expect(screen.queryAllByRole('option').length).toBe(0)
    expect(status.textContent).toBe('No matches found.')
    expect(input.getAttribute('aria-activedescendant')).toBeNull()
    expect(screen.getByText(/No matches — try a module or project name/)).toBeTruthy()

    // Pressing ArrowDown or Enter on empty results does not throw or close
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('supports Ctrl+K shortcut in Navbar and restores focus when closed', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ActiveRoadmapProvider>
          <ProgressProvider>
            <Navbar />
          </ProgressProvider>
        </ActiveRoadmapProvider>
      </MemoryRouter>,
    )

    const searchBtn = screen.getByRole('button', { name: 'Search (Ctrl+K)' })
    searchBtn.focus()
    expect(document.activeElement).toBe(searchBtn)

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const input = screen.getByRole('combobox', { name: 'Search everything' })
    expect(document.activeElement).toBe(input)

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(searchBtn)
  })

  it('searches practice tasks and deep-links to the module page with the task anchor', () => {
    function HashProbe() {
      const l = useLocation()
      return <div data-testid="loc">{`${l.pathname}${l.hash}`}</div>
    }
    render(
      <MemoryRouter initialEntries={['/']}>
        <ActiveRoadmapProvider>
          <ProgressProvider>
            <CommandPalette open onClose={() => {}} />
            <HashProbe />
          </ProgressProvider>
        </ActiveRoadmapProvider>
      </MemoryRouter>,
    )
    const input = screen.getByRole('combobox', { name: 'Search everything' })
    fireEvent.change(input, { target: { value: 'error-triage' } })
    const option = screen.getByRole('option', { name: /error-triage policy table/i })
    expect(option.textContent).toContain('practice task')
    expect(option.textContent).toContain('~15m')
    fireEvent.click(option)
    expect(screen.getByTestId('loc').textContent).toBe(
      '/r/ai-programming/roadmap/aip-reliability#aip-t-error-triage',
    )
  })
})
