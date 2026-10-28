import type { Lesson } from '../../types'
import { FAKE_PROVIDER_LESSON } from './lessonFakeProvider'
import { EVAL_SUITES_LESSON } from './lessonEvalSuites'
import { LOGGING_TRACING_LESSON } from './lessonLoggingTracing'
import { CODEGEN_LOOP_LESSON } from './lessonCodegenLoop'
import { FALLBACK_LADDER_LESSON } from './lessonFallbackLadder'

/**
 * Exemplar lessons for AI Programming — the nine-layer retention format.
 * Lesson 1 teaches the reliability layer every feature depends on; lesson 2
 * teaches the cost accounting that keeps features economically alive.
 */
export const LESSONS: Lesson[] = [
  {
    id: 'aip-resilient-call',
    moduleId: 'aip-reliability',
    title: 'The Resilient Model Call',
    minutes: 30,
    tagline: 'Providers fail on a schedule you do not control. Your policy decides what the user experiences.',
  takeaways: ["Retry only transient errors (429/5xx/timeout); fail fast on client errors (400/401).", "Exponential backoff WITH jitter — without jitter, failed clients retry as a herd.", "A circuit breaker stops sustained failure from becoming slow, multiplied load."],
  relatedPractice: "aip-pp-retry-lab",
    pre: {
      q: 'Which two timeouts must be configured separately on an HTTP client?',
      options: [
        'Request timeout and response timeout',
        'Connect timeout and read timeout',
        'DNS timeout and TLS timeout',
        'Total timeout and idle timeout',
      ],
      answer: 1,
      explain:
        'Connect timeout bounds establishing the connection; read timeout bounds waiting for response bytes after sending the request. They fail differently (dead host vs slow generation) and need different values — retry logic sits on top of this distinction.',
    },
    simple: [
      'Model providers fail. Not maliciously and not permanently — they rate-limit, they have bad minutes, they time out. A production AI feature assumes failure as a normal, scheduled event.',
      'Failures come in two classes with opposite policies. Transient failures (429 rate limits, 5xx server errors, timeouts) may succeed on retry. Client errors (400, 401, 403) will fail identically every single time — retrying them just burns money and delays the honest error.',
      'Retries need manners: exponential backoff (each wait doubles) plus jitter (randomness) so ten thousand clients that failed together do not retry together — the thundering herd that turns an outage into a stampede.',
      'Retries need a limit. Four attempts is a common ceiling; past it you surface the error and hand off to the fallback ladder (Phase 5): smaller model, cache, queue, or an honest apology.',
      'Under sustained failure, the circuit breaker opens: stop calling, fail fast, and probe occasionally (half-open) for recovery. It protects the provider from you and your users from slow timeouts.',
    ],
    intuition: {
      analogy: 'A retry policy is a polite caller, not a persistent door-knocker.',
      paragraphs: [
        'Imagine calling a friend who is on another call. A polite caller waits a bit, tries again, waits longer, tries once more — then leaves a voicemail and moves on with their day. An impolite caller redials every two seconds, which helps nobody and jams the line for real.',
        'The circuit breaker is the friend whose phone you stop calling after five straight rejections — you wait an hour, try once, and if they answer you resume; if not, you stop again. This is not giving up; it is refusing to let one broken conversation consume your whole afternoon.',
        'And the two-error-classes rule is knowing the difference between "line was busy" (call back later) and "wrong number" (calling back harder will not fix the digits).',
      ],
    },
    technical: [
      'Backoff schedule: wait(n) = base × 2^(n-1) + jitter, with base typically 250–1000ms and a cap (e.g. 8s). Full jitter (uniform in [0, base×2^n]) spreads load widest; equal jitter (half fixed, half random) trades spread for slightly faster recovery.',
      'Idempotency gate: only retry when a repeated call is safe. Model completions are effectively idempotent (same prompt, new sample — wasteful but not dangerous); side-effecting tool calls are NOT — a retry may double-charge or double-send.',
      'Respect the provider: on 429, honor the Retry-After header when present instead of computing your own delay; obey per-model rate limits in the client, not after the error.',
      'Circuit breaker states: CLOSED (normal, count consecutive failures) → OPEN (fail fast without calling, typically after 5) → HALF-OPEN (after a cool-down, let one probe through; success closes, failure re-opens). Expose breaker state as a metric — silent breakers cause mysterious "AI is slow" incidents.',
      'Where it lives: in your gateway wrapper around the provider interface (Project 1), so every feature inherits the same policy instead of re-implementing it badly.',
    ],
    deeper: [
      'Retry budgets: rather than a fixed max-attempts, cap retries as a fraction of requests (e.g. retries ≤ 20% of total) over a sliding window. This keeps total load amplification bounded at 1.2× even as traffic scales — the approach popularized by Google SRE retry-budget guidance.',
      'Hedged requests (send a second copy if the first exceeds p95): great for tail latency, dangerous for cost and provider load — only for reads where a duplicate completion is acceptable, and only with tight limits.',
      'Why full jitter beats deterministic backoff at scale: with N synchronized failing clients, deterministic schedules re-synchronize every retry; uniform jitter de-synchronizes them within one attempt, smoothing provider load measurably.',
    ],
    numbers: {
      title: 'A concrete retry timeline (base 500ms, 4 attempts, fixed jitter shown)',
      rows: [
        ['try 1 fails (429)', 'retry after ~500ms'],
        ['try 2 fails (500)', 'retry after ~1,200ms'],
        ['try 3 fails (timeout)', 'retry after ~2,600ms — plus the 10s read-timeout already spent'],
        ['try 4 fails', 'stop: surface the error; total elapsed ~14s, 4× load amplification on the provider'],
      ],
      takeaway:
        'Every retry multiplies provider load during its worst moments, and timeouts make failed calls your slowest calls. Bound both, deliberately.',
    },
    demo: 'retry-timeline',
    walkthrough: {
      lang: 'ts',
      code: `type ChatResult = { text: string; usage: Usage }

const RETRYABLE = new Set([429, 500, 502, 503, 504])
const BASE_MS = 500, MAX_ATTEMPTS = 4

export async function completeWithRetry(
  provider: Provider,           // the interface; fake in tests, real in prod
  messages: Message[],
): Promise<ChatResult> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await provider.complete(messages)      // client has timeouts set
    } catch (err) {
      if (!RETRYABLE.has(err.status) || attempt >= MAX_ATTEMPTS) throw err
      if (err.retryAfterMs) await sleep(err.retryAfterMs)         // honor 429 hints
      else {
        const jitter = Math.random() * BASE_MS * 2 ** (attempt - 1)
        await sleep(jitter)                                        // full jitter
      }
    }
  }
}`,
      notes: [
        ['RETRYABLE set', 'The policy in one line: only transient statuses retry. A 400 falls through immediately — fix the request instead.'],
        ['err.retryAfterMs', 'Provider hints beat your math: honor Retry-After on 429s where offered; compute backoff only otherwise.'],
        ['full jitter sleep', 'Math.random() over the exponential range de-synchronizes clients; deterministic doubling re-synchronizes them.'],
        ['attempt >= MAX_ATTEMPTS', 'The bound. Past it the error surfaces — the Phase-5 fallback ladder decides what the user sees next.'],
        ['provider: Provider', 'The fake provider makes all of this unit-testable offline: script 429, 429, 200 and assert exactly three calls.'],
      ],
    },
    exercise: {
      prompt:
        'Using your fake provider, script five failure scenarios and record the behavior of completeWithRetry for each: (1) 429,429,200; (2) 500,timeout,200; (3) 400 first; (4) 429 four times; (5) timeout,timeout,timeout,timeout. For each, write the attempts made, total elapsed (make sleep injectable and sum the waits), and what the caller received. Which scenario took longest, and why?',
      solution:
        'Scenario (1): 3 calls, ~1.7s, success. (2): 3 calls, ~11s+ (the timeout dominates — failed calls are the slow ones), success. (3): 1 call, fail-fast — the policy correctly refuses to retry a client error. (4): 4 calls, ~2–5s, error surfaced to the fallback ladder. (5): 4 calls, ~30s+, error — and notice the timeout scenario is the costliest in wall-clock, which is the argument for tuning read timeouts down and breaker thresholds along with retries. The key insight to write down: retry policy turns provider failures into a bounded, predictable tax instead of an unbounded gamble.',
    },
    quiz: [
      {
        q: 'A request fails with 401 Unauthorized. Correct behavior?',
        options: [
          'Retry with exponential backoff — it might work next time',
          'Fail fast without retrying: a client error will fail identically every time',
          'Trip the circuit breaker immediately',
          'Retry once, then escalate to a larger model',
        ],
        answer: 1,
        explain:
          '401 means your credentials or request are wrong — deterministic failure. Retrying burns latency and money and delays the honest error. Fix the cause (config, key scope) instead.',
      },
      {
        q: 'Why add jitter to exponential backoff?',
        options: [
          'To make retries faster on average',
          'To prevent synchronized clients from retrying in a thundering herd after a shared failure',
          'Jitter is required by all providers',
          'To reduce the total number of attempts',
        ],
        answer: 1,
        explain:
          'Without jitter, every client that failed together retries together — amplifying load exactly when the provider is weakest. Randomized waits de-synchronize the herd within one attempt.',
      },
      {
        q: 'What problem does a circuit breaker solve that retries alone cannot?',
        options: [
          'It makes individual retries cheaper',
          'It stops sustained failure from causing slow, multiplied load — failing fast protects both provider and user latency',
          'It caches successful responses',
          'It upgrades requests to a bigger model automatically',
        ],
        answer: 1,
        explain:
          'Retries treat each call independently; under sustained outage they multiply load and stack timeouts (the slowest possible UX). The breaker opens, fails fast, and probes for recovery — turning minutes of 30-second timeouts into instant errors your fallback ladder can handle.',
      },
    ],
    realWorld: [
      'Support copilots: a 429 storm at 9am peak is normal traffic, not an incident — retry policy absorbs it invisibly while the dashboard shows the retry rate ticking up.',
      'Batch enrichment pipelines: thousands of calls overnight run with tighter retry budgets and queue-based backpressure instead of aggressive client retries.',
      'On-call reality: "the AI feature is slow" almost always means timeouts without a working breaker — fail-fast plus fallbacks converts a slow outage into a fast degradation.',
    ],
    further: [
      {
        label: 'Google SRE: handling overload and retry budgets',
        url: 'https://sre.google/sre-book/handling-overload/',
        note: 'The canonical source on retry budgets and why unbounded retries amplify outages.',
      },
      {
        label: 'AWS architecture blog: exponential backoff and jitter',
        url: 'https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/',
        note: 'The clearest empirical comparison of backoff strategies — full jitter wins at scale.',
      },
      {
        label: 'Polly ( resilience library docs)',
        url: 'https://www.thepollyproject.org/',
        note: 'A mature implementation of retry/breaker policies to compare your hand-rolled version against.',
      },
    ],
  },
  {
    id: 'aip-token-cost',
    moduleId: 'aip-tokens-cost',
    title: 'What a Token Costs',
    minutes: 25,
    tagline: 'An AI feature without cost accounting is an unbounded liability with a friendly UI.',
  takeaways: ["Cost = tokens_in x price_in + tokens_out x price_out — and output tokens cost several times more.", "Attribute every call in a ledger (feature + user); budgets make it a control surface at 80/95/100%.", "Three levers: cache repeated prompts, route easy work to smaller models, cap output tokens."],
  relatedPractice: "aip-pp-cost-ledger",
    pre: {
      q: 'Besides the generated text, what does every chat response carry that your code must parse?',
      options: [
        'The model training data cutoff date',
        'Usage fields — tokens in and tokens out — the raw material of cost accounting',
        'The provider terms of service',
        'A freshness timestamp',
      ],
      answer: 1,
      explain:
        'Usage tokens come back with every completion. Parse them on day one: they are the input to cost math, budgets, quotas, and every per-feature unit-economics question that follows.',
    },
    simple: [
      'Every model call costs money, computed from two numbers in the response: input tokens (your prompt) and output tokens (the answer), each priced per million tokens at model-specific rates.',
      'Output tokens usually cost several times more than input tokens — the model does more work generating than reading. A feature that lets answers run long multiplies its own cost.',
      'An invoice tells you what you paid. A ledger tells you what cost it: per call, the model × tokens × price math, attributed to the feature and user that caused it, persisted and queryable.',
      'Budgets make the ledger actionable: per-feature daily ceilings, per-user quotas, alerts at 80% before the money is gone instead of after.',
      'The cheapest call is the one you do not make: caching repeated prompts, routing easy work to smaller models, and capping output length are the three big levers — all measured against the ledger.',
    ],
    intuition: {
      analogy: 'The ledger is an electricity meter with a room label on every kilowatt.',
      paragraphs: [
        'A household electricity bill tells you the total — useless for decisions. A meter that says "the heater cost 40 euros this month, the dryer 12" tells you exactly what to change. Model cost is identical: the invoice is the bill; the ledger is the labeled meter.',
        'And budgets are the circuit breaker in the fuse box: when the heater line draws too much, something trips before the house burns down. Per-feature budgets trip at 80% with a warning, at 100% with degradation — not with surprise invoices.',
      ],
    },
    technical: [
      'Cost formula per call: cost = (tokens_in / 1e6) × price_in + (tokens_out / 1e6) × price_out, with the price table versioned as data — providers change prices, so the table is loaded, not hardcoded, and stamped with effective dates.',
      'Ledger schema: one row per call — timestamp, model, tokens_in, tokens_out, computed_cost, feature_id, user_id, request_id (joins to the trace). This single table answers every cost question: per feature, per user, per day, per model, trend, anomaly.',
      'Budget enforcement points: alert at 80% (page a human), warn at 95%, degrade or stop at 100% (the Phase-5 ladder: smaller model, cached answers, queue for later). Quotas per user are the same machinery at finer grain.',
      'Cache interaction: a cache hit costs storage and latency, not tokens — so the ledger records hit/miss beside cost, and cache savings become a computed column, not a guess.',
      'The three levers, measured: (1) prefix caching for repeated instructions — often the largest single win; (2) model routing by task difficulty — nano for extraction, large only for hard synthesis; (3) output caps (max_tokens) — unbounded generation is an unbounded line item.',
    ],
    deeper: [
      'Why output tokens cost more: generation is autoregressive — each output token requires a full forward pass over the growing sequence, while input tokens are processed once in parallel. You are paying for sequential compute, not for bytes.',
      'Batching discounts: many providers price batched (offline, delayed) requests at roughly half — features with tolerance for minutes of delay (enrichment, classification queues) should run in batch mode and the ledger should show the discount.',
      'Unit economics as a product metric: cost per successful action (not per call — retries and repairs included) is the number a business actually prices against; compute it by joining the ledger with the action-success events from your tracing.',
    ],
    numbers: {
      title: 'What usage volume does to the bill (illustrative prices)',
      rows: [
        ['Prototype: 100 calls/day, ~1.6k tokens/call', 'pennies per month — cost is irrelevant at this scale'],
        ['Internal tool: 5k calls/day', 'tens of dollars per month — budgets become worth setting'],
        ['Real feature: 500k calls/day', 'thousands per month — routing, caching, and quotas become the feature'],
        ['10× growth, no levers', '10× the invoice — the exact scenario the ledger and alerts exist to catch early'],
      ],
      takeaway:
        'Cost engineering starts mattering exactly when usage does. The ledger from day one means the day it matters, you already have the numbers.',
    },
    demo: 'cost-meter',
    walkthrough: {
      lang: 'python',
      code: `from dataclasses import dataclass
from datetime import datetime

PRICE_TABLE = {                       # loaded from config in real code,
    "illustrative-nano": (0.15, 0.6), # (price_in_per_m, price_out_per_m)
    "illustrative-standard": (3.0, 12.0),
}

@dataclass
class LedgerEntry:
    ts: datetime; model: str
    tokens_in: int; tokens_out: int
    cost_usd: float; feature: str; user: str; cached: bool

def record_call(usage, model: str, feature: str, user: str,
                cached: bool = False) -> LedgerEntry:
    p_in, p_out = PRICE_TABLE[model]
    cost = (usage.tokens_in / 1e6) * p_in + (usage.tokens_out / 1e6) * p_out
    entry = LedgerEntry(datetime.utcnow(), model,
                        usage.tokens_in, usage.tokens_out,
                        cost, feature, user, cached)
    store.append(entry)               # + emit metric, check budgets
    check_budget(feature)             # alert at 80%, degrade at 100%
    return entry

def feature_cost(feature: str, day: str) -> float:
    return sum(e.cost_usd for e in store
               if e.feature == feature and e.ts.date() == day)`,
      notes: [
        ['PRICE_TABLE', 'Versioned data, not constants — providers change prices; effective-dated rows keep history honest.'],
        ['record_call', 'One row per call with feature + user attribution. The request_id (add it) joins cost to traces for "why" questions.'],
        ['cached flag', 'Cache hits skip token cost — recording hit/miss beside cost makes savings a query, not a belief.'],
        ['check_budget', 'The actionable part: 80% alert, 100% degrade. A ledger nobody enforces budgets from is just a slower invoice.'],
        ['feature_cost', 'The payoff query: per-feature, per-day cost. Everything — routing decisions, quota setting, pricing — starts here.'],
      ],
    },
    exercise: {
      prompt:
        'Take one real (or realistic) feature workload: estimate requests/day, average input and output tokens, and pick a model. Compute monthly cost. Then apply the levers one at a time and record the new monthly cost after each: (1) cache 40% of repeated prompts; (2) route 60% of easy calls to a 10× cheaper model; (3) cap output tokens at half. Which lever was biggest for YOUR numbers, and what would you tell a teammate who wants to skip the ledger and just watch the invoice?',
      solution:
        'Typical result: caching and routing each cut 30–60%, output caps 20–40% — and which wins depends entirely on the traffic shape (repetitive traffic rewards caching; mixed difficulty rewards routing; verbose generation rewards caps). The teammate answer: the invoice cannot attribute, alert, or enforce — it tells you the total after the money is spent, while the ledger answers per-feature unit economics, fires the 80% alert, and powers the quota system. An invoice is a receipt; a ledger is a control surface.',
    },
    quiz: [
      {
        q: 'Why is a per-call ledger more useful than the monthly invoice?',
        options: [
          'It is more accurate arithmetic',
          'It attributes cost to features and users, enables budgets and quotas, and supports per-unit economics — the invoice only totals after the fact',
          'Invoices cannot be trusted',
          'Ledgers are required for tax purposes',
        ],
        answer: 1,
        explain:
          'The invoice answers "what did we pay". The ledger answers "what cost it, who caused it, is it within budget, and which lever should we pull" — the questions decisions need.',
      },
      {
        q: 'Why do output tokens typically cost more than input tokens?',
        options: [
          'Output is more valuable commercially',
          'Each generated token requires a forward pass over the growing sequence; input is processed once in parallel — sequential compute costs more',
          'Providers charge for creativity',
          'Output is billed in a different currency',
        ],
        answer: 1,
        explain:
          'Generation is autoregressive: token N+1 reprocesses the whole sequence. You pay for sequential compute — which is also why capping output length is such an effective cost lever.',
      },
      {
        q: 'The three big cost levers, in the terms of this lesson, are…',
        options: [
          'Faster CPUs, GPUs, and networking',
          'Cache repeated prompts, route easy work to smaller models, cap output tokens',
          'Fewer users, shorter sessions, cheaper UIs',
          'Compression, deduplication, and indexing',
        ],
        answer: 1,
        explain:
          'Skip the call (cache), shrink the call (routing), bound the call (output caps) — each measurable against the ledger, unlike generic "optimization".',
      },
    ],
    realWorld: [
      'Feature launches: "will this ruin us if it gets popular?" is a ledger query — cost per user × projected users, with an alert as the tripwire.',
      'Pricing decisions: per-successful-action cost (including retries and repairs) is the floor under any per-seat or usage-based pricing conversation.',
      'Incident reviews: a Tuesday where cost per call doubled is visible in the ledger within minutes — usually a model swap, a cache miss wave, or a runaway generation loop.',
    ],
    further: [
      {
        label: 'OpenAI pricing documentation',
        url: 'https://platform.openai.com/docs/pricing',
        note: 'Live per-model price tables — read them into your price config, never hardcode them.',
      },
      {
        label: 'Anthropic pricing and batch discounts',
        url: 'https://www.anthropic.com/pricing',
        note: 'Compare input/output/batch pricing shapes across providers before committing a routing design.',
      },
      {
        label: 'Google SRE: alerting on sane thresholds',
        url: 'https://sre.google/sre-book/alerting-on-slos/',
        note: 'Budget alerts are just alerts — apply the same threshold discipline you would to latency and errors.',
      },
    ],
  },
  FAKE_PROVIDER_LESSON,
  LOGGING_TRACING_LESSON,
  EVAL_SUITES_LESSON,
  CODEGEN_LOOP_LESSON,
  FALLBACK_LADDER_LESSON,
]
