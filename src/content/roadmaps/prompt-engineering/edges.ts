// Elaborative-interrogation layer: why each important prerequisite edge exists.
// Keyed "from->to" using module ids; shown on module pages.
export const EDGE_WHY: Record<string, string> = {
  'pe-mental-model->pe-anatomy':
    'You cannot decompose a prompt into parts until you stop treating it as a message to a person and start treating it as the entire world the model sees this turn.',
  'pe-anatomy->pe-roles':
    'Role precedence only makes sense once a prompt is visibly assembled from parts — the skeleton shows you which part belongs in which role.',
  'pe-delimiters->pe-injection':
    'Injection works by blurring the line between data and instructions; the delimiter habit you built in Phase 1 is the first wall an attacker has to climb.',
  'pe-schemas->pe-function-calling':
    'Tool definitions are schemas with consequences — field names, enums, and descriptions do the same steering work, but wrong calls now trigger real side effects.',
  'pe-validation-repair->pe-extraction':
    'An extractor is a schema plus a repair loop plus honest scoring; without the repair pattern you ship a demo, not a pipeline.',
  'pe-context-budget->pe-few-shot':
    'Examples are the most expensive tokens in your prompt — budget thinking tells you how many you can afford and forces you to choose them well.',
  'pe-few-shot->pe-reasoning':
    'Reasoning patterns like chain-of-thought are examples of how to think, not just what to output; few-shot selection skills transfer directly.',
  'pe-long-context->pe-rag-prompts':
    'Grounding contracts assume you know what deserves to be in context at all — retrieval and restructuring are budget decisions before they are prompt decisions.',
  'pe-rag-prompts->pe-injection':
    'The moment you feed retrieved documents into a prompt, strangers can write part of your prompt; grounding and injection defense are the same problem from two sides.',
  'pe-why-evals->pe-metrics':
    'You cannot pick a metric before you own a golden set — the set defines what "correct" means, and the metric merely measures against it cheaply.',
  'pe-injection->pe-defense-layers':
    'Layered defense design starts from a concrete attack repertoire; the injection lab gives you the attacks each layer must survive.',
  'pe-defense-layers->pe-playbook-agents':
    'An agent prompt grants a model the power to act; the approval gates and privilege separation come straight from the defense stack you already built.',
}
