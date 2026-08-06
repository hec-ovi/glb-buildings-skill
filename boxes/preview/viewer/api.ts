/** Everything the viewer needs from its server. */
import type { PlacedScene } from '#assemble';
import type { BuildingDocument, Selection } from '#spec';

export type ScenePayload = { document: BuildingDocument; scene: PlacedScene; hasModel: boolean };

export async function fetchScene(): Promise<ScenePayload> {
  const res = await fetch('/api/scene');
  if (!res.ok) throw new Error(`scene: ${res.status} ${await res.text()}`);
  return res.json() as Promise<ScenePayload>;
}

export async function postSelection(selection: Omit<Selection, 'at'>): Promise<void> {
  await fetch('/api/selection', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...selection, at: '' }),
  });
}

/** Fires whenever the document or the built file changes on disk. */
export function onChange(handler: () => void): () => void {
  const source = new EventSource('/api/events');
  source.addEventListener('changed', handler);
  return () => source.close();
}
