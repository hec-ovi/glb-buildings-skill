/** What a verb is: a name, one line of help, and a run that returns plain data. */
import type { Projects } from '../projects.ts';

export type Ctx = { projects: Projects };

export type Verb = {
  name: string;
  summary: string;
  usage: string;
  run(args: string[], ctx: Ctx): Promise<unknown>;
};
