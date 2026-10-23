// Export curriculum content for the server-side retrieval index.
// Run from the repository root:
//   node --experimental-strip-types scripts/export-content.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { MODULES } from '../src/content/modules.ts'
import { LESSONS } from '../src/content/lessons.ts'
import { PROJECTS } from '../src/content/projects.ts'

const payload = {
  exportedAt: new Date().toISOString(),
  modules: MODULES.map((m) => ({
    id: m.id,
    phase: m.phase,
    title: m.title,
    why: m.why,
    objectives: m.objectives,
    completion: m.completion,
    deliverable: m.deliverable,
    essential: m.essential,
    hours: m.hours,
    prereqs: m.prereqs,
  })),
  lessons: LESSONS.map((l) => ({
    id: l.id,
    moduleId: l.moduleId,
    title: l.title,
    tagline: l.tagline,
    simple: l.simple,
    intuition: l.intuition,
    technical: l.technical,
    deeper: l.deeper ?? [],
    walkthroughCode: l.walkthrough.code,
    realWorld: l.realWorld,
  })),
  projects: PROJECTS.map((p) => ({ id: p.id, title: p.title, problem: p.problem, evaluation: p.evaluation })),
}

mkdirSync('server/data', { recursive: true })
writeFileSync('server/data/content.json', JSON.stringify(payload, null, 2))
console.log(`exported ${payload.modules.length} modules, ${payload.lessons.length} lessons → server/data/content.json`)
