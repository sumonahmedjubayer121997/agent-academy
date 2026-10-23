// SM-2-lite spaced repetition scheduler. Pure functions, injectable clock.
export interface SrsCard {
  ease: number
  intervalDays: number
  due: string // yyyy-mm-dd
  reps: number
  lapses: number
}

export function dayStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

/** A card enters the queue one day after its first successful retrieval. */
export function newCard(now: Date): SrsCard {
  return { ease: 2.5, intervalDays: 1, due: dayStr(addDays(now, 1)), reps: 0, lapses: 0 }
}

export type RecallGrade = 'again' | 'hard' | 'good' | 'easy'

/**
 * Grade a card: gotIt=false is a lapse (ease penalty, back to 1 day);
 * gotIt=true grows the interval 1d → 3d → interval×ease.
 */
export function review(card: SrsCard, gotIt: boolean, now: Date): SrsCard {
  if (!gotIt) {
    return {
      ease: Math.max(1.3, round2(card.ease - 0.2)),
      intervalDays: 1,
      due: dayStr(addDays(now, 1)),
      reps: 0,
      lapses: card.lapses + 1,
    }
  }
  const reps = card.reps + 1
  const ease = Math.min(2.5, round2(card.ease + 0.05))
  const intervalDays =
    reps === 1 ? 1 : reps === 2 ? 3 : Math.max(1, Math.round(card.intervalDays * ease))
  return { ease, intervalDays, due: dayStr(addDays(now, intervalDays)), reps, lapses: card.lapses }
}

/**
 * Four-grade SM-2 active recall scheduler ('again' | 'hard' | 'good' | 'easy').
 */
export function reviewWithGrade(card: SrsCard, grade: RecallGrade, now: Date): SrsCard {
  if (grade === 'again') return review(card, false, now)
  if (grade === 'good') return review(card, true, now)
  if (grade === 'hard') {
    const reps = card.reps + 1
    const ease = Math.max(1.3, round2(card.ease - 0.05))
    const intervalDays =
      reps === 1 ? 1 : reps === 2 ? 2 : Math.max(1, Math.round(card.intervalDays * 1.2))
    return { ease, intervalDays, due: dayStr(addDays(now, intervalDays)), reps, lapses: card.lapses }
  }
  // 'easy'
  const reps = card.reps + 1
  const ease = Math.min(2.5, round2(card.ease + 0.15))
  const intervalDays =
    reps === 1 ? 3 : reps === 2 ? 6 : Math.max(2, Math.round(card.intervalDays * ease * 1.3))
  return { ease, intervalDays, due: dayStr(addDays(now, intervalDays)), reps, lapses: card.lapses }
}

export function isDue(card: SrsCard, today: string): boolean {
  return card.due <= today
}

/** Cards due on each of the next 7 days (index 0 = today), for the forecast chart. */
export function dueForecast(cards: Record<string, SrsCard>, today: string): number[] {
  const out = new Array(7).fill(0)
  for (const c of Object.values(cards)) {
    const diff = daysBetween(today, c.due)
    if (diff >= 0 && diff < 7) out[diff]++
  }
  return out
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
