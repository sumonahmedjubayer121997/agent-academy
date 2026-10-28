import type { RoadmapBundle, RoadmapMeta, RoadmapStats } from '../types'
import * as aiAgents from './ai-agents'
import * as promptEngineering from './prompt-engineering'
import * as aiProgramming from './ai-programming'
import * as chatbotDev from './chatbot-dev'

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
  'ai-programming': aiProgramming,
  'chatbot-dev': chatbotDev,
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
  lessons: (promptEngineering.LESSONS ?? []).length,
  hours: promptEngineering.MODULES.reduce((sum, m) => sum + m.hours, 0),
}

const aiProgrammingStats: RoadmapStats = {
  phases: aiProgramming.PHASES.length,
  modules: aiProgramming.MODULES.length,
  lessons: (aiProgramming.LESSONS ?? []).length,
  hours: aiProgramming.MODULES.reduce((sum, m) => sum + m.hours, 0),
}

const chatbotDevStats: RoadmapStats = {
  phases: chatbotDev.PHASES.length,
  modules: chatbotDev.MODULES.length,
  lessons: (chatbotDev.LESSONS ?? []).length,
  hours: chatbotDev.MODULES.reduce((sum, m) => sum + m.hours, 0),
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
    ...aiProgramming.META,
    stats: aiProgrammingStats,
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
    ...chatbotDev.META,
    stats: chatbotDevStats,
  },
]

export function getRoadmap(slug: string): RoadmapRegistryEntry | undefined {
  return ROADMAPS.find((r) => r.slug === slug)
}
