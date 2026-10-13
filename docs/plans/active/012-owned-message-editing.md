# 012 — Owned message editing and mobile actions

Lifecycle: verification-pending
Approval: October 13, 2026 user request authorizes editing owned messages and mobile dropdown actions.
Verification: focused SQLite tests, PHP static analysis, web/extension types/builds and Chrome 1440px/390px acceptance passed. Full suite has an unrelated registration failure; PHP 8.4, PostgreSQL races, native side panel and live Reverb remain pending.
Release: not released; deployment outside scope.

## Purpose / Big Picture

Authors can edit retained messages in accessible chats. Narrow screens offer actions in a dropdown. Owner: [Messaging](../../features/messaging-and-composer.md). No moderator editing, rich text, new mention delivery or audience changes.

## Progress

- [x] Inspect current permissions and shared message UI.
- [x] Implement scoped editing, conflict protection and responsive actions.
- [x] Verify focused behavior and record actual evidence.
- [ ] Resolve broader runtime/registration verification gaps.

## Surprises & Discoveries

Shared collaboration routes and React components serve both web and extension. Loaded older history currently refreshes deletions only; edits must also converge.

## Decision Log

October 13: retain identity, send fingerprint, source, author, chronology and mentions. Editing changes plain text only and does not replay attention. A numeric edit version prevents stale overwrites; duplicate retries of an already applied identical edit succeed.

## Outcomes & Retrospective

Owned message editing and mobile dropdown actions are implemented and verified in the scoped environments below. Wider runtime/concurrency checks remain pending; no release authorized.

## Context and Orientation

Main baseline d1b86a3 with preserved Resend dependency/setup changes. ConversationAccess owns visibility; DeleteMessage and shared MessageRow establish existing mutation patterns.

## Plan of Work

Add edit metadata, author-only transaction and PATCH route, resource fields and loaded-history edit refresh. Reuse existing dialog and Radix dropdown for shared message UI. Add permission/conflict/retry regression coverage.

## Concrete Steps

Run isolated SQLite tests, PHP formatting/static analysis, web/extension types/builds, documentation checks and browser acceptance if available.

## Validation and Acceptance

Own root/reply editing succeeds; other authors, outsiders, removed members, mismatched chats and DM nonparticipants denied. Deleted messages cannot be restored. Stale saves conflict; safe retries preserve identity. Narrow actions, cancel, save, errors and focus require browser checks.

## Idempotence and Recovery

Nullable edited timestamp and zero-default version preserve historical rows. Edits retain original idempotency fingerprint. Test only disposable data; do not apply migrations to shared databases.

## Artifacts and Notes

October 13, 2026, main revision `d1b86a3` plus this patch and preserved Resend changes. Host PHP 8.5.1; SQLite memory for tests, disposable `/private/tmp/sidewire-edit-browser/data.sqlite` for browser fixtures. No shared database migration, real email, customer data, deployment or merge.

- `APP_KEY=<disposable key> vendor/bin/phpunit tests/Feature/Conversations/MessageEditingTest.php tests/Feature/Conversations/MessageDeletionTest.php`: 8 passed, 85 assertions. Own roots/replies, authorization, mismatched chats, DM access, removed membership, tombstones, conflicts, identical retries, preserved attention/fingerprint and extension PATCH covered.
- `APP_KEY=<disposable key> vendor/bin/phpunit`: 176 passed, 1 failed, 1 PostgreSQL-only skip (1170 assertions). Existing `RegistrationTest::test_public_registration_remains_closed` expects GET `/register` 404 but receives 200. Registration code is unchanged; tracked separately in SW-DEBT-002.
- Scoped `vendor/bin/pint` on changed PHP files: passed. `php -d memory_limit=1G vendor/bin/phpstan analyse --no-progress --debug`: passed, zero errors.
- `npm run types:check` and `npm run build`: web and extension passed. First types run found a web-only alias in the dropdown import; replaced with the existing Radix primitive directly so both surfaces compile.
- Scoped `npx vp fmt` and `npx vp lint` on shared client/conversation and browser scenarios: passed. CSS keeps existing compact style to avoid unrelated formatting churn.
- `node --test scripts/check-docs.test.mjs scripts/collaboration-ui.test.mjs`: 27 passed. `node scripts/check-docs.mjs` and `git diff --check`: passed.
- `SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/012-message-editing node tests/Browser/message-editing.cjs`: Chrome passed at 1440px/390px against isolated fixtures. Covers edit cancel, injected 500/save retry retaining input, keyboard save, edited marker, keyboard mobile dropdown/Escape focus, hidden mobile inline toolbar, deletion through mobile menu and absence of page errors/overflow. Initial sandbox prevented loopback server/Chrome; scoped escalation allowed isolated checks. Initial focus assertion ran before Radix restored focus; changed it to await the actual focus condition and reran successfully.
- Retained screenshots: [desktop](../artifacts/012-message-editing/editing-1440.png), [mobile](../artifacts/012-message-editing/editing-390.png). Mobile screenshot visually inspected.

Native extension interaction, live Reverb propagation, PostgreSQL concurrency and PHP 8.4 acceptance were not exercised. Existing deletion browser scenario was adapted for the new mobile dropdown but not rerun against its separate fixtures. No earlier plan is closed by these checks.

## Interfaces and Dependencies

Reuse Laravel transactions, MessageCreated refresh signal, CollaborationClient, shared dialog and installed Radix dropdown. No new dependency or extension permissions.
