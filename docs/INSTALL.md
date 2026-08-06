# Install

Needs Node 24 or newer (it runs the TypeScript directly, no build step). Check with `node --version`.

## The CLI

```bash
git clone https://github.com/hec-ovi/glb-buildings-skill
cd glb-buildings-skill
npm install
npm link          # puts `buildings` on your PATH
buildings help
```

Without `npm link`, call it in place: `node boxes/cli/bin/buildings.ts help`.

Projects live in `~/.glb-buildings/projects/<name>/`. Point that somewhere else with `BUILDINGS_HOME`:

```bash
export BUILDINGS_HOME=/data/buildings
```

## The skill, for any agent CLI

The portable unit is the folder [`skills/glb-buildings/`](../skills/glb-buildings/): one `SKILL.md` resolver
plus four fat parts it routes to. Copy it into wherever your agent reads skills from.

```bash
# most agent CLIs
cp -r skills/glb-buildings ~/.<your-agent>/skills/

# Claude Code, per user
cp -r skills/glb-buildings ~/.claude/skills/

# across every detected agent, via the skills installer
npx skills add hec-ovi/glb-buildings-skill
```

The skill assumes `buildings` is on the PATH. If you did not `npm link`, add a line at the top of your agent's
config telling it the command is `node /path/to/glb-buildings-skill/boxes/cli/bin/buildings.ts`.

## As a Claude Code plugin

```text
/plugin marketplace add hec-ovi/glb-buildings-skill
/plugin install glb-buildings@glb-buildings-skill
```

## Local model checklist

The skill is written to be usable by a small local model with no extra prompting:

- every action is one verb, and `buildings help` lists them all with their usage
- every answer is one JSON object with `ok`, so a failure is machine readable
- the current project is remembered, so the model says the name once
- `buildings show` prints the whole state, so the model never has to hold it in context

If your model struggles, the first thing to check is that `buildings help` runs in its shell.
