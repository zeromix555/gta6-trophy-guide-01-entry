// main.ts — hands in the Vice City Platinum guide (Node 22, standard library only).
// The guide is plain static files: app/index.html plus its modules, styles and data
// (app/data/trophies.json holds the 55 trophies with their guides), and screenshots/
// holds the four renders of the app. This program copies both folders from beside
// this file into the output directory and writes /output/dossier.json with the
// vendored make.fun library — the same library the scorer uses, so the dossier it
// writes here is byte for byte the one the gate checks.
//
// Leave vendor/makefun-frontend.ts untouched: the scorer rebuilds the dossier with
// its own copy and compares the two.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): text_max_bytes shapes the dossier
// text; the other caps refuse an entry the scorer would refuse — more than 4
// screenshots or one over 256 KiB, more than 993 files and directories in app/,
// or more than 48 MiB of app files (app/ counts beside /output's own 1000-entry cap).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
