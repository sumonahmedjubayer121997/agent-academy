// Client for the Agent Academy backend (server/). The backend is optional —
// every call degrades gracefully so the platform works fully offline.

const BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000'

export interface HealthInfo {
  status: string
  provider: string
  model: string
}

export async function health(): Promise<HealthInfo | null> {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2500) })
    if (!r.ok) return null
    return (await r.json()) as HealthInfo
  } catch {
    return null
  }
}

export interface CritiqueResult {
  score: number
  gaps: string[]
  strengths: string[]
}

export async function critique(
  lessonId: string,
  lessonTitle: string,
  text: string,
): Promise<{ ok: true; data: CritiqueResult } | { ok: false; error: string }> {
  try {
    const r = await fetch(`${BASE}/api/critique`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, lessonTitle, text }),
      signal: AbortSignal.timeout(30000),
    })
    if (!r.ok) {
      const detail = await r.json().catch(() => ({ detail: r.statusText }))
      return { ok: false, error: String(detail.detail ?? 'request failed') }
    }
    return { ok: true, data: (await r.json()) as CritiqueResult }
  } catch {
    return { ok: false, error: 'Backend unreachable — is the server running? (server/README.md)' }
  }
}

export interface AskCitation {
  id: string
  title: string
  route: string
}

export interface AskResult {
  answer: string
  citations: AskCitation[]
  provider: string
}

export async function ask(
  q: string,
): Promise<{ ok: true; data: AskResult } | { ok: false; error: string }> {
  try {
    const r = await fetch(`${BASE}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q }),
      signal: AbortSignal.timeout(20000),
    })
    if (!r.ok) {
      const detail = await r.json().catch(() => ({ detail: r.statusText }))
      return { ok: false, error: String(detail.detail ?? 'request failed') }
    }
    return { ok: true, data: (await r.json()) as AskResult }
  } catch {
    return { ok: false, error: 'Backend unreachable — start the server (server/README.md) to ask questions.' }
  }
}
