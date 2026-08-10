/**
 * How big a picture is, read from its header.
 *
 * A screen is fitted to the picture it carries, so something has to know the shape of the file
 * without decoding it. Both formats glTF carries say it in the first few bytes.
 */

export type Size = { width: number; height: number };

const PNG = [0x89, 0x50, 0x4e, 0x47];

/** The size of a PNG or a JPEG, or nothing if the bytes are neither. */
export function sizeOf(bytes: Uint8Array): Size | undefined {
  if (PNG.every((byte, i) => bytes[i] === byte)) {
    // IHDR is always the first chunk, and its width and height are the first eight bytes of it.
    const view = new DataView(bytes.buffer, bytes.byteOffset);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }

  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined;

  // JPEG is a chain of segments; the frame header carries the size and comes before the scan.
  let at = 2;
  while (at + 9 < bytes.length) {
    if (bytes[at] !== 0xff) return undefined;
    const marker = bytes[at + 1]!;
    const length = (bytes[at + 2]! << 8) | bytes[at + 3]!;

    // Every start-of-frame marker but the four that mean something else entirely.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: (bytes[at + 7]! << 8) | bytes[at + 8]!, height: (bytes[at + 5]! << 8) | bytes[at + 6]! };
    }
    at += 2 + length;
  }
  return undefined;
}
