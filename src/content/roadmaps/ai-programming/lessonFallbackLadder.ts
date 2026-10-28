import type { Lesson } from '../../types'

export const FALLBACK_LADDER_LESSON: Lesson = {
  id: 'aip-fallback-ladder',
  moduleId: 'aip-fallbacks',
  title: 'The Fallback Ladder',
  minutes: 30,
  tagline: 'The Resilient Model Call ended with retries exhausted and an error surfaced. This lesson is about everything the user experiences next.',
  takeaways: [
    'Order rungs by what the user experiences — fast good answer, then a slightly worse answer with a badge, then honest slowness, then honest failure — never by what is cheapest for you to serve.',
    'Every rung carries a designed user message; transparently-worse builds trust, while a silent swap teaches users that your feature lies.',
    'A ladder is not designed during the outage: it is specified in advance, wired to degradation metrics, and drilled by injecting failures in staging before real traffic ever walks it.',
  ],
  relatedPractice: 'aip-pp-degradation-ladder',
  pre: {
    q: 'From The Resilient Model Call (Phase 2): four attempts failed, the circuit breaker is open, and the error surfaced to the caller. At that exact moment, what does the user of the feature see?',
    options: [
      'An infinite spinner until the provider recovers',
      'Whatever the fallback ladder serves next — smaller model, cached answer, queued job, or an honest apology — designed in advance or not at all',
      'A raw stack trace with the provider status code',
      'The platform layer silently retries the request forever',
    ],
    answer: 1,
    explain:
      'Retries and breakers exist to stop you making the outage worse; the ladder exists to decide what the user experiences anyway. The handoff point is exactly here — and whether something considered, humane, and useful appears on screen depends entirely on decisions made weeks earlier.',
  },
  simple: [
    'Retries end; the user does not. When the resilient call gives up, the request still needs an answer — and the difference between a good AI product and a bad one under stress is almost entirely what answer appears at that moment.',
    'A fallback ladder is an ordered list of ways to serve the request progressively worse-but-honestly: the fast primary model, then a smaller model with a visible badge, then a cached or stale answer with its age shown, then an async queue with a notification, and finally an honest apology with something useful to do next.',
    'Each rung is really two designs: the technical path (which model, which cache, which queue) and the user-facing message. Both are written down before launch; neither is improvised during the incident.',
    'Ordering follows user value, not infrastructure convenience: a 40-millisecond stale answer beats a ten-minute queue for "what does this document say", but the queue beats staleness for "what is my balance right now". The order is a per-feature product decision.',
    'Ladders are drilled, not hoped for: fault injection in staging walks a real request down every rung before production traffic does, and the share of answers served by each rung sits on the dashboard next to latency and cost — a designed brownout and an incident look identical without that chart.',
  ],
  intuition: {
    analogy: 'The ladder is a restaurant that runs out of fish — the menu degrades honestly, and the kitchen never pretends frozen is fresh.',
    paragraphs: [
      'A good restaurant plans scarcity: the waiter offers the chicken, says plainly that the fish is out, perhaps offers yesterday’s cake at a discount with its day named. A bad one serves frozen fish as fresh and hopes nobody notices. Users are the diners: they will happily accept the smaller model or the cached answer — once, twice, dozens of times — if you tell them. They will not accept being lied to, and a silent swap is a lie that gets discovered.',
      'And the plan exists before the evening starts. The waiter’s script for "we’re out" is written at staff briefing, not improvised at table nine during the rush. Your badge text, your staleness label, your "we’ll notify you in ten minutes" — these are briefing-time artifacts, which is exactly what makes them calm and specific when the outage actually arrives.',
    ],
  },
  technical: [
    'A rung specification: each entry names the serving path (primary / small-model / cache-lookup / queue-plus-notify / apology), a latency budget, a quality expectation, its cost shape, the exact user-facing message, and the condition that selects it (breaker open, timeout, cache hit). One table per feature, reviewed like a schema.',
    'Selection logic lives in the gateway, not in feature code: the wrapper from The Resilient Model Call ends by walking rungs in order under one total deadline; the feature receives the answer plus whichRung and renders accordingly. One drilled ladder implementation, inherited by every feature — not five ad-hoc try/catch blocks.',
    'Messaging discipline per rung: rung two gets a subtle badge ("answering with our lighter assistant"), rung three shows staleness ("a similar question from 3 days ago"), rung four sets an expectation ("your answer in ~10 minutes" plus a notification), rung five apologizes once, offers a retry and an alternative, and never blames the user. Silence is the only forbidden message.',
    'Degradation is a first-class metric: the fraction of requests served per rung, plotted beside p50/p95 latency and cost per answer. A ladder serving 30% from cache during a provider brownout is the system working as designed — but only if the dashboard says so, otherwise nobody can tell whether to page or to celebrate.',
    'Drills close the loop: staging injects 429 storms, breaker-open, and hard-outage scripts behind a flag while one real request walks every rung; the drill records what each user message actually looked like and updates the runbook. A rung that has never been drilled does not exist.',
  ],
  deeper: [
    'Why the ladder descends instead of escalating to a bigger model: upward moves multiply cost and latency during the provider’s worst minutes, and a bigger model usually fails for the same regional reason the primary did. Under stress you descend to something that answers now — escalation is a tuning-time decision made in calm air, not an outage-time reflex.',
    'Partial degradation beats binary: stream the smaller model’s first token immediately while enqueueing the full-quality regeneration for later — an acceptable answer now, a better one delivered. The response-time literature (perceived latency thresholds at roughly 1 and 10 seconds) is why a ten-second honest wait needs a progress story, never a bare spinner.',
    'The apology rung is a product surface, not an error page: what it offers — retry button, alternate flow, human contact, "we’ll email you the result" — measurably changes whether the user comes back tomorrow. Write its copy with the seriousness of a landing page, and A/B it just as readily.',
  ],
  numbers: {
    title: 'One feature, three days (illustrative serving mix)',
    rows: [
      ['Healthy day', '~100% primary · p50 1.8 s · quality 0.94 · users see nothing unusual'],
      ['Provider brownout (429s, breaker flapping)', '~65% primary · 30% small model · 5% cache · p50 1.9 s · quality 0.90 · 35% saw a badge, zero saw an error'],
      ['Regional hard outage (2 hours)', '0% primary · 55% cache · 35% queued and notified · 10% apology · quality 0.82 on served work'],
      ['Complaints during the outage', '3 — all about the apology wording, none about degraded answers'],
    ],
    takeaway:
      'The brownout day is the ladder paying for itself: near-identical headline metrics, a visible degradation story on the dashboard, and not one raw error shown to a user. The numbers are illustrative teaching values — measure your own rung mix from day one.',
  },
  demo: 'fallback-ladder',
  walkthrough: {
    lang: 'ts',
    code: `type RungId = 'primary' | 'small' | 'cache' | 'queue' | 'apology'

type Rung = {
  id: RungId
  budgetMs: number      // how much of the user's patience this rung may spend
  userMessage: string   // exact copy the UI shows - designed, never improvised
}

const LADDER: Rung[] = [
  { id: 'primary', budgetMs: 12_000, userMessage: '' },
  { id: 'small',   budgetMs:  4_000, userMessage: 'Answering with our lighter assistant.' },
  { id: 'cache',   budgetMs:     50, userMessage: 'Showing a recent answer to a similar question (3 days old).' },
  { id: 'queue',   budgetMs:    100, userMessage: 'High demand - your answer will arrive in ~10 minutes.' },
  { id: 'apology', budgetMs:      0, userMessage: 'We cannot answer right now. Try again shortly.' },
]

export async function answerWithLadder(
  gateway: Gateway, question: string,
): Promise<{ answer: string; rung: Rung; toldUser: string }> {
  let deadlineLeft = TOTAL_BUDGET_MS
  for (const rung of LADDER) {
    try {
      const answer = await gateway.serve(rung.id, question, {
        budgetMs: Math.min(rung.budgetMs, deadlineLeft),
      })
      metrics.rungServed(rung.id)                  // degradation dashboard
      return { answer, rung, toldUser: rung.userMessage }
    } catch (err) {
      deadlineLeft -= err.elapsedMs                // an open breaker fails
    }                                              // fast and spends little
  }
  const last = LADDER[LADDER.length - 1]           // apology is always in stock
  metrics.rungServed(last.id)
  return { answer: apologyBody(question), rung: last, toldUser: last.userMessage }
}`,
    notes: [
      ['LADDER', 'The rung table is data: order, budgets, and exact user copy in one reviewable place — one table per feature, treated like a schema.'],
      ['budgetMs / deadlineLeft', 'The whole ladder runs inside one deadline the user can tolerate; each rung gets the smaller of its budget and what remains, and exhaustion falls through to the apology instead of a spinner.'],
      ['metrics.rungServed', 'Degradation as a metric: share-per-rung beside latency and cost is how on-call tells a designed brownout from an incident.'],
      ['toldUser', 'The message travels with the answer, so the UI cannot forget to show it — silence while serving rung three is the trust-destroying failure mode.'],
      ['apology always in stock', 'The final rung cannot fail: no provider, no cache, no queue. Designing it as a real rung with real copy is what makes total outage survivable.'],
    ],
  },
  exercise: {
    prompt:
      'Specify the ladder for one real feature of yours: list the rungs in the order the user would prefer them, each with a latency budget, the exact user message, and the selection condition. Then run the degradation drill from the practice build: inject (a) a 429 storm, (b) breaker-open, (c) total outage, and record which rung served and what the user saw in each. Which rung were you least proud of — and what is its message costing you in trust?',
    solution:
      'A strong answer has five rungs with honest, specific copy — a badge, a staleness age, a queue ETA you can actually keep, an apology with a next action — and the drill catching at least one gap. Common findings: the cache rung quietly serving answers to a subtly different question, a queue ETA that is fiction, or an apology that blames the user ("invalid question"). The trust question is the point: rung three with its age shown reads as helpful; the same answer served silently reads as the product lying once discovered. Fix the weakest message first — it is the cheapest quality win on the ladder.',
  },
  quiz: [
    {
      q: 'The primary model is rate-limited and the cache holds a slightly stale answer to a similar question. Per this lesson, rung three serves it how?',
      options: [
        'Silently — the user cannot tell the difference anyway',
        'With its staleness shown: "a recent answer to a similar question, 3 days old"',
        'Wrapped in an error banner so the user knows something is wrong',
        'It does not — stale answers must never be served',
      ],
      answer: 1,
      explain:
        'Silent swaps work until they are discovered — and then cost trust permanently. Honest degradation keeps users through dozens of brownouts. An error banner overshoots: this is a designed, acceptable answer, and the label should say exactly what it is.',
    },
    {
      q: 'Why does the ladder descend (smaller model, cache, queue) rather than escalate to a bigger model under stress?',
      options: [
        'Bigger models are unavailable during outages',
        'Escalation multiplies cost and latency during the provider’s worst minutes and likely fails for the same regional reason — descending serves the user something now',
        'Providers forbid switching models mid-request',
        'Bigger models cannot be covered by tests',
      ],
      answer: 1,
      explain:
        'Under stress, the goal is an acceptable answer now. Escalating upward spends the most money at the worst time on the attempt most likely to fail identically. Model upgrades are tuning-time decisions; outage-time decisions descend.',
    },
    {
      q: 'Which rung can never fail, and why does that matter?',
      options: [
        'The smaller model — providers keep it warm during incidents',
        'The apology — it depends on no external service and is designed with real copy and a next action',
        'The cache — it is local storage',
        'The queue — it is asynchronous',
      ],
      answer: 1,
      explain:
        'Every other rung depends on something that can itself be down. A designed final rung — honest words, a retry, an alternative — is what converts total outage from an incident into a degraded day the product survives with its reputation intact.',
    },
  ],
  realWorld: [
    'Support copilots: during a provider brownout the smaller model keeps answering routine tickets behind a badge while hard ones queue — agents see slightly simpler drafts, not an error wall at the 9am peak.',
    'Summarization features: the cached rung ("a recent answer to a similar document") routinely carries entire outage windows unnoticed — which is exactly why the degradation chart must exist, or the win is invisible to everyone including you.',
    'Incident reviews: the postmortem of a bad AI outage almost always finds an undesigned rung — an infinite spinner where an apology belonged, a queue with no ETA. The drill exists so that sentence is never written about your feature.',
  ],
  further: [
    {
      label: 'Google SRE book: handling overload',
      url: 'https://sre.google/sre-book/handling-overload/',
      note: 'Load shedding and graceful degradation from the source — pairs with the retry-budget reading in The Resilient Model Call.',
    },
    {
      label: 'The Tail at Scale (Communications of the ACM)',
      url: 'https://cacm.acm.org/research/the-tail-at-scale/',
      note: 'Why the slowest dependency dominates user-perceived failure, and why bounded rungs beat open-ended waiting.',
    },
    {
      label: 'NN/g: response time limits',
      url: 'https://www.nngroup.com/articles/response-times-3-important-limits/',
      note: 'The 0.1/1/10-second perception thresholds behind every budgetMs in the rung table.',
    },
  ],
}
