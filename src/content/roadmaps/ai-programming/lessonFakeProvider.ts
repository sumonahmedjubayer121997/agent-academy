import type { Lesson } from '../../types'

/** Third exemplar lesson — the module the fake-provider practice build teaches. */
export const FAKE_PROVIDER_LESSON: Lesson = {
  id: 'the-fake-provider',
  moduleId: 'aip-testing-fundamentals',
  title: 'The Fake Provider',
  minutes: 30,
  tagline: 'You cannot unit-test a model. You can unit-test everything around it — if it hides behind an interface.',
  pre: {
    q: 'What does boundary validation (pydantic/zod) catch that type checking alone misses?',
    options: [
      'Slower code paths',
      'Malformed data crossing boundaries at runtime — drift and hostile input, not just your code shapes',
      'Missing documentation',
      'Bundle size growth',
    ],
    answer: 1,
    explain:
      'Type checking sees your code at compile time; validation sees the data crossing boundaries at runtime. The provider interface you are about to design is exactly such a boundary — and its fake is the tool that tests it offline.',
  },
  simple: [
    'Roughly 80 percent of an AI feature is ordinary code: validation, routing, retries, caching, formatting. That 80 percent can be tested fast and deterministically — but only if the model itself is replaceable.',
    'The trick is one seam: a Provider interface with a single operation (complete(messages, options) returning a typed Result). The real implementation calls an API; a fake implementation returns scripted responses from memory.',
    'A good fake has three powers: it is deterministic (same script, same answer, every run), it is scriptable (you tell it what to return or throw next), and it fails on demand (429, timeout, malformed output — injected like a stage prop).',
    'With the fake in place, your whole suite runs offline in milliseconds: no network, no API key, no flaky 3am provider hiccup turning your CI red for reasons unrelated to your code.',
    'The real provider is not banished — it moves to a separate, clearly labelled smoke test that runs nightly or before release. Unit tests prove your logic; the smoke test proves the wire is real.',
  ],
  intuition: {
    analogy: 'The fake is a flight simulator, and the real provider is the aircraft.',
    paragraphs: [
      'Pilots train almost entirely in simulators because simulators are cheap, repeatable, and can fail on command: engine fire at 10,000 feet, on a Tuesday, every Tuesday, until the crew handles it perfectly. Nobody trains engine-fire recovery on the passenger aircraft.',
      'Your fake provider is the simulator control panel. It scripts the failure you need to test — three 429s in a row, a hang, a malformed body — and it will produce that exact failure identically a thousand times. The real aircraft (provider) is flown rarely, on scheduled check flights (smoke tests).',
    ],
  },
  technical: [
    'The interface is small on purpose: complete(messages: Message[], options?: Options) => Promise<Result> where Result carries text, usage, finishReason, and possibly structured output. Everything else (retries, caching, cost) is YOUR code layered above — which is exactly the code unit tests protect.',
    'Fake design: a queue of scripted responses; helpers like failNext(n, {status}) and delayNext(ms); counters for calls and token usage. Keep it under a hundred lines — if the fake needs a fake, the interface is wrong.',
    'Test patterns unlocked: assert exact outputs (deterministic), assert call counts (retry layer: fake fails 3 times, expect 4 calls), assert latency bounds with mocked timers (timeout logic), assert repair-loop behavior (malformed then valid script). None of these are possible against a live provider without flakiness.',
    'Placement: dependency injection at the boundary — the feature receives a Provider, tests construct FakeProvider, production wiring injects the real one from configuration. The fake is a first-class module in the repo, not a test afterthought.',
    'Contract discipline: the fake must answer with the same shapes the real provider produces. The practical guard is golden recordings — capture a handful of real responses, and a test that replays them against the same assertions the fake-mode tests make.',
  ],
  deeper: [
    'The test pyramid for AI features: many unit tests against the fake (logic), fewer integration tests with the fake exercising adapters and persistence, and one or two smoke tests against the real provider (nightly or pre-release). Trying to make the base of the pyramid use the real provider is why AI test suites become slow and flaky.',
    'Fakes vs mocks: a mock asserts interactions ("complete was called once"); a fake is a working implementation with scripted behavior. For provider seams, prefer the fake — your code consumes responses, not call signatures, and a fake lets you test consumption naturally.',
    'Golden recordings also catch provider drift: when the vendor changes a response field, the nightly smoke replays recordings and the diff points at the exact behavioral change — turning a mystery outage into a contract check.',
  ],
  numbers: {
    title: 'What the seam buys (typical shape of results)',
    rows: [
      ['Suite against live provider', 'seconds-to-minutes, network-flaky, costs tokens per run'],
      ['Same suite against the fake', 'milliseconds, zero flakes, zero cost — CI runs it on every push'],
      ['Failure injection coverage', '429 / timeout / malformed scripted on demand — untestable live without luck'],
      ['Smoke test (real provider)', 'runs nightly: wire, auth, and contract verified in one labelled job'],
    ],
    takeaway: 'The seam converts your provider from a dependency you pray to into a dependency you test around.',
  },
  demo: 'fake-provider',
  walkthrough: {
    lang: 'ts',
    code: `// The seam + the fake — the two smallest artifacts with the biggest testing payoff.
interface Provider {
  complete(messages: Message[], options?: Options): Promise<Result>
}

class FakeProvider implements Provider {
  private queue: Array<Result | Error> = []
  calls: Message[][] = []          // assert call counts (retry tests)

  respond(r: Result) { this.queue.push(r) }
  failNext(n: number, err: Error) { for (let i = 0; i < n; i++) this.queue.push(err) }

  async complete(messages: Message[]): Promise<Result> {
    this.calls.push(messages)
    const next = this.queue.shift()
    if (next instanceof Error) throw next
    return next ?? { text: '', usage: { in: 0, out: 0 }, finishReason: 'stop' }
  }
}

// A test that used to be flaky and slow is now instant and exact:
test('retry layer absorbs three 429s then succeeds', async () => {
  const fake = new FakeProvider()
  fake.failNext(3, providerError(429))
  fake.respond({ text: 'urgent', usage: { in: 42, out: 1 }, finishReason: 'stop' })

  const result = await completeWithRetry(fake, [{ role: 'user', content: 'how urgent?' }])

  expect(result.text).toBe('urgent')   // deterministic — same every run
  expect(fake.calls).toHaveLength(4)   // 3 failures + 1 success, no network
})`,
    notes: [
      ['interface Provider', 'The seam. Everything above it (retries, caching, cost) is your logic; everything below it is replaceable.'],
      ['failNext(3, providerError(429))', 'Failure injection as stage props: the 429 storm happens on demand, identically, forever — untestable against a live provider without luck.'],
      ['expect(fake.calls).toHaveLength(4)', 'Call-count assertions prove the retry layer did exactly what the policy says — three failures, four calls, one success.'],
      ['test runs offline', 'No key, no network, no flake: this test runs in CI on every push, which is what makes the 80 percent layer trustworthy.'],
      ['class under a hundred lines', 'If the fake grows complex, the interface is wrong — the fake is a mirror, not a second product.'],
    ],
  },
  exercise: {
    prompt:
      'This is the design step of the fake-provider practice build. Define your Provider interface (complete, Result, Options) in code, then implement FakeProvider with respond() and failNext(). Write three tests against completeWithRetry or any function that consumes the interface: (1) happy path with exact-output assertion, (2) three 429s then success with call-count assertion, (3) malformed output with a repair-loop assertion. Then prove the suite is network-free by turning off your wifi and running it. Record suite duration before (with any real calls you had) and after.',
    solution:
      'A correct solution has: the interface under ten lines, the fake under a hundred, three green tests that never touch a socket, and a wifi-off run proving it. The before/after duration note is usually dramatic (seconds to milliseconds). The subtlety worth writing down: assertions compare exact strings and counts — impossible against a live model, trivial against a script, and that shift is what makes the surrounding 80 percent of the feature genuinely test-covered.',
  },
  quiz: [
    {
      q: 'Why does the fake implement the same interface as the real provider, rather than tests calling it directly?',
      options: [
        'It is faster to write',
        'The code under test consumes the interface — swapping implementations is what lets the SAME production code run in tests and production',
        'Interfaces are required by TypeScript',
        'To support multiple providers',
      ],
      answer: 1,
      explain:
        'The seam means production code and test code are the same code — the feature cannot tell the difference, so tests exercise real logic (retries, parsing, caching) rather than a parallel test-only path.',
    },
    {
      q: 'Your CI is red at 3am because a provider outage timed out the test suite. What does this teach you?',
      options: [
        'Add longer timeouts',
        'The suite depends on the real provider — provider calls belong in a labelled smoke test, not the unit suite that runs on every push',
        'Retry harder in tests',
        'Providers are unreliable; disable CI at night',
      ],
      answer: 1,
      explain:
        'Unit suites must be deterministic and offline; a provider outage has no business failing them. Move real calls to the nightly smoke tier — the pyramid exists precisely to prevent this 3am page.',
    },
    {
      q: 'What do golden recordings add beyond the fake?',
      options: [
        'Faster tests',
        'Contract checking against reality — captured real responses verify the fake and tests still match what the provider actually returns',
        'Cheaper API bills',
        'They replace smoke tests',
      ],
      answer: 1,
      explain:
        'The fake can drift from reality (a field renamed upstream). Replaying captured real responses through the same assertions catches provider drift as a contract failure instead of a mystery outage.',
    },
  ],
  realWorld: [
    'Platform teams: every serious AI codebase (and most SDKs) ships a fake or test-double for exactly this seam — it is the precondition for confident refactoring of the reliability layer.',
    'Incident drills: a regression test reproducing a past 429 storm as a fake script is how the fix becomes permanent — the outage becomes a replayable unit test.',
    'Onboarding: a new engineer can run the full suite on day one with zero credentials — the fake removes the API-key barrier from contributing.',
  ],
  further: [
    {
      label: 'Martin Fowler — test doubles: fakes vs mocks',
      url: 'https://martinfowler.com/articles/mocksArentStubs.html',
      note: 'The classic definitions; understanding why a fake (not a mock) fits provider seams.',
    },
    {
      label: 'Google Testing Blog — just say no to more end-to-end tests',
      url: 'https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-testing.html',
      note: 'The pyramid argument in its clearest form — why the base must be fast and deterministic.',
    },
    {
      label: 'openai-python / openai-node SDKs',
      url: 'https://github.com/openai/openai-python',
      note: 'Read how production SDKs shape client interfaces — your Provider mirrors this boundary one level up.',
    },
  ],
}
