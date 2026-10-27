// Elaborative-interrogation layer: why each important prerequisite edge exists.
// Keyed "from->to" using module ids; shown on module pages.
export const EDGE_WHY: Record<string, string> = {
  'cb-what-chats-good->cb-conversation-patterns':
    'You cannot assemble good conversation moves for a bot whose job you have not pinned down — patterns serve the job statement, not the other way round.',
  'cb-conversation-patterns->cb-turn-anatomy':
    'Patterns are the moves; anatomy is what the model physically receives per move — you need both before you can debug why a good pattern fails.',
  'cb-turn-anatomy->cb-rag-recap':
    'Retrieval becomes a turn ingredient only after you know what a turn is assembled from — otherwise retrieval is magic powder, not an ingredient.',
  'cb-rag-recap->cb-grounding-contract':
    'Once retrieval feeds the turn, the question becomes what the answer may draw on — the contract is the rule that makes retrieval trustworthy.',
  'cb-grounding-contract->cb-citations':
    'A grounded claim still needs to be checkable — citations are the user-facing proof of the contract.',
  'cb-grounding-contract->cb-refusal-design':
    'The contract has two halves: grounded answers AND honest refusals — designing one without the other produces a bot that invents to avoid saying no.',
  'cb-turn-anatomy->cb-state-vs-memory':
    'Once you see what is re-sent every turn, the cost of dumping raw history is obvious — state and memory are the structured alternatives.',
  'cb-state-vs-memory->cb-session-state':
    'Slots are the structured half of the split — you design them after deciding what is state and what is memory.',
  'cb-state-vs-memory->cb-long-term-memory':
    'Long-term memory is the consented half — separating it from session state is what makes consent and deletion even possible.',
  'cb-context-budget-chat->cb-rolling-summarization':
    'Summarization is what the budget spends when the window fills — the ladder ends in compaction, and compaction needs its own contract.',
  'cb-rolling-summarization->cb-constraint-persistence':
    'Compaction is exactly where constraints die — first-class constraint storage is the fix for the failure your survival test exposed.',
  'cb-session-state->cb-slot-filling':
    'Slot filling IS session state in motion: the schema exists first, then the dialogue that fills it.',
  'cb-slot-filling->cb-confirmation-gates':
    'You can only gate actions whose inputs you structure — filled slots are what the confirmation summary is made of.',
  'cb-confirmation-gates->cb-injection-defense-chat':
    'The gate is your strongest code-side defense; injection defense generalizes it into layers.',
  'cb-conversation-evals->cb-red-team-chat':
    'Red-teaming produces attack conversations — the eval suite is where they become permanent regression cases.',
  'cb-red-team-chat->cb-injection-defense-chat':
    'Layer design starts from a concrete attack repertoire — the red-team session supplies it.',
  'cb-grounding-contract->cb-channel-web':
    'Before shipping to any channel, the bot must be worth shipping — the contract is the minimum bar of trustworthy answers.',
}
