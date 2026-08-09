/** The closed error set. Every box throws one of these codes and nothing else. */
export const ERRORS = {
  E_DOC_INVALID: 'the document does not match the schema',
  E_DOC_VERSION: 'the document was written by a different schema version',
  E_BAND_ID_DUPLICATE: 'two sections share an id',
  E_FLOATING_PART: 'a section does not land on the one below, or a part has drifted off its section',
  E_OVERLAP: 'a part is buried in the section it stands on, or two parts claim one deck cell',
  E_STACK_ENDS: 'the stack does not start with a main section and end with a roof',
  E_BUDGET: 'a section is over the triangle budget its tier allows',
  E_UNKNOWN_TEMPLATE: 'a section names a template the kit does not have',
  E_GLB_INVALID: 'the geometry is open or lit the wrong way round, or the Khronos validator refused the file',
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
