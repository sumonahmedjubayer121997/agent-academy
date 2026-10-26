import { ASSESSMENT } from './assessment'
import { EDGE_WHY } from './edges'
import { MODULES } from './modules'
import type { QuizQ } from '../../types'

export interface DeckCard {
  cardId: string
  moduleId: string
  moduleTitle: string
  phase: number
  kind: 'mcq' | 'flashcard'
  prompt: string
  answer: string
  options?: string[]
  correctOption?: number
  lessonId?: string
}

/**
 * One flashcard per essential module — the minimum viable review deck.
 * Card ids are prefixed with the roadmap slug so decks can never collide
 * (legacy AI Agents ids stay unprefixed and are read as that roadmap).
 */
const MODULE_FLASHCARDS: Record<string, { q: string; a: string }[]> = {
  'aip-toolchain': [
    {
      q: 'What does a one-command toolchain (install, lint, typecheck, test) buy an AI project specifically?',
      a: 'AI features change weekly — prompts, models, providers. Cheap, reproducible change is the precondition: a clean clone that boots and checks itself in one command is what makes aggressive iteration safe.',
    },
  ],
  'aip-env-config': [
    {
      q: 'Where do provider API keys belong, and how is isolation proven?',
      a: 'Env vars or a secrets manager, loaded into typed settings validated at startup. Isolation is proven by a test showing dev and prod configs differ and a pre-commit scan catching planted secrets.',
    },
  ],
  'aip-http-clients': [
    {
      q: 'Which two timeouts must be configured separately on an HTTP client, and why?',
      a: 'Connect timeout (how long to establish the connection) and read timeout (how long to wait for response bytes). They fail differently and need different values — a hanging connect and a slow generation are different problems.',
    },
  ],
  'aip-async-patterns': [
    {
      q: 'Why must concurrency be capped when calling model APIs in parallel?',
      a: 'Uncapped parallelism triggers provider rate limits, wastes retries, and can behave like a self-inflicted denial of service. A bounded runner keeps throughput high while staying under the limit.',
    },
  ],
  'aip-data-models': [
    {
      q: 'What does boundary validation (pydantic/zod) catch that type checking alone misses?',
      a: 'Type checking sees your code; validation sees the data crossing boundaries at runtime — malformed payloads, drifted schemas, hostile inputs. It turns shape drift into a startup error instead of a production incident.',
    },
  ],
  'aip-testing-fundamentals': [
    {
      q: 'How do you unit-test an AI feature deterministically?',
      a: 'Hide the model behind a provider interface and test everything else against a scriptable fake. The nondeterministic 20% gets evals; the deterministic 80% gets ordinary fast tests.',
    },
  ],
  'aip-first-call': [
    {
      q: 'What must be handled in a chat response besides the content string?',
      a: 'The full response object: finish reason (why it stopped), usage tokens (the cost ledger raw material), role/structure, and the abort/cancel path. Ignoring these is how bills and bugs appear.',
    },
  ],
  'aip-tokens-cost': [
    {
      q: 'What makes a cost ledger useful while an invoice is not?',
      a: 'Attribution: per-call entries (model × tokens × price) tagged with feature and user id. The invoice tells you what you paid; the ledger tells you what cost it, who caused it, and where budgets break.',
    },
  ],
  'aip-structured-io': [
    {
      q: 'What closes the gap between "valid JSON" and "usable object"?',
      a: 'Schema validation at the client boundary plus a bounded validate-repair loop that feeds errors back verbatim. JSON mode guarantees syntax; your validator enforces the contract.',
    },
  ],
  'aip-reliability': [
    {
      q: 'Which errors are retried, which are not, and why?',
      a: 'Retry transient failures (429, 5xx, timeouts) with exponential backoff + jitter. Never retry client errors (400, 401, 403) — they fail identically every time; fix the cause instead.',
    },
  ],
  'aip-caching': [
    {
      q: 'Name the two caching layers and what each saves.',
      a: 'Exact-match response caching (TTL-keyed) saves full cost+latency on repeated questions; provider prompt-prefix caching discounts the stable instruction prefix on every call. Both need a written policy (especially for PII).',
    },
  ],
  'aip-streaming-ux': [
    {
      q: 'Why measure TTFT separately from total latency?',
      a: 'Perceived latency is dominated by time-to-first-token: a stream that starts in 300ms feels instant even when completion takes seconds. The two metrics have different fixes (prefetch vs throughput).',
    },
  ],
  'aip-codegen-fundamentals': [
    {
      q: 'Why is compilation such a powerful part of a generation loop?',
      a: 'It is a free, unambiguous oracle: generated code either parses and compiles or it does not, and the error text is precise feedback the loop can act on — no judgment, no vibes.',
    },
  ],
  'aip-spec-as-tests': [
    {
      q: 'What is a spec gap in tests-first generation, and how do you catch one?',
      a: 'Tests that pass on a wrong-but-conforming implementation. You catch them by adversarially reviewing whether the tests fully pin behavior, and by keeping a failure gallery of caught gaps.',
    },
  ],
  'aip-sandboxing': [
    {
      q: 'What four limits does a generated-code sandbox enforce, and who enforces them?',
      a: 'Wall-clock time, memory, filesystem writes, and network access — enforced by the HOST (container/seatbelt), never by asking the model nicely in the prompt.',
    },
  ],
  'aip-logging-tracing': [
    {
      q: 'What makes a log a trace rather than a pile of lines?',
      a: 'A request id threaded across every hop, letting one user action be reconstructed end to end — plus a redaction policy so the trace is safe to keep.',
    },
  ],
  'aip-metrics-dashboards': [
    {
      q: 'Name the five core metrics for an AI feature.',
      a: 'Latency (p50/p95), cost per call/day, error mix by class, cache hit rate, and time-to-first-token. Five numbers answer "is it healthy" faster than fifty panels.',
    },
  ],
  'aip-eval-suites': [
    {
      q: 'What behavioral regressions does a CI eval gate catch that tests cannot?',
      a: 'Changes that keep code correct but shift output quality: prompt edits, model upgrades, provider changes. The golden set measures behavior, not syntax.',
    },
  ],
  'aip-error-taxonomy': [
    {
      q: 'Name the five failure categories and why the split matters.',
      a: 'Schema, prompt, data, provider, and product errors. Each has a different owner and fix layer — without the taxonomy, every failure becomes "the AI is broken" and ping-pongs between teams.',
    },
  ],
  'aip-feature-flags': [
    {
      q: 'Why are flags more critical for AI features than ordinary features?',
      a: 'AI behavior can regress with no code change (model/prompt drift), so you need deploy decoupled from release: gradual ramp with stop conditions and a kill switch that works in seconds.',
    },
  ],
  'aip-fallbacks': [
    {
      q: 'Sketch a standard degradation ladder.',
      a: 'Primary model → smaller/faster model → cached answer → queued for later → honest apology with human path. Each rung has defined user messaging and is drilled before it is needed.',
    },
  ],
  'aip-security-prompt': [
    {
      q: 'Where do injection defenses belong, and what belongs in the prompt?',
      a: 'Enforcement belongs in code: output validation, allow-lists, privilege separation, sandboxing. The prompt carries instructions and data separation — as one thin layer, never the only one.',
    },
  ],
  'aip-capstone-ai-prog': [
    {
      q: 'What must the capstone feature demonstrate to count?',
      a: 'The whole roadmap in one artifact: gateway reuse, streaming UX, eval gate in CI, dashboard + alerts, flag and fallback ladder, budget compliance, and an honest trade-off log — live and used.',
    },
  ],
}

function buildCurriculumDeck(): DeckCard[] {
  const deck: DeckCard[] = []
  const modMap = new Map(MODULES.map((m) => [m.id, m]))

  for (const [moduleId, cards] of Object.entries(MODULE_FLASHCARDS)) {
    const mod = modMap.get(moduleId)
    if (!mod) continue
    cards.forEach((c, i) => {
      deck.push({
        cardId: `ai-programming/fc:${moduleId}:${i}`,
        moduleId: mod.id,
        moduleTitle: mod.title,
        phase: mod.phase,
        kind: 'flashcard',
        prompt: c.q,
        answer: c.a,
      })
    })
  }

  for (const [edgeKey, whyText] of Object.entries(EDGE_WHY)) {
    const [fromId, toId] = edgeKey.split('->')
    const fromMod = modMap.get(fromId)
    const toMod = modMap.get(toId)
    if (!fromMod || !toMod) continue
    deck.push({
      cardId: `ai-programming/edge:${edgeKey}`,
      moduleId: toMod.id,
      moduleTitle: toMod.title,
      phase: toMod.phase,
      kind: 'flashcard',
      prompt: `Why is "${fromMod.title}" a prerequisite for "${toMod.title}"?`,
      answer: whyText,
    })
  }

  const domainModuleMap: Record<string, string> = {
    toolchain: 'aip-toolchain',
    'model-apis': 'aip-first-call',
    codegen: 'aip-codegen-fundamentals',
    'evals-ops': 'aip-eval-suites',
  }
  ASSESSMENT.forEach((q: QuizQ & { domain: string }, idx: number) => {
    const modId = domainModuleMap[q.domain] ?? 'aip-toolchain'
    const mod = modMap.get(modId)
    if (!mod) return
    deck.push({
      cardId: `ai-programming/assess:${q.domain}:q${idx}`,
      moduleId: mod.id,
      moduleTitle: mod.title,
      phase: mod.phase,
      kind: 'mcq',
      prompt: q.q,
      answer: q.explain,
      options: q.options,
      correctOption: q.answer,
    })
  })

  return deck
}

export const CURRICULUM_DECK: DeckCard[] = buildCurriculumDeck()

export function cardsForModule(moduleId: string): DeckCard[] {
  return CURRICULUM_DECK.filter((c) => c.moduleId === moduleId)
}
