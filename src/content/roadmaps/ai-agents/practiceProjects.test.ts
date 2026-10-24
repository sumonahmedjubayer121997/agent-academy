import { describe, expect, it } from 'vitest'
import { PRACTICE_PROJECTS } from './practiceProjects'
import { MODULES } from './modules'

describe('practice projects dataset', () => {
  it('contains exactly 40 projects', () => {
    expect(PRACTICE_PROJECTS).toHaveLength(40)
  })

  it('has unique ids', () => {
    const ids = new Set(PRACTICE_PROJECTS.map((p) => p.id))
    expect(ids.size).toBe(PRACTICE_PROJECTS.length)
  })

  it('covers every phase 1–8 with exactly five projects each', () => {
    for (let phase = 1; phase <= 8; phase++) {
      const n = PRACTICE_PROJECTS.filter((p) => p.phase === phase).length
      expect(n, `phase ${phase}`).toBe(5)
    }
  })

  it('every project has a step-by-step plan (>= 5 steps) and a completion test', () => {
    for (const p of PRACTICE_PROJECTS) {
      expect(p.steps.length, `${p.id} steps`).toBeGreaterThanOrEqual(5)
      expect(p.doneWhen.length, `${p.id} doneWhen`).toBeGreaterThan(15)
      expect(p.brief.length, `${p.id} brief`).toBeGreaterThan(20)
    }
  })

  it('links only to modules that exist', () => {
    const moduleIds = new Set(MODULES.map((m) => m.id))
    for (const p of PRACTICE_PROJECTS) {
      expect(p.modules.length, `${p.id} module links`).toBeGreaterThan(0)
      for (const id of p.modules) {
        expect(moduleIds.has(id), `${p.id} links unknown module ${id}`).toBe(true)
      }
    }
  })

  it('declares sane hours', () => {
    for (const p of PRACTICE_PROJECTS) {
      expect(p.hours).toBeGreaterThanOrEqual(2)
      expect(p.hours).toBeLessThanOrEqual(12)
    }
  })
})
