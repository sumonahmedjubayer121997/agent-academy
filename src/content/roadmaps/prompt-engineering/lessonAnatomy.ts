import type { Lesson } from '../../types'

/** Third exemplar lesson — the module the dogfood plan reaches next. */
export const ANATOMY_LESSON: Lesson = {
  id: 'anatomy-of-a-prompt',
  moduleId: 'pe-anatomy',
  title: 'Anatomy of a Prompt',
  minutes: 25,
  tagline: 'Most bad prompts are good ingredients in the wrong order — or missing entirely.',
  takeaways: ["Four parts, one job each: Instruction, Context, Input, Output format.", "Diagnose by missing part — unparseable output means a missing format line, not bad wording.", "Instructions first, delimited data last: the contract is set before the noise arrives."],
  relatedPractice: "pe-pp-anatomy-audit",
  pre: {
    q: 'Why can rewording a prompt change the output even at temperature 0?',
    options: [
      'The model re-randomizes on every call',
      'Different wording is a different token sequence, so the probabilities differ',
      'Temperature 0 only works on short prompts',
      'Providers add hidden instructions',
    ],
    answer: 1,
    explain:
      'The model predicts the next token from the exact token sequence it received. Same meaning, different wording = different tokens = different probabilities. Recall this whenever you are tempted to "just rephrase" a working prompt.',
  },
  simple: [
    'A well-formed prompt has four parts, and each has one job: the Instruction states the task, the Context carries the durable rules, the Input is the thing to operate on, and the Output format defines the shape of the answer.',
    'When a prompt misbehaves, diagnose by part. Vague results point to a weak Instruction. Contradictions point to Context spread across the wrong places. The model inventing structure points to a missing Output format. The model confusing your data with your instructions points to unmarked Input.',
    'Order matters more than politeness. Instructions first, context second, input last: the contract is set before the noise arrives, and everything after the instruction is read in its light.',
    'The skeleton is also your debugging checklist. When output disappoints, label each sentence of your prompt as one of the four parts. Unlabeled sentences are usually the problem — they are doing a job nobody assigned.',
    'The skeleton composes. Every later pattern in this roadmap — few-shot examples, retrieved documents, schemas — is just a part added to this frame, never a replacement for it.',
  ],
  intuition: {
    analogy: 'A prompt is a lab requisition slip, not a letter to a friend.',
    paragraphs: [
      'A requisition slip has printed fields: patient, test, sample, reporting format. Nobody fills it out with pleasantries, and nobody wonders where the sample goes. The lab (the model) processes hundreds of slips a day and needs zero context about you to act correctly.',
      'When you write a letter, the reader infers intent. When you fill a slip, the fields enforce it. Prompts that behave like slips are debuggable — a wrong result points at a wrong field. Prompts that behave like letters are mysteries.',
    ],
  },
  technical: [
    'Instruction: one sentence with one verb where possible ("Extract…", "Classify…", "Rewrite…"). Multiple verbs in one instruction is the top source of half-done tasks; split them into steps or separate calls.',
    'Context: durable rules the model needs across calls (enum definitions, style rules, domain constraints). Context belongs in the system message when it is stable — higher role precedence, cached prefixes, and it stops the rules competing with per-call user content.',
    'Input: the per-call data, always delimited (tags, triple quotes, fences). Delimiters are the boundary that keeps data from being read as instructions — the same boundary that later becomes your first injection defense.',
    'Output format: state it as a contract, exactly as a consumer would ("exactly one JSON object with keys …; no prose; no markdown fences"). The format line is the single highest-leverage sentence for variance reduction, because it collapses the space of acceptable continuations.',
    'Failure patterns by missing part: no instruction → generic output; no context → invented rules; no delimiters → data/role confusion; no format → unparseable prose. Name the missing part before editing any words.',
  ],
  deeper: [
    'Role mapping: in chat APIs the skeleton maps onto roles — Context (durable rules) into the system message, Instruction + Input + Format into the turn, or Instruction + Format into developer/user structure when the provider supports it. Higher-priority roles win conflicts, which is exactly why durable rules must not live in the user turn.',
    'Position effects: instruction adherence is strongest at the start and end of the window. A format spec buried in the middle of a long prompt measurably loses compliance — one more reason the contract goes first and the data goes last.',
    'Entropy view: an explicit output format removes degrees of freedom from the continuation. That is why format constraints reduce variance more than tone instructions — they eliminate classes of possible outputs rather than reweighting them.',
  ],
  numbers: {
    title: 'Failure triage by missing part (the shape you will see in practice)',
    rows: [
      ['No output format', 'parse failures and length swings — highest-frequency failure'],
      ['No delimiters on input', 'instructions inside data get obeyed — injection surface'],
      ['No context', 'invented rules and enums — plausible but wrong values'],
      ['No single instruction', 'half-done tasks — model picks the easier verb'],
    ],
    takeaway: 'Before touching wording, label every sentence with its part. The unlabeled ones are the bug.',
  },
  demo: 'anatomy-builder',
  walkthrough: {
    lang: 'ts',
    code: `// Building the skeleton in code — parts assembled deliberately, not typed ad hoc.
interface PromptParts { instruction: string; context?: string; input: string; format: string }

function buildPrompt(p: PromptParts): { system: string; user: string } {
  return {
    // Durable rules belong to the system role: precedence + cacheable prefix
    system: p.context ?? '',
    user: [
      p.instruction,                    // 1. the task — one verb
      \`\n<email>\${p.input}</email>\`,   // 2. the data — delimited
      \`\n\${p.format}\`,                 // 3. the contract — restated last
    ].join('\n'),
  }
}

const { system, user } = buildPrompt({
  instruction: 'Extract sender, email, and urgency from the support email below.',
  context: 'Urgency: urgent (today), normal (this week), low (whenever). Unstated deadline means normal.',
  input: 'Hi, this is Dana from Acme. Dashboard blank since 9am, client demo at 4pm today! dana@acme.co',
  format: 'Return exactly one JSON object: sender (string), email (string), urgency ("urgent"|"normal"|"low").',
})`,
    notes: [
      ['system: p.context', 'Durable rules go to the system role — they outrank user content and prefix-cache across calls.'],
      ['<email>…</email>', 'The delimiter is the boundary between data and instructions; without it, instructions inside the email get obeyed.'],
      ['instruction first', 'The task leads so every later token is read in its light; format is restated last so it sits at the high-attention end.'],
      ['buildPrompt(parts)', 'Assembling in code beats typing prompts by hand: parts become reviewable, testable, and diffable — a theme AI Programming will industrialize.'],
    ],
  },
  exercise: {
    prompt:
      'Take three prompts from your earlier anatomy audit (or any three real ones). For each: (1) label every sentence as Instruction / Context / Input / Format, (2) rewrite the unlabeled or mixed sentences into exactly one part, (3) run before and after on the same inputs. Record which single part-fix changed the output most — and whether any prompt got worse when you added a part it did not have.',
    solution:
      'The typical outcome: adding a Format line produces the biggest visible change (structure stabilizes immediately); re-delimiting input fixes the strangest failure modes (the model stops obeying instructions found inside the data). A prompt can get worse when Context is added that contradicts what the instruction implies — that is the diagnostic that Context is a rule layer, not a place for extra wishes.',
  },
  quiz: [
    {
      q: 'Output is technically correct but unparseable by your program. Which part is most likely missing or weak?',
      options: ['Instruction', 'Context', 'Output format', 'Delimiters on input'],
      answer: 2,
      explain:
        'Unparseable-but-correct output means the model was never told the shape the consumer needs. The format line is the contract; without it, prose is a reasonable answer and parsing is hope-based.',
    },
    {
      q: 'Where do durable rules (enum definitions, style constraints) belong, and why?',
      options: [
        'Restated in full in every user turn — repetition is safest',
        'The system message — higher role precedence and a cacheable prefix',
        'Inside the input data so they travel with it',
        'Nowhere — the model infers rules',
      ],
      answer: 1,
      explain:
        'System-role rules outrank user content in conflicts and form a stable, cacheable prefix. Restating rules per-turn invites drift and token waste; hiding rules in data is how they get lost or obeyed at the wrong time.',
    },
    {
      q: 'A model obeyed an instruction that was inside the pasted email. Which part failed?',
      options: ['Instruction was too long', 'Input was not delimited', 'Format was implicit', 'Context was in the user turn'],
      answer: 1,
      explain:
        'Undelimited input merges with instructions, so anything in the data can be read as a command. The delimiter marks the boundary — and is the first layer of every injection defense you will build later.',
    },
  ],
  realWorld: [
    'Support triage: one skeleton, thousands of emails a day — the format line is what lets a script consume the result without a human reading it.',
    'Compliance extraction: the context part carries the enum definitions (urgency levels, categories) so the model classifies against the official taxonomy, not an invented one.',
    'Prompt reviews: teams diff prompts like code once they are assembled from labeled parts — a change to Context stops silently editing Input.',
  ],
  further: [
    {
      label: 'Anthropic — prompt engineering: structuring prompts',
      url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',
      note: 'Provider guidance on structure, ordering, and XML-style delimiters for data.',
    },
    {
      label: 'OpenAI — six strategies for better prompting',
      url: 'https://platform.openai.com/docs/guides/prompt-engineering',
      note: 'The "tactic" sections map almost one-to-one onto the four anatomy parts.',
    },
    {
      label: 'Prompt patterns catalogue (White et al.)',
      url: 'https://arxiv.org/abs/2302.11382',
      note: 'Academic catalogue of prompt patterns — good browsing once the skeleton is instinct.',
    },
  ],
}
