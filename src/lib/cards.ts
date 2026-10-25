/** Which roadmap a review-card id belongs to: prefixed `slug/...` or legacy unprefixed (AI Agents). */
export function cardRoadmapOf(cardId: string): string {
  const slash = cardId.indexOf('/')
  return slash > 0 ? cardId.slice(0, slash) : 'ai-agents'
}
