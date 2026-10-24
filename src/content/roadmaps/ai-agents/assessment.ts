import type { QuizQ } from '../../types'

export type Domain = 'python' | 'math' | 'ml' | 'dl' | 'agents'

export const DOMAIN_LABELS: Record<Domain, string> = {
  python: 'Python & Software',
  math: 'Math & Statistics',
  ml: 'Classical ML',
  dl: 'Deep Learning & NLP',
  agents: 'LLMs & Agents',
}

// Conservative crediting: only a perfect domain score credits modules as completed;
// 2/3 marks them "in progress" for revision. Nothing is ever auto-inflated.
export const DOMAIN_CREDIT: Record<Domain, { full: string[]; partial: string[] }> = {
  python: { full: ['p1-python-core'], partial: [] },
  math: { full: ['p2-linear-algebra', 'p2-prob-stats', 'p2-calc-gradient'], partial: [] },
  ml: { full: ['p2-ml-core'], partial: ['p2-ml-engineering'] },
  dl: { full: [], partial: [] },
  agents: { full: [], partial: [] },
}

export const ASSESSMENT: (QuizQ & { domain: Domain })[] = [
  // ── Python & Software ──
  {
    domain: 'python',
    q: 'Which definition gives you an immutable, typed record with fields x and y?',
    options: [
      'class Point: def __init__(self, x, y): self.x = x; self.y = y',
      '@dataclass(frozen=True) class Point: x: float; y: float',
      'typedef struct { float x; float y; } Point',
      'record Point(x: float, y: float)',
    ],
    answer: 1,
    explain: 'dataclasses with frozen=True are Python\'s idiomatic immutable records; plain classes are mutable, and the other two syntaxes are from C and other languages.',
  },
  {
    domain: 'python',
    q: 'What does asyncio.gather(*coros) do?',
    options: [
      'Runs coroutines one after another in order',
      'Runs coroutines concurrently on the event loop and returns their results in call order',
      'Runs them in parallel on multiple CPU cores',
      'Cancels all coroutines if any raises',
    ],
    answer: 1,
    explain: 'gather interleaves coroutines concurrently on one event loop (great for I/O), preserves result order, and by default propagates the first exception — not multi-core parallelism.',
  },
  {
    domain: 'python',
    q: 'A repo has branch protection requiring passing CI. A pull request whose tests fail will…',
    options: [
      'Merge anyway with a warning',
      'Be blocked from merging until CI passes or rules are overridden by an admin',
      'Automatically revert the changes',
      'Re-run tests until they pass',
    ],
    answer: 1,
    explain: 'Branch protection + required status checks is the standard gate: broken code cannot enter main. This is exactly the mechanism you will use to keep agent evals enforced.',
  },
  // ── Math & Statistics ──
  {
    domain: 'math',
    q: 'What is the dot product (3, 4) · (4, 3)?',
    options: ['12', '24', '25', '0'],
    answer: 1,
    explain: '3×4 + 4×3 = 24. Dot products are the core of embeddings and attention — if this felt slow, the linear algebra refresh will pay off immediately.',
  },
  {
    domain: 'math',
    q: 'A disease affects 1% of people. A test catches 90% of the sick and falsely flags 20% of the healthy. A random person tests positive. The chance they are actually sick is closest to…',
    options: ['90%', 'about 4–5%', 'about 50%', '20%'],
    answer: 1,
    explain: 'Per 10,000: 90 true positives vs 1,980 false positives → 90/2,070 ≈ 4.3%. Base rates dominate — the single most useful statistical instinct for evaluating AI systems.',
  },
  {
    domain: 'math',
    q: 'Gradient descent updates parameters by stepping…',
    options: [
      'In the direction of the gradient',
      'Opposite the gradient, scaled by a learning rate',
      'Randomly, weighted by the loss',
      'Toward the nearest zero of the second derivative',
    ],
    answer: 1,
    explain: 'The gradient points uphill on the loss surface; you descend by moving against it, with the learning rate controlling step size.',
  },
  // ── Classical ML ──
  {
    domain: 'ml',
    q: 'Training accuracy 99%, test accuracy 71%. The most likely diagnosis is…',
    options: ['Underfitting', 'Overfitting', 'Class imbalance alone', 'A bug in the metric'],
    answer: 1,
    explain: 'A large train-test gap is the signature of overfitting (memorising training data). Remedies: regularisation, more data, simpler model, better validation.',
  },
  {
    domain: 'ml',
    q: 'For a fraud detector where 0.5% of transactions are fraud, the LEAST informative metric is…',
    options: ['Precision', 'Recall', 'F1 / PR-AUC', 'Accuracy'],
    answer: 3,
    explain: 'A model that predicts "never fraud" scores 99.5% accuracy. With rare positives, precision/recall trade-offs (PR curves) carry the real signal.',
  },
  {
    domain: 'ml',
    q: 'The validation set exists to…',
    options: [
      'Provide the final, unbiased performance estimate',
      'Select models/hyperparameters during development, keeping the test set untouched',
      'Increase training data',
      'Balance the classes',
    ],
    answer: 1,
    explain: 'Train fits parameters, validation guides choices, test gives the final honest number — touching it during development quietly invalidates it.',
  },
  // ── Deep Learning & NLP ──
  {
    domain: 'dl',
    q: 'An embedding layer learns to produce…',
    options: [
      'One-hot class probabilities',
      'Dense vectors where semantic similarity becomes geometric proximity',
      'Human-readable feature names',
      'Decision trees over token positions',
    ],
    answer: 1,
    explain: 'Embeddings turn discrete items into points in a continuous space where "nearby" means "related" — the foundation of retrieval, RAG, and memory.',
  },
  {
    domain: 'dl',
    q: 'In the attention mechanism, the output for each position is…',
    options: [
      'A copy of the highest-scoring input token',
      'A weighted average of value vectors, with weights from query–key compatibility',
      'The sum of all embeddings, normalised',
      'A fixed positional lookup',
    ],
    answer: 1,
    explain: 'Attention = soft dictionary lookup: queries score keys, softmax turns scores into weights, and the output mixes the corresponding values.',
  },
  {
    domain: 'dl',
    q: 'A "token" in an LLM is best described as…',
    options: [
      'Always one word',
      'Always one character',
      'A subword unit (from an algorithm like BPE) that the model actually processes',
      'A GPU memory slot',
    ],
    answer: 2,
    explain: 'Tokenisers like BPE split text into frequent subword chunks; tokens are the units of context, cost, and latency.',
  },
  // ── LLMs & Agents ──
  {
    domain: 'agents',
    q: 'With function calling, the model actually…',
    options: [
      'Executes your function inside its own sandbox',
      'Returns a structured request (name + arguments) that YOUR code chooses to execute',
      'Compiles your schema into the network weights',
      'Waits for the user to run the tool',
    ],
    answer: 1,
    explain: 'The model only emits intent; execution and permissions live in your runtime. That separation is the security boundary of every agent system.',
  },
  {
    domain: 'agents',
    q: 'RAG primarily improves answers by…',
    options: [
      'Making the model respond faster',
      'Reducing cost per query',
      'Grounding responses in retrieved source documents, reducing hallucination',
      'Increasing the context window',
    ],
    answer: 2,
    explain: 'Retrieval-Augmented Generation injects relevant evidence into the prompt so answers are conditioned on real sources — ideally with citations you can check.',
  },
  {
    domain: 'agents',
    q: 'The safest design for an agent that can send external emails is…',
    options: [
      'A longer system prompt saying "be careful"',
      'Human approval (or strict rate/allow-list rules) before any send action, with least-privilege credentials',
      'Giving it the account password so it can fix its own mistakes',
      'Logging all sends after the fact',
    ],
    answer: 1,
    explain: 'Prompts are guidance, not guarantees. Irreversible actions need hard controls: approval gates, allow-lists, rate limits, and credentials scoped to the minimum.',
  },
]
