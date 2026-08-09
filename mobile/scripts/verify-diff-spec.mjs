#!/usr/bin/env node
/**
 * Execute `documentation/spelling-diff-spec.md`'s own three-step verification
 * recipe (§1.2), so the spec is proven *as it stands on disk* rather than on
 * trust.
 *
 *   1. Extract every ```ts block in document order, dropping the ONE bodiless
 *      forward declaration of computeSpellingDiff in §2.2 (keeping it alongside
 *      the real implementation is TS2391).
 *   2. Type-check the result with `tsc --noEmit --strict`. This step catches
 *      undeclared *types*, which step 3 cannot — Node erases annotations rather
 *      than checking them, and an undeclared `EditOp` was once found exactly
 *      this way after surviving a runtime-only check.
 *   3. Run all 29 ground-truth vectors against the extracted implementation.
 *
 * Both steps 2 and 3 are required; either alone proves nothing useful.
 *
 * The extracted module is left at `.spec-extract/spec.ts` so the Jest suite can
 * differentially compare the app's implementation against the spec's own.
 *
 * Exit code 0 on success, 1 on any failure.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MOBILE = resolve(HERE, '..');
const SPEC_MD = resolve(MOBILE, '../documentation/spelling-diff-spec.md');
const VECTORS = resolve(MOBILE, 'src/features/evaluation/vectors.json');
const OUT_DIR = resolve(MOBILE, '.spec-extract');
const OUT_TS = resolve(OUT_DIR, 'spec.ts');

/** Accumulated failure messages; a non-empty list means the run failed. */
const failures = [];

/**
 * Record a failed assertion.
 *
 * @param message Human-readable description of what did not hold.
 */
function fail(message) {
  failures.push(message);
}

/**
 * Extract the spec's runnable TypeScript listing.
 *
 * @param markdown The full text of spelling-diff-spec.md.
 * @returns The concatenated `ts` blocks, in document order, minus the bodiless
 *          forward declaration.
 * @throws {Error} If no `ts` blocks are found, which means the document changed
 *         shape and this script's assumptions no longer hold.
 */
function extractSpecSource(markdown) {
  const blocks = [...markdown.matchAll(/```ts\n([\s\S]*?)```/g)].map((m) => m[1]);
  if (blocks.length === 0) throw new Error('No ```ts blocks found in spelling-diff-spec.md');
  const kept = blocks.filter((b) => !/\)\s*:\s*DiffSegment\[\];$/.test(b.trim()));
  const dropped = blocks.length - kept.length;
  if (dropped !== 1) {
    fail(
      `Expected to drop exactly 1 bodiless forward declaration, dropped ${dropped}. ` +
        'The spec listing changed shape — re-read §1.2 before trusting this run.',
    );
  }
  return kept.join('\n');
}

/**
 * Render a diff the way the legacy v0.2.0 app did (spelling-diff-spec.md §7.4).
 *
 * Duplicated here rather than imported from `src/` on purpose: this harness must
 * exercise the *spec's* code with the *spec's* mapping, independently of the
 * app.
 *
 * @param diff The structured diff.
 * @returns The legacy HTML string.
 */
function renderLegacyHtml(diff) {
  return diff
    .map((s) => {
      if (s.status === 'ok') return s.char;
      if (s.status === 'extra') return '<em>-</em>';
      if (s.char === ' ') return '<em>&nbsp;_&nbsp;</em>';
      return `<em>${s.char}</em>`;
    })
    .join('');
}

/**
 * Normalise a segment to a plain comparable object, dropping undefined keys so
 * `{ status, char }` and `{ status, char, typed: undefined }` compare equal.
 *
 * @param s A DiffSegment.
 * @returns A canonical plain object.
 */
function canon(s) {
  const out = { status: s.status, char: s.char };
  if (s.typed !== undefined) out.typed = s.typed;
  if (s.pairId !== undefined) out.pairId = s.pairId;
  return out;
}

/**
 * Assert every invariant in spelling-diff-spec.md §2.3 for one diff.
 *
 * @param diff The diff to check.
 * @param correct The correct answer it was computed against.
 * @param label A vector id used in failure messages.
 */
function checkInvariants(diff, correct, label) {
  // 1. Reconstruction.
  const rebuilt = diff
    .filter((s) => s.status !== 'extra')
    .map((s) => s.char)
    .join('');
  if (rebuilt !== correct) {
    fail(`${label}: reconstruction — got ${JSON.stringify(rebuilt)}, want ${JSON.stringify(correct)}`);
  }

  // 4. `extra` carries no correct-answer character.
  for (const s of diff) {
    if (s.status === 'extra' && (s.char !== '' || s.typed === undefined)) {
      fail(`${label}: an 'extra' segment must have char === '' and a typed value`);
    }
    // 7. No segment carries pairId unless its status is 'transposed'.
    if (s.pairId !== undefined && s.status !== 'transposed') {
      fail(`${label}: a '${s.status}' segment carries a pairId`);
    }
  }

  // 6. Transposition pairing.
  const byPair = new Map();
  diff.forEach((s, index) => {
    if (s.pairId === undefined) return;
    if (!byPair.has(s.pairId)) byPair.set(s.pairId, []);
    byPair.get(s.pairId).push(index);
  });
  for (const [pairId, indices] of byPair) {
    if (indices.length !== 2) {
      fail(`${label}: pairId ${pairId} appears on ${indices.length} segments, want exactly 2`);
      continue;
    }
    const [p, q] = indices;
    if (q !== p + 1) fail(`${label}: pairId ${pairId} segments are not adjacent`);
    if (diff[p].char !== diff[q].typed || diff[q].char !== diff[p].typed) {
      fail(`${label}: pairId ${pairId} halves are not mirror images`);
    }
  }
}

// ── Step 1: extract ─────────────────────────────────────────────────────────
const markdown = readFileSync(SPEC_MD, 'utf8');
const source = extractSpecSource(markdown);
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_TS, source, 'utf8');
// Marks the extract as ESM so Node's type-stripping loader does not re-parse it
// as CommonJS first (a warning, and a needless second parse).
writeFileSync(resolve(OUT_DIR, 'package.json'), JSON.stringify({ type: 'module' }, null, 2));
console.log(`[1/3] extracted ${source.split('\n').length} lines of spec TypeScript → ${OUT_TS}`);

// ── Step 2: type-check ──────────────────────────────────────────────────────
try {
  execFileSync(
    process.execPath,
    [
      resolve(MOBILE, 'node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--target',
      'es2022',
      '--moduleDetection',
      'force',
      // TS 6 errors out (TS5112) when a tsconfig.json is discoverable but files
      // are given on the command line. The spec's §1.2 recipe assumes a bare
      // directory; this flag reproduces that condition from inside the project.
      '--ignoreConfig',
      OUT_TS,
    ],
    { stdio: 'pipe', encoding: 'utf8' },
  );
  console.log('[2/3] tsc --noEmit --strict: clean');
} catch (error) {
  fail(`tsc --strict rejected the spec listing:\n${error.stdout || ''}${error.stderr || ''}`);
  console.error('[2/3] tsc --noEmit --strict: FAILED');
}

// ── Step 3: run the vectors ─────────────────────────────────────────────────
const { legacy, transposition, structured } = JSON.parse(readFileSync(VECTORS, 'utf8'));
const { computeSpellingDiff } = await import(pathToFileURL(OUT_TS).href);

let ran = 0;
let transposedSegmentsInLegacy = 0;

for (const v of legacy) {
  if (v.exactMatch) {
    // Vectors 1 and 2 exercise the exact-match path and never reach
    // computeSpellingDiff. Assert that here so the count of 15 is honest.
    if (v.typed.trim().toLowerCase() !== v.correct.toLowerCase()) {
      fail(`legacy ${v.id}: expected an exact match under case folding`);
    }
    ran++;
    continue;
  }
  const diff = computeSpellingDiff(v.typed, v.correct);
  const html = renderLegacyHtml(diff);
  if (html !== v.legacyHtml) {
    fail(`legacy ${v.id} (${v.exercises}): got ${JSON.stringify(html)}, want ${JSON.stringify(v.legacyHtml)}`);
  }
  transposedSegmentsInLegacy += diff.filter((s) => s.status === 'transposed').length;
  checkInvariants(diff, v.correct, `legacy ${v.id}`);
  ran++;
}

if (transposedSegmentsInLegacy !== 0) {
  fail(
    `Adding transposition changed the legacy vectors: ${transposedSegmentsInLegacy} transposed ` +
      'segment(s) produced. The 15 legacy vectors are the regression gate on the Damerau change ' +
      'and none of them may produce a swap.',
  );
}

for (const v of transposition) {
  const diff = computeSpellingDiff(v.typed, v.correct);
  const got = JSON.stringify(diff.map(canon));
  const want = JSON.stringify(v.segments);
  if (got !== want) {
    fail(`transposition ${v.id} (${v.exercises}):\n  got  ${got}\n  want ${want}`);
  }
  const swaps = new Set(diff.filter((s) => s.pairId !== undefined).map((s) => s.pairId)).size;
  if (swaps !== v.swaps) {
    fail(`transposition ${v.id}: got ${swaps} swap(s), want ${v.swaps}`);
  }
  checkInvariants(diff, v.correct, `transposition ${v.id}`);
  ran++;
}

for (const v of structured) {
  const got = JSON.stringify(computeSpellingDiff(v.typed, v.correct).map(canon));
  const want = JSON.stringify(v.segments);
  if (got !== want) {
    fail(`§9.4 structured ${v.id}:\n  got  ${got}\n  want ${want}`);
  }
}

console.log(`[3/3] ran ${ran} vectors (${legacy.length} legacy + ${transposition.length} transposition)`);

if (failures.length > 0) {
  console.error(`\nFAILED — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  • ${f}`);
  process.exit(1);
}

console.log(`\nPASS — ${ran}/29 vectors green against the spec's own reference implementation.`);
