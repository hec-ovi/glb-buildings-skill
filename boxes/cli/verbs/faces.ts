/**
 * Composing a face. The grid is the whole interface: read it, put something in a rectangle of
 * cells, and the tool builds the geometry. Nothing here takes a size or a position in metres.
 */
import { assemble, type PlacedBand } from '#assemble';
import { CELL, MARGIN, KIND_NOTES, KINDS, MATERIAL_NOTES, MATERIALS, dressFaces, readFace, type Element } from '#facade';
import { BUDGET, ROOF_BUDGET } from '#glb';
import { Surface, segment, sunkProblems } from '#kit';
import { BuildingError, SIDES, toMetres, toMm, type Band, type BandFace, type BuildingDocument, type FaceElement, type Side } from '#spec';
import type { Verb } from './verb.ts';
import { need, parse, size, text } from './args.ts';
import { sectionShape } from './shape.ts';

const DEFAULT_MATERIAL: Record<string, FaceElement['material']> = {
  window: 'crystal',
  door: 'crystal',
  panel: 'concrete',
  balcony: 'concrete',
};

function oneOf<T extends readonly string[]>(value: string | undefined, allowed: T, what: string, fallback?: T[number]): T[number] {
  if (value === undefined) {
    if (fallback !== undefined) return fallback;
    throw new BuildingError('E_DOC_INVALID', `name a ${what}: ${allowed.join(', ')}`, [what]);
  }
  if (!allowed.includes(value)) {
    throw new BuildingError('E_DOC_INVALID', `${what} must be one of ${allowed.join(', ')}`, [what]);
  }
  return value;
}

/** `12,8` is a cell: column across the face, row up from the floor. */
function readCell(value: string, what: string): [number, number] {
  const parts = value.split(',').map((part) => Number(part.trim()));
  if (parts.length !== 2 || parts.some((n) => !Number.isInteger(n) || n < 0)) {
    throw new BuildingError('E_DOC_INVALID', `${what} is a cell like 12,8: a column and a row, both whole numbers`, [what]);
  }
  return [parts[0]!, parts[1]!];
}

/** Where a section actually stands, so a composer can put a run outside it rather than in it. */
function outsideOf(placed: PlacedBand): string {
  const xs = placed.bottom.concat(placed.top).map(([x]) => toMetres(x));
  const zs = placed.bottom.concat(placed.top).map(([, z]) => toMetres(z));
  const round = (n: number) => Math.round(n * 100) / 100;
  return `${placed.id} spans x ${round(Math.min(...xs))} to ${round(Math.max(...xs))} and z ${round(Math.min(...zs))} to ${round(Math.max(...zs))}, from y ${round(toMetres(placed.y0))} to ${round(toMetres(placed.y1))}.`;
}

/** The section named, or the one the human last picked in the preview. */
function sectionOf(doc: BuildingDocument, named: string | undefined): Band {
  const id = named ?? doc.bands[0]?.id;
  const band = doc.bands.find((one) => one.id === id);
  if (!band) throw new BuildingError('E_DOC_INVALID', `no section named ${String(named)}`, ['bands', String(named)]);
  return band;
}

/** What the kit builds on this section's faces without asking the grid. */
function wornOn(band: Band) {
  return { columns: band.columns, wires: band.wires };
}

function facesOf(band: Band, side: Side): BandFace {
  return band.faces.find((face) => face.side === side) ?? { side, elements: [] };
}

function elementOf(stored: FaceElement): Element {
  return {
    kind: stored.kind,
    rect: { col: stored.col, row: stored.row, cols: stored.cols, rows: stored.rows },
    material: stored.material,
    ...(stored.depth === undefined ? {} : { depth: toMetres(stored.depth) }),
  };
}

export const face: Verb = {
  name: 'face',
  summary: 'the grid of one face, and everything standing on it',
  usage: 'face <section> [--side S] [--draw]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, { side: { type: 'string' }, draw: { type: 'boolean' } });
    const { name, project } = await projects.open();
    const doc = await project.readDocument();
    const band = sectionOf(doc, positionals[0]);
    const side = oneOf(text(values.side), SIDES, 'side', 'S');

    const scene = assemble(doc);
    const placed = scene.bands.find((one) => one.id === band.id)!;
    const plan = { side, elements: facesOf(band, side).elements.map(elementOf), wears: wornOn(band) };
    const { face: grid, sheet } = readFace(sectionShape(placed), plan);

    return {
      project: name,
      section: band.id,
      side,
      grid: { cols: grid.cols, rows: grid.rows, cell: CELL, margin: MARGIN },
      size: { width: Number(grid.width.toFixed(2)), height: Number(grid.height.toFixed(2)) },
      repeats: `one floor of ${band.id}; whatever you compose here is built on each of its ${grid.floors} floors`,
      place: `cells run [0,0] at the bottom left to [${grid.cols - 1},${grid.rows - 1}] at the top right, both ends of a rectangle included; keep ${MARGIN} clear all round`,
      elements: facesOf(band, side).elements.map((element, index) => ({
        n: index + 1,
        kind: element.kind,
        material: element.material,
        from: [element.col, element.row],
        to: [element.col + element.cols - 1, element.row + element.rows - 1],
      })),
      kinds: KINDS.map((kind) => ({ kind, does: KIND_NOTES[kind] })),
      materials: MATERIALS.map((material) => ({ material, is: MATERIAL_NOTES[material] })),
      ...(values.draw === true ? { drawn: sheet.draw() } : {}),
    };
  },
};

export const put: Verb = {
  name: 'put',
  summary: 'put a window, door, panel or balcony on a face, in cells',
  usage:
    'put <window|door|panel|balcony> <from cell> <to cell> [--section id] [--side S] [--material crystal] [--depth 1.5] [--every 3]\n' +
    '  or: put <kind> --row 9 --wide 1.4 --tall 1.5 --every 3   (the face works out the columns and skips what is taken)',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, {
      section: { type: 'string' },
      side: { type: 'string' },
      material: { type: 'string' },
      depth: { type: 'string' },
      every: { type: 'string' },
      row: { type: 'string' },
      wide: { type: 'string' },
      tall: { type: 'string' },
    });

    const kind = oneOf(need(positionals, 0, 'a kind'), KINDS, 'kind');
    const material = oneOf(text(values.material), MATERIALS, 'material', DEFAULT_MATERIAL[kind]);
    const depth = size(values.depth, 'depth');
    const step = text(values.every) ? Number(text(values.every)) : undefined;

    // Two ways in. Name both cells, or say what it should be and let the face place it: a row to
    // stand on, how wide and how tall in metres, and a pitch. Nobody counts columns that way.
    const byShape = text(values.row) !== undefined;
    const from = byShape ? [0, 0] as [number, number] : readCell(need(positionals, 1, 'a cell to start at'), 'from');
    const to = byShape ? [0, 0] as [number, number] : readCell(need(positionals, 2, 'a cell to finish at'), 'to');

    const { name, project } = await projects.open();
    const doc = await project.readDocument();
    const band = sectionOf(doc, text(values.section));
    const side = oneOf(text(values.side), SIDES, 'side', 'S');

    const scene = assemble(doc);
    const placed = scene.bands.find((one) => one.id === band.id)!;
    const shape = sectionShape(placed);
    const { face: grid } = readFace(shape, { side, elements: [], wears: wornOn(band) });

    const inCells = (metres: string | undefined, what: string, fallback: number) => {
      if (metres === undefined) return fallback;
      const value = Number(metres);
      if (!Number.isFinite(value) || value <= 0) {
        throw new BuildingError('E_DOC_INVALID', `${what} is a size in metres, like 1.4`, [what]);
      }
      return Math.max(1, Math.round(value / CELL));
    };

    const col = byShape ? MARGIN : Math.min(from[0], to[0]);
    const row = byShape ? Number(text(values.row)) : Math.min(from[1], to[1]);
    const cols = byShape ? inCells(text(values.wide), 'wide', 14) : Math.abs(to[0] - from[0]) + 1;
    const rows = byShape ? inCells(text(values.tall), 'tall', 15) : Math.abs(to[1] - from[1]) + 1;

    if (byShape && (!Number.isInteger(row) || row < 0)) {
      throw new BuildingError('E_DOC_INVALID', '--row is the row to stand on, a whole number of cells up from the floor', ['row']);
    }

    // `--every` repeats the same element across the face on a pitch, which is what a rhythm of
    // windows is, without the composer counting cells.
    const pitch = step !== undefined && Number.isFinite(step) && step > 0 ? Math.round(step / CELL) : undefined;
    const existing = facesOf(band, side);

    // Given a shape rather than two cells, walk the face and take what is free. What a section
    // already wears is on the grid, so a rhythm steps over its own ribs instead of failing on one.
    const made: FaceElement[] = [];
    const skipped: number[] = [];
    const walk = byShape ? (pitch ?? cols + Math.round(1 / CELL)) : (pitch ?? Infinity);

    for (let at = col; at + cols - 1 <= grid.cols - 1 - MARGIN; at += walk) {
      const candidate: FaceElement = { kind, col: at, row, cols, rows, material, ...(depth === undefined ? {} : { depth }) };
      if (byShape) {
        try {
          readFace(shape, { side, elements: [...existing.elements, ...made, candidate].map(elementOf), wears: wornOn(band) });
        } catch {
          skipped.push(at);
          continue;
        }
      }
      made.push(candidate);
      if (!byShape && pitch === undefined) break;
    }

    if (made.length === 0) {
      throw new BuildingError(
        'E_OVERLAP',
        `nowhere on the ${side} face of ${band.id} is free for a ${kind} ${cols} by ${rows} cells at row ${row}. Read it with \`buildings face ${band.id} --side ${side} --draw\` and pick another row`,
        ['face', kind],
      );
    }
    const faces = [
      ...band.faces.filter((one) => one.side !== side),
      { side, elements: [...existing.elements, ...made] },
    ];

    const next = { ...doc, bands: doc.bands.map((one) => (one.id === band.id ? { ...one, faces } : one)) };
    // Claiming happens here, so an overlap is refused before anything is written.
    readFace(shape, { side, elements: [...existing.elements, ...made].map(elementOf), wears: wornOn(band) });

    await project.writeDocument(next);

    // What the section's faces cost now, against what its tier promises. Said here rather than
    // at the build, so nobody composes a whole facade a tier cannot carry.
    const spend = costOf(shape, faces, grid.floors, wornOn(band));
    const allowed = band.kind === 'roof' ? ROOF_BUDGET : (BUDGET[band.tier] ?? BUDGET.full!);

    return {
      project: name,
      section: band.id,
      side,
      put: made.length,
      kind,
      material,
      on: made.map((element) => [element.col, element.row]),
      costs: { faces: spend, allowed, tier: band.tier },
      ...(skipped.length > 0 ? { skipped: skipped.length, note2: `${skipped.length} places were already taken and were stepped over` } : {}),
      note:
        spend > allowed
          ? `these faces cost ${spend} triangles a floor and a ${band.tier} section may spend ${allowed} on everything. Move it to a richer tier or take some off, or the build will refuse it`
          : `${grid.floors} floors carry it, so the section builds it once`,
    };
  },
};

/** Triangles a floor the composed faces of a section cost, counted from what they build. */
function costOf(shape: Parameters<typeof dressFaces>[0], faces: BandFace[], floors: number, wears: ReturnType<typeof wornOn>): number {
  const meshes = dressFaces(
    shape,
    faces.map((face) => ({ side: face.side, elements: face.elements.map(elementOf), wears })),
  );
  return Math.round(meshes.reduce((sum, mesh) => sum + mesh.indices.length / 3, 0) / Math.max(1, floors));
}

export const clear: Verb = {
  name: 'clear',
  summary: 'take elements off a face',
  usage: 'clear [n ...] [--section id] [--side S] [--all]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, { section: { type: 'string' }, side: { type: 'string' }, all: { type: 'boolean' } });
    const { name, project } = await projects.open();
    const doc = await project.readDocument();
    const band = sectionOf(doc, text(values.section));
    const side = oneOf(text(values.side), SIDES, 'side', 'S');

    const existing = facesOf(band, side).elements;
    const drop = new Set(positionals.map((one) => Number(one)));
    const kept = values.all === true ? [] : existing.filter((_, index) => !drop.has(index + 1));

    const faces = [...band.faces.filter((one) => one.side !== side), { side, elements: kept }];
    await project.writeDocument({ ...doc, bands: doc.bands.map((one) => (one.id === band.id ? { ...one, faces } : one)) });

    return { project: name, section: band.id, side, cleared: existing.length - kept.length, left: kept.length };
  },
};

export const run: Verb = {
  name: 'run',
  summary: 'a duct, pipe or cable along a path of points, mitred at every corner',
  usage: 'run <x,y,z> <x,y,z> [more ...] [--section id] [--profile round|square] [--thickness 0.2] [--material metal]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, {
      section: { type: 'string' },
      profile: { type: 'string' },
      thickness: { type: 'string' },
      material: { type: 'string' },
    });

    if (positionals.length < 2) {
      throw new BuildingError('E_DOC_INVALID', 'a run needs at least two points, each x,y,z in metres', ['run']);
    }

    const points = positionals.map((one, index) => {
      const parts = one.split(',').map((part) => Number(part.trim()));
      if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
        throw new BuildingError('E_DOC_INVALID', `point ${index + 1} is not x,y,z in metres`, ['run', String(index + 1)]);
      }
      return parts.map(toMm) as [number, number, number];
    });

    const { name, project } = await projects.open();
    const doc = await project.readDocument();
    const band = sectionOf(doc, text(values.section));

    const made = {
      points,
      profile: oneOf(text(values.profile), ['square', 'round'] as const, 'profile', 'round'),
      thickness: size(values.thickness, 'thickness') ?? 200,
      material: oneOf(text(values.material), MATERIALS, 'material', 'metal'),
    };

    // Draw it now and throw it away: a path that cannot be mitred, or one that runs inside the
    // building where nobody would see it, is refused here rather than at the next build.
    const drawn = new Surface(made.material);
    const scene = assemble(doc);
    const placed = scene.bands.find((one) => one.id === band.id)!;
    const shape = sectionShape(placed);
    const base = toMetres(placed.y0);

    segment(
      drawn,
      points.map(([x, y, z]) => [toMetres(x), toMetres(y) - base, toMetres(z)] as [number, number, number]),
      { profile: made.profile, thickness: toMetres(made.thickness) },
    );

    const buried = sunkProblems([drawn.data()], shape);
    if (buried.length > 0) {
      throw new BuildingError(
        'E_OVERLAP',
        `this run is inside ${band.id}, where nothing would see it. ${outsideOf(placed)} A run has to stand out of the section it hangs on`,
        ['run'],
      );
    }

    await project.writeDocument({
      ...doc,
      bands: doc.bands.map((one) => (one.id === band.id ? { ...one, runs: [...one.runs, made] } : one)),
    });

    return {
      project: name,
      section: band.id,
      points: points.length,
      profile: made.profile,
      thickness: toMetres(made.thickness),
      material: made.material,
      note: 'corners are mitred where the runs meet; build to prove it stands on something',
    };
  },
};

export const faceVerbs = [face, put, clear, run];
