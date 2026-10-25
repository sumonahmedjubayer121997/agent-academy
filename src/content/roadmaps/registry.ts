import type { RoadmapBundle, RoadmapMeta, RoadmapStats } from '../types'
import * as aiAgents from './ai-agents'
import * as promptEngineering from './prompt-engineering'

export type { RoadmapBundle } from '../types'

/**
 * Content bundles by slug. A roadmap becomes fully live (app routes, progress
 * tracking) by flipping its meta status to 'live' AND being present here —
 * 'coming-soon' roadmaps with a bundle show their authored curriculum on the
 * detail page while app integration lands.
 */
export const BUNDLES: Record<string, RoadmapBundle> = {
  'ai-agents': aiAgents,
  'prompt-engineering': promptEngineering,
}

export interface RoadmapRegistryEntry extends RoadmapMeta {
  /** Present only for live roadmaps; computed from authored content, never hand-written. */
  stats?: RoadmapStats
}

const aiAgentsStats: RoadmapStats = {
  phases: aiAgents.PHASES.length,
  modules: aiAgents.MODULES.length,
  lessons: aiAgents.LESSONS.length,
  hours: aiAgents.MODULES.reduce((sum, m) => sum + m.hours, 0),
}

const promptEngineeringStats: RoadmapStats = {
  phases: promptEngineering.PHASES.length,
  modules: promptEngineering.MODULES.length,
  lessons: 0,
  hours: promptEngineering.MODULES.reduce((sum, m) => sum + m.hours, 0),
}

export const ROADMAPS: RoadmapRegistryEntry[] = [
  {
    ...aiAgents.META,
    stats: aiAgentsStats,
  },
  {
    ...promptEngineering.META,
    stats: promptEngineeringStats,
  },
  {
    slug: 'ai-programming',
    title: 'AI Programming',
    tagline: 'Write real software around models',
    description:
      'Programming in the LLM era: calling models from code, structured I/O, code-generation patterns, and the eval + observability habits that separate toys from products.',
    level: 'Intermediate',
    status: 'coming-soon',
    icon: 'Code2',
    plannedPhases: [
      { title: 'Foundations', blurb: 'Python/TypeScript tooling and the mental model of a model-as-a-function.' },
      { title: 'LLM APIs & structured output', blurb: 'Streaming, retries, tokens, cost, and schema-constrained responses.' },
      { title: 'Code-generation patterns', blurb: 'Autocomplete, diff editing, agents that write and run code safely.' },
      { title: 'Evals & observability', blurb: 'Golden sets, regression gates, tracing, and cost monitoring.' },
      { title: 'Shipping AI features safely', blurb: 'Caching, rate limits, fallbacks, and feature flags for model-backed UX.' },
    ],
  },
  {
    slug: 'ai-automation',
    title: 'AI Automation (n8n, Kafka)',
    tagline: 'Event-driven systems that run themselves',
    description:
      'Build automation that survives contact with reality: n8n workflows with LLM steps, webhooks and queues, Kafka event streams, and the reliability practices production automations need.',
    level: 'Intermediate',
    status: 'coming-soon',
    icon: 'Workflow',
    plannedPhases: [
      { title: 'n8n core & self-hosting', blurb: 'Nodes, credentials, environments, and running your own instance.' },
      { title: 'Workflows, triggers & webhooks', blurb: 'Schedules, events, and connecting SaaS tools into pipelines.' },
      { title: 'Integrating LLM steps', blurb: 'Classification, extraction, and drafting inside automations — with guards.' },
      { title: 'Kafka & event streams', blurb: 'Topics, consumers, and streaming patterns for high-volume pipelines.' },
      { title: 'Reliability, retries & monitoring', blurb: 'Idempotency, dead-letter queues, alerting, and cost control.' },
    ],
  },
  {
    slug: 'chatbot-dev',
    title: 'Chatbot Development',
    tagline: 'Conversational products people actually use',
    description:
      'Design and build chatbots that hold up: conversation design, RAG answers with sources, memory and state, tool use across turns, and evaluation before launch.',
    level: 'Beginner-friendly',
    status: 'coming-soon',
    icon: 'MessagesSquare',
    plannedPhases: [
      { title: 'Conversation design', blurb: 'Intents, repair, tone, and knowing when not to use a bot.' },
      { title: 'RAG chatbots', blurb: 'Retrieval, grounding, citations, and honest "no answer found" replies.' },
      { title: 'Memory & state', blurb: 'Sessions, long-term memory, and context windows that fill up.' },
      { title: 'Multi-turn tool use', blurb: 'Handing the bot real actions — with approval gates where it matters.' },
      { title: 'Channels', blurb: 'Web widget, Telegram, WhatsApp: same brain, different constraints.' },
      { title: 'Evaluation & guardrails', blurb: 'Conversation-level testing, red-teaming, and monitoring quality in production.' },
    ],
  },
]

export function getRoadmap(slug: string): RoadmapRegistryEntry | undefined {
  return ROADMAPS.find((r) => r.slug === slug)
}
