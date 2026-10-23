import { describe, expect, it } from 'vitest'
import { masteryGate } from './mastery'

const rec = (completionDone: number[], evidenceUrls: { label: string; url: string }[] = []) => ({
  completionDone,
  evidenceUrls,
})

describe('masteryGate', () => {
  it('opens only when all criteria are checked and evidence exists', () => {
    const r = masteryGate({ completion: ['a', 'b', 'c'], record: rec([0, 1, 2], [{ label: 'repo', url: 'https://github.com/x' }]) })
    expect(r.ready).toBe(true)
    expect(r.missing).toEqual([])
  })

  it('lists unchecked criteria explicitly', () => {
    const r = masteryGate({ completion: ['a', 'b', 'c'], record: rec([0], [{ label: 'repo', url: 'u' }]) })
    expect(r.ready).toBe(false)
    expect(r.missing[0]).toMatch(/2 of 3 completion criteria/)
  })

  it('requires at least one evidence link', () => {
    const r = masteryGate({ completion: ['a'], record: rec([0]) })
    expect(r.ready).toBe(false)
    expect(r.missing.join(' ')).toMatch(/no evidence link/)
  })

  it('names both gaps when both are missing', () => {
    const r = masteryGate({ completion: ['a', 'b'], record: rec([]) })
    expect(r.missing).toHaveLength(2)
  })

  it('handles modules with no completion criteria (evidence alone decides)', () => {
    const withEvidence = masteryGate({ completion: [], record: rec([], [{ label: 'demo', url: 'u' }]) })
    expect(withEvidence.ready).toBe(true)
    const without = masteryGate({ completion: [], record: rec([]) })
    expect(without.ready).toBe(false)
  })
})
