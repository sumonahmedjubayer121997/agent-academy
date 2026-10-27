import type { Lesson } from '../../types'

/**
 * Exemplar lessons for Chatbot Development — the nine-layer format.
 * Lesson 1 grounds the per-turn mental model every later phase uses;
 * lesson 2 teaches the grounding contract by judgment.
 */
export const LESSONS: Lesson[] = [
  {
    id: 'what-the-model-gets-each-turn',
    moduleId: 'cb-turn-anatomy',
    title: 'What the Model Gets Each Turn',
    minutes: 25,
    tagline: 'A conversation is not memory — it is re-assembly, every single turn.',
    takeaways: [
      'Every turn re-sends an assembled context: persona, slots, retrieval, history, message — the model remembers nothing between calls.',
      'Structured slots survive because they are stored and re-injected; prose history survives only until the budget cuts it.',
      'The context budget is spent per turn — full history makes turn N cost N times, which is why compaction exists.',
    ],
    pre: {
      q: 'A prompt is the entire world for one call. What does that imply about turn 10 of a chat?',
      options: [
        'The model remembers turns 1-9 automatically',
        'Turn 10 only works if you RE-SEND whatever of turns 1-9 it needs — nothing carries over by itself',
        'Conversations are a special mode with memory',
        'The channel stores the memory for you',
      ],
      answer: 1,
      explain:
        'Chat feels continuous because your code makes it so: each call is stateless, and the context you assemble per turn is the only continuity that exists.',
    },
    simple: [
      'A chatbot conversation feels like one continuous discussion. Technically it is a series of independent, stateless model calls — each turn you build the entire context from scratch.',
      'The assembly has fixed ingredients: the persona and rules (system), the structured state (slots and constraints), retrieved sources for this question, the recent turns, and the new message.',
      'Because everything is re-sent, conversation has a per-turn cost curve: turn twenty with full history re-sends twenty turns of text. That is why long chats get expensive and eventually hit the window.',
      'The fix is not a bigger window — it is separating what deserves to persist. Structured facts live in slots and are re-injected cheaply. Prose history gets windowed and then summarized. Constraints get first-class storage.',
      'Once you see the assembly, chatbot bugs become readable: a forgotten instruction is a storage bug, a wrong answer is a retrieval bug, and a drifting persona is an assembly bug.',
    ],
    intuition: {
      analogy: 'Each turn is a new amnesiac expert handed a dossier: a brief, their notes, the relevant files, and the last few pages of the meeting transcript.',
      paragraphs: [
        'The expert (model) is brilliant but remembers nothing between consultations. Your bot is the assistant who prepares the dossier before every single consult — and the quality of the chatbot IS the quality of that dossier assembly.',
        'A good assistant includes the standing decisions (slots), the rule the client set an hour ago (constraints), the file relevant to this question (retrieval), and only the recent transcript — not a dump of everything ever said.',
      ],
    },
    technical: [
      'Per-turn assembly, concretely: system = persona + rules + stored constraints; user block = summary of old turns + recent turns verbatim + retrieved chunks + the new message. Every ingredient is your code making a decision.',
      'Cost math: with full history, turn N costs roughly the sum of all previous turns. At ~300 tokens per exchange, turn 30 carries ~9,000 tokens of history — before retrieval. The degradation ladder (window → summarize → drop) bends this curve.',
      'Why slots beat prose: "order 55421" buried in turn 4 prose costs a full re-read and can be lost in summarization; as a slot it is 3 tokens, exactly correct, and trivially testable.',
      'Constraints are the highest-value persistence: a rule set on turn 3 ("bullet points only") must be re-injected every turn from storage — never trusted to survive inside a summary.',
      'Retrieval is per-turn and query-dependent: it must handle follow-up references by rewriting the query with the prior turn, or "the second one" retrieves nothing.',
    ],
    deeper: [
      'This assembly loop IS the architecture pattern behind every agent framework — the chatbot turn is the agent loop with conversation as its interface. Learn it here and agents stop being magic.',
      'KV-prefix caching rewards stable prefixes: persona + rules first (identical every turn) means the provider can reuse computation for that prefix — one more reason durable content goes at the front.',
      'The loss curve of summarization is asymmetric: summaries preserve topics and decisions well, exact numbers and constraints poorly — which is exactly why numbers live in slots and constraints in their own store.',
    ],
    numbers: {
      title: 'The assembly cost curve (illustrative ~300-token exchanges)',
      rows: [
        ['Turn 5, full history', 'history ~1,500 tok + persona 150 + retrieval ~800'],
        ['Turn 20, full history', 'history ~6,000 tok — retrieval is now the small half'],
        ['Turn 20, window 6 + summary', 'history ~1,900 tok — the curve flattens'],
        ['Constraint stored as slot vs prose', '3 tokens re-injected vs 300-token history read'],
      ],
      takeaway: 'The window is a budget; slots and summaries are how you stop paying twice for the same words.',
    },
    demo: 'chat-turn-stepper',
    walkthrough: {
      lang: 'ts',
      code: `// The per-turn assembly — the beating heart of every chatbot.
interface TurnContext {
  system: string
  slots: Record<string, string>      // structured, stored, trusted
  constraints: string[]              // user rules: first-class, always re-injected
  summary: string                    // old turns, compacted
  recentTurns: Message[]             // verbatim, windowed
  retrieved: Chunk[]                 // THIS turn's question, rewritten if follow-up
  userMessage: string
}

function assembleTurn(ctx: TurnContext): Message[] {
  return [
    {
      role: 'system',
      content: [
        PERSONA,
        ...ctx.constraints.map((c) => \`User rule: \${c}\`),  // survives forever
        \`Known facts: \${JSON.stringify(ctx.slots)}\`,
      ].join('\\n'),
    },
    // stable prefix ends here: persona + rules + slots (cache-friendly)
    { role: 'user', content: [
        ctx.summary ? \`[earlier]\\n\${ctx.summary}\\n\\n\` : '',
        ...ctx.recentTurns.map((m) => \`\${m.role}: \${m.text}\`),
        ...(ctx.retrieved.length
          ? ['\\n[sources]\\n' + ctx.retrieved.map((c) => c.text).join('\\n---\\n')]
          : []),
        \`\\n[user]\\n\${ctx.userMessage}\`,
      ].join('\\n') },
  ]
}`,
      notes: [
        ['constraints.map', 'User rules re-injected verbatim EVERY turn from storage — the turn-3 rule holds at turn 50 because it never depended on history.'],
        ['JSON.stringify(ctx.slots)', 'Slots travel as 3-token facts, not prose to be re-parsed — cheap, exact, testable.'],
        ['stable prefix ends here', 'Persona + rules + slots are identical across turns: prefix-cacheable, which is why durable content goes first.'],
        ['[sources] block', 'Retrieval is per-turn and per-question — and only enters the assembly if the question needs it.'],
        ['assembleTurn', 'Every chatbot framework you will meet is this function wearing a costume — Phase 4 of AI Agents rebuilds it bare-metal.'],
      ],
    },
    exercise: {
      prompt:
        'Take any real chatbot conversation (yours, 8+ turns). Reconstruct the per-turn assembly for THREE turns of it: list the ingredients you believe were sent (persona, slots, retrieval, history, message), estimate token counts, and mark where the assembly must have failed (a forgotten instruction, a repeated question). Then design the slot + constraint storage that would have prevented each failure.',
      solution:
        'The typical finding: one forgotten constraint (no storage — fix: first-class constraints), one repeated question (retrieval missed a follow-up reference — fix: query rewriting with the prior turn), and one cost surprise at later turns (full history — fix: window + summary ladder). A strong answer names which ingredient failed per bug, not just the symptom.',
    },
    quiz: [
      {
        q: 'A user instruction from turn 3 is ignored by turn 25. The most likely cause?',
        options: [
          'The model got worse over time',
          'The instruction lived only in history, and the window or summary dropped it — constraints need first-class storage',
          'The channel stripped it',
          'Retrieval failed',
        ],
        answer: 1,
        explain:
          'Nothing persists between calls. Instructions that matter must be stored as constraints and re-injected every turn; history is a losing storage strategy for rules.',
      },
      {
        q: 'Why put the persona and rules at the START of the assembly?',
        options: [
          'It looks better',
          'A stable identical prefix is cacheable and sets the frame before noisy content arrives',
          'Providers require it',
          'It reduces tokens',
        ],
        answer: 1,
        explain:
          'Identical prefixes let providers reuse computation (KV caching), and instructions-first means everything after is read in their light — position matters.',
      },
      {
        q: 'Turn 20 with full history is costing too much. The first tool to reach for is…',
        options: [
          'A bigger context window',
          'The degradation ladder: window recent turns, summarize older ones, drop lowest-value content',
          'Shorter answers',
          'Fewer users',
        ],
        answer: 1,
        explain:
          'The ladder flattens the cost curve structurally. A bigger window treats the symptom and the per-turn bill keeps growing anyway.',
      },
    ],
    realWorld: [
      'Support bots: the order number lives in a slot, not in the hope that turn 14 of history is still in the window.',
      'Assistants with preferences: "always bullet points" is a stored constraint re-injected every turn — users notice exactly when it breaks.',
      'Cost incidents: a chatbot that quietly sent full history for 60-turn conversations — the invoice found it before the evals did.',
    ],
    further: [
      {
        label: 'OpenAI — conversations vs single calls',
        url: 'https://platform.openai.com/docs/guides/text-generation',
        note: 'The conversation shape as providers define it: stateless calls, client-side history.',
      },
      {
        label: 'Anthropic — managing the context window',
        url: 'https://docs.anthropic.com/en/docs/build-with-claude/context-windows',
        note: 'Provider guidance on compaction strategies — pairs with our preservation checklist.',
      },
      {
        label: 'LangChain — memory concepts',
        url: 'https://python.langchain.com/docs/concepts/memory/',
        note: 'Industry framing of the same ideas (window, summary, entity memory) — compare with our slot/constraint model.',
      },
    ],
  },
  {
    id: 'grounded-cited-or-silent',
    moduleId: 'cb-grounding-contract',
    title: 'Grounded, Cited, or Silent',
    minutes: 30,
    tagline: 'A chatbot may do three things with a question: answer from sources with citations, or say it cannot.',
    takeaways: [
      'The grounding contract: answer ONLY from provided sources with citations — or refuse; invention is the one unforgivable failure.',
      'The deadliest failure is plausible + cited + false: an invented claim wearing a citation badge.',
      'Refusal rate is measured per class (absent, ambiguous, out-of-scope) and tuned in BOTH directions — over-refusal fails users too.',
    ],
    pre: {
      q: 'What does the grounding contract say about questions the sources do not answer?',
      options: [
        'Answer from the model general knowledge',
        'Refuse honestly, ideally offering where to look — never invent',
        'Guess with a disclaimer',
        'Route to a human always',
      ],
      answer: 1,
      explain:
        'The contract has two halves: grounded answers AND honest refusal. A bot that cannot say "not in my sources" will eventually invent — that is the failure this module designs out.',
    },
    simple: [
      'Users do not forgive invention. They forgive "I cannot find that in my sources — here is where to check" remarkably well. Trust in a chatbot is built on the second behavior.',
      'The grounding contract is one instruction backed by machinery: answer ONLY from the provided sources, cite every claim, and refuse what the sources do not support.',
      'Citations are not decoration — they make every claim checkable by the user and by your eval suite. A citation that does not resolve, or resolves to text that does not support the claim, is a bug you can test for.',
      'Refusal is a designed behavior with classes: absent (sources say nothing), ambiguous (sources conflict or are unclear), and out-of-scope (not the bot job). Each gets its own script, and each script offers an alternative.',
      'The failure you must hunt hardest is the plausible one: a confident, well-formatted, correctly-cited answer that the source does not actually support. Vibes-checking finds these; judgment drills and eval sets catch them.',
    ],
    intuition: {
      analogy: 'A grounded chatbot is a librarian, not an oracle.',
      paragraphs: [
        'Ask a librarian about a book not in the catalog: they say it is not there and suggest where else to look. They do not improvise a summary from the title. The value IS the boundary — you trust the catalog because the librarian respects it.',
        'An oracle answers everything with equal confidence; that confidence is indistinguishable whether the answer comes from the shelf or from imagination. Users learn quickly which one they are talking to.',
      ],
    },
    technical: [
      'The contract in the prompt: "Answer ONLY from the [sources] block. Cite each claim with [n] markers tied to the provided chunks. If the sources do not contain the answer, reply exactly: NOT_IN_SOURCES plus one sentence on what WOULD help." A parseable refusal string makes honesty machine-measurable.',
      'Citation machinery: markers must map to chunk ids you supply; a verifier asserts every marker resolves AND spot-checks support. Dangling or unsupported citations fail the build, not the user.',
      'Refusal measurement: score three question classes separately — answerable (should ground, zero inventions), ambiguous (should hedge or ask), absent (should refuse). One aggregate number hides exactly the trade you care about.',
      'The follow-up problem: retrieval must rewrite references ("the second one") with the prior turn before it can ground the answer — grounding fails as a retrieval bug half the time.',
      'Injection interaction: sources are untrusted text. The grounding contract also binds the ANSWER to sources and never lets source text escalate into instructions — the first line of injection defense in a chatbot.',
    ],
    deeper: [
      'Faithfulness metrics: groundedness can be scored automatically — entailment-style checks or an LLM judge asking "is this sentence supported by chunk n?" — but a judge is an instrument, and instruments get calibrated against your own labels.',
      'The economics of refusal: every point of over-refusal pushes users to worse channels (human load) or worse sources; every point of under-refusal ships hallucinations. The threshold is a product decision with numbers attached, not a prompt tweak.',
      'Confidence is not calibration: the model is equally fluent whether grounded or inventing. Fluency-based trust ("it sounded sure") is precisely the failure mode the contract exists to replace.',
    ],
    numbers: {
      title: 'The scorecard shape you should be able to produce',
      rows: [
        ['Answerable set (20 q)', 'grounded: 19-20 · invented: 0 · citations resolve: 100%'],
        ['Absent set (10 q)', 'refused: 8+ · invented: 0'],
        ['Ambiguous set (10 q)', 'hedged or clarified: most · confidently wrong: 0'],
        ['The hunt', 'plausible-but-unsupported answers found by judgment drill, added to eval'],
      ],
      takeaway: 'Zero inventions on the answerable set is the bar; refusal rate on the absent set is the dial; the ambiguous set is where judgment lives.',
    },
    demo: 'grounding-check',
    walkthrough: {
      lang: 'python',
      code: `GROUNDING_CONTRACT = \"\"\"
Answer ONLY from the [sources] block.
- Cite every factual claim with [n] tied to the chunk ids given.
- If the sources do not contain the answer, reply exactly:
  NOT_IN_SOURCES — then one sentence naming what document WOULD help.
- Never merge general knowledge into a cited claim.
\"\"\"

NOT_IN_SOURCES = "NOT_IN_SOURCES"

def chat grounded(question: str, history, store) -> str:
    chunks = retrieve(rewrite(question, history.last_turn))   # follow-ups resolved
    answer = llm(system=PERSONA + GROUNDING_CONTRACT,
                  sources=[c.text for c in chunks], question=question)
    if answer.startswith(NOT_IN_SOURCES):
        metrics.refusals += 1                                  # honest, measured
        return answer + nearest_alternative(question)
    bad = dangling_citations(answer, chunks)                   # [3] with no chunk 3
    unsupported = spot_check_support(answer, chunks, k=2)      # judge: does n support it?
    if bad or unsupported:
        log_grounding_failure(question, bad or unsupported)
        return NOT_IN_SOURCES + " — verifying this answer failed."
    return answer`,
      notes: [
        ['NOT_IN_SOURCES marker', 'A parseable refusal turns honesty into a metric your eval suite can gate on — no regex heroics on prose.'],
        ['rewrite(question, ...)', 'Grounding fails as a retrieval bug half the time: references must be resolved BEFORE retrieval can supply the right chunks.'],
        ['dangling_citations', 'Every [n] must resolve to a real chunk — this check alone kills a whole class of confident fakes.'],
        ['spot_check_support', 'The deep check: does chunk n actually support the claim? Sampled, judged, logged — this is where plausible-but-false answers die.'],
        ['nearest_alternative', 'Refusals redirect: where COULD the user look? A refusal that offers a path preserves the conversation.'],
      ],
    },
    exercise: {
      prompt:
        'Build the three-class scorecard for a bot over a corpus you know: 20 answerable, 10 absent, 10 ambiguous questions. Run them, mark every answer grounded / invented / refused (by your own judgment first — the demo drill is the training). Then hunt: find ONE plausible-but-unsupported answer, add it to the eval set with the reason, and patch the contract or retrieval that allowed it. Report the before/after table.',
      solution:
        'A strong answer: zero inventions on the answerable set, refusal rate on the absent set stated as a number, the ambiguous set mostly hedged — plus the one caught plausible-fake with its fix (usually retrieval granularity or an over-permissive contract line). The habit being trained is the judgment: reading a cited answer and asking WHERE exactly the source says that.',
    },
    quiz: [
      {
        q: 'The most dangerous grounding failure is…',
        options: [
          'An obviously wrong answer',
          'A plausible, well-formatted, cited answer the source does not support',
          'A refusal',
          'A slow answer',
        ],
        answer: 1,
        explain:
          'Obvious errors get caught; confident fakes wearing citation badges pass vibes-checks and erode trust silently. Spot-check support, not just citation resolution.',
      },
      {
        q: 'Why make the refusal a fixed, parseable string?',
        options: [
          'It sounds more professional',
          'It turns honesty into a machine-measurable metric your evals can gate on',
          'Users prefer caps',
          'It saves tokens',
        ],
        answer: 1,
        explain:
          'NOT_IN_SOURCES as an exact marker means refusal rate is a count, not a judgment call — the contract becomes enforceable in CI.',
      },
      {
        q: 'Refusal rate on absent questions is 100%. Your next move?',
        options: [
          'Celebrate — honesty achieved',
          'Check the ambiguous set: you are almost certainly over-refusing answerable-but-imperfect questions',
          'Loosen the contract entirely',
          'Add more sources',
        ],
        answer: 1,
        explain:
          '100% on absent is the goal, but it usually drags ambiguous (and some answerable) questions into refusal too. Tune per class — the dial is not one number.',
      },
    ],
    realWorld: [
      'Support bots: the policy page IS the source of truth — the contract is what stops the bot improvising refund terms under pressure.',
      'Internal knowledge bots: "not in the docs, here is the team to ask" beats a confident guess that starts a wrong process.',
      'Legal and medical adjacent products: grounded-cited-or-silent is not a feature there — it is the license to operate.',
    ],
    further: [
      {
        label: 'Anthropic — grounded generation and citations',
        url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',
        note: 'Provider techniques for source-tied answers; compare with our verifier approach.',
      },
      {
        label: 'RAGAS — faithfulness metric',
        url: 'https://docs.ragas.io/',
        note: 'Automated groundedness scoring — useful AFTER you can measure refusals by marker.',
      },
      {
        label: 'Our AI Agents roadmap — RAG pipeline modules',
        url: 'https://agent-academy-peach.vercel.app/r/ai-agents/curriculum',
        note: 'The retrieval engineering behind the sources this contract depends on.',
      },
    ],
  },
]
