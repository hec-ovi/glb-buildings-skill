/**
 * Drift guard. The skill is what an agent reads instead of the code, so a verb it names must
 * exist, a file it routes to must be there, and the root copy must match the canonical one.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { VERBS } from '#cli';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const skillDir = `${root}skills/glb-buildings/`;
const skill = readFileSync(`${skillDir}SKILL.md`, 'utf8');

describe('the skill an agent reads', () => {
  it('routes only to files that exist, from the resolver and from every part', () => {
    // A part may route on to another part, so the whole folder is checked, not just SKILL.md.
    const pages = ['SKILL.md', ...readdirSync(`${skillDir}parts`).map((name) => `parts/${name}`)];
    let routes = 0;
    for (const page of pages) {
      for (const found of readFileSync(`${skillDir}${page}`, 'utf8').matchAll(/`(parts\/[^`]+\.md)`/g)) {
        expect(existsSync(`${skillDir}${found[1]!}`), `${page} routes to ${found[1]!}`).toBe(true);
        routes += 1;
      }
    }
    expect(routes).toBeGreaterThan(0);
  });

  it('names only verbs the CLI has', () => {
    const named = [...skill.matchAll(/^\| `([a-z-]+)[ `]/gm)].map((m) => m[1]!);
    const known = new Set(VERBS.map((verb) => verb.name));
    for (const verb of named) {
      expect(known.has(verb), `SKILL.md names ${verb}`).toBe(true);
    }
  });

  it('names every verb the CLI has, so none is invisible to an agent', () => {
    for (const verb of VERBS) {
      expect(skill.includes(`\`${verb.name}`), `SKILL.md is missing ${verb.name}`).toBe(true);
    }
  });

  it('keeps the root copy identical to the canonical one', () => {
    expect(readFileSync(`${root}SKILL.md`, 'utf8')).toBe(skill);
  });
});
