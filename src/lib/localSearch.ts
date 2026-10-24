import { GLOSSARY } from '../content/glossary'
import { sequenceModeOf } from '../store/progress'
import { LESSONS } from '../content/roadmaps/ai-agents'
import { MODULES } from '../content/roadmaps/ai-agents'
import { PROJECTS } from '../content/roadmaps/ai-agents'
import { RESOURCES } from '../content/resources'
import { TRACKS, trackForModule } from '../content/roadmaps/ai-agents'
import {
  dueCards,
  moduleMinutesLogged,
  moduleRecordOf,
  stageOf,
  todayStr,
  totals,
  type ProgressData,
} from '../store/progress'
import type { AskCitation } from './api'
import { getRecommendations } from './recommend'

export interface SearchChunk {
  id: string
  title: string
  route: string
  text: string
}

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'and',
  'or',
  'how',
  'what',
  'why',
  'when',
  'where',
  'who',
  'which',
  'do',
  'does',
  'did',
  'my',
  'me',
  'i',
  'am',
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
}

function buildStaticChunks(): SearchChunk[] {
  const chunks: SearchChunk[] = []
  for (const l of LESSONS) {
    chunks.push({
      id: `lesson:${l.id}:simple`,
      title: `${l.title} — Explanation & Intuition`,
      route: `/learn/${l.id}`,
      text: [...l.simple, l.intuition.analogy, ...l.intuition.paragraphs].join(' '),
    })
    chunks.push({
      id: `lesson:${l.id}:technical`,
      title: `${l.title} — Technical & Deeper`,
      route: `/learn/${l.id}`,
      text: [...l.technical, ...(l.deeper ?? [])].join(' '),
    })
  }
  for (const m of MODULES) {
    chunks.push({
      id: `module:${m.id}`,
      title: `Phase ${m.phase} · ${m.title}`,
      route: `/roadmap/${m.id}`,
      text: `${m.title}. ${m.why} Objectives: ${m.objectives.join('; ')}. Deliverable: ${m.deliverable}`,
    })
  }
  for (const g of GLOSSARY) {
    chunks.push({
      id: `glossary:${g.term}`,
      title: `Glossary · ${g.term}`,
      route: `/roadmap/${g.moduleId}`,
      text: `${g.term}: ${g.def}`,
    })
  }
  for (const p of PROJECTS) {
    chunks.push({
      id: `project:${p.id}`,
      title: `Project · ${p.title}`,
      route: '/projects',
      text: `${p.title}. ${p.proves} ${p.problem} Stack: ${p.stack.join(', ')}`,
    })
  }
  for (const r of RESOURCES) {
    chunks.push({
      id: `resource:${r.title}`,
      title: `Resource · ${r.title}`,
      route: '/resources',
      text: `${r.title} (${r.provider}): ${r.why} Supports ${r.supports}`,
    })
  }
  return chunks
}

const STATIC_CHUNKS = buildStaticChunks()

/** Client-side BM25 search over the curriculum + personal journal/module notes. */
export function searchCurriculumAndNotes(
  query: string,
  data?: ProgressData,
  k = 4,
): { chunks: SearchChunk[]; answer: string; citations: AskCitation[] } {
  const dynamicChunks: SearchChunk[] = []
  if (data) {
    for (const j of data.journal ?? []) {
      dynamicChunks.push({
        id: j.id,
        title: `Journal (${j.date})`,
        route: '/journal',
        text: `${j.learned} ${j.built} ${j.difficulties} ${j.openQuestions}`,
      })
    }
    for (const m of MODULES) {
      const rec = data.modules?.[m.id]
      if (rec && (rec.notes.trim() || rec.questions.length > 0)) {
        dynamicChunks.push({
          id: `notes:${m.id}`,
          title: `My Notes · ${m.title}`,
          route: `/roadmap/${m.id}`,
          text: `${rec.notes} ${rec.questions.join(' ')}`,
        })
      }
    }
  }

  const all = [...dynamicChunks, ...STATIC_CHUNKS]
  const qTokens = tokenize(query)
  if (qTokens.length === 0) {
    return { chunks: [], answer: 'Enter a specific keyword or question to search.', citations: [] }
  }

  const docTokens = all.map((c) => tokenize(`${c.title} ${c.text}`))
  const avgLen = docTokens.reduce((s, d) => s + d.length, 0) / Math.max(1, docTokens.length)
  const df = new Map<string, number>()
  for (const tokens of docTokens) {
    for (const tok of new Set(tokens)) {
      df.set(tok, (df.get(tok) ?? 0) + 1)
    }
  }

  const N = all.length
  const k1 = 1.5
  const b = 0.75

  const scored = all.map((chunk, i) => {
    const tokens = docTokens[i]
    const tfMap = new Map<string, number>()
    for (const tok of tokens) tfMap.set(tok, (tfMap.get(tok) ?? 0) + 1)
    let score = 0
    for (const qt of qTokens) {
      const tf = tfMap.get(qt) ?? 0
      if (tf === 0) continue
      const nq = df.get(qt) ?? 0
      const idf = Math.log(1 + (N - nq + 0.5) / (nq + 0.5))
      const denom = tf + k1 * (1 - b + b * (tokens.length / avgLen))
      score += idf * ((tf * (k1 + 1)) / denom)
    }
    return { chunk, score }
  })

  const hits = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.chunk)

  if (hits.length === 0) {
    return {
      chunks: [],
      answer: 'No matching section found in the curriculum or your personal notes for that query.',
      citations: [],
    }
  }

  const best = hits[0]
  const snippet = best.text.slice(0, 320) + (best.text.length > 320 ? '…' : '')
  return {
    chunks: hits,
    answer: `Best match (${best.title}): ${snippet}`,
    citations: hits.map((h) => ({ id: h.id, title: h.title, route: h.route })),
  }
}

export interface AssistantResponse {
  query: string
  intent: string
  /** Strictly verified facts computed from ProgressData (never fabricated). */
  savedFacts: string[]
  /** Transparent rule-based or model-generated guidance and exercises. */
  recommendations: string[]
  citations: AskCitation[]
  provider: string
}

const modById = new Map(MODULES.map((m) => [m.id, m]))

/**
 * Grounded Personal AI Learning Assistant (Offline-first engine).
 * Strictly separates `savedFacts` (from ProgressData) from `recommendations`.
 */
export function answerPersonalAssistantQuery(
  query: string,
  data: ProgressData,
): AssistantResponse {
  const qLower = query.toLowerCase()
  const now = Date.now()
  const t = totals(data)

  // Intent 1: "What did I learn last week?" / recent progress
  if (qLower.includes('last week') || qLower.includes('this week') || qLower.includes('recent')) {
    const sevenDaysAgo = now - 7 * 86_400_000
    const recentSessions = data.sessions.filter((s) => Date.parse(s.at) >= sevenDaysAgo)
    const totalMin = recentSessions.reduce((s, x) => s + x.minutes, 0)
    const recentJournal = (data.journal ?? []).filter((j) => Date.parse(j.createdAt) >= sevenDaysAgo)
    const activeMods = MODULES.filter((m) => stageOf(data, m.id) !== 'not-started')

    const savedFacts: string[] = [
      `Logged ${recentSessions.length} study session${recentSessions.length === 1 ? '' : 's'} in the last 7 days (${(totalMin / 60).toFixed(1)} hours total vs your ${data.weeklyHours}h/wk target).`,
      `Recorded ${recentJournal.length} journal reflection${recentJournal.length === 1 ? '' : 's'} in the past 7 days.`,
      activeMods.length > 0
        ? `Modules with recorded progress: ${activeMods.map((m) => `${m.title} (${stageOf(data, m.id)})`).slice(0, 5).join(', ')}.`
        : 'No modules have been marked Learning, Practising, Confident, or Mastered yet.',
    ]
    if (recentJournal.length > 0) {
      savedFacts.push(`Latest journal takeaway (${recentJournal[0].date}): "${recentJournal[0].learned}"`)
    }

    const topRec = getRecommendations(data, { limit: 1 })[0]
    return {
      query,
      intent: 'Weekly learning history summary',
      savedFacts,
      recommendations: [
        topRec
          ? `Next priority: ${topRec.headline} — ${topRec.reasons[0]}`
          : 'Complete your diagnostic assessment or pick your first Phase 1 module.',
        totalMin < data.weeklyHours * 60 * 0.5
          ? 'Your logged time this week is below 50% of your target — schedule a 30-minute Daily Study Plan block today.'
          : 'Your weekly study consistency is on track — focus on converting "Learning" topics into "Practising" via hands-on exercises.',
      ],
      citations: activeMods.slice(0, 3).map((m) => ({
        id: m.id,
        title: m.title,
        route: `/roadmap/${m.id}`,
      })),
      provider: 'local-verified',
    }
  }

  // Intent 2: "Which concepts am I struggling with?" / weak areas / mistakes
  if (
    qLower.includes('struggl') ||
    qLower.includes('weak') ||
    qLower.includes('mistake') ||
    qLower.includes('difficult') ||
    qLower.includes('exercis')
  ) {
    const shakyMods = MODULES.filter(
      (m) => data.confidence[m.id] === 'lost' || data.confidence[m.id] === 'shaky',
    )
    const lowQuizzes = Object.entries(data.quiz)
      .filter(([, q]) => q.score / q.total < 0.75)
      .map(([id, q]) => `${id.replace('lesson:', '')} (${q.score}/${q.total})`)
    const highLapseCards = Object.entries(data.srs)
      .filter(([, c]) => c.lapses > 0)
      .sort((a, b) => b[1].lapses - a[1].lapses)
    const openQuestions = (data.journal ?? []).filter((j) => j.openQuestions.trim().length > 0 && !j.resolved)

    const savedFacts: string[] = [
      shakyMods.length > 0
        ? `Modules explicitly rated Shaky or Lost: ${shakyMods.map((m) => `${m.title} (${data.confidence[m.id]})`).join(', ')}.`
        : 'No modules are currently marked Shaky or Lost in confidence.',
      lowQuizzes.length > 0
        ? `Quizzes scoring below 75%: ${lowQuizzes.join(', ')}.`
        : 'No recorded lesson quizzes below 75%.',
      highLapseCards.length > 0
        ? `${highLapseCards.length} spaced-repetition card${highLapseCards.length === 1 ? '' : 's'} have recorded lapses (forgotten during review).`
        : 'Zero spaced-repetition lapses recorded so far.',
      openQuestions.length > 0
        ? `Unresolved journal questions (${openQuestions.length}): "${openQuestions[0].openQuestions}"`
        : 'No unresolved open questions in your Learning Journal.',
    ]

    const targetMod = shakyMods[0] ?? getRecommendations(data, { limit: 1 })[0]?.module ?? MODULES[0]
    const rec = moduleRecordOf(data, targetMod.id)
    const uncheckedExercise =
      targetMod.completion.find((_, i) => !rec.completionDone.includes(i)) ?? targetMod.completion[0]

    return {
      query,
      intent: 'Weak-spot diagnosis & targeted drill',
      savedFacts,
      recommendations: [
        `Targeted Exercise for ${targetMod.title}: ${uncheckedExercise}`,
        `Deliverable check: ${targetMod.deliverable}`,
        highLapseCards.length > 0
          ? 'Open the Review page and run "Weak-Spot Drill" to clear cards with previous lapses.'
          : 'Rate your confidence (Sure / Shaky / Lost) on every module you study so the system can pinpoint weak spots.',
      ],
      citations: [{ id: targetMod.id, title: targetMod.title, route: `/roadmap/${targetMod.id}` }],
      provider: 'local-verified',
    }
  }

  // Intent 3: "Monthly progress" / role & career gap analysis
  if (
    qLower.includes('month') ||
    qLower.includes('gap') ||
    qLower.includes('role') ||
    qLower.includes('career') ||
    qLower.includes('target')
  ) {
    const thirtyDaysAgo = now - 30 * 86_400_000
    const monthSessions = data.sessions.filter((s) => Date.parse(s.at) >= thirtyDaysAgo)
    const monthHours = monthSessions.reduce((s, x) => s + x.minutes, 0) / 60

    const trackBreakdown = TRACKS.map((tr) => {
      const mods = MODULES.filter((m) => m.essential && trackForModule(m.id) === tr.id)
      const confidentPlus = mods.filter((m) => {
        const st = stageOf(data, m.id)
        return st === 'confident' || st === 'mastered'
      }).length
      const mastered = mods.filter((m) => stageOf(data, m.id) === 'mastered').length
      return `Track ${tr.code} (${tr.shortTitle}): ${confidentPlus}/${mods.length} Confident+, ${mastered}/${mods.length} Mastered`
    })

    const savedFacts: string[] = [
      `Last 30 days: ${monthHours.toFixed(1)} study hours across ${monthSessions.length} logged sessions.`,
      `Overall lifecycle: ${t.modulesMastered} Mastered, ${t.modulesConfident} Confident, ${t.modulesPractising} Practising, ${t.modulesLearning} Learning, ${t.stageCounts['not-started']} Not Started.`,
      ...trackBreakdown,
    ]

    const recs = getRecommendations(data, { limit: 2 })
    return {
      query,
      intent: 'Monthly progress & career role gap analysis',
      savedFacts,
      recommendations: [
        ...recs.map((r, idx) => `Priority #${idx + 1}: ${r.headline} (${r.reasons[0]})`),
        t.modulesConfident > t.modulesMastered
          ? `You have ${t.modulesConfident} modules marked Confident without project mastery — attach a repo/deliverable link on their module page to graduate them to Mastered.`
          : 'Focus on shipping the next checkpoint project in your active wave to turn theoretical study into portfolio proof.',
      ],
      citations: recs.map((r) => ({
        id: r.module.id,
        title: r.module.title,
        route: `/roadmap/${r.module.id}`,
      })),
      provider: 'local-verified',
    }
  }

  // Intent 4: "Recommend the next topic" / "What should I learn next?"
  if (qLower.includes('next') || qLower.includes('recommend') || qLower.includes('should i learn')) {
    const recs = getRecommendations(data, { limit: 3 })
    const due = dueCards(data, todayStr())
    const savedFacts: string[] = [
      `Sequence mode: ${sequenceModeOf(data, 'ai-agents')} · Weekly target: ${data.weeklyHours}h/wk.`,
      `Due spaced-repetition cards today: ${due.length}.`,
      `Active modules in Learning/Practising: ${t.modulesLearning + t.modulesPractising}.`,
    ]
    return {
      query,
      intent: 'Next-step recommendation',
      savedFacts,
      recommendations: recs.map(
        (r, i) =>
          `${i + 1}. ${r.module.title} (${r.estimatedTime.remainingHours}h remaining) — Why: ${r.reasons.join(' ')} | Exercise: ${r.practicalExercise}`,
      ),
      citations: recs.map((r) => ({
        id: r.module.id,
        title: r.module.title,
        route: `/roadmap/${r.module.id}`,
      })),
      provider: 'local-verified',
    }
  }

  // Default: Search curriculum & personal notes via BM25 + include personal status of matched modules
  const searchRes = searchCurriculumAndNotes(query, data, 4)
  const matchedModIds = searchRes.citations
    .map((c) => (c.route.startsWith('/roadmap/') ? c.route.replace('/roadmap/', '') : null))
    .filter((x): x is string => Boolean(x))

  const savedFacts: string[] =
    matchedModIds.length > 0
      ? matchedModIds.map((id) => {
          const m = modById.get(id)
          const st = stageOf(data, id)
          const mins = moduleMinutesLogged(data, id)
          return `Your status on "${m?.title ?? id}": ${st} (${mins} min logged, confidence: ${data.confidence[id] ?? 'unrated'}).`
        })
      : [`Overall progress: ${t.modulesDone}/${t.modulesTotal} modules Confident/Mastered.`]

  return {
    query,
    intent: 'Curriculum & personal knowledge lookup',
    savedFacts,
    recommendations: [searchRes.answer],
    citations: searchRes.citations,
    provider: 'local-bm25',
  }
}
