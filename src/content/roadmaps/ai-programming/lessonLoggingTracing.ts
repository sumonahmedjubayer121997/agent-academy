import type { Lesson } from '../../types'

export const LOGGING_TRACING_LESSON: Lesson = {
  id: 'aip-logging-tracing',
  moduleId: 'aip-logging-tracing',
  title: 'Seeing Every Model Call',
  minutes: 30,
  tagline: 'A pile of console.logs is archaeology; a request-threaded trace with redacted spans is a replayable timeline.',
  takeaways: [
    'Logs record discrete events, metrics aggregate numbers over time, and traces connect every hop of one user request via shared traceId and parentSpanId.',
    'Every model-call span should capture the debugging contract: traceId, spanId, model, promptVersion, tokensIn, tokensOut, costUsd, latencyMs, finishReason, and status — with secrets and PII redacted before write.',
    'Production traces are the factory floor for your eval suite: one failing trace gives you the exact input, prompt version, and failure mode to promote into a golden test case.',
  ],
  relatedPractice: 'aip-pp-trace-one-action',
  pre: {
    q: 'From Phase 2 (Your first model integration): when a user reports "the AI gave a cut-off answer at 14:02", why is `console.log(reply.content)` useless for diagnosing the root cause?',
    options: [
      'Because `console.log` slows down the model API response',
      'Because the raw string hides the request ID, model version, prompt version, token usage, latency, and `finish_reason` (e.g. `length` vs `stop`) needed to tie that call to the user action',
      'Because strings cannot be stored in log files',
      'Because model responses are encrypted in production',
    ],
    answer: 1,
    explain:
      'Without structured metadata (`traceId`, `promptVersion`, `finishReason`, token counts, latency) attached to the call span, you cannot tell whether the answer was truncated by `max_tokens`, degraded by a fallback model, or caused by a bad retrieval step upstream.',
  },
  simple: [
    'When an ordinary web endpoint fails, a stack trace usually points straight to the broken line of code. When an AI feature misbehaves, no exception is thrown: the HTTP status is 200 OK, the JSON parses cleanly, and the user still gets a wrong, slow, or weirdly truncated answer.',
    'If all you wrote was `console.log(response)`, debugging that report is guesswork. Which user request triggered which model call? Did the retrieval step return empty context first? Which version of the system prompt was active? Did the primary model time out and fall back to a smaller model?',
    'Structured logging and tracing replace guesswork with a timeline. At the edge of your server, you generate a unique `traceId` for the incoming user action. Every step inside that action — retrieval, prompt assembly, model call, schema validation, retry, tool execution — emits a structured JSON record (a "span") carrying that same `traceId` plus its own `spanId`, timing, cost, and outcome. When something goes wrong, you filter by one `traceId` and read the entire story in order.',
    'Because prompts and completions often contain personal data or credentials, your tracing layer must redact sensitive strings before a span ever leaves memory — keeping every trace safe to store, query, and turn into future eval cases.',
  ],
  intuition: {
    analogy: 'Metrics are the cockpit warning light; logs are loose receipts in a shoebox; a trace is the flight data recorder ("black box") for one specific flight.',
    paragraphs: [
      'A dashboard metric tells you that p95 latency spiked from 1.8s to 6.4s at 10:15am — the warning light is flashing, but it cannot tell you which step stalled. Unstructured log lines are receipts dumped into a shoebox by fifty concurrent requests: you see "Retrying after 429" and "Validation failed", but you do not know which receipt belongs to which customer.',
      'A trace threads a single flight number (`traceId`) onto every instrument reading from takeoff to landing. Pull up flight `tr_8f92a` and you see a nested waterfall: HTTP request (4,210ms total) → vector search (95ms, 4 chunks) → model call #1 (2,800ms, 429 rate-limit) → backoff (500ms) → model call #2 (815ms, `gpt-4o-mini`, `promptVersion: "triage@v4"`, 610 tokens in, 92 out, `$0.00015`, `finishReason: "stop"`). The mystery is solved in ten seconds.',
    ],
  },
  technical: [
    'Understand the three observability signals and what each is for. **Metrics** are numeric counters, gauges, and histograms aggregated over time windows (requests/sec, p95 TTFT, daily spend) — cheap to store forever, used for dashboards and alerting, but stripped of per-request context. **Structured logs** are point-in-time JSON events (`level`, `timestamp`, `event`, attributes). **Traces** are trees of timed **spans** (`traceId`, `spanId`, `parentSpanId`, `name`, `startTimeMs`, `durationMs`, `status`, `attributes`) that represent causal hierarchy across async calls and service boundaries.',
    'Every model-call span in your gateway should record a standard attribute contract: `traceId`, `spanId`, `parentSpanId`, `feature`, `model`, `provider`, `promptVersion` (e.g. git SHA or semantic version of the template), `tokensIn`, `tokensOut`, `costUsd`, `latencyMs`, `ttftMs` (if streaming), `finishReason`, `retryAttempt`, and `status` (`"ok"` | `"error"`). In multi-step flows (RAG, validate-repair loops, tool-calling agents), wrap the outer workflow in a parent span so retries and tool calls appear as child spans (`parentSpanId = rootSpan.spanId`).',
    'Redaction is a hard boundary requirement, never an afterthought. Prompts and completions routinely contain user emails, phone numbers, customer documents, and occasionally leaked API keys or bearer tokens. Run a synchronous redaction pass inside the logger/tracer sink *before* any span is serialised to stdout, disk, or an observability vendor — stripping credential patterns (`sk-...`, `Bearer ...`) and masking PII (emails, phone numbers, national IDs) while preserving structural fields (`tokensIn`, `latencyMs`, `promptVersion`, `errorClass`) so every trace remains debuggable.',
    'Control volume and storage cost with tail-based or tiered sampling. Always emit 100% of span metadata (timings, token counts, costs, status codes, prompt versions) — those JSON lines are tiny (~400 bytes). For bulky prompt/completion text payloads, capture 100% of error, retry, fallback, and negative-feedback traces, plus a small random sample (e.g. 5–10%) of healthy 200 OK traces.',
  ],
  deeper: [
    'OpenTelemetry (OTel) and the W3C Trace Context standard (`traceparent` HTTP header: `00-<32-hex-trace-id>-<16-hex-span-id>-<flags>`) let traces cross process boundaries automatically. When your frontend or API gateway forwards `traceparent` to your Python/TypeScript AI worker, the worker attaches its model and tool spans to the exact same `traceId` — unifying browser click, backend queue wait, and LLM call into a single distributed trace.',
    'Notice how Phase 4 closes a loop between observability and evaluation. A trace with `status: "error"` (or an implicit user-dissatisfaction signal like immediate regeneration) already contains the exact `promptVersion`, redacted input payload, retrieved chunks, and model output. A 20-line script can export that span directly into your `evals/golden.jsonl` file — turning yesterday’s production mystery into tomorrow’s permanent CI regression check.',
  ],
  numbers: {
    title: 'Observability footprint — 50,000 model calls / day',
    rows: [
      ['Span metadata record (IDs, timings, tokens, cost, status)', '~450 bytes JSON / span'],
      ['50,000 metadata spans / day (100% kept)', '~22.5 MB / day (~675 MB / month)'],
      ['Full redacted prompt + output payload (~1.5k tokens)', '~6 KB JSON / span'],
      ['100% full-payload capture at 50k calls/day', '~300 MB / day (~9 GB / month)'],
      ['Tiered sampling: 100% of errors (2%) + 5% of OK calls', '3,450 full payloads/day ≈ 20.7 MB / day'],
      ['Storage saved by tiered payload sampling', '~93% reduction with 0% loss of failure traces'],
    ],
    takeaway:
      'Keep 100% of structured metadata spans so cost, latency, and error-rate rollups are exact; sample full redacted prompt/completion payloads at 100% on errors/retries and 5% on healthy calls to cut storage by >90% without losing a single bug trace.',
  },
  walkthrough: {
    lang: 'typescript',
    code: `export interface ModelSpan {
  traceId: string
  spanId: string
  parentSpanId?: string
  model: string
  promptVersion: string
  tokensIn: number
  tokensOut: number
  costUsd: number
  latencyMs: number
  finishReason: string
  status: 'ok' | 'error'
  promptPreview: string
  errorClass?: string
}

const SECRET_RE = /(sk-[a-zA-Z0-9_-]{12,}|Bearer\\s+[a-zA-Z0-9._-]+)/g
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g

export function redactText(raw: string): string {
  return raw.replace(SECRET_RE, '[REDACTED_SECRET]').replace(EMAIL_RE, '[REDACTED_EMAIL]')
}

export async function traceModelCall(
  ctx: { traceId: string; parentSpanId?: string; model: string; promptVersion: string; prompt: string },
  invoke: () => Promise<{ content: string; tokensIn: number; tokensOut: number; costUsd: number; finishReason: string }>,
  emit: (span: ModelSpan) => void,
) {
  const start = performance.now()
  const spanId = \`sp_\${Math.random().toString(36).slice(2, 10)}\`
  try {
    const res = await invoke()
    emit({
      traceId: ctx.traceId, spanId, parentSpanId: ctx.parentSpanId,
      model: ctx.model, promptVersion: ctx.promptVersion,
      tokensIn: res.tokensIn, tokensOut: res.tokensOut, costUsd: res.costUsd,
      latencyMs: Math.round(performance.now() - start),
      finishReason: res.finishReason, status: 'ok',
      promptPreview: redactText(ctx.prompt).slice(0, 200),
    })
    return res
  } catch (err) {
    emit({
      traceId: ctx.traceId, spanId, parentSpanId: ctx.parentSpanId,
      model: ctx.model, promptVersion: ctx.promptVersion,
      tokensIn: 0, tokensOut: 0, costUsd: 0,
      latencyMs: Math.round(performance.now() - start),
      finishReason: 'error', status: 'error',
      promptPreview: redactText(ctx.prompt).slice(0, 200),
      errorClass: err instanceof Error ? err.name : 'UnknownError',
    })
    throw err
  }
}`,
    notes: [
      ['export interface ModelSpan', 'A typed span schema forces every model call in the codebase to record the same fields — making logs queryable by SQL or jq without regex gymnastics.'],
      ['export function redactText(raw: string): string', 'Boundary redaction helper applied before any span leaves memory. Regexes catch structured tokens (`sk-...`, `Bearer ...`) and emails; in production, pair them with field allow-lists, truncation, and a dedicated PII scrubber because regexes alone cannot catch free-form names or custom secrets.'],
      ['ctx: { traceId: string; parentSpanId?: string; model: string; promptVersion: string; prompt: string }', 'The caller threads `traceId` from the incoming HTTP request and `parentSpanId` from the enclosing workflow step so multi-hop calls assemble into a tree.'],
      ['model: ctx.model, promptVersion: ctx.promptVersion', 'Recording `promptVersion` (e.g. `"triage@v4"` or git commit SHA) lets you correlate quality or latency shifts to the exact prompt edit that caused them.'],
      ["errorClass: err instanceof Error ? err.name : 'UnknownError'", 'Failed calls still emit a span with elapsed `latencyMs`, `status: "error"`, and `errorClass` before re-throwing — otherwise timeouts and 429s vanish from your traces.'],
    ],
  },
  exercise: {
    prompt:
      'Write a pure function `shouldSamplePayload(span: Pick<ModelSpan, "status" | "latencyMs" | "finishReason">, sampleRate?: number, rng?: () => number): boolean` that implements tiered payload sampling: always return `true` (keep full redacted prompt/response text) if the span errored, if `finishReason === "length"`, or if `latencyMs > 3000`; otherwise keep it with probability `sampleRate` (default `0.05`). Include a deterministic test using an injected `rng`.',
    solution: `export function shouldSamplePayload(
  span: Pick<ModelSpan, 'status' | 'latencyMs' | 'finishReason'>,
  sampleRate = 0.05,
  rng: () => number = Math.random,
): boolean {
  if (span.status === 'error') return true
  if (span.finishReason === 'length') return true
  if (span.latencyMs > 3000) return true
  return rng() < sampleRate
}

// Deterministic verification:
// shouldSamplePayload({ status: 'error', latencyMs: 120, finishReason: 'error' }, 0.05, () => 0.99) === true
// shouldSamplePayload({ status: 'ok', latencyMs: 800, finishReason: 'length' }, 0.05, () => 0.99) === true
// shouldSamplePayload({ status: 'ok', latencyMs: 3400, finishReason: 'stop' }, 0.05, () => 0.99) === true
// shouldSamplePayload({ status: 'ok', latencyMs: 450, finishReason: 'stop' }, 0.05, () => 0.02) === true
// shouldSamplePayload({ status: 'ok', latencyMs: 450, finishReason: 'stop' }, 0.05, () => 0.50) === false`,
  },
  quiz: [
    {
      q: 'What is the defining structural difference between a pile of structured log lines and a distributed trace?',
      options: [
        'Traces are stored in binary format while logs are stored as plain text',
        'A trace threads a shared `traceId` and parent-child `spanId` links across every hop of one request, forming a causal tree with start times and durations',
        'Traces only record errors whereas logs record every request',
        'Logs include token counts while traces only measure CPU usage',
      ],
      answer: 1,
      explain:
        'Structured JSON logs give you queryable fields on single events; adding `traceId`, `spanId`, and `parentSpanId` turns those isolated events into a causal tree (request → retrieval → model call → retry → response).',
    },
    {
      q: 'Where in your logging/tracing pipeline should secret and PII redaction happen, and what must remain unredacted?',
      options: [
        'In a weekly cron job that scrubs the database after logs are ingested',
        'Inside the prompt by asking the model not to repeat secrets',
        'Synchronously at the logger/tracer boundary before spans are written or exported, redacting sensitive text while keeping structural fields (`traceId`, `promptVersion`, `tokensIn`, `latencyMs`, `status`) intact',
        'By hashing the entire JSON span into an opaque string',
      ],
      answer: 2,
      explain:
        'Once an unredacted secret or email is written to stdout or shipped to a log vendor, it has already leaked. Redacting text fields at emit time protects privacy while preserving every structural attribute needed for debugging and metrics.',
    },
    {
      q: 'Why should every model-call span record `promptVersion` alongside `model`?',
      options: [
        'Because LLM providers reject API requests that do not include a prompt version header',
        'Because behaviour regressions often come from prompt edits rather than code or model changes; `promptVersion` lets you slice error rates and latency before vs after a prompt rollout',
        'Because `promptVersion` reduces the number of input tokens billed',
        'Because `promptVersion` replaces the need for `traceId`',
      ],
      answer: 1,
      explain:
        'Prompts change far more often than model IDs. Tagging every span with `promptVersion` lets dashboards, alerts, and failure triage pinpoint immediately which prompt revision introduced a spike in schema errors or latency.',
    },
  ],
  realWorld: [
    'Production AI gateways (LiteLLM, Cloudflare AI Gateway, custom FastAPI/Node wrappers) emit one OpenTelemetry span per model call tagged with `gen_ai.request.model`, token usage, cost, and prompt version — feeding both real-time Grafana/Datadog dashboards and trace explorers.',
    'When an on-call engineer investigates a spike in user retries, they filter traces where a single `traceId` contains multiple child model spans, inspect the redacted prompt diff, and promote the failing payload into the CI golden set in minutes.',
    'Regulated fintech and healthcare AI teams run automated pre-merge tests that feed synthetic SSNs, emails, and `sk-` API keys through their request pipeline and assert that zero raw matches appear in the emitted span sink.',
  ],
  further: [
    {
      label: 'OpenTelemetry — Semantic Conventions for Generative AI Systems',
      url: 'https://opentelemetry.io/docs/specs/semconv/gen-ai/',
      note: 'The vendor-neutral standard attribute names (`gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`) for LLM spans.',
    },
    {
      label: 'W3C — Trace Context Specification',
      url: 'https://www.w3.org/TR/trace-context/',
      note: 'How `traceparent` headers propagate `traceId` and `parentSpanId` across HTTP services.',
    },
    {
      label: 'OWASP — Top 10 for Large Language Model Applications (Sensitive Information Disclosure)',
      url: 'https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/',
      note: 'Threat model and boundary-redaction practices for keeping PII and credentials out of prompts and telemetry.',
    },
  ],
}
