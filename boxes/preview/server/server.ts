/** The local server behind the preview: scene in, selection out, live reload. */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { assemble } from '#assemble';
import { BuildingError, parseSelection } from '#spec';
import { Project, watchTree } from './project.ts';
import { ViewerBundle } from './bundle.ts';

const INDEX = fileURLToPath(new URL('../viewer/index.html', import.meta.url));

export type PreviewOptions = {
  /** A fixed project folder. */
  dir?: string;
  /** Or follow whatever project is current: resolved on every request. */
  resolve?: () => Promise<string>;
  /** What to watch while following, usually the projects root. */
  watchRoot?: string;
  port?: number;
  host?: string;
  /** Print a line per request. On for the CLI, off in tests. */
  log?: boolean;
};

export class PreviewServer {
  /** The fixed project, when the server was given one. */
  readonly project: Project;
  readonly #resolve: (() => Promise<string>) | undefined;
  readonly #watchRoot: string | undefined;
  readonly #log: boolean;
  readonly #bundle = new ViewerBundle();
  readonly #host: string;
  readonly #port: number;
  readonly #clients = new Set<ServerResponse>();
  #server: Server | undefined;
  #unwatch: (() => void) | undefined;

  constructor(options: PreviewOptions) {
    if (!options.dir && !options.resolve) throw new Error('preview needs a dir or a resolve');
    this.project = new Project(options.dir ?? '.');
    this.#resolve = options.resolve;
    this.#watchRoot = options.watchRoot;
    this.#log = options.log ?? false;
    this.#host = options.host ?? '127.0.0.1';
    this.#port = options.port ?? 4321;
  }

  async start(): Promise<string> {
    const server = createServer((req, res) => {
      this.#route(req, res).catch((error: unknown) => this.#fail(res, error));
    });
    this.#server = server;

    await new Promise<void>((ok, fail) => {
      server.once('error', fail);
      server.listen(this.#port, this.#host, ok);
    });

    this.#unwatch = this.#watchRoot
      ? watchTree(this.#watchRoot, () => this.#broadcast())
      : this.project.watch(() => this.#broadcast());
    return this.url;
  }

  get url(): string {
    const address = this.#server?.address();
    const port = typeof address === 'object' && address ? address.port : this.#port;
    return `http://${this.#host}:${port}/`;
  }

  async close(): Promise<void> {
    this.#unwatch?.();
    for (const client of this.#clients) client.end();
    this.#clients.clear();
    const server = this.#server;
    if (!server) return;
    await new Promise<void>((ok) => server.close(() => ok()));
    this.#server = undefined;
  }

  async #route(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const path = new URL(req.url ?? '/', 'http://localhost').pathname;
    // One line per request, so a page that will not load can be read from this side.
    if (this.#log) process.stdout.write(`${new Date().toISOString()} ${req.method} ${path}\n`);

    if (path === '/api/ping') return this.#send(res, 200, 'text/plain', 'preview is serving\n');

    if (path === '/') return this.#sendFile(res, INDEX, 'text/html; charset=utf-8');
    if (path === '/viewer.js') return this.#send(res, 200, 'text/javascript; charset=utf-8', await this.#bundle.code());
    if (path === '/api/scene') return this.#scene(res);
    if (path === '/api/model.glb') return this.#model(res);
    if (path === '/api/selection' && req.method === 'POST') return this.#putSelection(req, res);
    if (path === '/api/selection') return this.#json(res, 200, await (await this.#current()).readSelection());
    if (path === '/api/events') return this.#events(res);

    this.#send(res, 404, 'text/plain', 'not found');
  }

  /** The project this request is about: the fixed one, or whichever is current. */
  async #current(): Promise<Project> {
    return this.#resolve ? new Project(await this.#resolve()) : this.project;
  }

  async #scene(res: ServerResponse): Promise<void> {
    const project = await this.#current();
    const document = await project.readDocument();
    this.#json(res, 200, { document, scene: assemble(document), hasModel: project.hasModel() });
  }

  async #model(res: ServerResponse): Promise<void> {
    const project = await this.#current();
    if (!project.hasModel()) return this.#send(res, 404, 'text/plain', 'no build yet');
    const glb = await project.readModel();
    res.writeHead(200, { 'content-type': 'model/gltf-binary', 'cache-control': 'no-store' });
    res.end(glb);
  }

  async #putSelection(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const selection = parseSelection(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
    this.#json(res, 200, await (await this.#current()).writeSelection(selection));
  }

  #events(res: ServerResponse): void {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    });
    res.write('retry: 1000\n\n');
    this.#clients.add(res);
    res.on('close', () => this.#clients.delete(res));
  }

  #broadcast(): void {
    for (const client of this.#clients) client.write('event: changed\ndata: {}\n\n');
  }

  async #sendFile(res: ServerResponse, path: string, type: string): Promise<void> {
    this.#send(res, 200, type, await readFile(path, 'utf8'));
  }

  #send(res: ServerResponse, status: number, type: string, body: string): void {
    res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(body);
  }

  #json(res: ServerResponse, status: number, body: unknown): void {
    this.#send(res, status, 'application/json; charset=utf-8', JSON.stringify(body));
  }

  #fail(res: ServerResponse, error: unknown): void {
    const body = error instanceof BuildingError ? error.toJSON() : { code: 'E_DOC_INVALID', message: String(error), at: [] };
    this.#json(res, 400, body);
  }
}
