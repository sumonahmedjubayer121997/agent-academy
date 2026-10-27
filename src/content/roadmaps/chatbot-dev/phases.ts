import type { Phase } from '../../types'

export const PHASES: Phase[] = [
  {
    n: 1,
    id: 'cb-p1',
    title: 'Conversation Design',
    tagline: 'Decide what the bot is before writing a prompt',
    description:
      'What makes a chatbot good (and when not to build one), core conversation patterns, the anatomy of a turn, persona and voice, repair flows, and scoping refusals — the design layer every later phase depends on.',
    outcome: 'A one-page conversation design spec: scope, persona, intents, repair scripts, and out-of-scope behavior for one real use case.',
  },
  {
    n: 2,
    id: 'cb-p2',
    title: 'Grounded RAG Chatbots',
    tagline: 'Answers with sources, or honest silence',
    description:
      'Retrieval as a turn ingredient, the grounding contract, clickable citations, refusal design as a feature, chunking and freshness for conversational corpora, and hybrid retrieval in chat context.',
    outcome: 'A grounded Q&A chat over a real document set with citations, measured refusal rate, and zero invented facts.',
  },
  {
    n: 3,
    id: 'cb-p3',
    title: 'Memory & State',
    tagline: 'Remember the right things, forget on purpose',
    description:
      'State versus memory, session state and slot tracking, long-term user memory with consent, the context window as a cross-turn budget, rolling summarization, constraint persistence, and multi-user privacy boundaries.',
    outcome: 'A conversation engine that keeps constraints alive across 50 turns and can say exactly what it remembers about you.',
  },
  {
    n: 4,
    id: 'cb-p4',
    title: 'Multi-Turn Tool Use',
    tagline: 'A chatbot with hands — and brakes',
    description:
      'Tools in conversation, slot filling turn by turn, confirm-before-act gates for anything destructive, parallel actions with progress, human handoff, proactive messaging, and platform conversation APIs.',
    outcome: 'An assistant that collects structured information, asks before acting, and hands off to a human at the right moment.',
  },
  {
    n: 5,
    id: 'cb-p5',
    title: 'Channels',
    tagline: 'One brain, every surface',
    description:
      'Web widget latency budgets, Telegram bots, WhatsApp templates and the 24-hour window, voice with ASR/TTS, a channel-agnostic core with adapters, rich responses per platform, and re-engagement.',
    outcome: 'The same chatbot core shipped on two channels with channel-appropriate UX for each.',
  },
  {
    n: 6,
    id: 'cb-p6',
    title: 'Evaluation & Guardrails',
    tagline: 'Prove it works before users do',
    description:
      'Multi-turn golden conversations as evals, red-teaming a chatbot through users and channels, injection defenses where every data source is an attack surface, PII in conversation logs, conversational metrics, A/B testing strategies, and the capstone.',
    outcome: 'A shipped, evaluated chatbot on one real channel with an eval suite, a red-team report, and honest metrics.',
  },
]
