import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const assets = new URL('../dist-prototype/assets/', import.meta.url);
const files = (await readdir(assets)).filter((file) => file.endsWith('.js'));
assert(files.length, 'Build the standalone prototype before checking its bundle.');
const source = (
  await Promise.all(files.map((file) => readFile(new URL(file, assets), 'utf8')))
).join('\n');
for (const marker of ['api/school', '@netlify/', '/.netlify/identity', 'DATABASE_URL', 'gotrue']) {
  assert(!source.includes(marker), `Cloud implementation found in prototype: ${marker}`);
}
assert(
  source.includes('Experience prototype'),
  'The published bundle must be the isolated prototype.',
);
console.log(
  `Verified ${files.length} prototype bundles: sample-data frontend, no cloud API implementation.`,
);
