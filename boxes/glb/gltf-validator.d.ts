/** The Khronos validator ships no types. This is the surface we use. */
declare module 'gltf-validator' {
  export function validateBytes(data: Uint8Array, options?: { maxIssues?: number }): Promise<unknown>;
}
