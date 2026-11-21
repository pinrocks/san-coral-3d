// San Coral: High Tide — Make GTA 6 (gta6-01) entry packager (Node 22, standard library only).
// Copies the offline static 3D WebGL game (game/) and browser captures (screenshots/) into /output,
// builds /output/dossier.json via vendor/makefun-game.ts, and normalizes world-readable modes.

import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

process.umask(0o022);

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const skipDotfiles = (src: string): boolean => !basename(src).startsWith('.');

mkdirSync(out, { recursive: true, mode: 0o755 });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true, filter: skipDotfiles });
mkdirSync(join(out, 'screenshots'), { recursive: true, mode: 0o755 });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true, filter: skipDotfiles });
}

function normalizePermissions(rootDir: string, isRoot = true): void {
  if (!isRoot) {
    chmodSync(rootDir, 0o755);
  } else {
    try {
      chmodSync(rootDir, 0o755);
    } catch {
      // Container mount root may be owned by root; children below are owned by us.
    }
  }
  for (const name of readdirSync(rootDir)) {
    const full = join(rootDir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      normalizePermissions(full, false);
    } else if (st.isFile()) {
      chmodSync(full, 0o644);
    }
  }
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
  { mode: 0o644 },
);

normalizePermissions(out);
