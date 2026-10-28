import { createElement } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { MODULES } from './modules'
import { PHASES } from './phases'
import { PRACTICE_PROJECTS } from './practiceProjects'
import { PROJECTS } from './projects'
import { ASSESSMENT, DOMAIN_LABELS, DOMAIN_CREDIT } from './assessment'
import { CURRICULUM_DECK, cardsForModule } from './cards'
import { EDGE_WHY } from './edges'
import { EQUIVALENTS } from './equivalents'
import { LESSONS } from './lessons'
import { PRACTICE_TASKS } from './practiceTasks'
import { TRACKS, SEQUENCE_MODES, trackForModule, waveForModule } from './tracks'
import { BUNDLES } from '../registry'
import { ActiveRoadmapProvider } from '../../../store/activeRoadmap'
import { ProgressProvider, moduleRecordOf, nextUp, stageOf, todayStr, useProgress } from '../../../store/progress'
import LessonPage from '../../../pages/Lesson'
import ModuleDetail from '../../../pages/ModuleDetail'

const ids = new Set(MODULES.map((m) => m.id))

describe('ai-programming curriculum integrity', () => {
  it('has 40 modules across 5 phases, 8 per phase, all ids prefixed aip-', () => {
    expect(MODULES).toHaveLength(40)
    expect(PHASES).toHaveLength(5)
    for (let n = 1; n <= 5; n++) {
      expect(MODULES.filter((m) => m.phase === n)).toHaveLength(8)
    }
    for (const m of MODULES) {
      expect(m.id.startsWith('aip-')).toBe(true)
    }
  })

  it('has unique module ids and sane hours/metadata', () => {
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

  it('has 25 practice projects, 5 per phase, referencing real modules, 5+ steps each', () => {
    expect(PRACTICE_PROJECTS).toHaveLength(25)
    for (let n = 1; n <= 5; n++) {
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

  it('has 4 portfolio checkpoints with valid moduleIds and full specs', () => {
    expect(PROJECTS).toHaveLength(4)
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
    expect(CURRICULUM_DECK.length).toBeGreaterThan(45)
    for (const card of CURRICULUM_DECK) {
      expect(ids.has(card.moduleId), `deck card ${card.cardId} on unknown module`).toBe(true)
      expect(card.cardId.startsWith('ai-programming/')).toBe(true)
    }
    for (const m of MODULES.filter((x) => x.essential)) {
      expect(cardsForModule(m.id).length, `essential module ${m.id} has no cards`).toBeGreaterThan(0)
    }
  })

  it('deck card ids never collide with other roadmaps (namespaced)', () => {
    const cardIds = CURRICULUM_DECK.map((c) => c.cardId)
    expect(new Set(cardIds).size).toBe(cardIds.length)
  })

  it('edge why-explanations reference existing modules on both ends', () => {
    for (const key of Object.keys(EDGE_WHY)) {
      const [from, to] = key.split('->')
      expect(ids.has(from), `edge from unknown ${from}`).toBe(true)
      expect(ids.has(to), `edge to unknown ${to}`).toBe(true)
    }
  })

  it('has 7 exemplar lessons (including aip-codegen-loop and aip-fallback-ladder), complete in all nine layers, wired to real modules', () => {
    expect(LESSONS).toHaveLength(7)
    const lessonIds = LESSONS.map((l) => l.id)
    expect(new Set(lessonIds).size).toBe(LESSONS.length)
    expect(lessonIds).toContain('aip-eval-suites')
    expect(lessonIds).toContain('aip-logging-tracing')
    expect(lessonIds).toContain('aip-codegen-loop')
    expect(lessonIds).toContain('aip-fallback-ladder')
    const validDemos = ['agent-loop', 'vector-sim', 'context-inspector', 'structured-stepthrough', 'retry-timeline', 'cost-meter', 'fallback-ladder', 'anatomy-builder', 'fake-provider']
    for (const l of LESSONS) {
      expect(ids.has(l.moduleId), `lesson ${l.id} on unknown module`).toBe(true)
      expect(l.takeaways).toHaveLength(3)
      expect(l.simple.length).toBeGreaterThanOrEqual(4)
      expect(l.intuition.paragraphs.length).toBeGreaterThanOrEqual(2)
      expect(l.technical.length).toBeGreaterThanOrEqual(4)
      expect((l.deeper ?? []).length).toBeGreaterThanOrEqual(2)
      expect(l.walkthrough.code.length).toBeGreaterThan(100)
      expect(l.walkthrough.notes.length).toBeGreaterThanOrEqual(4)
      expect(l.exercise.prompt.length).toBeGreaterThan(40)
      expect(l.exercise.solution.length).toBeGreaterThan(40)
      expect(l.quiz.length).toBeGreaterThanOrEqual(3)
      expect(l.realWorld.length).toBeGreaterThanOrEqual(3)
      expect(l.further.length).toBeGreaterThanOrEqual(3)
      if (l.demo) expect(validDemos).toContain(l.demo)
      if (l.relatedPractice) {
        expect(PRACTICE_PROJECTS.some((p) => p.id === l.relatedPractice)).toBe(true)
      }
      const mod = MODULES.find((m) => m.id === l.moduleId)
      expect(mod?.lessonId).toBe(l.id)
      if (l.pre) {
        expect(l.pre.options).toHaveLength(4)
        expect(l.pre.answer).toBeGreaterThanOrEqual(0)
        expect(l.pre.answer).toBeLessThan(4)
      }
    }
  })

  it('mounts LessonPage at /r/ai-programming/learn/<id> for the new exemplar lessons without errors', () => {
    for (const lessonId of ['aip-eval-suites', 'aip-logging-tracing', 'aip-codegen-loop', 'aip-fallback-ladder'] as const) {
      const lesson = LESSONS.find((l) => l.id === lessonId)!
      const { unmount } = render(
        createElement(
          MemoryRouter,
          { initialEntries: [`/r/ai-programming/learn/${lessonId}`] },
          createElement(
            ActiveRoadmapProvider,
            null,
            createElement(
              ProgressProvider,
              null,
              createElement(
                Routes,
                null,
                createElement(Route, {
                  path: '/r/:slug/learn/:lessonId',
                  element: createElement(LessonPage),
                }),
              ),
            ),
          ),
        ),
      )
      expect(screen.getByRole('heading', { name: lesson.title })).toBeTruthy()
      unmount()
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

  it('cross-roadmap equivalents map valid aip- modules to real foreign modules without self-links or duplicates', () => {
    const foreignIds = new Set(
      Object.entries(BUNDLES)
        .filter(([slug]) => slug !== 'ai-programming')
        .flatMap(([, b]) => b.MODULES.map((m) => m.id)),
    )
    expect(Object.keys(EQUIVALENTS).length).toBeGreaterThanOrEqual(6)
    expect((BUNDLES['ai-programming'] as unknown as { EQUIVALENTS?: Record<string, string[]> }).EQUIVALENTS).toBe(EQUIVALENTS)
    for (const [aipId, eqs] of Object.entries(EQUIVALENTS)) {
      expect(ids.has(aipId), `equivalents key ${aipId} is not an ai-programming module`).toBe(true)
      expect(eqs.length).toBeGreaterThan(0)
      expect(new Set(eqs).size, `duplicate targets in EQUIVALENTS[${aipId}]`).toBe(eqs.length)
      for (const eq of eqs) {
        expect(ids.has(eq), `self-roadmap target ${eq} in EQUIVALENTS[${aipId}]`).toBe(false)
        expect(foreignIds.has(eq), `equivalent ${eq} on ${aipId} not found in any foreign bundle`).toBe(true)
      }
    }
  })

  it('SRS equivalents behavior: confident/mastered foreign equivalent defers same-day cards without completing module, skipping objectives, or removing from plan', () => {
    localStorage.clear()
    let api: ReturnType<typeof useProgress> | undefined
    function Probe() {
      api = useProgress()
      return null
    }
    const { unmount } = render(
      createElement(
        MemoryRouter,
        { initialEntries: ['/r/ai-programming/curriculum'] },
        createElement(ActiveRoadmapProvider, null, createElement(ProgressProvider, null, createElement(Probe))),
      ),
    )

    // Complete Phase-1 essential prereqs so aip-first-call is the next recommended module in ai-programming
    for (const prereqId of [
      'aip-toolchain',
      'aip-env-config',
      'aip-http-clients',
      'aip-async-patterns',
      'aip-data-models',
      'aip-testing-fundamentals',
    ]) {
      act(() => api!.setStage(prereqId, 'confident'))
    }

    // Mark foreign equivalents as confident / mastered
    act(() => {
      api!.setStage('p4-llm-apis', 'confident') // equivalent of aip-first-call
      api!.setStage('pe-ci-prompts', 'mastered') // equivalent of aip-eval-suites
    })

    const today = todayStr()
    let seededFirstCall = 0
    let seededEvalSuites = 0
    act(() => {
      seededFirstCall = api!.seedModuleCards('aip-first-call')
      seededEvalSuites = api!.seedModuleCards('aip-eval-suites')
    })

    expect(seededFirstCall).toBeGreaterThan(0)
    expect(seededEvalSuites).toBeGreaterThan(0)

    // 1. Immediate card seeding is deferred (due > today, not due today)
    for (const modId of ['aip-first-call', 'aip-eval-suites']) {
      for (const c of cardsForModule(modId)) {
        const srsCard = api!.data.srs[c.cardId]
        expect(srsCard, `expected SRS card ${c.cardId} to be seeded`).toBeDefined()
        expect(srsCard.due > today, `expected ${c.cardId} due (${srsCard.due}) > today (${today})`).toBe(true)
      }
    }

    // 2. Module is NOT marked complete/confident and objectives are NOT skipped
    expect(stageOf(api!.data, 'aip-first-call')).toBe('not-started')
    expect(stageOf(api!.data, 'aip-eval-suites')).toBe('not-started')
    expect(moduleRecordOf(api!.data, 'aip-first-call').completionDone).toEqual([])
    expect(moduleRecordOf(api!.data, 'aip-eval-suites').completionDone).toEqual([])

    // 3. Module is NOT removed from the learning plan / recommendations
    const rec = nextUp(api!.data, 3, MODULES)
    expect(rec[0]?.id).toBe('aip-first-call')
    unmount()
  })

  it('practice tasks: namespaced unique ids, valid module/lesson/practice refs, tier-shaped fields, offline-first', () => {
    expect(PRACTICE_TASKS.length).toBeGreaterThanOrEqual(1)
    const taskIds = PRACTICE_TASKS.map((t) => t.id)
    expect(new Set(taskIds).size).toBe(taskIds.length)
    const lessonIds = LESSONS.map((l) => l.id)
    for (const t of PRACTICE_TASKS) {
      expect(t.id.startsWith('aip-t-'), `task id ${t.id} must be aip-t- namespaced`).toBe(true)
      expect(ids.has(t.moduleId), `task ${t.id} references unknown module`).toBe(true)
      const [minMinutes, maxMinutes] =
        t.kind === 'exercise' ? [10, 20] : t.kind === 'guided' ? [30, 60] : [60, 180]
      expect(t.minutes).toBeGreaterThanOrEqual(minMinutes)
      expect(t.minutes).toBeLessThanOrEqual(maxMinutes)
      expect(t.requirements.length).toBeGreaterThanOrEqual(3)
      expect(t.checks.length).toBeGreaterThanOrEqual(2)
      expect(t.hints.length).toBeGreaterThanOrEqual(2)
      expect(t.doneWhen.length).toBeGreaterThan(20)
      expect(t.offline, `task ${t.id} must be runnable offline`).toBe(true)
      if (t.lessonId) {
        expect(lessonIds).toContain(t.lessonId)
        const lesson = LESSONS.find((l) => l.id === t.lessonId)
        expect(lesson?.moduleId).toBe(t.moduleId)
      }
      if (t.practiceId) {
        const pp = PRACTICE_PROJECTS.find((p) => p.id === t.practiceId)
        expect(pp, `task ${t.id} references unknown practice ${t.practiceId}`).toBeDefined()
        expect(pp?.modules).toContain(t.moduleId)
      }
    }
    // pilot wiring: the reliability task links its lesson and its practice build
    const pilot = PRACTICE_TASKS.find((t) => t.moduleId === 'aip-reliability')
    expect(pilot?.lessonId).toBe('aip-resilient-call')
    expect(pilot?.practiceId).toBe('aip-pp-retry-lab')
  })

  it('task coverage: every ai-programming module has at least one task, phases match, tiers are balanced', () => {
    const covered = new Set(PRACTICE_TASKS.map((t) => t.moduleId))
    for (const m of MODULES) {
      expect(covered.has(m.id), `module ${m.id} has no practice task`).toBe(true)
    }
    for (const t of PRACTICE_TASKS) {
      const mod = MODULES.find((m) => m.id === t.moduleId)!
      expect(t.phase, `task ${t.id} phase mismatch with its module`).toBe(mod.phase)
    }
    // tiers exist and exercises dominate (the quick layer is the new coverage)
    const kinds = new Set(PRACTICE_TASKS.map((t) => t.kind))
    expect(kinds.has('exercise')).toBe(true)
    expect(kinds.has('guided')).toBe(true)
    expect(PRACTICE_TASKS.filter((t) => t.kind === 'exercise').length).toBeGreaterThanOrEqual(
      PRACTICE_TASKS.length / 2,
    )
  })

  it('mounts ModuleDetail with Practice & Build on aip-reliability; toggling a task never touches module state', () => {
    localStorage.clear()
    let api: ReturnType<typeof useProgress> | undefined
    function Probe() {
      api = useProgress()
      return null
    }
    const task = PRACTICE_TASKS.find((t) => t.moduleId === 'aip-reliability')!
    const { unmount } = render(
      createElement(
        MemoryRouter,
        { initialEntries: ['/r/ai-programming/roadmap/aip-reliability'] },
        createElement(
          ActiveRoadmapProvider,
          null,
          createElement(
            ProgressProvider,
            null,
            createElement(Probe),
            createElement(
              Routes,
              null,
              createElement(Route, {
                path: '/r/:slug/roadmap/:moduleId',
                element: createElement(ModuleDetail),
              }),
            ),
          ),
        ),
      ),
    )
    expect(screen.getByRole('heading', { name: 'Retries, backoff & circuit breakers' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Practice & Build' })).toBeTruthy()
    expect(screen.getByText(task.title)).toBeTruthy()
    // the module's existing practice build is surfaced, not duplicated
    expect(screen.getByText(/retry & breaker lab/i)).toBeTruthy()
    expect(screen.getByText('Quick exercise')).toBeTruthy()
    expect(screen.getByText('offline')).toBeTruthy()
    // progressive disclosure: hints and the reference solution exist as closed details
    expect(screen.getAllByText(/Hint 1 of/).length).toBeGreaterThan(0)
    expect(screen.getByText('Reference solution')).toBeTruthy()

    const box = screen.getByRole('checkbox', { name: `Mark task complete: ${task.title}` })
    fireEvent.click(box)
    expect(api!.data.tasks?.[task.id]?.done).toBe(true)
    // completion is task-scoped: stage, objectives, and completion criteria untouched
    expect(stageOf(api!.data, 'aip-reliability')).toBe('not-started')
    expect(moduleRecordOf(api!.data, 'aip-reliability').objectivesDone).toEqual([])
    expect(moduleRecordOf(api!.data, 'aip-reliability').completionDone).toEqual([])
    fireEvent.click(box)
    expect(api!.data.tasks?.[task.id]?.done).toBe(false)
    unmount()
  })
})
