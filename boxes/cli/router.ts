/** One entry point: match the verb, run it, answer with one JSON object. */
import { BuildingError } from '#spec';
import { Projects } from './projects.ts';
import { bandVerbs } from './verbs/bands.ts';
import { outputVerbs } from './verbs/build.ts';
import { deckVerbs } from './verbs/deck.ts';
import { doctorVerbs } from './verbs/doctor.ts';
import { enhanceVerbs } from './verbs/enhance.ts';
import { faceVerbs } from './verbs/faces.ts';
import { projectVerbs } from './verbs/projects.ts';
import type { Verb } from './verbs/verb.ts';

export const VERBS: Verb[] = [...doctorVerbs, ...projectVerbs, ...bandVerbs, ...enhanceVerbs, ...faceVerbs, ...deckVerbs, ...outputVerbs];

export type Answer = { ok: true; verb: string; [key: string]: unknown } | { ok: false; code: string; message: string; at: string[] };

function help(): Answer {
  return {
    ok: true,
    verb: 'help',
    verbs: VERBS.map((verb) => ({ verb: verb.name, summary: verb.summary, usage: verb.usage })),
  };
}

export async function run(argv: string[], projects = new Projects()): Promise<Answer> {
  const [name, ...args] = argv;
  if (!name || name === 'help' || name === '--help' || name === '-h') return help();

  const verb = VERBS.find((v) => v.name === name);
  if (!verb) {
    return { ok: false, code: 'E_DOC_INVALID', message: `no verb named ${name}, run help`, at: [name] };
  }

  try {
    const data = await verb.run(args, { projects });
    return { ok: true, verb: verb.name, ...(data as object) };
  } catch (error) {
    if (error instanceof BuildingError) return { ok: false, code: error.code, message: error.message, at: error.at };
    return { ok: false, code: 'E_DOC_INVALID', message: (error as Error).message, at: [] };
  }
}
