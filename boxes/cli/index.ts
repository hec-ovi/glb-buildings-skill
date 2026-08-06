/** The verbs an agent calls. Every answer is one JSON object on stdout. */
export { run, VERBS, type Answer } from './router.ts';
export { Projects, home } from './projects.ts';
export type { Verb, Ctx } from './verbs/verb.ts';
