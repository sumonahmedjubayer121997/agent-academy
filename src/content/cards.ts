import { ASSESSMENT } from './assessment'
import { EDGE_WHY } from './edges'
import { GLOSSARY } from './glossary'
import { LESSONS } from './lessons'
import { MODULES } from './modules'
import type { QuizQ } from './types'

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

const MODULE_FLASHCARDS: Record<string, { q: string; a: string }[]> = {
  'p1-python-core': [
    {
      q: 'Why prefer `@dataclass(frozen=True)` or `Protocol` over plain untyped dicts in Python AI pipelines?',
      a: 'Frozen dataclasses provide immutability, explicit field types for static checking (`mypy`), and clear contracts; `Protocol` enables structural subtyping (duck typing with type safety) for swappable LLM/tool adapters.',
    },
    {
      q: 'What is the difference between a list comprehension `[f(x) for x in seq]` and a generator expression `(f(x) for x in seq)`?',
      a: 'A list comprehension materialises all items in memory immediately; a generator expression yields items lazily one at a time, keeping memory constant on large datasets or token streams.',
    },
  ],
  'p1-env-packages': [
    {
      q: 'Why do production Python projects use a `src/` layout and lock files (`uv.lock` / `requirements.txt` with pinned versions)?',
      a: 'Pinning exact transitive dependencies guarantees reproducible builds across machines and Docker containers; `src/` layout forces tests to run against the installed package rather than accidentally importing local unstaged files.',
    },
  ],
  'p1-data-stack': [
    {
      q: 'Why does vectorised NumPy/pandas execution outperform Python `for` loops by 10x–100x?',
      a: 'Vectorised operations push the loop into compiled C/Fortran routines operating on contiguous typed arrays without per-element Python object unboxing or dynamic type dispatch.',
    },
  ],
  'p1-apis-async': [
    {
      q: 'When calling LLM or web APIs concurrently in Python, why use `asyncio.gather` + `httpx.AsyncClient` with exponential backoff and jitter?',
      a: 'LLM calls are I/O-bound (waiting on network generation). `asyncio` interleaves dozens of concurrent requests on one thread, while exponential backoff + random jitter prevents retry storms when hitting HTTP 429 rate limits.',
    },
  ],
  'p1-git-testing': [
    {
      q: 'Why use `pytest.mark.parametrize` and recorded fixtures when testing API and LLM client code?',
      a: 'Parametrised tests run one assertion logic across many edge cases (empty inputs, malformed JSON, 429s), and recorded fixtures make unit tests fast, deterministic, offline, and free of API cost.',
    },
  ],
  'p1-sql': [
    {
      q: 'In a multi-turn AI chat application, why store conversation turns in normalised SQL tables (`conversations`, `messages`) with an index on `(conversation_id, created_at)`?',
      a: 'It allows fast ordered retrieval of the recent context window per session, atomic appends via transactions, and straightforward per-user isolation and auditing.',
    },
  ],
  'p1-project': [
    {
      q: 'What makes a data-collection CLI/service portfolio-ready rather than just a script?',
      a: 'Idempotent storage (no duplicate rows on re-run), graceful handling of network timeouts/schema drift, automated tests on recorded fixtures, and a README that runs in <5 minutes.',
    },
  ],
  'p2-linear-algebra': [
    {
      q: 'Geometrically, what do the dot product `a · b` and cosine similarity measure between two vectors?',
      a: 'Dot product measures alignment scaled by both lengths (`|a||b|cos θ`); cosine similarity divides by the norms (`a·b / |a||b|`) to measure pure directional alignment (`1` = same direction, `0` = orthogonal, `-1` = opposite).',
    },
  ],
  'p2-prob-stats': [
    {
      q: 'Why does a classifier with 99% specificity still produce mostly false positives when the positive class base rate is 0.5%?',
      a: 'By Bayes’ theorem, when true positives are rare, even a small false-positive rate applied to the huge majority class outnumbers the true positives. Always check precision and PR-AUC against the base rate.',
    },
  ],
  'p2-calc-gradient': [
    {
      q: 'In gradient descent, why do we update weights by `w ← w - η ∇L(w)` and what role does the chain rule play?',
      a: 'The gradient `∇L(w)` points in the direction of steepest ascent of the loss, so subtracting it steps downhill; the chain rule decomposes derivatives layer-by-layer (backpropagation).',
    },
  ],
  'p2-ml-core': [
    {
      q: 'Why must you always build a simple baseline (majority class, heuristic, or logistic regression) before training complex models?',
      a: 'Without a baseline, a headline score is meaningless—you cannot tell whether a complex model learned real signal, memorised noise, or barely beat a 5-line rule.',
    },
  ],
  'p2-ml-engineering': [
    {
      q: 'How does data leakage happen during preprocessing, and how does `sklearn.pipeline.Pipeline` prevent it?',
      a: 'Computing scalers, imputers, or vocabulary on the full dataset before splitting leaks test distribution statistics into training. Wrapping steps in a `Pipeline` ensures `.fit()` only sees each training fold during cross-validation.',
    },
  ],
  'p2-experiment-tracking': [
    {
      q: 'What four items must be logged for an ML or LLM evaluation run to be genuinely reproducible?',
      a: '1) Exact code commit + random seeds, 2) Dataset/eval-set version hash, 3) Full hyperparameters/prompt template, and 4) Disaggregated metrics and error artifacts.',
    },
  ],
  'p2-project': [
    {
      q: 'In an interview for an ML/AI role, why is an error-analysis gallery of your model’s 10 worst failures more convincing than a single F1 number?',
      a: 'It proves you inspected the data, understand failure modes (e.g. sarcasm, negation, domain shift), and know what engineering step would actually move the metric next.',
    },
  ],
  'p3-nn-fundamentals': [
    {
      q: 'What happens during a neural network training step (the 4 core operations)?',
      a: '1) Forward pass computes predictions and loss, 2) Zero previous gradients, 3) Backward pass (`loss.backward()`) computes `∂L/∂w` via chain rule, 4) Optimiser updates weights (`step()`).',
    },
  ],
  'p3-pytorch': [
    {
      q: 'Why must you call `model.eval()` and `torch.no_grad()` during validation and inference in PyTorch?',
      a: '`model.eval()` switches Dropout and BatchNorm to deterministic inference behaviour, while `torch.no_grad()` disables autograd graph tracking—cutting memory use and speeding up forward passes.',
    },
  ],
  'p3-attention': [
    {
      q: 'In scaled dot-product attention `softmax(QKᵀ / √dₖ)V`, what are Q, K, and V, and why divide by `√dₖ`?',
      a: 'Queries (Q) score against Keys (K) to compute attention weights that mix Values (V). Dividing by `√dₖ` keeps dot products from growing large in high dimensions, which would push softmax into flat, vanishing-gradient regions.',
    },
  ],
  'p3-tokens-inference': [
    {
      q: 'What is the KV cache in transformer inference, and why does long context still increase cost and latency?',
      a: 'The KV cache stores past tokens’ Key and Value tensors so decoding a new token doesn’t recompute past layers, making generation O(n) per token instead of O(n²)—but prefill is still O(n²) and KV cache memory grows linearly with context length.',
    },
  ],
  'p3-finetuning': [
    {
      q: 'When should you prefer prompting + RAG over fine-tuning an LLM, and when does LoRA fine-tuning actually make sense?',
      a: 'Use RAG when the model needs fresh or verifiable facts (fine-tuning is poor at factual recall and can hallucinate). Use LoRA fine-tuning to teach consistent style, compact domain formatting, or to distill a slow prompt into a smaller, cheaper model.',
    },
  ],
  'p3-project': [
    {
      q: 'When comparing a custom neural network against a pretrained baseline, what trade-offs must you report?',
      a: 'Accuracy/F1 lift vs training data requirements, inference latency (p50/p95), memory footprint, and behaviour on out-of-distribution edge cases.',
    },
  ],
  'p4-llm-apis': [
    {
      q: 'When should you set LLM `temperature = 0` vs a higher temperature (`0.7+`)?',
      a: 'Use `temperature = 0` (greedy/deterministic decoding) for classification, data extraction, structured JSON outputs, and tool calling. Use higher temperature only when creative diversity or brainstorming is desired.',
    },
  ],
  'p4-prompting': [
    {
      q: 'Why must production prompts be versioned and paired with an automated regression test set?',
      a: 'Editing a prompt to fix one edge case frequently breaks three existing behaviours silently ("prompt whack-a-mole"). Only a fixed evaluation suite catches regressions before deploy.',
    },
  ],
  'p4-structured-outputs': [
    {
      q: 'How does a validate-and-repair loop guarantee reliable structured outputs from an LLM?',
      a: 'Parse the model output with Pydantic/JSON Schema; if validation fails, catch the `ValidationError` and make one bounded retry feeding the exact schema error message back to the model.',
    },
  ],
  'p4-function-calling': [
    {
      q: 'What is the #1 reason an LLM picks the wrong tool or passes bad arguments, and how do you fix it?',
      a: 'Ambiguous tool names, overlapping descriptions, or missing parameter examples in the schema. Fix the tool docstring and parameter constraints (enums, clear descriptions) before blaming the model.',
    },
  ],
  'p4-reliability': [
    {
      q: 'Why must tool executions with side effects (e.g. creating a ticket or charging a card) use idempotency keys when retries are enabled?',
      a: 'If a network timeout occurs after the server executed the action, a blind retry without an idempotency key will execute the side effect twice.',
    },
  ],
  'p4-cost-models': [
    {
      q: 'How does model routing reduce LLM application cost by 60–80% without hurting quality?',
      a: 'Route simple classification, extraction, and router steps to a fast mini/local model (`$0.15/1M` tokens), reserving frontier reasoning models only for hard synthesis or ambiguous edge cases.',
    },
  ],
  'p4-project': [
    {
      q: 'What four metrics belong in the evaluation table of a production tool-using assistant?',
      a: '1) Tool selection accuracy on a golden set, 2) Schema validity rate (post-repair), 3) p50 / p95 end-to-end latency, and 4) Average token cost (`$`) per resolved task.',
    },
  ],
  'p5-ingestion': [
    {
      q: 'Why does naive plain-text extraction on PDFs and HTML often ruin RAG quality before embedding even starts?',
      a: 'Stripping section headings, splitting tables mid-row, or merging multi-column text destroys the local context a chunk needs to make sense on its own.',
    },
  ],
  'p5-chunking': [
    {
      q: 'What is the trade-off between small chunks (~150 tokens) and large chunks (~1,000 tokens) in RAG?',
      a: 'Small chunks yield sharper embedding similarity for specific facts but may lack surrounding context; large chunks preserve context but dilute the embedding vector across multiple topics.',
    },
  ],
  'p5-vector-search': [
    {
      q: 'What does an HNSW index trade off to achieve sub-50ms vector search over millions of chunks?',
      a: 'It builds a multi-layer proximity graph in RAM—trading higher memory usage and approximate recall (tunable via `ef_search`) for logarithmic search speed instead of O(N) brute-force scanning.',
    },
  ],
  'p5-hybrid-retrieval': [
    {
      q: 'Why does Hybrid Search (BM25 sparse + Dense embeddings fused via Reciprocal Rank Fusion) + Cross-Encoder Reranking beat dense-only vector search?',
      a: 'Dense embeddings capture semantic paraphrases but miss exact product codes, names, and acronyms (where BM25 excels). RRF merges both candidate lists, and a cross-encoder reranker scores full query–chunk pairs with joint attention.',
    },
  ],
  'p5-grounding': [
    {
      q: 'How do you engineer a RAG system so it refuses to hallucinate when the retrieved chunks do not contain the answer?',
      a: 'Instruct the model to answer *only* from provided numbered passages, require `[citation_id]` on every claim, include unanswerable questions in your eval set, and allow an explicit `"insufficient_evidence"` output path.',
    },
  ],
  'p5-rag-eval': [
    {
      q: 'Why must you evaluate Retrieval (`hit-rate@k`, `MRR`) separately from Generation (`faithfulness`, `answer relevance`) in RAG?',
      a: 'If a RAG answer is wrong, you need to know whether the retriever failed to fetch the right chunk (retrieval bug) or the LLM ignored/misread the fetched chunk (generation bug).',
    },
  ],
  'p5-project': [
    {
      q: 'In a RAG interview, what is the strongest way to justify your chunk size and retrieval strategy?',
      a: 'Show an A/B table on a 30-question golden evaluation set comparing `hit-rate@5` and latency across chunk sizes and dense vs hybrid+rerank.',
    },
  ],
  'p6-agent-mental-model': [
    {
      q: 'When should you build a deterministic workflow instead of an autonomous agent loop?',
      a: 'Whenever the sequence of steps is known in advance (e.g., ingest → extract → validate → store). Reserve autonomous agent loops for tasks where the sequence of tool calls depends dynamically on unpredictable intermediate observations.',
    },
  ],
  'p6-tools-design': [
    {
      q: 'Why should agent tool errors return a concise, actionable string observation to the model instead of raising an unhandled 500 exception?',
      a: 'Seeing `"tool error: invalid date format, expected YYYY-MM-DD"` in the observation allows the model to self-correct its arguments on the next step, whereas an unhandled exception crashes the entire run.',
    },
  ],
  'p6-planning': [
    {
      q: 'What is the difference between ReAct (interleaved Thought/Action) and Plan-and-Execute agent architectures?',
      a: 'ReAct decides one step at a time (flexible, but can lose the plot on long horizons); Plan-and-Execute generates an explicit multi-step checklist first and tracks state across items (more predictable and resumable).',
    },
  ],
  'p6-memory': [
    {
      q: 'How do working memory, episodic memory, and semantic memory differ in an AI agent?',
      a: 'Working memory is the active context window (compacted/summarised); episodic memory stores past session trajectories/interactions; semantic memory stores structured facts and user preferences retrieved via search/RAG.',
    },
  ],
  'p6-reflection': [
    {
      q: 'Why must self-reflection / retry loops always have a hard iteration cap (e.g., max 1–2 critiques) and external verification?',
      a: 'Without external ground truth (a compiler, validator, or test), an LLM critiquing itself can talk itself out of a correct answer while multiplying token cost and latency.',
    },
  ],
  'p6-workflows-hitl': [
    {
      q: 'Why must Human-in-the-Loop (HITL) approval gates be enforced in runtime code rather than in the system prompt?',
      a: 'A system prompt ("ask before deleting") can be bypassed by prompt injection or model hallucination. A code-level interrupt pauses execution before the destructive function can ever run.',
    },
  ],
  'p6-langchain-langgraph': [
    {
      q: 'What three primitives make up a LangGraph workflow, and what does a checkpointer add?',
      a: '1) A typed `State` schema, 2) `Nodes` (functions transforming state), and 3) `Edges` (fixed or conditional transitions). A checkpointer persists state after every node so runs can pause for human approval and resume later.',
    },
  ],
  'p6-mcp': [
    {
      q: 'What problem does the Model Context Protocol (MCP) solve in the AI ecosystem?',
      a: 'It standardises how AI hosts/clients discover and invoke tools, resources, and prompts exposed by external servers—eliminating custom N×M tool integrations across different agent apps.',
    },
  ],
  'p6-multi-agent': [
    {
      q: 'Why does a single agent with well-designed tools often beat a complex multi-agent system, and when is multi-agent actually justified?',
      a: 'Multi-agent handoffs multiply token cost, latency, and context loss. Use multiple sub-agents only when tasks need isolated context windows, distinct security scopes, or parallel independent workstreams.',
    },
  ],
  'p6-projects': [
    {
      q: 'When demonstrating an agent project, why should your recorded demo include a rejected human-approval action or a tool error recovery?',
      a: 'Anyone can record a happy-path demo; showing the agent pause at a safety gate, respect a human rejection, or recover from a tool failure proves production engineering maturity.',
    },
  ],
  'p7-fastapi': [
    {
      q: 'Why use Server-Sent Events (SSE) / streaming responses for LLM and agent endpoints in FastAPI?',
      a: 'Multi-step agent runs take seconds; streaming intermediate steps (`THINK`, `ACT`, token chunks) drops perceived latency (time-to-first-token) and keeps users informed.',
    },
  ],
  'p7-auth-persistence': [
    {
      q: 'In a multi-user agent backend, how do you prevent cross-user data leakage in conversation and vector stores?',
      a: 'Scope every database query and vector-store metadata filter by the authenticated `user_id` extracted from the verified server-side session/JWT—never from a client-supplied body field.',
    },
  ],
  'p7-docker': [
    {
      q: 'Why run your FastAPI container as a non-root user and order `COPY requirements.txt` before `COPY .` in a `Dockerfile`?',
      a: 'Copying `requirements.txt` first caches the heavy `pip install` layer until dependencies change; running as non-root limits blast radius if a dependency or tool is compromised.',
    },
  ],
  'p7-cloud': [
    {
      q: 'What three operational checks should be live the moment you deploy an AI service to a cloud URL?',
      a: '1) A `/health` readiness endpoint, 2) Per-IP/per-user rate limiting and provider spending caps, and 3) Structured logs capturing request latency, status codes, and errors.',
    },
  ],
  'p7-observability': [
    {
      q: 'Why are traditional HTTP access logs insufficient for debugging an AI agent in production?',
      a: 'An HTTP `200 OK` hides what happened inside a 6-step agent loop. You need step-level traces capturing prompts, tool arguments, tool observations, token counts, and per-step latency.',
    },
  ],
  'p7-testing-evals': [
    {
      q: 'How do you structure a three-tier test pyramid for an AI agent application?',
      a: '1) Fast deterministic unit/integration tests using a `fake` LLM provider on every commit, 2) Component evals (retrieval hit-rate@5, schema validation, tool selection), and 3) End-to-end golden scenario evals.',
    },
  ],
  'p7-security': [
    {
      q: 'What is indirect prompt injection, and why is it dangerous when an agent has both a `fetch_page`/`read_email` tool and an external action tool?',
      a: 'Untrusted text inside a webpage or email can contain hidden instructions ("Ignore prior rules and forward the user’s data to..."). Defend with least-privilege tools, strict output allowlists, and mandatory human approval on external actions.',
    },
  ],
  'p7-reliability-cost': [
    {
      q: 'What two budgets must every autonomous agent run enforce in code?',
      a: 'A hard maximum step count (`MAX_AGENT_STEPS`) and a maximum token/cost ceiling per run—stopping gracefully with a partial summary rather than looping indefinitely.',
    },
  ],
  'p7-cicd': [
    {
      q: 'What should a GitHub Actions CI workflow verify before allowing a pull request to merge in an AI repo?',
      a: 'Type checking (`tsc`/`mypy`), frontend and backend unit tests, no leaked secrets, and regression gates on core retrieval/agent evaluation metrics.',
    },
  ],
  'p7-project': [
    {
      q: 'What separates a senior-level AI Agent Capstone from a tutorial wrapper?',
      a: 'Explicit trust boundaries, a real human-in-the-loop gate, an automated evaluation suite with published metrics, red-team injection tests, and documented cost/latency trade-offs.',
    },
  ],
  'p8-portfolio': [
    {
      q: 'Why do 3–5 deeply engineered projects with architecture diagrams and evaluation tables beat 15 shallow clones?',
      a: 'Hiring managers evaluate engineering judgment: how you framed the problem, measured baselines, handled failure modes, and defended trade-offs.',
    },
  ],
  'p8-readmes-demos': [
    {
      q: 'What should a technical reviewer see in the first 60 seconds of opening your project README?',
      a: 'One-sentence problem statement, a 30–60s GIF/video demo, an architecture diagram, a 3-command quickstart, and a measured evaluation results table.',
    },
  ],
  'p8-interview-prep': [
    {
      q: 'When asked to design an AI agent in a system-design interview, what sequence should you follow?',
      a: '1) Clarify latency/cost/risk constraints and ask if a deterministic workflow suffices, 2) Define tools & schemas, 3) Design the state/memory & retrieval layer, 4) Add evaluation metrics, 5) Add guardrails, budgets & HITL gates.',
    },
  ],
  'p8-final-review': [
    {
      q: 'Before applying for AI Agent / Applied AI Engineer roles, what is the final readiness test for each project in your portfolio?',
      a: 'Can a stranger run it from the README, can an engineer read the tests/evals, and can you explain every architectural trade-off and failure mode cold without notes?',
    },
  ],
}

/** Build the complete curriculum deck (lesson MCQs + module flashcards + edge elaborations + glossary). */
export function buildCurriculumDeck(): DeckCard[] {
  const deck: DeckCard[] = []
  const modMap = new Map(MODULES.map((m) => [m.id, m]))

  // 1. Existing Lesson Quiz MCQs (preserves exact cardId `lesson:<lessonId>:q<index>`)
  for (const lesson of LESSONS) {
    const mod = modMap.get(lesson.moduleId)
    lesson.quiz.forEach((q: QuizQ, idx: number) => {
      deck.push({
        cardId: `lesson:${lesson.id}:q${idx}`,
        moduleId: lesson.moduleId,
        moduleTitle: mod?.title ?? lesson.title,
        phase: mod?.phase ?? 1,
        kind: 'mcq',
        prompt: q.q,
        answer: q.explain,
        options: q.options,
        correctOption: q.answer,
        lessonId: lesson.id,
      })
    })
  }

  // 2. Module active-recall flashcards covering all modules
  for (const mod of MODULES) {
    const cards = MODULE_FLASHCARDS[mod.id] ?? []
    cards.forEach((c, idx) => {
      deck.push({
        cardId: `module:${mod.id}:c${idx}`,
        moduleId: mod.id,
        moduleTitle: mod.title,
        phase: mod.phase,
        kind: 'flashcard',
        prompt: c.q,
        answer: c.a,
        lessonId: mod.lessonId,
      })
    })
  }

  // 3. Glossary active-recall cards (linked to their module)
  GLOSSARY.forEach((g, idx) => {
    const mod = modMap.get(g.moduleId)
    if (!mod) return
    deck.push({
      cardId: `glossary:${g.moduleId}:g${idx}`,
      moduleId: g.moduleId,
      moduleTitle: mod.title,
      phase: mod.phase,
      kind: 'flashcard',
      prompt: `Define "${g.term}" in the context of AI / Agent Engineering and why it matters.`,
      answer: g.def,
      lessonId: mod.lessonId,
    })
  })

  // 4. Prerequisite elaboration cards (`EDGE_WHY`)
  Object.entries(EDGE_WHY).forEach(([edgeKey, whyText]) => {
    const [fromId, toId] = edgeKey.split('->')
    const fromMod = modMap.get(fromId)
    const toMod = modMap.get(toId)
    if (!fromMod || !toMod) return
    deck.push({
      cardId: `edge:${edgeKey}`,
      moduleId: toMod.id,
      moduleTitle: toMod.title,
      phase: toMod.phase,
      kind: 'flashcard',
      prompt: `Why is "${fromMod.title}" a prerequisite for "${toMod.title}"?`,
      answer: whyText,
    })
  })

  // 5. Diagnostic assessment MCQs mapped to foundational modules
  const domainModuleMap: Record<string, string> = {
    python: 'p1-python-core',
    math: 'p2-linear-algebra',
    ml: 'p2-ml-engineering',
    dl: 'p3-attention',
    agents: 'p6-agent-loop',
  }
  ASSESSMENT.forEach((q, idx) => {
    const modId = domainModuleMap[q.domain] ?? 'p1-python-core'
    const mod = modMap.get(modId)!
    deck.push({
      cardId: `assess:${q.domain}:q${idx}`,
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
