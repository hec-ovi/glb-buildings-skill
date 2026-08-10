/** One entry point: match the verb, run it, answer with one JSON object. */
import { BuildingError } from '#spec';
import { Projects } from './projects.ts';
import { bandVerbs } from './verbs/bands.ts';
import { outputVerbs } from './verbs/build.ts';
import { deckVerbs } from './verbs/deck.ts';
import { doctorVerbs } from './verbs/doctor.ts';
import { enhanceVerbs } from './verbs/enhance.ts';
import { faceVerbs } from './verbs/faces.ts';
import { litVerbs } from './verbs/lit.ts';
import { lookVerbs } from './verbs/look.ts';
import { packVerbs } from './verbs/pack.ts';
import { projectVerbs } from './verbs/projects.ts';
import type { Verb } from './verbs/verb.ts';

export const VERBS: Verb[] = [
  ...doctorVerbs,
  ...projectVerbs,
  ...lookVerbs,
  ...packVerbs,
  ...bandVerbs,
  ...enhanceVerbs,
  ...faceVerbs,
  ...litVerbs,
  ...deckVerbs,
  ...outputVerbs,
];

export type Answer = { ok: true; verb: string; [key: string]: unknown } | { ok: false; code: string; message: string; at: string[] };

function help(): Answer {
  return {
    ok: true,
    verb: 'help',
    verbs: VERBS.map((verb) => ({ verb: verb.name, summary: verb.summary, usage: verb.usage })),
  };
}

/**
 * `--project <name>` anywhere in the line pins every verb in it to that building. Without it a
 * verb works on whichever is current, which is fine for a person and a trap for anything running
 * beside something else: two sessions sharing a store would otherwise edit each other's work.
 */
function pinnedProject(argv: string[]): { argv: string[]; project?: string } {
  const kept: string[] = [];
  let project: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--project') {
      project = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith('--project=')) {
      project = arg.slice('--project='.length);
      continue;
    }
    kept.push(arg);
  }
  return { argv: kept, project };
}

export async function run(argv: string[], store = new Projects()): Promise<Answer> {
  const { argv: line, project: pinned } = pinnedProject(argv);
  const projects = pinned ? store.pinnedTo(pinned) : store;
  const [name, ...args] = line;
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
