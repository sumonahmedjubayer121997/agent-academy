import type { Lesson } from '../../types'

export const LESSONS: Lesson[] = [
  {
    id: 'agent-loop',
    moduleId: 'p6-agent-loop',
    title: 'The Agent Loop',
    minutes: 35,
    tagline: 'Every agent framework is this one loop wearing a costume.',
  takeaways: ["Every agent is the same loop: observe, reason, act — frameworks only dress it differently.", "Tools turn a chatbot into an agent: the loop decides, the tool executes.", "Stop conditions and budgets are what keep a loop from becoming a bill."],
    pre: {
      q: 'Before we start — from Phase 4: when a model "calls a function", who actually executes it?',
      options: ['The model, inside its own sandbox', 'My runtime — the model only returns a structured request'],
      answer: 1,
      explain:
        'The model emits intent (name + arguments); your code validates and executes it. Keep that separation in mind — the whole lesson builds on it.',
    },
    simple: [
      'An AI agent is a program that repeatedly asks a large language model "what should I do next?" and actually does it. That is almost the whole idea. The model cannot run code, search the web, or send emails by itself — it can only write text. So your program gives the model a list of tools it may ask for, plus the current situation, and the model replies with either a final answer or a request to call one of the tools.',
      'Your code executes that tool, attaches the result back into the conversation, and asks the model again. Round and round it goes — until the model produces a final answer, or a limit you set is reached. The loop is the agent. Frameworks like LangGraph wrap this loop with nicer state management, but underneath, this is all they do.',
    ],
    intuition: {
      analogy: 'A brilliant intern with a phone, working for you remotely.',
      paragraphs: [
        'The intern (the model) is extremely well-read and reasons well, but has no hands: they cannot open your files, browse, or send messages themselves. You give them a goal ("find out why churn spiked and brief me"), a phone directory of people who can do things (the tools), and a rule: check in before doing anything irreversible.',
        'The intern calls you with requests ("phone the analytics desk"), you place the call and read them the answer (tool execution → observation), and they continue reasoning. Eventually they hand you the brief (final answer). If they ramble for hours, you cut them off (max steps). If they want to publish something to customers, you approve it first (human-in-the-loop).',
      ],
    },
    technical: [
      'Formally, an agent is a state machine over a message history M and a tool set T = {t₁…tₙ}, each tool described by a JSON schema. Each iteration: send M + tool schemas to the model; the model returns either a tool call (name + arguments) or a final completion. The orchestrator validates arguments, executes the tool, appends the result as a tool-role message (the observation), and loops.',
      'The stopping conditions are engineering decisions, not model decisions: a final answer, a maximum step count, a token/cost budget, or an interrupt (approval gate). Observations are just messages — which means context grows every step, attention cost grows quadratically, and older steps can be summarised or dropped (compaction).',
      'Note what the model never does: it never executes anything. It emits structured requests; your runtime holds the privileges. This separation — decisions in the model, execution in your code — is the security boundary you will defend in Phase 7.',
    ],
    deeper: [
      'Context growth is the loop\'s hidden quadratic tax. Each step re-sends the whole history, and transformer attention over n tokens costs O(n²) time and O(n) memory per layer — so step 40 of a long agent run is dramatically more expensive per token than step 1, before you even count the extra input tokens themselves. This is why serious agent runtimes compact: summarise older tool results, keep structured digests of observations, or move long outputs to external scratch files referenced by path.',
      'ReAct vs plan-and-execute are the two canonical loop shapes. ReAct (Reason+Act) interleaves thinking and tool calls step by step — flexible, but prone to drift on long tasks. Plan-and-execute produces an explicit plan first, then executes items (sometimes re-planning after each) — more deterministic and easier to resume, at the cost of adaptability. Most production systems are hybrids: a plan skeleton with local ReAct-style flexibility inside each step.',
      'Formally, the loop defines a Markov decision process where the policy is the model conditioned on the message history, actions are tool calls ∪ {final}, and the reward is implicit in your stopping rules and evaluation harness. You don\'t train this policy — you engineer around it: tool design shapes the action space, prompts shape the policy, and budgets shape the horizon.',
    ],
    numbers: {
      title: 'The cost of autonomy — one run, by the numbers',
      rows: [
        ['Steps per run', '6 (typical small task)'],
        ['Input tokens per step (growing context)', '~800 average'],
        ['Output tokens per step', '~200'],
        ['Price — input / output', '$3 / $15 per million tokens'],
        ['Input cost', '6 × 800 × $3/M = $0.0144'],
        ['Output cost', '6 × 200 × $15/M = $0.0180'],
        ['Total per run', '$0.032'],
        ['At 1,000 runs/day', '≈ $970 / month'],
      ],
      takeaway:
        'A loop that "thinks" a few extra steps per run can triple your bill. This is why step budgets, context compaction, and model routing (cheap model for easy steps) are core agent engineering — not optimisations you add later.',
    },
    demo: 'agent-loop',
    walkthrough: {
      lang: 'python',
      code: `import json

TOOLS = {
    "search_web": lambda q: f"[sim] results for {q!r}",
    "read_page":  lambda url: f"[sim] content of {url}",
}

def run_agent(goal: str, max_steps: int = 6) -> str:
    messages = [{"role": "user", "content": goal}]
    for step in range(max_steps):
        reply = call_model(messages, tools=TOOL_SPECS)
        if reply.tool_calls:
            for call in reply.tool_calls:
                result = TOOLS[call.name](**json.loads(call.arguments))
                messages.append(tool_msg(call.id, result))
        else:
            return reply.content
    return "Stopped: max steps reached."`,
      notes: [
        ['TOOLS = { ... }', 'Your execution surface. The model never touches anything you have not explicitly registered — least privilege starts here.'],
        ['def run_agent(goal, max_steps=6)', 'The loop signature already encodes the most important safety rail: a hard step limit decided by you, not the model.'],
        ['messages = [{"role": "user", ...}]', 'The state of the agent is just a message list. "Memory" at this level means managing this list deliberately.'],
        ['reply = call_model(messages, tools=TOOL_SPECS)', 'One API call per step: full history + tool schemas. Watch this list grow — it is your cost curve.'],
        ['if reply.tool_calls:', 'The fork in the loop: the model either wants to act (tool calls) or is done (plain text). Everything else in agent frameworks is this branch, elaborated.'],
        ['result = TOOLS[call.name](**json.loads(call.arguments))', 'You — not the model — execute. In production: validate arguments, enforce permissions, catch errors, and return readable error messages the model can recover from.'],
        ['messages.append(tool_msg(call.id, result))', 'The observation. Feeding results back is what makes the system an agent rather than a single prompt.'],
        ['return "Stopped: max steps reached."', 'A budget-exhausted agent must stop gracefully. Silent infinite loops are how demo agents become $2,000 bills.'],
      ],
    },
    exercise: {
      prompt:
        'Extend run_agent with a "consecutive error" circuit breaker: if two tool executions in a row raise exceptions, stop and return a diagnostic message instead of continuing. Think first about where errors can occur and what the model should see when a tool fails.',
      solution: `errors = 0
for step in range(max_steps):
    reply = call_model(messages, tools=TOOL_SPECS)
    if not reply.tool_calls:
        return reply.content
    for call in reply.tool_calls:
        try:
            result = TOOLS[call.name](**json.loads(call.arguments))
            errors = 0
        except Exception as e:
            result = f"tool error: {e}"   # let the model see the failure
            errors += 1
        messages.append(tool_msg(call.id, result))
    if errors >= 2:
        return "Aborted: repeated tool failures."

# Key ideas: (1) feed errors back as observations so the model can
# self-correct once; (2) cap the retries so a broken tool cannot
# burn the whole budget — the same pattern you will meet again as
# "controlled retries" and "reflection with limits".`,
    },
    quiz: [
      {
        q: 'When does the agent loop stop?',
        options: [
          'When the model decides it is tired',
          'When it returns a final answer OR hits a step/budget limit',
          'After exactly one tool call',
          'When the context window is full',
        ],
        answer: 1,
        explain:
          'Termination is an engineering guarantee, not a model behaviour: final answer, max steps, or a cost budget. (A full context window causes failures — which is why you budget before that happens.)',
      },
      {
        q: 'In agent terms, what is an "observation"?',
        options: [
          'The user\'s original request',
          'The model\'s internal reasoning',
          'The result of a tool execution, fed back into the message history',
          'A log line for debugging',
        ],
        answer: 2,
        explain:
          'Observe–reason–act: the observation is what the agent perceives after acting — the tool result appended as a message, which the next reasoning step conditions on.',
      },
      {
        q: 'Why is a maximum-steps limit essential rather than optional?',
        options: [
          'Models refuse to continue after 6 steps',
          'Cost and latency grow with every step, and loops can run away',
          'It improves answer quality directly',
          'It is required by all LLM APIs',
        ],
        answer: 1,
        explain:
          'Each step costs tokens and time, and a model stuck retrying the same failing tool can loop indefinitely. The cap converts an unbounded failure into a graceful stop.',
      },
    ],
    realWorld: [
      'Claude Code and similar coding agents are this loop with tools like "read file", "edit file", and "run command" — plus approval gates exactly like the one in the Playground.',
      'Customer-support agents loop over tools like look_up_order, check_refund_policy, and issue_refund; the irreversible tool always sits behind a rule or a human.',
      'LangGraph\'s graph runtime, OpenAI\'s agent loops, and MCP clients all reduce to this structure — which is why you build it once, framework-free, before touching any framework.',
    ],
    further: [
      { label: 'Anthropic — Building Effective Agents', url: 'https://www.anthropic.com/engineering/building-effective-agents', note: 'The best short paper on workflows vs agents; read it now and again after Phase 6.' },
      { label: 'OpenAI — Function calling guide', url: 'https://developers.openai.com/api/docs/guides/function-calling', note: 'The canonical description of the tool-call round trip this lesson implements.' },
      { label: 'LangGraph docs', url: 'https://docs.langchain.com/oss/python/langgraph/overview', note: 'See how the same loop becomes a state graph. You will rebuild this lesson in LangGraph.' },
    ],
  },
  {
    id: 'embeddings-intuition',
    moduleId: 'p3-embeddings-repr',
    title: 'Embeddings & Similarity',
    minutes: 30,
    tagline: 'Turn meaning into geometry — the most reused idea in applied AI.',
  takeaways: ["Embeddings turn meaning into geometry — similar things land close together.", "Cosine similarity measures direction agreement, which is why it beats raw distance for text.", "Retrieval quality is embedding quality: failures upstream are search failures downstream."],
    pre: {
      q: 'Warm-up from the math track: what is the dot product of (3, 4) · (4, 3)?',
      options: ['12', '24', '25'],
      answer: 1,
      explain: '3×4 + 4×3 = 24. If that felt slow, the linear algebra module has a refresh — you will use dot products constantly from here on.',
    },
    simple: [
      'An embedding is a list of numbers (a vector) that represents the meaning of a piece of text. The trick: texts with similar meanings get vectors that point in similar directions. "Cats chase laser pointers" and "Felines pursue blinking lights" are different words, but their vectors end up close together — while "Interest rates rose this quarter" points somewhere entirely different.',
      'Nobody types these numbers by hand. An embedding model (a small neural network) is trained on huge amounts of text so that it produces this geometry. Once you have vectors, "how similar are these two texts?" becomes arithmetic you already know: multiply and add.',
    ],
    intuition: {
      analogy: 'A library where shelves are arranged by meaning, not alphabet.',
      paragraphs: [
        'Every book gets a position on a giant map: cooking books cluster in one region, astrophysics in another, and a book about "the chemistry of cooking" sits between them. To find books similar to yours, you do not read every book — you look at what is nearby on the map.',
        'A vector is just coordinates on that map (with hundreds of dimensions instead of two). Cosine similarity answers "how close to the same shelf?" — and search, RAG retrieval, deduplication, and agent memory are all, at heart, "find me the neighbours".',
      ],
    },
    technical: [
      'An embedding model f: text → ℝᵈ maps sequences to d-dimensional vectors (384–3,072 dims are typical). Training objectives (contrastive losses, masked-language objectives) shape the space so semantically related inputs land near each other; normalising vectors to unit length makes dot product equal cosine similarity.',
      'Cosine similarity cos(a, b) = a·b / (|a||b|) measures the angle between vectors: 1 = same direction, 0 = unrelated (orthogonal), −1 = opposite. Cosine ignores magnitude — useful because a long document is not "more about its topic" than a short one; length is not meaning.',
      'Search over millions of vectors uses approximate nearest neighbour indexes (HNSW and friends) that trade a little recall for orders-of-magnitude speed-up — the machinery behind every vector database you will meet in Phase 5.',
    ],
    deeper: [
      'Embedding models are trained with contrastive objectives: pull annotated paraphrase pairs together, push random (negative) pairs apart — InfoNCE loss is the common formulation. The quality of a retrieval system is largely decided by how well the embedding model\'s training distribution matches your documents; a model trained on web paragraphs may underperform on legal text or code without domain-tuned alternatives.',
      'HNSW (Hierarchical Navigable Small World) indexes build layered proximity graphs: upper layers are sparse "highways" for long jumps, lower layers dense for precision. Search descends greedily layer by layer — O(log n) hops in practice, at the cost of memory-heavy graphs and no exact guarantees. That is the concrete meaning of "approximate" nearest neighbour, and why vector DBs expose an ef_search dial trading recall for latency.',
      'Why cosine rather than dot product or Euclidean? With unit-normalised vectors, all three give identical rankings — the choice is really about raw vectors, where magnitude encodes length/token-count signal you usually do not want ranking your results. The professional habit: normalise once at ingest, then think purely in angles.',
    ],
    numbers: {
      title: 'Cosine similarity by hand — 2 dimensions',
      rows: [
        ['a = (3, 4), b = (4, 3)', 'two short "documents"'],
        ['a · b = 3×4 + 4×3', '= 24'],
        ['|a| = √(3²+4²) = 5, |b| = 5', 'both length 5'],
        ['cos = 24 / (5×5)', '= 0.96 → about 16° apart'],
        ['a vs c = (−4, 3): a·c = 0', 'cos = 0 → unrelated'],
      ],
      takeaway:
        'With unit-length vectors (most embedding APIs normalise), cosine similarity is just a dot product — one matrix multiply compares a query against every document at once. Try it below with your own vectors.',
    },
    demo: 'vector-sim',
    walkthrough: {
      lang: 'python',
      code: `from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")

docs = ["Cats chase laser pointers.",
        "Felines pursue blinking lights.",
        "Interest rates rose this quarter."]

V = model.encode(docs, normalize_embeddings=True)

sim = V @ V.T
print(np.round(sim, 2))`,
      notes: [
        ['SentenceTransformer("all-MiniLM-L6-v2")', 'A small, free, local embedding model: 384 dimensions, ~80MB, good enough for prototypes. Big retrieval quality comes later from better models + chunking.'],
        ['model.encode(docs, normalize_embeddings=True)', 'Embeddings as rows of a matrix, scaled to length 1 — which makes the next line legal.'],
        ['sim = V @ V.T', 'The entire semantic-search computation: every document against every other. With a query vector q, it is V @ q — one line is a search engine.'],
        ['print(np.round(sim, 2))', 'Prints ≈ [[1.0, 0.75, 0.09], [0.75, 1.0, 0.10], [0.09, 0.10, 1.0]] (approx.): paraphrases score high, finance scores near zero — the geometry you just dragged around above.'],
      ],
    },
    exercise: {
      prompt:
        'By hand, compute the cosine similarity of a = (2, 1) and b = (1, 2). Then predict (before calculating) whether (2,1) and (−2,−1) score higher or lower than (2,1) and (1,2) — and check yourself.',
      solution: `a·b = 2×1 + 1×2 = 4
|a| = |b| = √5, so |a||b| = 5
cos = 4/5 = 0.8   (≈ 37°)

(2,1) vs (−2,−1): dot = −4−1 = −5, cos = −5/5 = −1 → exactly opposite.
Direction carries meaning; the opposite vector is the "anti-document".
This is also why cosine ignores length: (4,2) vs (1,2) still scores 0.8
because (4,2) points the same way as (2,1).`,
    },
    quiz: [
      {
        q: 'Compute cos((2,1), (1,2)).',
        options: ['0.6', '0.8', '1.0', '0'],
        answer: 1,
        explain: 'Dot = 4, norms √5·√5 = 5, so 4/5 = 0.8. Same words-in-common energy, same direction-ish — "related, not identical".',
      },
      {
        q: 'A cosine similarity of exactly 1 means…',
        options: [
          'The texts are identical strings',
          'The vectors point in the same direction (maximally similar meaning)',
          'The vectors are orthogonal',
          'The model is 100% confident',
        ],
        answer: 1,
        explain:
          'Identical strings do score 1, but so do scaled versions of the same direction — cosine measures angle only. And no similarity score is a confidence statement about truth.',
      },
      {
        q: 'Why prefer cosine similarity over Euclidean distance for text retrieval?',
        options: [
          'It is faster to compute',
          'It works in any dimension',
          'Vector length often reflects document length, not meaning — cosine ignores length',
          'Euclidean distance cannot be negative',
        ],
        answer: 2,
        explain:
          'A long document is not "more about" its topic. Cosine compares directions, discarding magnitude noise (especially after normalisation, when both are equivalent anyway).',
      },
    ],
    realWorld: [
      'Your Netflix recommendation project used collaborative filtering ("users like you liked…"); embeddings add content-based similarity ("items like this…"). Modern recommenders blend both.',
      'Every RAG system (Phase 5) is this lesson at scale: embed chunks once, embed the query, take the top-k neighbours, and hand them to the LLM as context.',
      'Agent memory (Phase 6) uses the same trick: past conversations are embedded and retrieved when relevant, instead of stuffing everything into the context window.',
    ],
    further: [
      { label: 'Hugging Face — Embeddings docs', url: 'https://huggingface.co/docs/transformers/llm_tutorial', note: 'From the team behind sentence-transformers; the models page ranks embeddings by benchmark.' },
      { label: 'Hugging Face NLP Course', url: 'https://huggingface.co/learn/nlp-course', note: 'Free; chapters 1–2 give the model-side view of what you just used.' },
      { label: 'OpenAI — Embeddings guide', url: 'https://developers.openai.com/api/docs/guides/embeddings', note: 'The API-side view: the same math as a managed service.' },
    ],
  },
]
