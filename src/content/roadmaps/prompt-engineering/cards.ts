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

/** One flashcard per essential module — the minimum viable review deck.
 * Card ids are prefixed with the roadmap slug so decks can never collide
 * (legacy AI Agents ids stay unprefixed and are read as that roadmap). */
const MODULE_FLASHCARDS: Record<string, { q: string; a: string }[]> = {
  'pe-mental-model': [
    {
      q: 'Why does rewording a prompt change the output at temperature 0?',
      a: 'The model predicts the next token from the exact token sequence it was given; different wording is a different sequence, so probabilities shift even with sampling fixed.',
    },
  ],
  'pe-anatomy': [
    {
      q: 'Name the four anatomical parts of a well-formed prompt.',
      a: 'Instruction (the task), context (background rules and data), input (the thing to operate on), and output format (the exact shape of the answer).',
    },
  ],
  'pe-roles': [
    {
      q: 'What is the instruction precedence order in chat-model APIs, and why does it matter?',
      a: 'System > developer > user. When instructions conflict, higher-priority roles win — so persistent rules belong in the system role, not re-sent per user message.',
    },
  ],
  'pe-clarity': [
    {
      q: 'Give three constraints that turn "make it better" into a testable prompt.',
      a: 'Any measurable bounds: audience (for a technical reader), length (2 sentences), and format/style (present tense, no exclamation marks, bullet list).',
    },
  ],
  'pe-delimiters': [
    {
      q: 'What do delimiters defend against, mechanically?',
      a: 'They mark where untrusted data begins and ends so the model treats pasted content as data rather than instructions — reducing confusion and the success rate of injection.',
    },
  ],
  'pe-zero-shot': [
    {
      q: 'List four zero-shot task shapes that cover most production prompts.',
      a: 'Classify, extract, rewrite/transform, and summarise (generate and translate complete the family). Recognising the shape gives you a proven starting pattern.',
    },
  ],
  'pe-why-structured': [
    {
      q: 'What does "prompts are APIs" mean in practice?',
      a: 'The output has a consumer (a program), so it needs a contract (schema), versioning, and defined failure behavior — prose output violates all three.',
    },
  ],
  'pe-json-mode': [
    {
      q: 'What does JSON mode guarantee, and what does it NOT guarantee?',
      a: 'It guarantees parseable JSON (syntax). It does not guarantee the shape — fields can be missing, misnamed, or wrong-typed for your schema. Validation is still required.',
    },
  ],
  'pe-schemas': [
    {
      q: 'Why do enums and flat, self-describing field names reduce model errors?',
      a: 'Enums collapse the output space to valid values; well-named fields act as inline instructions, so the model needs no extra explanation to comply.',
    },
  ],
  'pe-function-calling': [
    {
      q: 'In a tool definition, what actually steers the model — the name, the description, or the parameter schema?',
      a: 'All three, and they must agree: the name states the intent, the description states when to use it, and parameter names/descriptions constrain the arguments. A contradiction between them produces wrong calls.',
    },
  ],
  'pe-validation-repair': [
    {
      q: 'Why include validation errors verbatim in a repair prompt?',
      a: 'Specific feedback ("qty must be integer, received string") turns the retry into a targeted fix instead of a hopeful re-roll, which is why repair loops lift success rates dramatically.',
    },
  ],
  'pe-extraction': [
    {
      q: 'Why hand-label a gold set for an extraction task you already trust?',
      a: 'Without labeled examples you have no precision/recall, only vibes. The gold set is what turns "it seems fine" into a number you can defend and improve.',
    },
  ],
  'pe-context-budget': [
    {
      q: 'What is the priority order when the context budget gets tight?',
      a: 'Instructions first, then decision-relevant data, then examples, then history — and everything else gets summarised, compressed, or dropped with the quality loss measured.',
    },
  ],
  'pe-few-shot': [
    {
      q: 'What makes a few-shot example set good?',
      a: 'Coverage of the decision boundary: the hard cases, the near-misses, and the edge cases — not volume. Redundant or off-distribution examples actively hurt.',
    },
  ],
  'pe-reasoning': [
    {
      q: 'When does chain-of-thought make output worse?',
      a: 'On easy or highly-formatted tasks where reasoning tokens add latency, cost, and drift; and when the required output is a strict schema that intermediate prose can contaminate.',
    },
  ],
  'pe-long-context': [
    {
      q: 'What is "lost in the middle" and the standard countermeasures?',
      a: 'Models attend less reliably to content buried mid-context. Countermeasures: move key facts to the edges, restructure into outlines, or retrieve instead of stuffing.',
    },
  ],
  'pe-rag-prompts': [
    {
      q: 'What three behaviors must a grounded QA prompt enforce?',
      a: 'Answer only from provided sources, cite claims in a parseable format, and refuse with a fixed sentence when the answer is not in the sources — so all three are checkable in evals.',
    },
  ],
  'pe-why-evals': [
    {
      q: 'What makes a golden set golden?',
      a: 'Real inputs with expected outputs you verified by hand, frozen as data — including edge cases and known failures. Model-generated or cherry-picked sets measure nothing.',
    },
  ],
  'pe-metrics': [
    {
      q: 'What must you do before trusting an LLM-as-judge score?',
      a: 'Calibrate it: measure its agreement rate against your own labels on a sample. An uncalibrated judge is a random number generator with confidence.',
    },
  ],
  'pe-regression': [
    {
      q: 'Why do prompts need version control when the model provider already versions models?',
      a: 'Because most regressions come from prompt edits, not model swaps. Versioning plus a frozen eval suite is what lets you bisect which change broke which case.',
    },
  ],
  'pe-error-analysis': [
    {
      q: 'What are the four fix layers in prompt error analysis?',
      a: 'The prompt (wording/examples), the schema (field design), the model (capability), and the data (input quality). Each error class belongs to exactly one layer first.',
    },
  ],
  'pe-cost-latency': [
    {
      q: 'Name three levers to cut prompt-pipeline cost without redesigning it.',
      a: 'Prompt caching for repeated prefixes, routing easy items to smaller/cheaper models, and cutting context (budget discipline) — each verified against the eval suite so quality holds.',
    },
  ],
  'pe-injection': [
    {
      q: 'Distinguish direct from indirect prompt injection.',
      a: 'Direct: the attacker types instructions to your model ("ignore previous instructions"). Indirect: instructions arrive inside data your prompt consumes — a retrieved page, email, or document.',
    },
  ],
  'pe-leakage': [
    {
      q: 'Why is "just do not reveal your instructions" insufficient?',
      a: 'Because it is one prompt-level promise against an unbounded attack space — rewording, role-play, translation, and encoding bypass it. Real secrets belong outside the prompt entirely.',
    },
  ],
  'pe-defense-layers': [
    {
      q: 'Name the core idea of defense in depth for prompts.',
      a: 'Assume each layer fails: separate privileges, allow-list actions, validate outputs, gate side effects behind approval — so one bypass does not become a breach.',
    },
  ],
  'pe-red-team': [
    {
      q: 'What turns a red-team session from hacking into engineering?',
      a: 'Structure and artifacts: fixed time-boxes, an attack checklist, severity-triaged findings, and the top findings converted into regression eval cases.',
    },
  ],
  'pe-playbook-search': [
    {
      q: 'What stack of earlier patterns makes up a production QA playbook?',
      a: 'Grounding contract + citations + refusal path (Phase 3), a golden set + judge (Phase 4), and injection defenses over retrieved documents (Phase 5).',
    },
  ],
  'pe-playbook-code': [
    {
      q: 'Why do test-first prompts outperform describe-the-code prompts?',
      a: 'Tests are an unambiguous, checkable spec — the model optimises against something verifiable, and your eval is free: the tests pass or they do not.',
    },
  ],
  'pe-playbook-agents': [
    {
      q: 'What must an agent system prompt define beyond the task?',
      a: 'A plan format (think before acting), tool-use rules and stop conditions, and an approval gate for destructive actions — imported from the Phase-5 defense stack.',
    },
  ],
  'pe-capstone': [
    {
      q: 'What makes a prompt library trustworthy to other engineers?',
      a: 'Every pattern ships with its eval results, a changelog, known failure modes, and a "when not to use this" section — evidence, not enthusiasm.',
    },
  ],
}

function buildCurriculumDeck(): DeckCard[] {
  const deck: DeckCard[] = []
  const modMap = new Map(MODULES.map((m) => [m.id, m]))

  // 1. Per-module flashcards
  for (const [moduleId, cards] of Object.entries(MODULE_FLASHCARDS)) {
    const mod = modMap.get(moduleId)
    if (!mod) continue
    cards.forEach((c, i) => {
      deck.push({
        cardId: `prompt-engineering/fc:${moduleId}:${i}`,
        moduleId: mod.id,
        moduleTitle: mod.title,
        phase: mod.phase,
        kind: 'flashcard',
        prompt: c.q,
        answer: c.a,
      })
    })
  }

  // 2. Prerequisite-edge "why" cards
  for (const [edgeKey, whyText] of Object.entries(EDGE_WHY)) {
    const [fromId, toId] = edgeKey.split('->')
    const fromMod = modMap.get(fromId)
    const toMod = modMap.get(toId)
    if (!fromMod || !toMod) continue
    deck.push({
      cardId: `prompt-engineering/edge:${edgeKey}`,
      moduleId: toMod.id,
      moduleTitle: toMod.title,
      phase: toMod.phase,
      kind: 'flashcard',
      prompt: `Why is "${fromMod.title}" a prerequisite for "${toMod.title}"?`,
      answer: whyText,
    })
  }

  // 3. Diagnostic assessment MCQs mapped to foundational modules
  const domainModuleMap: Record<string, string> = {
    fundamentals: 'pe-mental-model',
    structured: 'pe-json-mode',
    context: 'pe-context-budget',
    evals: 'pe-why-evals',
    security: 'pe-injection',
  }
  ASSESSMENT.forEach((q: QuizQ & { domain: string }, idx: number) => {
    const modId = domainModuleMap[q.domain] ?? 'pe-mental-model'
    const mod = modMap.get(modId)!
    deck.push({
      cardId: `prompt-engineering/assess:${q.domain}:q${idx}`,
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
