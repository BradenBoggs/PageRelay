import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { checkRepository, requiredFiles, planHeadings } from './check-docs.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'sidewire-docs-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (name, text) => { const file = join(root, name); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); };
  const plan = (state = 'proposed') => `# Test plan\n\nLifecycle: ${state}\nApproval: ${state === 'completed' ? 'user approved test fixture' : 'not granted'}\nVerification: ${state === 'completed' ? 'fixture evidence only' : 'not run'}\nRelease: out of scope\n${state === 'completed' ? 'Closed: 2026-09-27\nClosure: fixture only; not product evidence.\n' : ''}\n${planHeadings.map(heading => `## ${heading}\n\nFixture content.\n`).join('\n')}`;
  for (const file of requiredFiles) put(file, '# Fixture\n');
  put('docs/features/example.md', '# Example\n');
  put('docs/features/README.md', '# Features\n\n[Example](example.md)\n');
  put('docs/plans/active/004-example.md', plan());
  put('docs/plans/README.md', '# Plans\n\n[Example](active/004-example.md)\n');
  return { root, put, plan, errors: () => checkRepository(root) };
}

test('valid active layout passes', t => assert.deepEqual(fixture(t).errors(), []));
test('missing required owner fails', t => { const f = fixture(t); rmSync(join(f.root, 'docs/INDEX.md')); assert(f.errors().some(e => e.includes('required documentation'))); });
test('broken local link fails', t => { const f = fixture(t); f.put('docs/INDEX.md', '[Missing](absent.md)'); assert(f.errors().some(e => e.includes('missing local link target'))); });
test('external links, heading anchors and fenced examples are not fetched', t => { const f = fixture(t); f.put('docs/INDEX.md', '[Web](https://example.invalid)\n[Heading](#absent)\n```md\n[Example](absent.md)\n```\n'); assert.deepEqual(f.errors(), []); });
test('unindexed feature fails', t => { const f = fixture(t); f.put('docs/features/other.md', '# Other'); assert(f.errors().some(e => e.includes('feature is absent'))); });
test('unindexed plan fails', t => { const f = fixture(t); f.put('docs/plans/README.md', '# Plans'); assert(f.errors().some(e => e.includes('plan is absent'))); });
test('new root-level plan is rejected', t => { const f = fixture(t); f.put('docs/plans/005-wrong.md', f.plan()); assert(f.errors().some(e => e.includes('legacy forwarding notes'))); });
test('oversized root AGENTS fails', t => { const f = fixture(t); f.put('AGENTS.md', 'Instruction\n'.repeat(101)); assert(f.errors().some(e => e.includes('100 lines'))); });
test('duplicate number across lifecycle folders fails', t => { const f = fixture(t); f.put('docs/plans/completed/004-other.md', f.plan('completed')); assert(f.errors().some(e => e.includes('duplicate plan number'))); });
test('active completed status fails', t => { const f = fixture(t); f.put('docs/plans/active/004-example.md', f.plan('completed')); assert(f.errors().some(e => e.includes('belongs in completed'))); });
test('modified legacy content needs lifecycle metadata', t => { const f = fixture(t); f.put('docs/plans/active/000-execplan.md', '# Not the byte-preserved legacy plan'); assert(f.errors().some(e => e.includes('Lifecycle header'))); });
test('missing or reordered headings fail', t => { const f = fixture(t); f.put('docs/plans/active/004-example.md', f.plan().replace('## Progress', '## Not progress')); assert(f.errors().some(e => e.includes('section: Progress'))); });
test('proper completed layout passes without claiming release', t => { const f = fixture(t); rmSync(join(f.root, 'docs/plans/active/004-example.md')); f.put('docs/plans/completed/004-example.md', f.plan('completed')); f.put('docs/plans/README.md', '[Example](completed/004-example.md)'); assert.deepEqual(f.errors(), []); });
test('unfinished work in completed fails', t => { const f = fixture(t); f.put('docs/plans/completed/005-pending.md', f.plan('completed').replace('## Progress\n', '## Progress\n\n- [ ] Required check\n')); assert(f.errors().some(e => e.includes('unchecked work'))); });
test('completed placeholders and missing closure fail', t => { const f = fixture(t); f.put('docs/plans/completed/005-no-evidence.md', f.plan('completed').replace('Verification: fixture evidence only', 'Verification: not run').replace('Closed: 2026-09-27', 'Closed: unknown')); assert(f.errors().some(e => e.includes('Closure evidence'))); assert(f.errors().some(e => e.includes('pending placeholders'))); });
test('forged legacy forwarding note fails', t => { const f = fixture(t); f.put('docs/plans/000-execplan.md', '# Moved execution plan\n\n[Wrong](active/004-example.md)'); assert(f.errors().some(e => e.includes('legacy forwarding notes'))); });
test('local traversal outside repository fails', t => { const f = fixture(t); f.put('docs/INDEX.md', '[Outside](../../outside.md)'); assert(f.errors().some(e => e.includes('leaves the repository'))); });
test('URL-encoded valid paths resolve and invalid encoding fails', t => { const f = fixture(t); f.put('docs/reference space.md', '# Reference'); f.put('docs/INDEX.md', '[Reference](reference%20space.md)'); assert.deepEqual(f.errors(), []); f.put('docs/INDEX.md', '[Invalid](broken%XX.md)'); assert(f.errors().some(e => e.includes('invalid URL encoding'))); });
