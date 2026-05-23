#!/usr/bin/env node
/* eslint-disable */
const { existsSync, mkdirSync, cpSync, statSync } = require('node:fs');
const { join } = require('node:path');

const root = process.cwd();
const standalone = join(root, '.next', 'standalone');

if (!existsSync(standalone)) {
  console.log('[postbuild] standalone dir missing; skipping static copy');
  process.exit(0);
}

const copies = [
  { from: join(root, '.next', 'static'), to: join(standalone, '.next', 'static') },
  { from: join(root, 'public'), to: join(standalone, 'public') },
];

for (const { from, to } of copies) {
  if (!existsSync(from)) {
    console.log(`[postbuild] skip ${from} (missing)`);
    continue;
  }
  if (!statSync(from).isDirectory()) {
    console.log(`[postbuild] skip ${from} (not a directory)`);
    continue;
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true, force: true });
  console.log(`[postbuild] copied ${from} -> ${to}`);
}
