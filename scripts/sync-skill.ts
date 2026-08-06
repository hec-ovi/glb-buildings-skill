#!/usr/bin/env node
/** Copies the canonical skill to the root, so a plain checkout shows it too. */
import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
await copyFile(`${root}skills/glb-buildings/SKILL.md`, `${root}SKILL.md`);
console.log('SKILL.md synced from skills/glb-buildings/');
