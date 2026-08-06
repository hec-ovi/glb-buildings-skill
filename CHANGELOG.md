# Changelog

Present-state entries: each version says what the project is at that point.

## 0.0.2

The document model and the editor. A building is JSON in whole millimetres: bands of floors over one
footprint, each floor's facade split into bays that cover it exactly. `npm run preview -- <dir>` serves a
three.js blueprint of it, where a click picks a bay and a dragged rectangle picks a zone, and every pick lands
in `selection.json` for the CLI agent to act on.

## 0.0.1

Repo initialized: docs scaffold, MIT license.
