/** The Khronos glTF validator, run on the bytes we are about to hand an engine. */
import { validateBytes } from 'gltf-validator';

export type ValidationIssue = { code: string; message: string; pointer?: string; severity: number };
export type ValidationReport = {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  infos: ValidationIssue[];
};

type RawReport = {
  issues: {
    messages: { code: string; message: string; pointer?: string; severity: number }[];
  };
};

/** Severity 0 is an error, 1 a warning, 2 information. */
export async function validateGlb(glb: Uint8Array): Promise<ValidationReport> {
  const report = (await validateBytes(glb, { maxIssues: 100 })) as RawReport;
  const messages = report.issues.messages ?? [];
  return {
    errors: messages.filter((m) => m.severity === 0),
    warnings: messages.filter((m) => m.severity === 1),
    infos: messages.filter((m) => m.severity === 2),
  };
}
