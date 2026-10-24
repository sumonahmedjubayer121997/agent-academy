import { describe, expect, it } from 'vitest'
import { MODULES } from './modules'
import { PHASES } from './phases'
import { PRACTICE_PROJECTS } from './practiceProjects'
import { PROJECTS } from './projects'
import { ASSESSMENT, DOMAIN_LABELS, DOMAIN_CREDIT } from './assessment'
import { CURRICULUM_DECK, cardsForModule } from './cards'
import { EDGE_WHY } from './edges'
import { TRACKS, trackForModule, waveForModule } from './tracks'

const ids = new Set(MODULES.map((m) => m.id))

describe('prompt-engineering curriculum integrity', () => {
  it('has 42 modules across 6 phases, 7 per phase, all ids prefixed pe-', () => {
    expect(MODULES).toHaveLength(42)
    expect(PHASES).toHaveLength(6)
    for (let n = 1; n <= 6; n++) {
      expect(MODULES.filter((m) => m.phase === n)).toHaveLength(7)
    }
    for (const m of MODULES) {
      expect(m.id.startsWith('pe-')).toBe(true)
    }
  })

  it('has unique module ids and hours within sane bounds', () => {
    expect(ids.size).toBe(MODULES.length)
    for (const m of MODULES) {
      expect(m.hours).toBeGreaterThanOrEqual(2)
      expect(m.hours).toBeLessThanOrEqual(8)
      expect(m.objectives.length).toBeGreaterThanOrEqual(3)
      expect(m.completion.length).toBeGreaterThanOrEqual(2)
      expect(m.deliverable.length).toBeGreaterThan(0)
    }
  })

  it('every prereqs entry resolves to a module in this roadmap', () => {
    for (const m of MODULES) {
      for (const p of m.prereqs) {
        expect(ids.has(p), `unknown prereq ${p} on ${m.id}`).toBe(true)
      }
    }
  })

  it('has 18 practice projects, 3 per phase, referencing real modules, 5+ steps each', () => {
    expect(PRACTICE_PROJECTS).toHaveLength(18)
    for (let n = 1; n <= 6; n++) {
      expect(PRACTICE_PROJECTS.filter((p) => p.phase === n)).toHaveLength(3)
    }
    for (const p of PRACTICE_PROJECTS) {
      expect(p.steps.length).toBeGreaterThanOrEqual(5)
      expect(p.doneWhen.length).toBeGreaterThan(0)
      for (const modId of p.modules) {
        expect(ids.has(modId), `practice ${p.id} references unknown module ${modId}`).toBe(true)
      }
    }
  })

  it('has 3 portfolio checkpoints with valid moduleIds and full specs', () => {
    expect(PROJECTS).toHaveLength(3)
    for (const p of PROJECTS) {
      expect(ids.has(p.moduleId)).toBe(true)
      expect(p.milestones.length).toBeGreaterThanOrEqual(6)
      expect(p.interview.length).toBeGreaterThanOrEqual(4)
      expect(p.metrics.length).toBeGreaterThanOrEqual(5)
    }
  })

  it('assessment: 12 questions, valid answers, every domain labeled and credited', () => {
    expect(ASSESSMENT).toHaveLength(12)
    for (const q of ASSESSMENT) {
      expect(q.options).toHaveLength(4)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(4)
      expect(q.explain.length).toBeGreaterThan(0)
      expect(DOMAIN_LABELS[q.domain]).toBeDefined()
    }
    for (const credit of Object.values(DOMAIN_CREDIT)) {
      for (const modId of [...credit.full, ...credit.partial]) {
        expect(ids.has(modId), `credit references unknown module ${modId}`).toBe(true)
      }
    }
  })

  it('review deck covers every essential module and references only real modules', () => {
    expect(CURRICULUM_DECK.length).toBeGreaterThan(40)
    for (const card of CURRICULUM_DECK) {
      expect(ids.has(card.moduleId), `deck card ${card.cardId} on unknown module`).toBe(true)
    }
    for (const m of MODULES.filter((x) => x.essential)) {
      expect(cardsForModule(m.id).length, `essential module ${m.id} has no cards`).toBeGreaterThan(0)
    }
  })

  it('edge why-explanations reference existing modules on both ends', () => {
    for (const key of Object.keys(EDGE_WHY)) {
      const [from, to] = key.split('->')
      expect(ids.has(from), `edge from unknown ${from}`).toBe(true)
      expect(ids.has(to), `edge to unknown ${to}`).toBe(true)
    }
  })

  it('tracks: 3 specs (A/B/C), every module maps to a track, waves in 1-4', () => {
    expect(TRACKS.map((t) => t.code).sort()).toEqual(['A', 'B', 'C'])
    for (const m of MODULES) {
      expect(TRACKS.some((t) => t.id === trackForModule(m.id))).toBe(true)
      expect([1, 2, 3, 4]).toContain(waveForModule(m.id))
    }
  })
})
