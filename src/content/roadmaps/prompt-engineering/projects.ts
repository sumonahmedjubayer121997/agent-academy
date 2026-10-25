import type { ProjectSpec } from '../../types'

/** The three portfolio checkpoints of the Prompt Engineering roadmap. */
export const PROJECTS: ProjectSpec[] = [
  {
    id: 'pe-project-library',
    title: 'Eval-Backed Prompt Library',
    moduleId: 'pe-capstone',
    proves: 'prompt engineering as a discipline: versioning, evals, documentation',
    problem:
      'Teams hoard prompts in chat histories and notes files where they rot. You will build the alternative: a public, versioned library of prompt patterns where every entry ships with an automated eval suite, a changelog, and an honest "when not to use this" section.',
    users:
      'Developers and technical writers who need a working pattern in ten minutes and need to trust it.',
    stack: ['Git', 'Python or TypeScript', 'any LLM API', 'GitHub Actions or similar CI'],
    milestones: [
      'Repo scaffold: one folder per pattern (prompt, eval script, README, changelog)',
      'Pattern 1 ported from your Phase-2 extractor with its scorecard',
      'Eval runner: one command scores every pattern and prints a table',
      'Patterns 2-8 ported from your playbook work with evals attached',
      'CI gate: pull requests fail if any pattern score drops below threshold',
      'Red-team and cost reports included as first-class docs',
      'README written; one external user completes a pattern without help',
    ],
    evaluation:
      'Score each pattern on a golden set in CI (exact match or calibrated judge). Track pass rate per pattern over time; a release is shippable only when all patterns are green on their frozen golden sets.',
    metrics: [
      'patterns documented',
      'golden-set size per pattern',
      'eval pass rate per pattern',
      'judge agreement rate',
      'CI gate threshold',
    ],
    readme: [
      'What the library is and the contract every pattern follows',
      'How to use a pattern in your own code in under ten minutes',
      'How to run the eval suite locally',
      'Contributing: what a new pattern must include',
      'Known limitations, clearly separated per pattern',
    ],
    demo: 'A short screencast: clone, run evals, use one pattern in a live coding session.',
    tradeoffs:
      'Be ready to defend: judge-based vs exact-match scoring per pattern, why some patterns refuse JSON mode, where you accepted lower scores for cost, and why the library limits itself to patterns you have actually run in production-shaped tasks.',
    interview: [
      'Walk me through a pattern where your first prompt scored badly. What did you change and why?',
      'How do you prevent your eval suite from overfitting to the golden set?',
      'When is an LLM judge the wrong metric, and how did you calibrate yours?',
      'A teammate says prompts do not need version control. Convince them otherwise using this repo.',
    ],
  },
  {
    id: 'pe-project-extraction',
    title: 'Production Extraction Service',
    moduleId: 'pe-extraction',
    proves: 'structured-output engineering: schemas, validation, repair, measurement',
    problem:
      'Free-text data is locked in emails, PDFs, and posts. You will build the service that unlocks it: a schema-validated extraction API with a repair loop, honest error rates, and a cost model — the single most-shipped LLM feature, done properly.',
    users:
      'Backend services and analysts who need reliable structured records from unstructured sources.',
    stack: ['Python (FastAPI) or TypeScript', 'pydantic or zod', 'LLM API', 'pytest or vitest'],
    milestones: [
      'Schema designed with enums and optional fields justified in comments',
      '50-input gauntlet collected with failure log started',
      'JSON mode + validation wired with a measured first-pass rate',
      'Repair loop implemented; retry policy and terminal-failure path defined',
      '20-item gold set hand-labeled; per-field precision/recall scored',
      'Top error class fixed via schema wording; scores re-run',
      'Cost per 1k documents computed; cheap-vs-accurate routing documented',
    ],
    evaluation:
      'Per-field precision and recall against a hand-labeled gold set, before and after repair. Cost and p95 latency per document. Terminal-failure behavior verified with adversarial inputs.',
    metrics: [
      'first-pass valid rate',
      'post-repair valid rate',
      'per-field precision',
      'per-field recall',
      'cost per 1k documents',
      'p95 latency',
    ],
    readme: [
      'The schema and the reasoning behind every field name',
      'Measured success rates with the gold-set methodology explained',
      'The repair loop design and its retry bounds',
      'Cost model and the routing decision it supports',
      'Failure gallery: the inputs it still gets wrong',
    ],
    demo: 'Live API call on three real documents — one clean, one messy, one adversarial — showing the repair log.',
    tradeoffs:
      'Expect questions on: bigger model vs repair loop economics, why the schema uses enums aggressively, what terminal failures do downstream, and where you would draw the line on hallucinated field values.',
    interview: [
      'Your post-repair rate is 99%. Walk me through the 1% — what are they and where do they go?',
      'Why pydantic/zod instead of trusting the model JSON mode alone?',
      'How would you cut the cost of this pipeline by half, and what would it cost you?',
      'A new model version ships tomorrow. How do you know if you should switch?',
    ],
  },
  {
    id: 'pe-project-secure-assistant',
    title: 'Injection-Resistant RAG Assistant',
    moduleId: 'pe-defense-layers',
    proves: 'prompt security: attack surface thinking, layered defense, honest residuals',
    problem:
      'Assistants that read retrieved content are assistants that execute strangers instructions. You will build a grounded Q&A assistant over a document set, then attack it yourself and engineer the layered defenses that keep it useful — with a red-team report proving what works.',
    users:
      'Anyone shipping a RAG product that touches untrusted documents or user input.',
    stack: ['Python or TypeScript', 'LLM API', 'a retrieval source (even naive)', 'your injection lab'],
    milestones: [
      'Grounded QA prompt with citations and refusal path working (Phase-3 artifact)',
      'Injection lab attacks ported: direct, indirect via poisoned document, exfiltration',
      'Layer 1: delimiters + data/instruction contract in the prompt',
      'Layer 2: output validation — citations must resolve, no secrets in output',
      'Layer 3: allow-listed actions + approval gate on anything side-effecting',
      'Attack suite re-run per layer; break-rate matrix produced',
      'Red-team report: findings, fixes, accepted residual risks',
    ],
    evaluation:
      'Attack break rate per defense layer on a fixed suite of at least ten payloads. Answer quality held constant on your Phase-3 25-question benchmark (defenses must not destroy usefulness).',
    metrics: [
      'attack break rate (undefended)',
      'attack break rate (fully defended)',
      'answer accuracy retained after defenses',
      'refusal rate on unanswerable questions',
      'citation coverage',
    ],
    readme: [
      'Threat model: who can inject what, where',
      'The defense layers and what each does and does not stop',
      'Break-rate matrix across layers',
      'Residual risks accepted, explicitly',
      'Reproduction steps for every attack in the suite',
    ],
    demo: 'The same poisoning attack failing silently on the defended assistant, then succeeding on an undefended fork for contrast.',
    tradeoffs:
      'Be ready to defend: why no single layer is trusted, the usefulness cost of each defense, why you still do not claim injection is "solved", and what you would add with more time (sandboxes, human review queues).',
    interview: [
      'Explain indirect prompt injection to a non-technical product manager.',
      'Which of your defense layers would break first under a determined attacker, and why?',
      'How did you verify your defenses did not degrade answer quality?',
      'Where does responsibility sit when a poisoned document causes harm — the prompt, the retrieval, or the product?',
    ],
  },
  {
    id: 'pe-project-eval-harness',
    title: 'Prompt Eval & Regression Harness',
    moduleId: 'pe-regression',
    proves: 'eval-driven prompt development: golden sets, judges, and CI gates',
    problem:
      'Prompts are edited constantly and tested never. You will build the harness that makes every prompt change an experiment: versioned prompts, a golden set, automated scoring with a calibrated judge, and a merge gate that blocks regressions.',
    users: 'Any developer or team touching prompts who wants to stop shipping vibes.',
    stack: ['Python or TypeScript', 'LLM API', 'Git', 'CI'],
    milestones: [
      'Golden set of 40+ real items with expected outputs, committed as data',
      'Runner: one command scores any prompt version against the set',
      'Exact-match metrics where possible; calibrated LLM-judge for fuzzy tasks',
      'Prompt versions stored as files with changelogs',
      'Regression gate: CI fails when a score drops below threshold',
      'Bisect demo: a planted regression is found and reverted using the harness',
      'README: how to add items, run evals, and read the scoreboard',
    ],
    evaluation:
      'Pass rate per prompt version on the frozen golden set; judge agreement rate against hand labels; CI run gating a planted bad edit.',
    metrics: ['golden-set size', 'pass rate per version', 'judge agreement rate', 'CI gate threshold', 'regressions caught'],
    readme: [
      'Why evals precede optimization',
      'How to run the suite locally in one command',
      'How a new prompt version is added and scored',
      'Judge calibration method and measured agreement',
      'Known limitations: what the harness cannot catch',
    ],
    demo: 'A screencast: a prompt edit passes locally, CI red-gates a regression, bisect finds the edit.',
    tradeoffs:
      'Expect to defend: exact-match vs judge per task type, golden-set overfitting prevention (hold-out split), judge failure modes you measured, and why some tasks are human-only.',
    interview: [
      'Your eval suite says 96%. Walk me through what the 4% is and what you did about it.',
      'How did you calibrate the judge, and when do you override it?',
      'A teammate wants to ship a prompt edit that scores the same but reads better. Ship or block?',
      'How does the harness behave when the provider ships a new model version?',
    ],
  },
  {
    id: 'pe-project-context-compression',
    title: 'Multi-Turn Context Compression Engine',
    moduleId: 'pe-memory-prompts',
    proves: 'context engineering under constraint: memory, summarisation, and budget enforcement',
    problem:
      'Long conversations blow the context budget and drift: constraints set on turn 2 are forgotten by turn 40. You will build the engine that keeps a multi-turn assistant coherent and cheap: rolling summaries, explicit constraint carry-over, and a hard token budget with graceful degradation.',
    users: 'Anyone building chat products that must survive more than a dozen turns.',
    stack: ['Python or TypeScript', 'LLM API', 'pytest or vitest'],
    milestones: [
      'Conversation model: full history, rolling summary, active constraint list',
      'Summariser prompt with a quality checklist (constraints preserved, decisions kept, fluff dropped)',
      'Budgeter: token accounting per turn; compression triggers before overflow',
      'Constraint persistence: user rules re-stated explicitly every turn',
      'A 50-turn adversarial conversation: the turn-3 constraint must still hold at turn 50',
      'Cost report: tokens with vs without compression over the same conversation',
      'Failure gallery: what compression loses, documented honestly',
    ],
    evaluation:
      'Constraint retention rate across 50-turn conversations (programmatic checks), p95 per-turn latency, total token spend with vs without compression.',
    metrics: ['constraint retention at turn 50', 'token spend reduction', 'p95 latency per turn', 'summary quality score', 'failure cases logged'],
    readme: [
      'The memory architecture in one diagram',
      'When the summariser runs and what it must preserve',
      'Measured retention and savings on the adversarial conversation',
      'The degradation ladder: what gets dropped first as budget tightens',
      'Known losses: what this design forgets on purpose',
    ],
    demo: 'A live 50-turn session where the turn-3 rule visibly still applies at turn 50, with the token meter staying flat.',
    tradeoffs:
      'Be ready to defend: why constraints are re-stated instead of trusted to memory, when full history beats summarisation, what the summariser silently drops, and how you tested for summary drift compounding.',
    interview: [
      'The summariser is lossy. How do you decide what it is allowed to forget?',
      'Walk me through the degradation ladder as the budget shrinks.',
      'How would you detect summary drift compounding over 200 turns?',
      'Why re-state constraints every turn instead of relying on the system message?',
    ],
  },
]