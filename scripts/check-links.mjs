#!/usr/bin/env node
// Checks relative links in all .md files and manifest.json paths against the real tree.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

const mdFiles = [];
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.md')) mdFiles.push(p);
  }
};
walk(ROOT);

let broken = 0;
for (const file of mdFiles) {
  // strip fenced code blocks and inline code — regexes like [\\/](react)[\\/] are not links
  const text = readFileSync(file, 'utf8')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '');
  for (const m of text.matchAll(/\]\(([^)#\s]+)(#[^)]*)?\)/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|tel:)/.test(target)) continue;
    const abs = resolve(dirname(file), decodeURIComponent(target));
    if (!existsSync(abs)) {
      console.log(`BROKEN  ${file.replace(ROOT, '')} -> ${target}`);
      broken++;
    }
  }
}

// manifest.json: verify every "path"/"file" value exists
const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
let manifestBroken = 0;
const checkPaths = (node) => {
  if (Array.isArray(node)) return node.forEach(checkPaths);
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string' && (k === 'path' || k === 'file') && v.endsWith('.md')) {
        if (!existsSync(join(ROOT, v))) {
          console.log(`MANIFEST BROKEN -> ${v}`);
          manifestBroken++;
        }
      } else checkPaths(v);
    }
  }
};
checkPaths(manifest);

console.log(`\n${mdFiles.length} md files scanned: ${broken} broken md links, ${manifestBroken} broken manifest paths`);
process.exitCode = broken + manifestBroken ? 1 : 0;
