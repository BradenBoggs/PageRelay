# 015 — Work reference badges in messages

Lifecycle: verification-pending
Approval: October 13, 2026 GPS user requests chat formatting for PO and related work references, such as [Po 1234].
Verification: 30 parser/documentation tests, shared types/builds and Chrome 1440px/390px insertion/render/edit checks passed; native side-panel acceptance pending.
Release: not released; deployment outside scope.

## Purpose / Big Picture

Make arbitrary bracketed labels scannable in messages. Owner: [Messaging](../../features/messaging-and-composer.md). Display-only formatting, no external-system linking, imported records, access grants or new notification semantics.

## Progress

- [x] Inspect shared rendering, mentions, composer and staged changes.
- [x] Implement generic bracket syntax, badge styling and insertion.
- [x] Verify parser, safe rendering and desktop/mobile flows.
- [ ] Verify native extension side-panel rendering.

## Surprises & Discoveries

Mention rendering already preserves raw text and resolves recipients independently. Existing password/task-description work is staged; preserve it.

## Decision Log

October 13 initial implementation recognized business-reference prefixes. The user's follow-up explicitly expands this to any non-empty bracketed label, preserving case and supporting nested/multiline text. Empty/unmatched brackets stay text. Formatting never resolves an actual business record or changes mention recipients.

## Outcomes & Retrospective

Generic square-bracket badges are implemented and scoped web checks passed. No release.

## Context and Orientation

Main 6aa57df plus existing staged changes. Shared MessageRow/presentation/composer serve web and extension. No backend/model change required.

## Plan of Work

Add pure formatting helper composed with resolved mentions, wrapping inline CSS and an accessible generic badge insertion control. Record syntax in owning docs.

## Concrete Steps

Run parser/mention tests, shared types/builds, scoped lint and real desktop/mobile Chrome checks with synthetic messages.

## Validation and Acceptance

Recognized tokens render inline without affecting mentions, task conversion, source, editing or raw stored text. Malformed/unknown tokens and HTML remain inert text. Narrow rows do not overflow; keyboard insertion works.

## Idempotence and Recovery

Display-only derivation; no migration, schema or send identity change. Reverting the renderer reveals original bracket text.

## Artifacts and Notes

October 13, 2026, main `6aa57df` plus this patch and preserved staged password/task-description work. PHP 8.5.1/SQLite disposable browser fixtures, Node 24.14.1 and Chrome.

- `node --test scripts/check-docs.test.mjs scripts/collaboration-ui.test.mjs`: 30 passed. Generic labels, nested/multiline/long labels, empty/unmatched text, original text reconstruction and resolved mentions covered. Initial generic-parser revision omitted its cursor initializer; tests caught it and passed after correction.
- `npm run types:check` and `npm run build`: web/extension passed. Scoped `vp lint` on helper/conversation/composer/tests passed; browser scenario formatting passed. Existing compact source style preserved.
- `SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/015-message-references node tests/Browser/message-references.cjs`: Chrome 1440px/390px passed. Checks keyboard badge insertion, arbitrary `[Other text]` rendering alongside PO/SO/invoice/quote labels, inert HTML/no links, accessible labels, original bracket syntax in edit textarea, no overflow or page errors. Prior prefix-only browser run passed before the user expanded the scope; final generic run supersedes it.
- Retained screenshots: [desktop](../artifacts/015-message-references/references-1440.png), [mobile](../artifacts/015-message-references/references-390.png).
- `node scripts/check-docs.mjs` and `git diff --check`: passed.

No backend/data migration, notification recipients, permissions, integration, shared records or deployment changed. Native side-panel interaction and full backend suite were not exercised for this display-only change.

## Interfaces and Dependencies

Existing React safe text rendering, lucide icons, semantic tokens and shared message helpers; no new dependency or extension permissions.

## Bounded follow-up — clickable message URLs

October 13 user requests URLs as links in chat. Add safe HTTP/HTTPS/www navigation in plain message parts, preserving mentions, badges and original text. No preview fetches or access changes. Existing staged work and concurrent Chat controls are preserved. Scoped verification passed.

URL follow-up evidence, October 13, baseline `6aa57df` plus working-tree/staged changes. Node 24.14.1, PHP 8.5.1/SQLite disposable fixtures and Chrome. No shared database or backend mutation introduced by this feature.

- `node --test scripts/check-docs.test.mjs scripts/collaboration-ui.test.mjs`: 33 passed, including HTTP/HTTPS/www normalization, punctuation/parentheses, unsafe schemes/credentials and coexistence with mentions/badges.
- `npm run types:check`, `npm run build` and scoped `vp lint`: web/extension passed. Browser scenario formatting passed.
- `SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/015-message-references/links node tests/Browser/message-links.cjs`: Chrome 1440px/390px passed. Verifies three link types, safe new-tab attributes and navigation to a mocked HTTPS destination, preserved badges, inert HTML, exact source text in editor and no overflow/page errors. [Mobile](../artifacts/015-message-references/links/links-390.png) visually inspected; [desktop](../artifacts/015-message-references/links/links-1440.png) retained.
- `node scripts/check-docs.mjs` and `git diff --check`: passed.

Native side-panel acceptance remains pending. Full backend suite not rerun for display-only URLs. Concurrent work-Chat controls migration was applied only to the existing disposable browser SQLite file so its runtime could load; no shared migration or release.
