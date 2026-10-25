import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Import hygiene: nothing outside src/content may value-import a specific
 * roadmap bundle — only the REGISTRY is the sanctioned access point. This is
 * what keeps "the engine is roadmap-blind" enforceable instead of aspirational.
 * `import type` lines are allowed (types vanish at runtime).
 */
const TEMP_ALLOWLIST = [
  'src/lib/localSearch.ts', // P2 follow-up: parameterize its index by bundle
]

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(name)) out.push(full)
  }
  return out
}

describe('roadmap import ban', () => {
  it('no value imports of content/roadmaps/<slug> outside content/ (registry is the only door)', () => {
    const root = join(process.cwd(), 'src')
    const offenders: string[] = []
    for (const file of walk(root)) {
      const rel = file.slice(process.cwd().length + 1)
      if (rel.startsWith('src/content/')) continue
      if (/\.(test|spec)\./.test(rel)) continue
      if (TEMP_ALLOWLIST.includes(rel)) continue
      const lines = readFileSync(file, 'utf8').split('\n')
      for (const line of lines) {
        const m = line.match(/from\s+['"]([^'"]*content\/roadmaps\/[^'"]+)['"]/)
        if (!m) continue
        if (line.trimStart().startsWith('import type')) continue
        if (/content\/roadmaps\/(registry)(['"]|$|\/)/.test(m[1])) continue
        offenders.push(`${rel}: ${line.trim()}`)
      }
    }
    expect(offenders, `direct bundle imports found:\n${offenders.join('\n')}`).toEqual([])
  })
})
