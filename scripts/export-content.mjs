// Export curriculum content for the server-side retrieval index.
// Runs over the ROADMAP REGISTRY — every registered bundle ships, and new
// roadmaps are picked up automatically (curriculum-as-cartridge).
// Run from the repository root:
//   node --experimental-strip-types scripts/export-content.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { BUNDLES } from '../src/content/roadmaps/registry.ts'

const modules = []
const lessons = []
const projects = []

for (const [slug, bundle] of Object.entries(BUNDLES)) {
  for (const m of bundle.MODULES) {
    modules.push({
      roadmap: slug,
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
    })
  }
  for (const l of bundle.LESSONS ?? []) {
    lessons.push({
      roadmap: slug,
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
    })
  }
  for (const p of bundle.PROJECTS) {
    projects.push({ roadmap: slug, id: p.id, title: p.title, problem: p.problem, evaluation: p.evaluation })
  }
}

const payload = { exportedAt: new Date().toISOString(), modules, lessons, projects }

mkdirSync('server/data', { recursive: true })
writeFileSync('server/data/content.json', JSON.stringify(payload, null, 2))
console.log(
  `exported ${modules.length} modules, ${lessons.length} lessons, ${projects.length} projects ` +
    `from ${Object.keys(BUNDLES).length} roadmaps -> server/data/content.json`,
)
