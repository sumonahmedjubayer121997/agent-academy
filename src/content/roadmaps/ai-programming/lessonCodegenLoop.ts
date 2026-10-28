import type { Lesson } from '../../types'

export const CODEGEN_LOOP_LESSON: Lesson = {
  id: 'aip-codegen-loop',
  moduleId: 'aip-codegen-fundamentals',
  title: 'The Generate–Compile–Fix Loop',
  minutes: 30,
  tagline: 'Generated prose forgives; a compiler forgives nothing — and that is exactly what makes it your quality lever.',
  takeaways: [
    'Treat the compiler as the verifier inside the loop: generate against an explicit contract (signature, types, constraints), then check mechanically — never by eyeball and never by asking the model whether its own code works.',
    'Extract fenced code strictly before interpreting anything, and feed errors back verbatim exactly once — the first truthful feedback round repairs most mechanical failures; later rounds repair less than a fresh attempt.',
    'Bound and measure the loop: attempts, tokens, pass@1, and repaired-pass rate are the numbers that tell you whether your generator is an engineering tool or a slot machine.',
  ],
  relatedPractice: 'aip-pp-compile-loop',
  pre: {
    q: 'From Phase 2 (Structured input & output): your generated function fails typecheck on the first try. Which single addition to your next request repairs it most reliably?',
    options: [
      'A polite instruction to be more careful with types this time',
      'The verbatim compiler error, quoted alongside the full code you generated',
      'A higher temperature so the model can explore more diverse attempts',
      'Asking for the same function in a different programming language first',
    ],
    answer: 1,
    explain:
      'A compiler error is the highest-signal feedback in software: file, line, expected type, received type. A model shown the exact error repairs most mechanical failures in one round — a vague admonishment carries no new information, and a confident model cannot verify its own output. You ask the compiler, then paste its answer.',
  },
  simple: [
    'Code generation differs from every other model task in one decisive way: there is a machine that says NO. Summaries and chat answers have no verifier; a generated function does — and that verifier is objective, instant, and free.',
    'The loop has four stations: a contract (the exact signature, types, and constraints you want), generation, mechanical verification (parse, compile, typecheck — tests arrive in the next module), and one feedback round in which the verbatim error travels back into the request.',
    'Extraction comes before interpretation. Models wrap code in prose and fences — "Here is the function you asked for…" — so a strict extractor that pulls exactly one fenced block, and fails loudly when there is none, keeps prompt drift from masquerading as model failure.',
    'Errors are fuel, not verdicts. A type error quoted next to the code is the most informative token sequence you can send back. But the round-trip has sharply diminishing returns: after one, at most two, feedback rounds, a fresh generation is cheaper than a third repair.',
    'The loop becomes engineering only when you measure it: pass@1 (compiles unaided), repaired-pass (compiles after feedback), and extraction-failure rate, recorded per task family — the same discipline the Phase-4 eval suite applies to behaviour, applied here to mechanics.',
  ],
  intuition: {
    analogy: 'The model is a junior pair-programmer with infinite patience, no memory, and unshakable confidence.',
    paragraphs: [
      'Hand a junior a ticket; they hand back code that almost compiles. What makes the loop work is not brilliance on either side — it is that the compiler’s complaint is precise, impersonal, and immediately quotable. You never say "try harder"; you paste the error. The next attempt is almost always mechanically fixed.',
      'The no-memory part dictates the shape of every request: each round must carry its own complete context — contract, code, and error together — because "fix this" alone refers to nothing. And the confidence part is why you never ask "does this compile?" — it will say yes. You ask the compiler.',
    ],
  },
  technical: [
    'The contract prompt: request a single function with an explicit signature, parameter and return types, edge-case behaviour, and a hard output constraint — one fenced TypeScript block and nothing else. Constraints in the prompt (no prose, no usage examples, no unused imports) are the strongest predictors of compile-pass; politeness is not.',
    'Extraction policy: capture exactly one fenced block with a strict regex; on zero or multiple blocks, count an extraction failure and regenerate. Never interpolate prose into code, and never "repair" a missing fence by hand — log the extraction-failure rate separately, because it measures a prompt bug, not a model bug.',
    'The feedback round: resend the original contract, the complete generated code, and the verbatim compiler output; ask for the corrected full function in one block. Whole code (not a snippet) avoids line-number drift; verbatim errors beat paraphrase because models are trained on raw tool output, not on your summary of it.',
    'Bounds and budget: cap the loop at one feedback round (two for high-stakes paths), cap total attempts and tokens, and on exhaustion fail loudly — surface the last code and last error to a human instead of looping. A bounded failure is a workflow; an unbounded one is a slot machine that burns tokens to hide the truth.',
    'Instrument the pipeline: record pass@1, repaired-pass, extraction failures, and per-attempt latency and cost, split by task family. These numbers decide prompt changes, model routing (a small model for boilerplate, a large one for algorithms), and whether the feedback round pays for itself on your workload.',
  ],
  deeper: [
    'Self-repair is empirically strong but bounded: the self-debugging literature (for example "Teaching Large Language Models to Self-Debug", 2023) shows compiler and execution feedback repairing a large share of failures — with the second and third rounds returning far less than the first. That curve, not folklore, is why the loop caps at one or two rounds.',
    'Compile-pass is a floor, not a ceiling: typecheck says nothing about semantics. The next module (Tests as the specification) replaces the compiler with tests as the contract — the same loop over a stronger verifier — and SWE-bench-style evaluation measures exactly this gap on real repositories, where plausible-but-wrong code is the dominant failure.',
    'Determinism removes failure classes before they occur: temperature 0 (and a pinned seed where the provider offers one) plus constrained output formats for any wrapper fields eliminate variance — and variance you eliminate never needs a repair round in the first place.',
  ],
  numbers: {
    title: 'What one feedback round buys (illustrative pass-rate curve, 50 small typed functions)',
    rows: [
      ['pass@1 — compiles unaided', '~70–80% of tasks with a strict contract prompt'],
      ['after 1 verbatim-error feedback round', '~90–95% — the single biggest jump in the curve'],
      ['after a 2nd round', '~1–3 further points — the diminishing tail'],
      ['rewrite-from-scratch instead of round 2', 'roughly the same yield, often fewer tokens than a repair'],
      ['extraction failures (zero or multiple fences)', 'near zero once "one block only" is a hard constraint'],
    ],
    takeaway:
      'The first truthful error round is where the value is; every round after it buys less than a fresh attempt. Cap the loop where the curve flattens, and measure your own curve before trusting these numbers.',
  },
  walkthrough: {
    lang: 'ts',
    code: `type GenResult = { code: string; ok: boolean; rounds: number; lastError?: string }

const MAX_ROUNDS = 1 // one feedback round, then a human

export async function generateCompiling(
  provider: Provider,
  contract: string,
): Promise<GenResult> {
  const ask = (extra: string[]) =>
    provider.complete([
      { role: 'system', content:
          'Emit exactly one fenced TypeScript block. No prose, no usage examples.' },
      { role: 'user', content: [contract, ...extra].join('\\n\\n') },
    ])

  let attempt = await ask([])
  for (let round = 0; round <= MAX_ROUNDS; round++) {
    const code = extractFenced(attempt.text)  // strict: null on 0 or 2+ blocks
    if (!code) {                              // extraction failure: regenerate,
      attempt = await ask([])                 // never hand-repair prose into code
      continue
    }
    const diag = typecheck(code)              // tsc --noEmit on a temp fixture
    if (diag.ok) return { code, ok: true, rounds: round }
    if (round === MAX_ROUNDS)
      return { code, ok: false, rounds: round, lastError: diag.error }
    attempt = await ask([                     // the feedback round: contract +
      'Your previous attempt was:',           // whole code + VERBATIM error
      code,
      'The compiler said:',
      diag.error,
      'Return the corrected complete function in one fenced block.',
    ])
  }
  throw new Error('unreachable')
}`,
    notes: [
      ['extractFenced', 'Strict extraction: exactly one fenced block or it returns null — and a null is counted as an extraction failure and regenerated, never hand-repaired.'],
      ['typecheck(code)', 'The mechanical verifier (tsc --noEmit on a temp file). The loop trusts it exclusively; the model is never asked whether its own code compiles.'],
      ['the ask([...]) feedback round', 'Resends the contract, the complete code, and the untouched compiler output. Whole code avoids line-number drift; verbatim beats paraphrase.'],
      ['MAX_ROUNDS = 1', 'The bound. Round one repairs the most; round two buys little; round three is a rewrite in disguise. Exhaustion surfaces code + error to a human.'],
      ['GenResult', 'The measurement hook: rounds === 0 is pass@1, ok after round 1 is repaired-pass — record both per task family before tuning anything.'],
    ],
  },
  exercise: {
    prompt:
      'Build this loop against your fake provider. Script it to return: (a) a clean fenced function, (b) the same function wrapped in chatty prose, (c) a fenced function with one type error, then the corrected version when fed back. Run ten small contracts through the loop and record pass@1, extraction failures, repaired-pass, and total tokens. Which failure class did strict extraction catch — and what would have gone wrong if you had concatenated everything the model said into a .ts file?',
    solution:
      'Expect extraction failures on (b): the strict fence policy regenerates instead of interpolating, so prose never reaches the compiler. (c) exercises the feedback round — the verbatim error plus whole-code resend produces the fix in one round, and the counters show it as repaired-pass. Concatenating raw output would have turned (b) into a parse error deep inside prose, which you would have misread as a bad model rather than a missing extractor — the two failure classes have different fixes, and the loop only tells them apart when extraction is strict and counted. The recorded rates become the baseline for the Phase-3 project: a tests-first generator whose pass@k you can defend.',
  },
  quiz: [
    {
      q: 'Generation fails with a type error. What goes into the next request?',
      options: [
        'A polite instruction to be more careful with types',
        'The verbatim compiler error quoted alongside the complete generated code',
        'A higher temperature for more diverse repair attempts',
        'The identical prompt again — consistency helps the model converge',
      ],
      answer: 1,
      explain:
        'The error carries file, line, and expected-versus-received — the highest-signal tokens available. Politeness and repetition carry none. Paste the error, resend the whole code, and the fix usually arrives in one round.',
    },
    {
      q: 'Why cap the loop after one or two feedback rounds?',
      options: [
        'Providers rate-limit code-generation requests faster than chat',
        'Diminishing returns — later rounds repair less than a fresh attempt, and an unbounded loop burns tokens to hide a failure that a human should see',
        'The model forgets the original contract after two requests',
        'Tests must be written before a third generation is allowed',
      ],
      answer: 1,
      explain:
        'The measured repair curve flattens hard after the first round. The cap converts an expensive silent failure into a bounded, loud one — the last code and last error land in front of a person exactly when further attempts would only obscure them.',
    },
    {
      q: 'pass@1 jumped after a prompt change, yet users report worse behaviour. Most likely explanation?',
      options: [
        'Coincidence — pass@1 and user satisfaction are unrelated metrics',
        'Compile-pass measures mechanics, not semantics: the code now compiles more often and does the wrong thing more often too',
        'Users are reporting a different feature',
        'The temperature drifted between runs',
      ],
      answer: 1,
      explain:
        'A compiler verifies exactly what a compiler verifies. Semantics need a stronger verifier — tests as the specification (next module) and the Phase-4 eval suite. Rising pass@1 alongside falling quality is the classic signature of plausible-but-wrong code.',
    },
  ],
  realWorld: [
    'PR review bots: the dangerous part is not the suggestion but the wrapper around it — strict extraction plus a compile gate before posting means a malformed generation dies quietly in CI instead of loudly in a reviewer’s thread.',
    'Codemod assistance: migrations succeed at rates chat interfaces cannot touch precisely because they wire the target repo’s compiler into the loop as ground truth — the pattern of this lesson, running at repository scale in Phase 3’s refactoring modules.',
    'Team trust: engineers trust generated code exactly up to the line where something mechanical vouches for it. A green check from the real toolchain is that line, and a pass-rate dashboard keeps the trust honest instead of anecdotal.',
  ],
  further: [
    {
      label: 'SWE-bench — measured repair rates on real repositories',
      url: 'https://www.swebench.com/',
      note: 'Where generation-plus-verification lands on actual GitHub issues — the reality check for any claim about code-generation loops.',
    },
    {
      label: 'Teaching Large Language Models to Self-Debug (paper)',
      url: 'https://arxiv.org/abs/2304.05128',
      note: 'The self-debugging line of work: how much verbatim feedback repairs, and where the returns diminish.',
    },
    {
      label: 'OpenAI Cookbook: structured outputs',
      url: 'https://cookbook.openai.com/examples/structured_outputs_intro',
      note: 'Constrained decoding for the wrapper around your code block — eliminating format variance before it ever needs a repair round.',
    },
  ],
}
