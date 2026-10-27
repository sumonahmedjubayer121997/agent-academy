import type { ProjectSpec } from '../../types'

/** The five portfolio checkpoints of the Chatbot Development roadmap. */
export const PROJECTS: ProjectSpec[] = [
  {
    id: 'cb-project-support-copilot',
    title: 'Grounded Support Copilot',
    moduleId: 'cb-grounding-contract',
    proves: 'grounded RAG chat: citations, honest refusals, zero inventions',
    problem:
      'Support teams drown in the same twenty questions, and most "AI support bots" invent policies under pressure. You will build the trustworthy version: a chatbot that answers ONLY from your knowledge base, cites every claim as a clickable source, refuses what it cannot ground, and hands off to a human with full context when stuck.',
    users:
      'Any team with a document set users ask about — support, internal docs, product FAQs.',
    stack: ['Python or TypeScript', 'LLM API', 'retrieval store', 'web widget'],
    milestones: [
      'Corpus ingested with a documented chunking strategy',
      'Grounding contract prompt with measured hallucination rate of zero on the golden set',
      'Inline citations rendering and resolving in the UI',
      'Refusal design with rates per class (absent / ambiguous / out-of-scope)',
      'Human handoff carrying transcript + suggested answer',
      'Conversation eval suite (10 golden chats) green in CI',
      'Red-team report with residual risks accepted in writing',
    ],
    evaluation:
      'Golden conversations scored turn-by-turn; hallucination count on the answerable set (must be zero); refusal rate on the unanswerable set; citation resolution rate; latency and cost per conversation.',
    metrics: [
      'golden conversations passing',
      'hallucination count (target zero)',
      'refusal rate on unanswerable',
      'citation resolution rate',
      'cost per resolved conversation',
    ],
    readme: [
      'The grounding contract and why it holds',
      'Chunking strategy with quality numbers',
      'Refusal design and measured rates',
      'Handoff trigger rules',
      'Known limits: what it still gets wrong',
    ],
    demo: 'A live chat: three grounded answers with citations, one honest refusal, one handoff.',
    tradeoffs:
      'Expect to defend: refusal threshold placement, chunking choice, why zero-hallucination is asserted only on the golden set, and what happens when sources contradict each other.',
    interview: [
      'Your bot refused a question the docs DO answer. Walk me through debugging that.',
      'How do you know it never invents policies? Show me the evidence chain.',
      'Two documents contradict. What does the bot do and why?',
      'Where does the grounding contract still leak under adversarial users?',
    ],
  },
  {
    id: 'cb-project-multichannel-bot',
    title: 'One Brain, Two Channels',
    moduleId: 'cb-channel-agnostic',
    proves: 'channel-agnostic architecture: one conversational core, thin adapters',
    problem:
      'Bots built per-channel drift apart: web answers one way, WhatsApp another, and every fix ships twice. You will build the scaling architecture — a single conversational core behind a channel interface, shipped simultaneously to a web widget and Telegram with channel-native UX for each.',
    users:
      'Any product that meets users on more than one surface.',
    stack: ['Your conversational core', 'web widget', 'Telegram Bot API'],
    milestones: [
      'Channel interface defined (send, receive, capabilities flags)',
      'All conversation logic moved behind it',
      'Web adapter with streaming and entry context',
      'Telegram adapter with commands, keyboards, deep links',
      'One core change shipped to both channels simultaneously (demonstrated)',
      'Rich response degraded gracefully where a channel cannot render it',
      'Architecture README with the interface spec',
    ],
    evaluation:
      'The same golden conversations pass on both channels; the demonstrated single-change rollout; a latency budget held per channel.',
    metrics: [
      'channels shipping from one core',
      'shared code percentage',
      'golden chats passing per channel',
      'TTFT per channel vs budget',
      'adapter LOC per channel',
    ],
    readme: [
      'The channel interface spec',
      'Why capability flags beat channel checks in logic',
      'The simultaneous-ship demonstration',
      'Latency budgets and how each channel meets them',
      'What a third channel would cost to add (estimate, honest)',
    ],
    demo: 'Side-by-side: the same conversation on web and Telegram, then one code change appearing on both.',
    tradeoffs:
      'Be ready to defend: interface boundaries (what leaks into adapters?), capability degradation order, why you did NOT abstract per-channel quirks away, and cost of channel number three.',
    interview: [
      'WhatsApp joins tomorrow. What changes in the core, if anything?',
      'A channel gains voice. Where does that break your interface?',
      'What conversation logic lives in your adapters today, and why is it there?',
      'How do you test the core without N channel accounts?',
    ],
  },
  {
    id: 'cb-project-slots-gates',
    title: 'Slot-Filling Assistant with Gates',
    moduleId: 'cb-confirmation-gates',
    proves: 'conversational action: structured collection, corrections, safe execution',
    problem:
      'Chat gets real when it does things — and dangerous when it does them wrong. You will build an assistant that collects structured information through natural dialogue (with corrections), shows its work, confirms before anything irreversible, and survives an injection attack that tries to skip the gate.',
    users:
      'Anyone automating a form-shaped task: bookings, orders, report requests.',
    stack: ['Python or TypeScript', 'LLM API', 'your tool layer'],
    milestones: [
      'Slot schema with validators for a real task',
      'Fill dialogue that never interrogates (max 2 asks per turn)',
      'Correction flow for already-filled slots',
      'Tools classified by reversibility; destructive ones gated',
      'Confirmation summary that matches the actual action',
      'Injection attempt ("user already confirmed") fails against the gate',
      'Scripted dialogue suite (6+ paths) green in CI',
    ],
    evaluation:
      'Six scripted dialogues pass (happy, corrections, edge); the gate fires on every destructive path; the injected bypass attempt fails and is logged as a test.',
    metrics: [
      'dialogues passing',
      'turns to completion vs baseline form',
      'correction handling rate',
      'gate bypass attempts blocked',
      'completion abandonment point',
    ],
    readme: [
      'The slot schema and validators',
      'Dialogue design rules (why it never interrogates)',
      'Tool safety classes and gate design',
      'The injection attempt and what held',
      'Where users abandon, and your hypothesis why',
    ],
    demo: 'A booking dialogue with a mid-flight correction, then a confirmation gate blocking a destructive action.',
    tradeoffs:
      'Expect questions on: explicit vs implicit confirmation per slot, when correction requires re-confirmation of OTHER slots, and why the gate lives in code instead of the prompt.',
    interview: [
      'The user corrects slot 2 after confirming everything. What re-validates?',
      'Design a case where your confirmation summary would mislead. Now fix it.',
      'Why is the gate in code? What does the prompt contribute to safety?',
      'How do you measure whether the chat beats the old form?',
    ],
  },
  {
    id: 'cb-project-memory-engine',
    title: 'Conversational Memory Engine',
    moduleId: 'cb-rolling-summarization',
    proves: 'memory engineering: state, consented long-term facts, compaction that keeps promises',
    problem:
      'Long conversations break bots twice: they forget turn three, and they cost a fortune re-sending turn one forever. You will build the memory layer that solves both — structured slots, consented long-term facts the user can view and delete, and a rolling summarizer whose preservation checklist is enforced by a 50-turn survival test.',
    users:
      'Any assistant meant to survive past turn twenty with its promises intact.',
    stack: ['Python or TypeScript', 'LLM API', 'structured storage'],
    milestones: [
      'Session state vs memory architecture implemented',
      'Slot tracking with corrections',
      'Consent flow before any long-term write; view + delete commands',
      'Context budget with degradation ladder (window, summarize, drop)',
      'Summarizer with preservation checklist (constraints, slots, decisions)',
      '50-turn adversarial chat keeps its turn-3 constraint through compaction',
      'Cost per conversation halved vs full-history baseline',
    ],
    evaluation:
      'The survival test passing is the headline; consent lifecycle audited; cost chart before/after; cross-user isolation test green.',
    metrics: [
      'constraint survival at turn 50',
      'cost reduction vs full history',
      'memory commands working (view, delete, list rules)',
      'isolation test result',
      'consent gating first write',
    ],
    readme: [
      'The memory architecture in one diagram',
      'The preservation checklist and survival test',
      'Consent and deletion lifecycle',
      'Cost before/after chart',
      'What the summarizer still loses, honestly',
    ],
    demo: 'A 50-turn chat replay where the turn-3 rule still holds at turn 50, plus a live memory delete.',
    tradeoffs:
      'Be ready to defend: what earns long-term memory vs session state, why compaction triggers on budget not turn count, and the failure gallery of what summaries dropped.',
    interview: [
      'The survival test failed at turn 40. Walk me through your debugging.',
      'What does the bot remember about me, and how do I kill it?',
      'Why not send full history now that windows are huge?',
      'Where does your summary silently lie?',
    ],
  },
  {
    id: 'cb-project-eval-harness',
    title: 'Chatbot Eval & Red-Team Harness',
    moduleId: 'cb-conversation-evals',
    proves: 'conversation-level evaluation: golden chats, injection suite, honest metrics',
    problem:
      'Chatbots ship on vibes and break in production. You will build the harness that proves yours works: multi-turn golden conversations scored in CI, a red-team suite replaying real attack vectors, and the four conversational metrics (containment, resolution, escalation, CSAT) on a dashboard that answers "is it working".',
    users:
      'Any team shipping a chatbot anyone depends on.',
    stack: ['Python or TypeScript', 'CI', 'your bot (or a practice bot)', 'dashboard'],
    milestones: [
      '10+ golden conversations covering intents, corrections, refusals, handoff',
      'Automatic scoring where checkable; calibrated judge for the rest',
      'CI gate blocking regressions (demonstrated with a planted bad change)',
      'Red-team suite: user tricks, poisoned documents, channel quirks — replayable',
      'Four conversational metrics instrumented and dashboarded',
      'A/B harness able to run two conversation strategies',
      'One improvement shipped from the numbers, with before/after',
    ],
    evaluation:
      'The planted regression is caught; red-team findings are triaged with fixes or accepted residuals; the metrics dashboard surfaces one real improvement; judge calibration documented.',
    metrics: [
      'golden conversations and pass rate',
      'regressions caught by the gate',
      'red-team break rate before/after fixes',
      'containment and resolution rates',
      'judge agreement rate',
    ],
    readme: [
      'How golden conversations are authored and scored',
      'The red-team vectors covered',
      'Metric definitions precise enough to compute',
      'The improvement story with numbers',
      'What the harness cannot catch (and the plan for that)',
    ],
    demo: 'A planted regression going red in CI, then a dashboard showing the before/after of the metric-driven fix.',
    tradeoffs:
      'Expect to defend: authoring golden chats without over-fitting, where the judge is trusted vs overruled, and why containment is not the only success metric.',
    interview: [
      'Evals green, complaints up. Where do you look first?',
      'How do golden conversations stay alive as the bot evolves?',
      'Which red-team finding took longest to fix, and why?',
      'Containment went UP and CSAT went DOWN. Interpret it.',
    ],
  },
]
