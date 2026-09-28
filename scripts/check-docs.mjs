import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const requiredFiles = [
  'AGENTS.md', 'README.md', 'PLANS.md', 'docs/INDEX.md', 'docs/AGENTS.md',
  'docs/DOCUMENTATION.md', 'docs/QUALITY.md', 'docs/ROADMAP.md',
  'docs/engineering/WORKFLOW.md', 'docs/features/README.md',
  'docs/plans/README.md', 'docs/plans/completed/README.md',
  'docs/plans/tech-debt-tracker.md', 'docs/templates/exec-plan.md',
  'docs/templates/feature.md', 'docs/references/harness-engineering.md',
  'app/AGENTS.md', 'resources/js/AGENTS.md', 'apps/extension/AGENTS.md',
];
export const planHeadings = [
  'Purpose / Big Picture', 'Progress', 'Surprises & Discoveries', 'Decision Log',
  'Outcomes & Retrospective', 'Context and Orientation', 'Plan of Work',
  'Concrete Steps', 'Validation and Acceptance', 'Idempotence and Recovery',
  'Artifacts and Notes', 'Interfaces and Dependencies',
];
// Only these byte-preserved historical ACTIVE plans may lack the new header.
const legacy = new Map([
  ['000-execplan.md', '8cfed0b1675af04daafc418dc1c40d6def4bc69b'],
  ['001-page-chats-and-linking.md', '3f233305da5b0c08317a1abc758c7243a8ba5e38'],
  ['002-durable-work-chats.md', '21069667d74933372f293e6b03413516592e7011'],
  ['003-application-shell.md', '649e62d53cd258a479c627c324d1c4cf029c4934'],
]);
const numbered = /^(\d{3,})-.+\.md$/;
const states = new Set(['proposed', 'approved', 'in-progress', 'blocked', 'verification-pending', 'completed']);
const blobHash = text => createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0`).update(text).digest('hex');

function markdownFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  });
}

function prose(text) {
  let fence = null;
  return text.split(/\r?\n/).filter(line => {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (match) {
      if (!fence) fence = match[1];
      else if (match[1][0] === fence[0] && match[1].length >= fence.length) fence = null;
      return false;
    }
    return !fence;
  }).join('\n');
}

export function checkRepository(root) {
  root = resolve(root);
  const errors = [];
  const report = (file, message) => errors.push(`${relative(root, file)}: ${message}`);
  for (const name of requiredFiles) {
    if (!existsSync(resolve(root, name))) report(resolve(root, name), 'required documentation owner is missing; restore it or deliberately update the map/checker.');
  }
  const files = new Set(markdownFiles(resolve(root, 'docs')));
  for (const name of requiredFiles) if (existsSync(resolve(root, name))) files.add(resolve(root, name));
  const links = new Map();
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const targets = new Set();
    // Bounded check of ordinary inline Markdown file links; not a full Markdown parser.
    for (const match of prose(text).matchAll(/\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+["'][^)]*["'])?\)/g)) {
      const href = match[1] ?? match[2];
      if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(href)) continue;
      let path;
      try { path = decodeURIComponent(href.split(/[?#]/)[0]); }
      catch { report(file, `invalid URL encoding in local link ${href}.`); continue; }
      if (!path) continue;
      const target = path.startsWith('/') ? resolve(root, path.slice(1)) : resolve(dirname(file), path);
      const rel = relative(root, target);
      if (rel === '..' || rel.startsWith('../') || isAbsolute(rel)) report(file, `local link leaves the repository: ${href}.`);
      else if (!existsSync(target)) report(file, `missing local link target ${href}; repair the link or its target.`);
      targets.add(target);
    }
    links.set(file, targets);
    if (file === resolve(root, 'AGENTS.md') && text.trimEnd().split(/\r?\n/).length > 100) report(file, 'keep the root agent guide at most 100 lines; move detail to its owning document.');
  }
  const featureIndex = resolve(root, 'docs/features/README.md');
  for (const file of markdownFiles(resolve(root, 'docs/features'))) {
    if (file !== featureIndex && !links.get(featureIndex)?.has(file)) report(file, 'feature is absent from docs/features/README.md; add its owning entry.');
  }
  const planIndex = resolve(root, 'docs/plans/README.md');
  const identities = new Map();
  for (const folder of ['active', 'completed']) {
    const directory = resolve(root, `docs/plans/${folder}`);
    if (!existsSync(directory)) { report(directory, 'plan lifecycle directory is missing.'); continue; }
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isFile() || !numbered.test(entry.name)) continue;
      const file = resolve(directory, entry.name);
      const id = entry.name.match(numbered)[1];
      if (identities.has(id)) report(file, `duplicate plan number ${id}; move the existing plan, do not copy or reuse its number.`);
      identities.set(id, file);
      if (!links.get(planIndex)?.has(file)) report(file, 'plan is absent from the canonical plan register.');
      const text = readFileSync(file, 'utf8');
      const body = prose(text);
      let previous = -1;
      for (const heading of planHeadings) {
        const position = body.indexOf(`\n## ${heading}\n`);
        if (position < 0 || position <= previous) report(file, `missing or out-of-order section: ${heading}.`);
        previous = Math.max(position, previous);
      }
      if (folder === 'active' && legacy.get(entry.name) === blobHash(text)) continue;
      const field = name => body.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim();
      const lifecycle = field('Lifecycle');
      if (!states.has(lifecycle)) report(file, 'add a valid Lifecycle header under docs/plans/README.md; legacy exceptions require unchanged bytes.');
      for (const name of ['Approval', 'Verification', 'Release']) if (!field(name)) report(file, `missing ${name} header; distinguish authorization, checks, and release.`);
      if (folder === 'active' && lifecycle === 'completed') report(file, 'completed plan belongs in completed/ after the closure gate and reference updates.');
      if (folder === 'completed') {
        if (lifecycle !== 'completed') report(file, 'completed/ requires Lifecycle: completed; do not archive unfinished work as done.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(field('Closed') ?? '') || !field('Closure')) report(file, 'record Closed date and Closure evidence/disposition before completing.');
        if (/^\s*[-*]\s+\[ \]/m.test(body)) report(file, 'unchecked work remains; keep the plan active until the approved completion gate is met.');
        if (/^(?:not granted|unknown|pending)/i.test(field('Approval') ?? '') || /^(?:not run|unknown|pending|unverified)/i.test(field('Verification') ?? '')) report(file, 'completion requires actual approval and verification evidence, not pending placeholders.');
      }
    }
  }
  const planRoot = resolve(root, 'docs/plans');
  if (existsSync(planRoot)) for (const entry of readdirSync(planRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !numbered.test(entry.name)) continue;
    const file = resolve(planRoot, entry.name);
    const text = readFileSync(file, 'utf8');
    const destinations = ['active', 'completed'].map(folder => resolve(planRoot, folder, entry.name));
    if (!legacy.has(entry.name) || !text.startsWith('# Moved execution plan\n') || text.split('\n').length > 12 || text.includes('## Progress') || !destinations.some(target => existsSync(target) && links.get(file)?.has(target))) report(file, 'root numbered files may only be the four legacy forwarding notes; create/edit canonical active or completed plans.');
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkRepository(process.argv[2] ?? process.cwd());
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Documentation structure checks passed. Semantic accuracy and runtime verification require separate review.');
}
