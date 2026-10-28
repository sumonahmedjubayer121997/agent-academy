import { BUNDLES } from '../content/roadmaps/registry'

/**
 * Anki-compatible export — pure functions over the existing curriculum decks.
 * Source of truth: each roadmap's CURRICULUM_DECK (authored flashcards,
 * prerequisite whys, assessment MCQs) plus lesson quiz cards. Nothing is
 * generated or invented here; the decks ARE lesson-derived content.
 */

export interface ExportableCard {
  cardId: string
  front: string
  back: string
  tags: string[]
  moduleTitle: string
}

export type ExportScope =
  | { kind: 'lesson'; slug: string; moduleId: string }
  | { kind: 'roadmap'; slug: string }
  | { kind: 'all' }

/** Collect cards for a scope, de-duplicated by cardId. */
export function collectCards(scope: ExportScope): ExportableCard[] {
  const seen = new Set<string>()
  const out: ExportableCard[] = []
  const push = (c: ExportableCard) => {
    if (seen.has(c.cardId)) return
    seen.add(c.cardId)
    out.push(c)
  }

  const bundleSlugs = scope.kind === 'all' ? Object.keys(BUNDLES) : [scope.slug]
  for (const slug of bundleSlugs) {
    const bundle = BUNDLES[slug]
    if (!bundle) continue
    const roadmapTag = slug

    if (scope.kind === 'lesson') {
      // module deck cards + this lesson's quiz cards only
      for (const c of bundle.cardsForModule(scope.moduleId)) {
        push({
          cardId: c.cardId,
          front: c.prompt,
          back: c.answer + (c.options ? '\nOptions: ' + c.options.join(' / ') : ''),
          tags: [roadmapTag, c.moduleId],
          moduleTitle: c.moduleTitle,
        })
      }
      const lesson = (bundle.LESSONS ?? []).find((l) => l.moduleId === scope.moduleId)
      if (lesson) {
        lesson.quiz.forEach((q, i) => {
          push({
            cardId: `lesson:${lesson.id}:q${i}`,
            front: q.q,
            back: q.explain,
            tags: [roadmapTag, lesson.moduleId],
            moduleTitle: lesson.title,
          })
        })
      }
      continue
    }

    for (const c of bundle.CURRICULUM_DECK) {
      push({
        cardId: c.cardId,
        front: c.prompt,
        back: c.answer + (c.options ? '\nOptions: ' + c.options.join(' / ') : ''),
        tags: [roadmapTag, c.moduleId],
        moduleTitle: c.moduleTitle,
      })
    }
    for (const l of bundle.LESSONS ?? []) {
      l.quiz.forEach((q, i) => {
        push({
          cardId: `lesson:${l.id}:q${i}`,
          front: q.q,
          back: q.explain,
          tags: [roadmapTag, l.moduleId],
          moduleTitle: l.title,
        })
      })
    }
  }
  return out
}

/** Escape a field for TSV: HTML-escape, then newlines/tabs become safe. */
export function escapeField(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '<br>')
    .replace(/\t/g, ' ')
}

/** Build the TSV body: Front <TAB> Back <TAB> Tags (Anki Basic note type). */
export function toTsv(cards: ExportableCard[]): string {
  const header = '#agent-academy export'
  const lines = cards.map(
    (c) => `${escapeField(c.front)}\t${escapeField(c.back)}\t${c.tags.join(' ')}`,
  )
  return [header, ...lines].join('\n')
}

/** Filesystem-safe, informative filename. */
export function exportFilename(scope: ExportScope): string {
  if (scope.kind === 'all') return 'agent-academy_all-roadmaps.tsv'
  if (scope.kind === 'roadmap') return `agent-academy_${scope.slug}.tsv`
  return `agent-academy_${scope.slug}_${scope.moduleId}.tsv`
}

/** Trigger a UTF-8 TSV download in the browser. */
export function downloadTsv(cards: ExportableCard[], scope: ExportScope): string {
  const tsv = toTsv(cards)
  const blob = new Blob(['\uFEFF' + tsv], { type: 'text/tab-separated-values;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = exportFilename(scope)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return tsv
}

export const ANKI_IMPORT_INSTRUCTIONS =
  'In Anki: File → Import → select this .tsv → Note type: Basic → Field mapping: field 1 = Front, field 2 = Back, field 3 = Tags → Import.'
