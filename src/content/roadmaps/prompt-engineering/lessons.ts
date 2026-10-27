import type { Lesson } from '../../types'
import { ANATOMY_LESSON } from './lessonAnatomy'

/**
 * Exemplar lessons for Prompt Engineering — the same nine-layer retention
 * format as the AI Agents roadmap. Module 1 grounds the mental model every
 * later phase relies on; module 2 teaches the workhorse pattern (structured
 * output with validation and repair).
 */
export const LESSONS: Lesson[] = [
  {
    id: 'what-the-model-sees',
    moduleId: 'pe-mental-model',
    title: 'What the Model Actually Sees',
    minutes: 25,
    tagline: 'A prompt is not a message to a person — it is the entire world, for exactly one call.',
    simple: [
      'When you send a prompt, the model does not remember you, your previous chats, or your intentions. Everything it knows this turn is the exact text you sent — nothing more.',
      'That text is first chopped into tokens: word pieces of roughly four characters each. "Unbelievable" might be three tokens; "the" is one. The model never sees letters or spacing the way you do — only this token sequence.',
      'The model then does one job: predict the next token, again and again, until it decides to stop. Every word it writes is chosen from probabilities computed over everything you gave it.',
      'This is why two wordings of the "same" request produce different answers. They are different token sequences, so the probabilities differ — even at temperature 0.',
      'And it is why structure beats politeness. A clear instruction, well-separated data, and an explicit output format change the probabilities far more reliably than "please" or "you are the world\'s best expert".',
    ],
    intuition: {
      analogy: 'The model is a brilliant consultant with amnesia who reads exactly one brief.',
      paragraphs: [
        'Imagine hiring a genius consultant who, each morning, has forgotten every previous meeting. You communicate only by sliding a single sheet of paper under their door, and they slide back one answer. That sheet is your prompt.',
        'A vague sheet — "make our product sound good" — gets a generic answer, because the consultant must guess everything you left unsaid. A precise sheet — audience, length, tone, format, the source material, clearly marked — gets the answer you actually wanted, because all of it is on the one page they will ever see.',
        'The sheet also has a size limit (the context window). If you stuff it with irrelevant pages, the important lines do not get "read more carefully" — they compete with noise. Budgeting that page is a core skill of this roadmap.',
      ],
    },
    technical: [
      'A prompt enters a chat-shaped API as a list of messages with roles (system, developer, user, assistant). Higher-priority roles win when instructions conflict, which is why persistent rules belong in the system message, not re-sent per turn.',
      'The tokenizer maps your text to token ids. Tokenization explains several quirks: why models are bad at counting letters in a word, why "strawberry" puzzles them, and why a small wording change can shift output — it changes the token boundary structure.',
      'The context window is a hard budget counted in tokens. Model output also draws from it, so a 4,000-token answer in an 8,000-token window halves the room your input has.',
      'Attention is computed across the whole window, but not uniformly: position matters. Content buried in the middle of very long prompts is retrieved less reliably than content at the start or end — the "lost in the middle" effect you will reproduce in Phase 3.',
      'Temperature controls the randomness of sampling over the predicted distribution; it does not change what the model knows. At temperature 0 the same token sequence still yields the same output — which is why your test harnesses fix it.',
    ],
    deeper: [
      'At each step the model outputs a probability distribution over the vocabulary (often 50k-200k tokens) via a softmax over logits. Sampling at temperature T divides logit differences by T before the softmax: lower T sharpens the distribution, higher T flattens it.',
      'This is why temperature 0 is deterministic but not "correct" — it is greedy argmax over the same distribution. If the prompt is ambiguous, the most probable continuation may still be a guess.',
      'Some APIs expose the top logprobs per generated token. Reading them is the cheapest way to see whether the model was confident or coin-flipping — a tool you will use for eval diagnostics in Phase 4.',
    ],
    numbers: {
      title: 'Rough numbers worth internalising',
      rows: [
        ['1 token', 'approx. 4 characters of English, or 0.75 words'],
        ['Sliding-scale budget', 'a 100-word instruction is about 130 tokens'],
        ['Context windows in the wild', '8k, 32k, 128k+ tokens — but quality of use degrades before the hard limit'],
        ['Answer cost', 'output tokens are usually billed higher than input tokens'],
      ],
      takeaway:
        'Treat tokens as money: every example, every pasted document, and every generated word spends from the same budget.',
    },
    demo: 'context-inspector',
    walkthrough: {
      lang: 'ts',
      code: `import OpenAI from 'openai'
const client = new OpenAI() // key stays server-side in real apps

const VAGUE = 'Write about our product.'
const SPECIFIED = [
  'Write a 2-sentence product description.',
  'Audience: backend engineers. Tone: technical, no hype.',
  'Include exactly one concrete feature. Present tense.',
  'Output format: plain prose, no heading, no emoji.',
].join('\\n')

for (const temperature of [0, 1]) {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature,
    messages: [{ role: 'user', content: VAGUE }],
  })
  console.log(temperature, '->', res.choices[0].message.content)
}`,
      notes: [
        ['const VAGUE vs SPECIFIED', 'The vague prompt delegates every decision to the model, which maximises variance across runs.'],
        ['temperature: [0, 1]', 'Run each twice: temperature 0 with the same input is stable per provider, but the two prompts still differ — wording is part of the function.'],
        ['messages: [{ role: "user" }]', 'This call uses only a user message. In Phase 1 you will move persistent rules into the system role, where they outrank user-level content.'],
        ['key stays server-side', 'The call is shown client-side for brevity here; the platform rule is that provider keys live only in server environment variables.'],
      ],
    },
    exercise: {
      prompt:
        'Take one real prompt you have sent recently. Rewrite it twice: once adding only an explicit output format, once adding audience + length + format. Run all three versions at temperature 0 twice each and record the six outputs. What changed when you added constraints — and which single constraint changed the most?',
      solution:
        'Typical result: the format constraint alone removes structural variance (headings, lists, length swings appear or disappear), while audience + length changes word choice and content selection. The largest single lever is usually the explicit output format, because it constrains the highest-entropy part of the generation. If your outputs did not differ at all, your original prompt was probably already over-specified — try a vaguer one.',
    },
    quiz: [
      {
        q: 'You run the exact same prompt twice at temperature 0 and get different answers. What is the most likely explanation?',
        options: [
          'The model is probabilistic even at temperature 0',
          'The two requests were not the same token sequence — wording or message structure differed',
          'Temperature 0 only works for short prompts',
          'The API caches and perturbs results',
        ],
        answer: 1,
        explain:
          'At temperature 0, identical token sequences produce identical outputs on a fixed model version. Different outputs mean different input sequences — even an invisible difference like a trailing space changes the tokens.',
      },
      {
        q: 'Why does "lost in the middle" happen?',
        options: [
          'The API truncates the middle of long prompts',
          'Attention retrieves content at the start and end of long contexts more reliably than content buried mid-context',
          'Middle tokens cost more and get skipped',
          'It only affects prompts without system messages',
        ],
        answer: 1,
        explain:
          'It is a positional attention bias measured empirically in long-context research: retrieval quality dips for information in the middle of the window. Countermeasures: restructure, move key facts to the edges, or retrieve instead of stuffing.',
      },
      {
        q: 'Which change most reliably reduces output variance?',
        options: [
          'Adding "please" and a polite tone',
          'Telling the model it is the world expert',
          'Specifying the output format explicitly (length, structure, style rules)',
          'Raising the temperature for creativity',
        ],
        answer: 2,
        explain:
          'An explicit output format collapses the space of acceptable continuations. Politeness and persona claims barely move the distribution compared to concrete constraints.',
      },
    ],
    realWorld: [
      'Support-ticket triage: the same classifier prompt runs thousands of times a day; understanding variance is what makes its output trustworthy enough to route on.',
      'Data extraction pipelines: every field must come from the input document alone — the mental model of "the prompt is the whole world" is literally the security boundary.',
      'Interviews: "why did the model ignore my instruction?" is answered by role precedence and token-level input understanding — a favourite screening question.',
    ],
    further: [
      {
        label: 'OpenAI guide: prompt engineering & text generation',
        url: 'https://platform.openai.com/docs/guides/text-generation',
        note: 'Provider-side grounding for message roles, temperature, and token basics.',
      },
      {
        label: 'Anthropic: prompt engineering overview',
        url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',
        note: 'Clean explanation of the system role and clear-prompt patterns from a second provider.',
      },
      {
        label: 'Hugging Face NLP course: tokenizers',
        url: 'https://huggingface.co/learn/nlp-course/chapter6/1',
        note: 'How tokenizers actually work — worth one careful read, then revisit in Phase 4 debugging.',
      },
    ],
  },
  {
    id: 'json-you-can-trust',
    moduleId: 'pe-json-mode',
    title: 'JSON You Can Trust',
    minutes: 30,
    tagline: 'JSON mode guarantees syntax. Your program needs a schema, a validator, and a repair loop.',
    pre: {
      q: 'In the "prompts are APIs" framing, what is the API contract a structured prompt must define?',
      options: [
        'The model provider and version to call',
        'The exact shape of the output object — fields, types, and allowed values',
        'The temperature and max tokens',
        'The system prompt wording',
      ],
      answer: 1,
      explain:
        'A consumer program depends on the output shape the way code depends on a function signature. Fields, types, and enums are the contract; JSON mode then guarantees the syntax, and validation enforces the rest.',
    },
    simple: [
      'The moment a program consumes model output, free text becomes a liability. The program needs an object with known fields, known types, and known allowed values — a schema.',
      'JSON mode (or structured-output modes) guarantees the response parses as JSON. That sounds like enough. It is not: a response can be valid JSON and still have a missing field, a string where you expected a number, or an invented value outside your enum.',
      'Syntax guarantee and shape guarantee are different promises. You close the gap yourself: validate every response against a schema in code (pydantic or zod), and when validation fails, send the errors back to the model with a repair instruction.',
      'The repair loop is the pattern that turns 92% first-pass reliability into 99%+: validate, show the model exactly which constraint it violated, validate again. Usually one round is enough; always bound the retries.',
      'Design the schema to be easy to satisfy: flat beats nested, enums beat free text, and field names that say what they mean ("country_code", not "c") act as inline instructions.',
    ],
    intuition: {
      analogy: 'JSON mode is a customs officer who checks the form is filled in ink — not that the answers are right.',
      paragraphs: [
        'The officer (JSON mode) verifies the paperwork is formally correct: right paper, right pen, parseable. They do not check that the declared value matches the goods, that every required box is ticked, or that the tariff code actually exists in the table.',
        'Your validator is the second officer who checks the content against the rulebook (the schema) — and the repair loop is sending the form back with sticky notes saying exactly which boxes are wrong. A form sent back with precise notes comes back fixed; a form sent back saying "do better" comes back different, not better.',
      ],
    },
    technical: [
      'Provider mechanics: chat APIs offer a JSON/response-format mode; stricter schema-guided modes constrain generation to a supplied JSON Schema. The stricter the mode, the more syntax is guaranteed — but field semantics (did it pick the RIGHT enum?) remain your responsibility.',
      'Validation: define the schema in code. In Python, pydantic parses and coerces or raises per-field errors; in TypeScript, zod does the same. These error messages are gold — they are exactly what you feed into the repair prompt.',
      'The repair loop: catch validation errors, format them verbatim ("year: expected number, received null"), instruct "fix ONLY these errors", re-validate. Bound retries (commonly 3) and define the terminal failure path: raise, log, or queue for human review — never silently drop.',
      'Schema design rules that measurably reduce failures: use enums for any closed set; make genuinely unknown fields optional and omitted (null is a value the model will happily invent); prefer flat structures; keep one concept per field; and give the model an out ("if not stated in the input, omit") to discourage hallucination.',
      'Testing: a fixed set of messy inputs, run through the pipeline, with first-pass and post-repair success rates recorded. You will build this into a full eval harness in Phase 4; the seed of it is a for-loop with counters.',
    ],
    deeper: [
      'How can syntax be guaranteed at all? Constrained decoding: at each generation step the sampler masks tokens that would violate the grammar (here: the JSON syntax or schema), so invalid sequences are never sampled. This is why schema-guided modes can promise valid JSON without post-processing.',
      'The same machinery explains the limit: constraints operate on form, not meaning. The sampler can be forced to emit a string in the year field — it cannot be forced to emit the correct year. Truth remains a property of your prompt, your data, and your evals.',
    ],
    numbers: {
      title: 'What the repair loop buys (typical shape of results)',
      rows: [
        ['Naive "return JSON" prompt', 'parse failures appear on messy real-world input'],
        ['JSON mode on', 'syntax failures drop to ~0; shape failures remain'],
        ['Schema-guided mode', 'shape failures drop sharply; semantic errors (wrong enum choice) remain'],
        ['Validation + 1 repair round', 'terminal failures typically fall to low single-digit percentages'],
      ],
      takeaway:
        'Measure your own numbers on your own data — this table is the shape of the curve, not a claim about your corpus.',
    },
    demo: 'structured-stepthrough',
    walkthrough: {
      lang: 'python',
      code: `from pydantic import BaseModel, ValidationError, field_validator
from typing import Literal, Optional

class MovieReview(BaseModel):
    title: str
    year: Optional[int] = None          # omitted when unknown — never null
    genre: Literal["action", "comedy", "drama", "sci-fi"]
    rating_out_of_10: float

    @field_validator("rating_out_of_10")
    @classmethod
    def bound_rating(cls, v: float) -> float:
        assert 0 <= v <= 10, "rating_out_of_10 must be 0-10"
        return v

def extract(review: str) -> MovieReview | None:
    for attempt in range(3):                      # bounded retries
        raw = llm_json(TASK_PROMPT, review)       # JSON mode ON
        try:
            return MovieReview.model_validate_json(raw)
        except ValidationError as e:
            raw = llm_json(                       # repair: errors verbatim
                TASK_PROMPT
                + "\\nYour previous output failed validation. "
                + "Fix ONLY these errors:\\n"
                + str(e.errors()),
                review,
            )
    log_terminal_failure(review)                  # loud, never silent
    return None`,
      notes: [
        ['Optional[int] = None', 'The field disappears when unknown. Models asked for null will happily invent a value; asked to omit, they usually do.'],
        ['Literal[...]', 'Enums collapse the output space to valid values and make wrong choices visible in validation instead of downstream.'],
        ['str(e.errors())', 'Pydantic error strings go into the repair prompt verbatim — the single highest-leverage line in the loop.'],
        ['for attempt in range(3)', 'The bound. Beyond it, fail loudly: log, queue, or raise. Silent drops are how pipelines rot.'],
        ['return MovieReview | None', 'The caller sees an honest type: a record, or a documented failure — the "prompts are APIs" contract.'],
      ],
    },
    exercise: {
      prompt:
        'Design a schema for extracting structured data from job postings (title, company, remote policy, salary range, seniority, tech stack). Write the schema in pydantic or zod, run 10 real postings through JSON mode, and record: how many parsed, how many validated, and which field failed most. Then fix that ONE field (wording, enum, or optional-ness) and re-run. Report before/after numbers.',
      solution:
        'The most common first-failure is salary (free-text ranges like "$120-160k" resist float fields — model it as min/max optional numbers or a normalised string enum). Second is remote policy: turning it into Literal["remote","hybrid","onsite","unsaid"] usually cuts failures sharply. A correct solution includes the before/after table and names the field it fixed — one targeted schema change, not a prompt rewrite.',
    },
    quiz: [
      {
        q: 'JSON mode is enabled and the pipeline still fails. What is the most likely gap?',
        options: [
          'JSON mode is unreliable and should be avoided',
          'JSON mode guarantees syntax, not the shape — schema validation is still required',
          'Temperature must be set to exactly 0',
          'The prompt needs more examples',
        ],
        answer: 1,
        explain:
          'Syntax guarantee is not shape guarantee: missing fields, wrong types, and invented enum values all parse as valid JSON. Validation plus a repair loop closes the gap.',
      },
      {
        q: 'Why include validation errors verbatim in the repair prompt?',
        options: [
          'To increase token usage and therefore quality',
          'Because specific feedback turns the retry into a targeted fix instead of a hopeful re-roll',
          'It is required by all providers',
          'To keep the conversation history shorter',
        ],
        answer: 1,
        explain:
          '"genre must be one of [...]" tells the model precisely what to change. Vague repair instructions produce different output, not corrected output.',
      },
      {
        q: 'A field is often unknown from the input. Best schema design?',
        options: [
          'Make it a string and instruct the model to write "unknown"',
          'Make it required and let the model guess',
          'Make it optional with omission instructed ("if not stated, omit the field")',
          'Remove validation for that field',
        ],
        answer: 2,
        explain:
          'Optional-and-omitted discourages hallucinated values and keeps the type honest. "unknown" as a string value pollutes every downstream consumer with a sentinel.',
      },
    ],
    realWorld: [
      'Extraction pipelines (invoices, postings, tickets) — the most-shipped industrial LLM feature, and precisely this pattern: schema, validate, repair, measure.',
      'Agent tool arguments: every tool call is structured output; wrong types or invented enum values are how agents crash, which is why Phase 2 feeds directly into Phase 6.',
      'Evals: your Phase 4 golden sets consume schema-validated records — an eval harness over unvalidated prose measures nothing.',
    ],
    further: [
      {
        label: 'pydantic documentation',
        url: 'https://docs.pydantic.dev/latest/',
        note: 'The Python validator used across this roadmap; error messages are repair-prompt fuel.',
      },
      {
        label: 'zod documentation',
        url: 'https://zod.dev/',
        note: 'The TypeScript counterpart — same mental model for Node/browser stacks.',
      },
      {
        label: 'OpenAI structured outputs guide',
        url: 'https://platform.openai.com/docs/guides/structured-outputs',
        note: 'How schema-guided generation works on one major provider, including its documented limits.',
      },
    ],
  },
  ANATOMY_LESSON,
]
