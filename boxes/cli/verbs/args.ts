/** One flag parser for every verb. */
import { parseArgs } from 'node:util';
import { BuildingError, toMm } from '#spec';

export type FlagSpec = Record<string, { type: 'string' | 'boolean' }>;

export type Parsed = { positionals: string[]; values: Record<string, string | boolean | undefined> };

export function parse(args: string[], options: FlagSpec): Parsed {
  try {
    const parsed = parseArgs({ args, options, allowPositionals: true, strict: true });
    return { positionals: parsed.positionals, values: parsed.values as Record<string, string | boolean | undefined> };
  } catch (error) {
    throw new BuildingError('E_DOC_INVALID', (error as Error).message, []);
  }
}

export function need(positionals: string[], index: number, what: string): string {
  const value = positionals[index];
  if (!value) throw new BuildingError('E_DOC_INVALID', `missing ${what}`, [what]);
  return value;
}

/** Metres on the command line, millimetres in the document. */
/** A flag that was given as text. Booleans are switches and never carry a value. */
export function text(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function metres(value: string | boolean | undefined, what: string): number | undefined {
  value = text(value);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new BuildingError('E_DOC_INVALID', `${what} must be a number of metres`, [what]);
  return toMm(parsed);
}

export function count(value: string | boolean | undefined, what: string): number | undefined {
  value = text(value);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new BuildingError('E_DOC_INVALID', `${what} must be a whole number, at least 1`, [what]);
  return parsed;
}

export function degrees(value: string | boolean | undefined): number | undefined {
  value = text(value);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new BuildingError('E_DOC_INVALID', 'rotation must be a number of degrees', ['rotation']);
  return parsed;
}
