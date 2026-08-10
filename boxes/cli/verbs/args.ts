/** One flag parser for every verb. */
import { parseArgs } from 'node:util';
import { BuildingError, toMm } from '#spec';

export type FlagSpec = Record<string, { type: 'string' | 'boolean' }>;

export type Parsed = { positionals: string[]; values: Record<string, string | boolean | undefined> };

/**
 * `--shift-x -2` reads as an unknown option to the parser, because the value starts with a
 * dash. A negative metre is an ordinary thing to ask for, so the value is joined to its flag
 * before parsing and both spellings work.
 */
function joinNegatives(args: string[], options: FlagSpec): string[] {
  const joined: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    const next = args[i + 1];
    const name = arg.startsWith('--') ? arg.slice(2) : '';
    if (options[name]?.type === 'string' && next !== undefined && /^-\d/.test(next)) {
      joined.push(`${arg}=${next}`);
      i += 1;
      continue;
    }
    joined.push(arg);
  }
  return joined;
}

export function parse(args: string[], options: FlagSpec): Parsed {
  try {
    const parsed = parseArgs({ args: joinNegatives(args, options), options, allowPositionals: true, strict: true });
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

/** Metres in, millimetres out. Steps and slides go both ways, so a negative is fine here. */
export function metres(value: string | boolean | undefined, what: string): number | undefined {
  value = text(value);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new BuildingError('E_DOC_INVALID', `${what} must be a number of metres`, [what]);
  return toMm(parsed);
}

/** For the ones that cannot go backwards: a width, a depth, a height. */
export function size(value: string | boolean | undefined, what: string): number | undefined {
  const parsed = metres(value, what);
  if (parsed !== undefined && parsed <= 0) throw new BuildingError('E_DOC_INVALID', `${what} must be more than zero metres`, [what]);
  return parsed;
}

export function count(value: string | boolean | undefined, what: string): number | undefined {
  value = text(value);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new BuildingError('E_DOC_INVALID', `${what} must be a whole number, at least 1`, [what]);
  return parsed;
}

/** A 0 to 1 dial, like how much of a face carries fake parts. */
export function fraction(value: string | boolean | undefined, what: string): number | undefined {
  value = text(value);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new BuildingError('E_DOC_INVALID', `${what} must be between 0 and 1`, [what]);
  }
  return parsed;
}

/** One of a set of words. With nothing given and no fallback, it says what the choices are. */
export function oneOf<T extends readonly string[]>(value: string | undefined, allowed: T, what: string, fallback?: T[number]): T[number] {
  if (value === undefined) {
    if (fallback !== undefined) return fallback;
    throw new BuildingError('E_DOC_INVALID', `name a ${what}: ${allowed.join(', ')}`, [what]);
  }
  if (!allowed.includes(value)) {
    throw new BuildingError('E_DOC_INVALID', `${what} must be one of ${allowed.join(', ')}`, [what]);
  }
  return value;
}

/** The same, where leaving the flag out means "keep whatever was there". */
export function maybeOneOf<T extends readonly string[]>(value: string | undefined, allowed: T, what: string): T[number] | undefined {
  return value === undefined ? undefined : oneOf(value, allowed, what);
}

export function degrees(value: string | boolean | undefined): number | undefined {
  value = text(value);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new BuildingError('E_DOC_INVALID', 'rotation must be a number of degrees', ['rotation']);
  return parsed;
}
