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
]
