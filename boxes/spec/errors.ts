/** The closed error set. Every box throws one of these codes and nothing else. */
export const ERRORS = {
  E_DOC_INVALID: 'the document does not match the schema',
  E_DOC_VERSION: 'the document was written by a different schema version',
  E_BAND_ID_DUPLICATE: 'two bands share an id',
  E_BAND_EMPTY: 'a band has no floors',
  E_FLOATING_PART: 'a part is not bound to a socket on a host part',
  E_OVERLAP: 'two parts interpenetrate',
  E_ENVELOPE: 'a part reaches past the floor envelope',
  E_PROPORTION: 'a dimension is outside the human size table',
  E_SEAM_MISMATCH: 'two stacked bands do not share a seam',
  E_BUDGET: 'a band is over its triangle budget',
  E_UNKNOWN_TEMPLATE: 'a band names a floor template the kit does not have',
  E_GLB_INVALID: 'the written file failed the Khronos glTF validator',
} as const;

export type ErrorCode = keyof typeof ERRORS;

/** Carries a code from the closed set, a human sentence, and where it happened. */
export class BuildingError extends Error {
  readonly code: ErrorCode;
  readonly at: string[];

  constructor(code: ErrorCode, detail: string, at: string[] = []) {
    super(`${code}: ${detail}`);
    this.name = 'BuildingError';
    this.code = code;
    this.at = at;
  }

  toJSON() {
    return { code: this.code, message: this.message, at: this.at };
  }
}
