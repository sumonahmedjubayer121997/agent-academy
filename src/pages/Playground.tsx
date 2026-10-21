import { useEffect, useRef, useState } from 'react'
import { Bot, CheckCircle2, Pause, Play, RotateCcw, ShieldAlert, Wrench, X } from 'lucide-react'
import { Badge, Button, Card, SectionHead } from '../components/ui'
import { LOOP_STAGES } from '../components/demos/LoopVisual'

/* ── Simulation data ─────────────────────────────────────────────────── */

type Trace =
  | { k: 'user'; t: string }
  | { k: 'plan'; items: string[] }
  | { k: 'think'; t: string }
  | { k: 'act'; tool: string; args: string }
  | { k: 'result'; t: string }
  | { k: 'obs'; t: string }
  | { k: 'eval'; t: string }
  | { k: 'reflect'; t: string }
  | { k: 'final'; t: string }
  | { k: 'gate'; action: string; detail: string }

interface Scenario {
  id: string
  label: string
  goal: string
  steps: Trace[]
  afterApprove: Trace[]
  afterReject: Trace[]
}

const SCENARIOS: Scenario[] = [
  {
    id: 'research',
    label: 'Research assistant (search + email)',
    goal: 'Research “dense vs sparse retrieval” and email me a cited brief.',
    steps: [
      { k: 'user', t: 'Research “dense vs sparse retrieval” and email me a cited brief.' },
      {
        k: 'plan',
        items: ['Search for a comparison article', 'Read the two most promising pages', 'Draft a brief with citations', 'Ask the human before sending any email'],
      },
      { k: 'think', t: 'I need current, citable sources. Starting with a web search.' },
      { k: 'act', tool: 'search_web', args: '{"query": "dense vs sparse retrieval comparison 2026"}' },
      { k: 'result', t: '3 results: (1) “Hybrid Search Explained” — vectorbuzz.dev (2) “BM25 vs embeddings” — searchnotes.io (3) “RAG retrieval patterns” — arxiv.org/…' },
      { k: 'obs', t: 'Results (1) and (3) look most substantive. Reading both.' },
      { k: 'act', tool: 'read_page', args: '{"url": "vectorbuzz.dev/hybrid-search"}' },
      { k: 'result', t: 'Key point: dense retrieval captures meaning, sparse (BM25) captures exact terms; hybrid + reranking wins in benchmarks.' },
      { k: 'act', tool: 'read_page', args: '{"url": "arxiv.org/abs/…"}' },
      { k: 'result', t: 'Paper reports +11% recall@5 for hybrid over dense-only on keyword-heavy queries.' },
      { k: 'obs', t: 'Two solid sources with a concrete number. Enough to draft.' },
      { k: 'think', t: 'Drafting a 120-word brief citing both sources.' },
      { k: 'act', tool: 'draft_email', args: '{"subject": "Brief: dense vs sparse retrieval", "words": 120}' },
      { k: 'result', t: 'Draft ready. Next action sends real email — irreversible, requires approval.' },
      { k: 'gate', action: 'send_email(to="me@example.com")', detail: 'The agent wants to send the drafted brief to your inbox. This is the human-in-the-loop approval gate — irreversible actions always stop here.' },
    ],
    afterApprove: [
      { k: 'result', t: 'Human approved ✓ — executing send_email' },
      { k: 'obs', t: 'Email sent (message id 4f2a…).' },
      { k: 'eval', t: 'Goal satisfied: research done, sources cited, email delivered. Stopping.' },
      { k: 'final', t: 'Done — brief delivered to your inbox with 2 citations. Total: 6 model calls, 4 tool executions.' },
    ],
    afterReject: [
      { k: 'result', t: 'Human rejected ✗ — send_email blocked' },
      { k: 'reflect', t: 'The email was rejected. The draft is safe; I will not retry a rejected irreversible action. Falling back to returning the brief here.' },
      { k: 'final', t: 'Understood — email not sent. Here is the brief with citations instead. (A rejected action is information, not an obstacle to argue with.)' },
    ],
  },
  {
    id: 'analyst',
    label: 'Data analyst (dataset + report approval)',
    goal: 'Analyze sales.csv and post a weekly summary to the team channel.',
    steps: [
      { k: 'user', t: 'Analyze sales.csv and post a weekly summary to the team channel.' },
      {
        k: 'plan',
        items: ['Inspect the dataset schema', 'Compute weekly aggregates', 'Draft the summary', 'Get approval before posting'],
      },
      { k: 'act', tool: 'read_csv', args: '{"path": "sales.csv", "rows": 5}' },
      { k: 'result', t: 'Columns: date, region, product, units, revenue_usd — 12,480 rows, no nulls.' },
      { k: 'obs', t: 'Clean schema. Revenue is the target metric; region is the interesting cut.' },
      { k: 'act', tool: 'run_analysis', args: '{"group_by": "week", "agg": "sum(revenue_usd)"}' },
      { k: 'result', t: 'This week $41.2k (+9.4% WoW). Top region: EU ($18.7k). One product line (Anchors) down 22%.' },
      { k: 'eval', t: 'Numbers computed and sanity-checked against the row count. Drafting the post.' },
      { k: 'act', tool: 'draft_report', args: '{"sections": ["headline", "by_region", "watchlist"]}' },
      { k: 'result', t: 'Draft ready (140 words). Posting is visible to the whole team — approval required.' },
      { k: 'gate', action: 'post_to_slack(channel="#team-weekly")', detail: 'The agent wants to post the summary where 30 people will read it. Approve, or reject and it will hand you the draft instead.' },
    ],
    afterApprove: [
      { k: 'result', t: 'Human approved ✓ — executing post_to_slack' },
      { k: 'obs', t: 'Posted. Link: #team-weekly/1730…' },
      { k: 'eval', t: 'Task complete within budget: 5 model calls, $0.021.' },
      { k: 'final', t: 'Weekly summary posted. Highlight: +9.4% WoW overall; watch Anchors (−22%).' },
    ],
    afterReject: [
      { k: 'result', t: 'Human rejected ✗ — post_to_slack blocked' },
      { k: 'reflect', t: 'Rejected. Keeping the draft; suggesting you edit the “watchlist” wording before posting manually.' },
      { k: 'final', t: 'Not posted. Draft saved to ./weekly-draft.md for your review — the human stays in command of shared channels.' },
    ],
  },
]

/* ── UI helpers ──────────────────────────────────────────────────────── */

const stageFor = (t: Trace): number => {
  if (t.k === 'obs' || t.k === 'result') return 0
  if (t.k === 'think' || t.k === 'plan') return 1
  if (t.k === 'act' || t.k === 'gate') return 2
  return 3
}

function TraceEntry({ t }: { t: Trace }) {
  const styles: Record<Trace['k'], { label: string; cls: string }> = {
    user: { label: 'USER', cls: 'border-line bg-raised' },
    plan: { label: 'PLAN', cls: 'border-line bg-raised' },
    think: { label: 'THINK', cls: 'border-line-strong bg-surface' },
    act: { label: 'ACT', cls: 'border-accent/40 bg-accent-soft' },
    result: { label: 'RESULT', cls: 'border-line bg-raised' },
    obs: { label: 'OBSERVE', cls: 'border-line bg-raised' },
    eval: { label: 'EVALUATE', cls: 'border-line-strong bg-surface' },
    reflect: { label: 'REFLECT', cls: 'border-accent/40 bg-accent-soft' },
    final: { label: 'FINAL', cls: 'border-ok/40 bg-ok/10' },
    gate: { label: 'GATE', cls: 'border-bad/40 bg-bad/10' },
  }
  const s = styles[t.k]
  return (
    <div className={`fade-up rounded-xl border px-4 py-3 text-sm ${s.cls}`}>
      <span className="mr-2 font-mono text-[10px] font-bold tracking-wider text-ink-faint">
        {s.label}
      </span>
      {t.k === 'plan' ? (
        <ul className="mt-1.5 space-y-1 text-ink-soft">
          {t.items.map((it, i) => (
            <li key={i}>
              {i + 1}. {it}
            </li>
          ))}
        </ul>
      ) : t.k === 'act' ? (
        <div className="mt-1">
          <span className="font-mono text-[12px] font-semibold text-accent">{t.tool}</span>(
          <span className="font-mono text-[12px] text-ink-soft break-all">{t.args}</span>)
        </div>
      ) : t.k === 'gate' ? (
        <div>
          <p className="mt-1 font-mono text-[12px] font-semibold text-bad">{t.action}</p>
          <p className="mt-1.5 text-ink-soft">{t.detail}</p>
        </div>
      ) : (
        <span className="text-ink-soft">{t.t}</span>
      )}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function Playground() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)
  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!
  const [visible, setVisible] = useState<Trace[]>([])
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1100)
  const [gate, setGate] = useState(false)
  const queue = useRef<Trace[]>([])
  const traceEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    traceEnd.current?.scrollIntoView({ block: 'end' })
  }, [visible])

  useEffect(() => {
    if (!running || gate) return
    const timer = setTimeout(tick, speed)
    return () => clearTimeout(timer)
  }, [running, gate, speed, visible])

  useEffect(reset, [scenarioId])

  function reset() {
    queue.current = []
    setVisible([])
    setRunning(false)
    setGate(false)
  }

  function start() {
    queue.current = [...scenario.steps]
    setVisible([{ k: 'user', t: scenario.goal }])
    setRunning(true)
    setGate(false)
  }

  function tick() {
    const next = queue.current.shift()
    if (!next) {
      setRunning(false)
      return
    }
    if (next.k === 'gate') {
      setVisible((v) => [...v, next])
      setGate(true)
      setRunning(false)
      return
    }
    setVisible((v) => [...v, next])
  }

  function decide(approved: boolean) {
    const tail = approved ? scenario.afterApprove : scenario.afterReject
    queue.current = [...queue.current, ...tail]
    setGate(false)
    setRunning(true)
  }

  const last = visible[visible.length - 1]
  const stage = visible.length ? stageFor(last) : -1
  const toolCount = visible.filter((t) => t.k === 'act').length
  const modelCalls = visible.filter((t) => ['think', 'plan', 'eval', 'reflect'].includes(t.k)).length + (visible.length ? 1 : 0)

  return (
    <div className="py-10">
      <SectionHead
        eyebrow="AI agent playground"
        title="Step through a real agent loop"
        sub="A scripted, deterministic simulation of the architecture you'll build in Phase 6: planning, tool calls, observations, evaluation — and an approval gate before anything irreversible. No live model is connected (that arrives with the FastAPI backend in a later iteration), and that honesty is itself a lesson."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge tone="warn">
          <ShieldAlert size={12} /> SIMULATION — scripted, no live LLM
        </Badge>
        <div className="flex flex-wrap gap-1.5">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenarioId(s.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                scenarioId === s.id
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line text-ink-soft hover:bg-raised'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Trace */}
        <Card className="flex max-h-[70vh] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Bot size={16} className="text-accent" /> Execution trace
            </span>
            <div className="flex items-center gap-2">
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink-soft"
                aria-label="Playback speed"
              >
                <option value={1600}>0.5×</option>
                <option value={1100}>1×</option>
                <option value={600}>2×</option>
              </select>
              {running ? (
                <Button size="sm" variant="secondary" onClick={() => setRunning(false)}>
                  <Pause size={13} /> Pause
                </Button>
              ) : (
                visible.length > 0 &&
                !gate && (
                  <Button size="sm" variant="secondary" onClick={() => setRunning(true)}>
                    <Play size={13} /> Resume
                  </Button>
                )
              )}
              <Button size="sm" variant="ghost" onClick={reset}>
                <RotateCcw size={13} /> Reset
              </Button>
              {visible.length === 0 && (
                <Button size="sm" onClick={start}>
                  <Play size={13} /> Run agent
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto p-5">
            {visible.length === 0 && (
              <p className="py-12 text-center text-sm text-ink-faint">
                Press <span className="font-semibold text-ink">Run agent</span> to execute the goal:
                “{scenario.goal}”
              </p>
            )}
            {visible.map((t, i) => (
              <TraceEntry key={i} t={t} />
            ))}

            {gate && (
              <Card className="fade-up border-bad/40 p-5">
                <p className="flex items-center gap-2 font-semibold text-bad">
                  <ShieldAlert size={16} /> Human approval required
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {visible[visible.length - 1].k === 'gate' &&
                    (visible[visible.length - 1] as Extract<Trace, { k: 'gate' }>).detail}
                </p>
                <div className="mt-4 flex gap-3">
                  <Button onClick={() => decide(true)} size="sm">
                    <CheckCircle2 size={14} /> Approve action
                  </Button>
                  <Button onClick={() => decide(false)} size="sm" variant="secondary">
                    <X size={14} /> Reject
                  </Button>
                </div>
              </Card>
            )}
            <div ref={traceEnd} />
          </div>
        </Card>

        {/* State + stats */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold tracking-tight">Agent state machine</h3>
            <p className="mt-1 text-xs text-ink-faint">Highlights follow the latest trace entry.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {LOOP_STAGES.map((s, i) => (
                <div
                  key={s.name}
                  className={`rounded-xl border px-3 py-3 text-center text-xs font-semibold transition-all duration-300 ${
                    i === stage
                      ? 'border-accent bg-accent-soft text-accent shadow-soft'
                      : 'border-line text-ink-faint'
                  }`}
                >
                  {s.name}
                </div>
              ))}
            </div>
            {stage >= 0 && (
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{LOOP_STAGES[stage].caption}</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold tracking-tight">Run metrics</h3>
            <div className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-soft">Tool executions</span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <Wrench size={13} className="text-accent" /> {toolCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Model calls (steps)</span>
                <span className="font-semibold">{modelCalls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Approval gates hit</span>
                <span className="font-semibold">{visible.some((t) => t.k === 'gate') ? '1' : '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Est. cost (this sim)</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <p className="pt-1 text-xs text-ink-faint">
                In Phase 6's lesson you'll compute real loop costs — roughly $0.03 per 6-step run on a
                mid-tier model.
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold tracking-tight">What to watch for</h3>
            <ul className="mt-2.5 space-y-2 text-sm leading-relaxed text-ink-soft">
              <li>• Every ACT is a structured request — your runtime executes it, not the model.</li>
              <li>• Every RESULT becomes an OBSERVE message fed back into context.</li>
              <li>• The loop stops on a final answer, not on a timer.</li>
              <li>• Irreversible actions pause at the gate — reject one and see the reflection path.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
