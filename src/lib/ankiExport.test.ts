import { describe, expect, it } from 'vitest'
import { collectCards, escapeField, exportFilename, toTsv, type ExportScope } from './ankiExport'

describe('ankiExport', () => {
  it('lesson scope exports only that module + lesson quiz cards', () => {
    const scope: ExportScope = { kind: 'lesson', slug: 'ai-agents', moduleId: 'p6-agent-loop' }
    const cards = collectCards(scope)
    expect(cards.length).toBeGreaterThan(0)
    for (const c of cards) {
      expect(c.tags).toContain('p6-agent-loop')
    }
    const lessonQuiz = cards.filter((c) => c.cardId.startsWith('lesson:agent-loop:'))
    expect(lessonQuiz.length).toBeGreaterThanOrEqual(3)
  })

  it('roadmap scope covers the whole deck and stays inside the roadmap', () => {
    const cards = collectCards({ kind: 'roadmap', slug: 'prompt-engineering' })
    expect(cards.length).toBeGreaterThan(50)
    for (const c of cards) expect(c.tags).toContain('prompt-engineering')
    for (const c of cards) expect(c.cardId.startsWith('prompt-engineering/') || c.cardId.startsWith('lesson:')).toBe(true)
  })

  it('all scope spans every roadmap and de-duplicates by cardId', () => {
    const cards = collectCards({ kind: 'all' })
    const ids = cards.map((c) => c.cardId)
    expect(new Set(ids).size).toBe(ids.length)
    const tags = new Set(cards.flatMap((c) => c.tags))
    for (const slug of ['ai-agents', 'prompt-engineering', 'ai-programming', 'chatbot-dev']) {
      expect(tags.has(slug), slug).toBe(true)
    }
  })

  it('escapes tabs, newlines, and HTML so the TSV cannot corrupt', () => {
    const out = escapeField('a<b>\tline1\nline2 & "quotes" ünicode')
    expect(out).not.toContain('\t')
    expect(out).not.toContain('\n')
    expect(out).toContain('&lt;b&gt;')
    expect(out).toContain('<br>')
    expect(out).toContain('&amp;')
    expect(out).toContain('ünicode')
  })

  it('tsv has header, one record per card, three fields, tags safe', () => {
    const cards = [
      { cardId: 'x:1', front: 'Q1', back: 'A1', tags: ['ai-agents', 'p1-python-core'], moduleTitle: 'm' },
      { cardId: 'x:2', front: 'Q2', back: 'A2', tags: ['ai-agents'], moduleTitle: 'm' },
    ]
    const tsv = toTsv(cards)
    const lines = tsv.split('\n')
    expect(lines[0]).toBe('#agent-academy export')
    expect(lines).toHaveLength(3)
    for (const line of lines.slice(1)) {
      expect(line.split('\t')).toHaveLength(3)
    }
    expect(lines[1]).toBe('Q1\tA1\tai-agents p1-python-core')
  })

  it('filenames are informative and filesystem-safe', () => {
    expect(exportFilename({ kind: 'all' })).toBe('agent-academy_all-roadmaps.tsv')
    expect(exportFilename({ kind: 'roadmap', slug: 'prompt-engineering' })).toBe(
      'agent-academy_prompt-engineering.tsv',
    )
    expect(exportFilename({ kind: 'lesson', slug: 'ai-agents', moduleId: 'p6-agent-loop' })).toBe(
      'agent-academy_ai-agents_p6-agent-loop.tsv',
    )
  })

  it('a roadmap with no authored cards yields an empty export (graceful)', () => {
    const cards = collectCards({ kind: 'roadmap', slug: 'ai-agents' })
    expect(cards.length).toBeGreaterThan(0) // aa has a deck; and an unknown slug:
    expect(collectCards({ kind: 'roadmap', slug: 'does-not-exist' })).toEqual([])
  })
})
