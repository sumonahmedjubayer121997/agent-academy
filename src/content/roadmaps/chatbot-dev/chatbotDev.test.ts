import { describe, expect, it } from 'vitest'
import { MODULES } from './modules'
import { PHASES } from './phases'
import { PRACTICE_PROJECTS } from './practiceProjects'
import { PROJECTS } from './projects'
import { ASSESSMENT, DOMAIN_LABELS, DOMAIN_CREDIT } from './assessment'
import { CURRICULUM_DECK, cardsForModule } from './cards'
import { EDGE_WHY } from './edges'
import { EQUIVALENTS } from './equivalents'
import { TRACKS, SEQUENCE_MODES, trackForModule, waveForModule } from './tracks'
import { LESSONS } from './lessons'
import { BUNDLES } from '../registry'

const ids = new Set(MODULES.map((m) => m.id))
const foreignIds = new Set([
  ...BUNDLES['ai-agents'].MODULES.map((m) => m.id),
  ...BUNDLES['prompt-engineering'].MODULES.map((m) => m.id),
  ...BUNDLES['ai-programming'].MODULES.map((m) => m.id),
])

describe('chatbot-dev curriculum integrity', () => {
  it('has 42 modules across 6 phases, 7 per phase, all ids prefixed cb-', () => {
    expect(MODULES).toHaveLength(42)
    expect(PHASES).toHaveLength(6)
    for (let n = 1; n <= 6; n++) {
      expect(MODULES.filter((m) => m.phase === n)).toHaveLength(7)
    }
    for (const m of MODULES) {
      expect(m.id.startsWith('cb-')).toBe(true)
    }
  })

  it('has unique module ids and sane metadata', () => {
    expect(ids.size).toBe(MODULES.length)
    for (const m of MODULES) {
      expect(m.hours).toBeGreaterThanOrEqual(2)
      expect(m.hours).toBeLessThanOrEqual(8)
      expect(m.objectives.length).toBeGreaterThanOrEqual(3)
      expect(m.completion.length).toBeGreaterThanOrEqual(3)
      expect(m.deliverable.length).toBeGreaterThan(0)
    }
  })

  it('every prereq resolves inside this roadmap', () => {
    for (const m of MODULES) {
      for (const p of m.prereqs) {
        expect(ids.has(p), `unknown prereq ${p} on ${m.id}`).toBe(true)
      }
    }
  })

  it('has 30 practice projects, 5 per phase, referencing real modules, 5+ steps', () => {
    expect(PRACTICE_PROJECTS).toHaveLength(30)
    for (let n = 1; n <= 6; n++) {
      expect(PRACTICE_PROJECTS.filter((p) => p.phase === n)).toHaveLength(5)
    }
    for (const p of PRACTICE_PROJECTS) {
      expect(p.steps.length).toBeGreaterThanOrEqual(5)
      expect(p.doneWhen.length).toBeGreaterThan(0)
      for (const modId of p.modules) {
        expect(ids.has(modId), `practice ${p.id} references unknown module ${modId}`).toBe(true)
      }
    }
  })

  it('has 5 portfolio checkpoints with valid moduleIds and full specs', () => {
    expect(PROJECTS).toHaveLength(5)
    for (const p of PROJECTS) {
      expect(ids.has(p.moduleId)).toBe(true)
      expect(p.milestones.length).toBeGreaterThanOrEqual(6)
      expect(p.interview.length).toBeGreaterThanOrEqual(4)
      expect(p.metrics.length).toBeGreaterThanOrEqual(5)
    }
  })

  it('assessment: 15 questions, valid answers, all 5 domains labeled and credited', () => {
    expect(ASSESSMENT).toHaveLength(15)
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

  it('review deck: namespaced, unique, covers every essential module', () => {
    expect(CURRICULUM_DECK.length).toBeGreaterThan(50)
    const cardIds = CURRICULUM_DECK.map((c) => c.cardId)
    expect(new Set(cardIds).size).toBe(cardIds.length)
    for (const card of CURRICULUM_DECK) {
      expect(ids.has(card.moduleId), `deck card ${card.cardId} on unknown module`).toBe(true)
      expect(card.cardId.startsWith('chatbot-dev/')).toBe(true)
    }
    for (const m of MODULES.filter((x) => x.essential)) {
      expect(cardsForModule(m.id).length, `essential ${m.id} has no cards`).toBeGreaterThan(0)
    }
  })

  it('equivalents reference real FOREIGN modules only (one-directional)', () => {
    for (const [from, tos] of Object.entries(EQUIVALENTS)) {
      expect(ids.has(from), `equivalents key ${from} is not a cb- module`).toBe(true)
      for (const to of tos) {
        expect(foreignIds.has(to), `equivalent ${to} for ${from} not found in other roadmaps`).toBe(true)
        expect(ids.has(to), `self-equivalent ${to}`).toBe(false)
      }
    }
  })

  it('edges reference existing modules on both ends', () => {
    for (const key of Object.keys(EDGE_WHY)) {
      const [from, to] = key.split('->')
      expect(ids.has(from), `edge from unknown ${from}`).toBe(true)
      expect(ids.has(to), `edge to unknown ${to}`).toBe(true)
    }
  })

  it('tracks + sequence modes: 3 specs (A/B/C), every module maps, waves in 1-4', () => {
    expect(TRACKS.map((t) => t.code).sort()).toEqual(['A', 'B', 'C'])
    expect(SEQUENCE_MODES.length).toBeGreaterThanOrEqual(2)
    for (const m of MODULES) {
      expect(TRACKS.some((t) => t.id === trackForModule(m.id))).toBe(true)
      expect([1, 2, 3, 4]).toContain(waveForModule(m.id))
    }
  })

  it('has 2 exemplar lessons, complete in all nine layers, wired to real modules', () => {
    expect(LESSONS).toHaveLength(2)
    const validDemos = ['agent-loop', 'vector-sim', 'context-inspector', 'structured-stepthrough', 'retry-timeline', 'cost-meter', 'anatomy-builder', 'fake-provider', 'chat-turn-stepper', 'grounding-check']
    for (const l of LESSONS) {
      expect(ids.has(l.moduleId), `lesson ${l.id} on unknown module`).toBe(true)
      expect((l.takeaways ?? []).length).toBeGreaterThanOrEqual(3)
      expect(l.simple.length).toBeGreaterThanOrEqual(4)
      expect(l.intuition.paragraphs.length).toBeGreaterThanOrEqual(2)
      expect(l.technical.length).toBeGreaterThanOrEqual(4)
      expect((l.deeper ?? []).length).toBeGreaterThanOrEqual(2)
      expect(l.walkthrough.code.length).toBeGreaterThan(100)
      expect(l.walkthrough.notes.length).toBeGreaterThanOrEqual(4)
      expect(l.quiz.length).toBeGreaterThanOrEqual(3)
      expect(l.realWorld.length).toBeGreaterThanOrEqual(3)
      expect(l.further.length).toBeGreaterThanOrEqual(3)
      if (l.demo) expect(validDemos).toContain(l.demo)
      const mod = MODULES.find((m) => m.id === l.moduleId)
      expect(mod?.lessonId).toBe(l.id)
      if (l.pre) {
        expect(l.pre.options).toHaveLength(4)
        expect(l.pre.answer).toBeGreaterThanOrEqual(0)
        expect(l.pre.answer).toBeLessThan(4)
      }
    }
  })
})
