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
 * Card ids are prefixed with the roadmap slug so decks can never collide.
 */
const MODULE_FLASHCARDS: Record<string, { q: string; a: string }[]> = {
  'cb-what-chats-good': [
    {
      q: 'What shape of task makes a good chatbot use case?',
      a: 'Bounded, repeated, language-shaped work — the same questions and structured flows, arrived at through conversation. One-shot linear forms are better as forms.',
    },
  ],
  'cb-conversation-patterns': [
    {
      q: 'Name the five core conversation moves.',
      a: 'Greet, clarify, confirm, progress, repair. Conversations are assembled from these moves — pattern failures are diagnosable by name.',
    },
  ],
  'cb-turn-anatomy': [
    {
      q: 'What ingredients are assembled into the model call each turn?',
      a: 'System persona, memory (slots + summary), retrieved context for this turn, recent history, and the new user message — everything else the model has ever "seen" is gone.',
    },
  ],
  'cb-error-repair': [
    {
      q: 'What are the three failure classes needing repair flows?',
      a: 'Miss (wrong intent), misunderstanding (wrong slot or reference), dead end (task cannot proceed). Each has a designed recovery, and a reset plus escalation path backs them all.',
    },
  ],
  'cb-scope-refusals': [
    {
      q: 'What makes a refusal good rather than just safe?',
      a: 'It declines clearly AND offers the nearest useful alternative path — redirect, do not just decline.',
    },
  ],
  'cb-rag-recap': [
    {
      q: 'How does retrieval fit a conversation differently from a one-shot Q&A?',
      a: 'It runs per turn, as a turn ingredient — and must handle follow-up references ("the second one") by rewriting queries with the prior turn.',
    },
  ],
  'cb-grounding-contract': [
    {
      q: 'State the grounding contract in one sentence.',
      a: 'Answer ONLY from the provided sources, citing them — or say you cannot answer. Measured as zero inventions on the golden set plus a refusal rate on the unanswerable set.',
    },
  ],
  'cb-citations': [
    {
      q: 'What two properties must every citation have?',
      a: 'Parseable (tied to a real chunk id, machine-checkable) and resolvable (renders as a link users can click to verify the claim).',
    },
  ],
  'cb-refusal-design': [
    {
      q: 'Why is over-refusal a design failure too?',
      a: 'A bot that refuses answerable questions fails users just like one that invents — refusal rate must be measured per class (absent / ambiguous / out-of-scope) and tuned both ways.',
    },
  ],
  'cb-state-vs-memory': [
    {
      q: 'Session state vs long-term memory — the dividing line?',
      a: 'State is structured and task-scoped (slots, current intent), dies with the session. Memory is consented facts about the user that persist, are viewable, and deletable.',
    },
  ],
  'cb-session-state': [
    {
      q: 'Why put slots in structured storage instead of trusting chat history?',
      a: 'Structured slots are inspectable, testable, correctable, and cheap to re-inject — history is none of those, and buries facts inside prose.',
    },
  ],
  'cb-long-term-memory': [
    {
      q: 'What must gate every long-term memory write?',
      a: 'Explicit consent — plus a "what do you remember about me" view and working delete. Remembering without asking is creepy, not clever.',
    },
  ],
  'cb-context-budget-chat': [
    {
      q: 'What is the cross-turn context degradation ladder?',
      a: 'Window the recent turns first, then summarize older history, then drop lowest-value content — each rung measured against cost and the constraint-survival test.',
    },
  ],
  'cb-rolling-summarization': [
    {
      q: 'What must a compaction summary preserve, and how is it enforced?',
      a: 'Constraints, slots, decisions, and open questions — enforced by a preservation checklist and a survival test (a turn-3 constraint alive at turn 50).',
    },
  ],
  'cb-multi-user-privacy': [
    {
      q: 'What proves a bot has no cross-user leakage?',
      a: 'A two-user isolation test in CI: different facts per user, then each asks what the bot remembers — any crossover fails the build.',
    },
  ],
  'cb-tools-in-chat': [
    {
      q: 'What changes when a chatbot gains tools?',
      a: 'It can act, not just inform — and inherits distributed-systems failure modes: tool errors, latency, and the need to render results conversationally instead of as JSON dumps.',
    },
  ],
  'cb-slot-filling': [
    {
      q: 'What is the rule against interrogation in slot filling?',
      a: 'At most two asks per turn; fill from context where possible; echo the full state before finalizing so the user can correct anything in one shot.',
    },
  ],
  'cb-confirmation-gates': [
    {
      q: 'How do you decide which tools get a confirmation gate?',
      a: 'Classify by reversibility: reads and listings run free; irreversible, outward-facing actions (send, book, delete) always confirm — with a summary that matches the actual action.',
    },
  ],
  'cb-human-handoff': [
    {
      q: 'What is in a complete handoff package?',
      a: 'Transcript, structured slots, the trigger reason, and a suggested next step — so the user never repeats themselves and the human starts fast.',
    },
  ],
  'cb-channel-web': [
    {
      q: 'What is the headline latency metric for a web chat widget, and a sane budget?',
      a: 'Time-to-first-token with streaming — under about two seconds keeps the conversation feeling alive; total completion time matters far less.',
    },
  ],
  'cb-channel-telegram': [
    {
      q: 'Why is Telegram the recommended second channel?',
      a: 'Free, fast, scriptable, with commands, inline keyboards, and deep links — real channel constraints with the friendliest developer surface.',
    },
  ],
  'cb-channel-agnostic': [
    {
      q: 'What is the channel-agnostic core pattern?',
      a: 'One conversational core behind a channel interface; thin adapters per channel; channel abilities expressed as capability flags, not scattered channel checks in logic.',
    },
  ],
  'cb-conversation-evals': [
    {
      q: 'Why are golden conversations, not single Q&A pairs, the eval unit for chatbots?',
      a: 'Users experience conversations — follow-ups, corrections, refusals, handoffs. Single-answer evals miss every interactive failure mode.',
    },
  ],
  'cb-red-team-chat': [
    {
      q: 'What three attack vectors does a chatbot red-team cover?',
      a: 'User tricks (role-play, fake system messages), poisoned documents (injection via retrieved text), and channel quirks (unexpected payloads) — findings become regression conversations.',
    },
  ],
  'cb-injection-defense-chat': [
    {
      q: 'Why do chatbots have the largest injection surface of LLM products?',
      a: 'Every retrieved page, ticket, and product description is foreign text your prompt consumes — user input is only one of several channels an attacker controls.',
    },
  ],
  'cb-pii-logs': [
    {
      q: 'Where must PII redaction happen in a chat pipeline?',
      a: 'At write time, before storage — redacting at read time leaves the leak sitting in every backup and log sink downstream.',
    },
  ],
  'cb-chat-metrics': [
    {
      q: 'Name the four core conversational metrics.',
      a: 'Containment (resolved without human), resolution, escalation rate, and CSAT — token counts tell you it runs; these tell you it works.',
    },
  ],
  'cb-capstone-chatbot': [
    {
      q: 'What must the capstone chatbot carry to count?',
      a: 'Grounded cited answers, consented memory, at least one gated action, one channel shipped with real usage, a green eval gate, a red-team report, and honest metrics.',
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
        cardId: `chatbot-dev/fc:${moduleId}:${i}`,
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
      cardId: `chatbot-dev/edge:${edgeKey}`,
      moduleId: toMod.id,
      moduleTitle: toMod.title,
      phase: toMod.phase,
      kind: 'flashcard',
      prompt: `Why is "${fromMod.title}" a prerequisite for "${toMod.title}"?`,
      answer: whyText,
    })
  }

  const domainModuleMap: Record<string, string> = {
    design: 'cb-conversation-patterns',
    rag: 'cb-grounding-contract',
    memory: 'cb-state-vs-memory',
    tools: 'cb-confirmation-gates',
    safety: 'cb-injection-defense-chat',
  }
  ASSESSMENT.forEach((q: QuizQ & { domain: string }, idx: number) => {
    const modId = domainModuleMap[q.domain] ?? 'cb-what-chats-good'
    const mod = modMap.get(modId)
    if (!mod) return
    deck.push({
      cardId: `chatbot-dev/assess:${q.domain}:q${idx}`,
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
