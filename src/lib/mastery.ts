import type { ModuleRecord } from '../store/progress'

export interface MasteryGateInput {
  completion: string[] // module's completion criteria
  record: Pick<ModuleRecord, 'completionDone' | 'evidenceUrls'>
}

export interface MasteryGateResult {
  /** true when every criterion is checked AND at least one evidence link exists */
  ready: boolean
  /** human-readable list of what is still missing */
  missing: string[]
}

/**
 * The evidence gate for the Mastered stage (ROADMAP_V2 V2.2): mastery is
 * demonstrated, not declared. A module is ready to master only when all
 * completion criteria are checked off and at least one evidence link
 * (repo, notebook, demo…) is attached. The UI may still allow an explicit
 * self-assessed override — but only after showing exactly what is missing.
 */
export function masteryGate({ completion, record }: MasteryGateInput): MasteryGateResult {
  const missing: string[] = []
  const unchecked = completion.length - record.completionDone.length
  if (unchecked > 0) {
    missing.push(`${unchecked} of ${completion.length} completion criteria still unchecked`)
  }
  if (record.evidenceUrls.length === 0) {
    missing.push('no evidence link attached (repo, notebook, demo, or write-up)')
  }
  return { ready: missing.length === 0, missing }
}
