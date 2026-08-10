#!/usr/bin/env node
/** `buildings <verb> [...]` prints one JSON object and exits 0, or 1 with a code. */
import { run } from '../router.ts';

const answer = await run(process.argv.slice(2));
process.stdout.write(`${JSON.stringify(answer, null, 2)}\n`);

// `preview` keeps the process alive on purpose; everything else is done here.
if (!answer.ok) process.exit(1);
