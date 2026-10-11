# 010 — Message deletion and organization access removal

Lifecycle: verification-pending
Approval: October 9, 2026 user request authorizes own-message deletion, administrator moderation of work chats, and organization access removal preserving history.
Verification: October 9 PHP 8.4/SQLite tests, PHP static analysis, shared web/extension types/builds, scoped lint/format and authenticated Chrome 1440px/390px acceptance passed. PostgreSQL concurrency and native extension side-panel acceptance remain pending.
Release: not released; deployment is outside scope.

## Purpose / Big Picture

Members can delete their own messages; owners/admins can delete any message in shared work chats. Organization access removal preserves authored history. Owners: [Messaging](../../features/messaging-and-composer.md) and [Accounts](../../features/accounts-and-organizations.md). No DM audience expansion, account deletion, bulk purge, editing or retention automation.

## Progress

- [x] Inspect existing chat access, shared clients, membership removal and current working tree.
- [x] Implement deletion and explain access removal in the UI.
- [x] Verify permissions, preserved threads/history, retries and web client behavior.
- [ ] Verify native extension side-panel focus/deletion and PostgreSQL concurrent delete/retry/removal behavior.
- [x] Record evidence and update feature maps.

## Surprises & Discoveries

Membership removal already marks membership removed/nonbillable and retains users/messages. Main has unrelated invitation/navigation edits; preserve them. Dependencies are absent locally; Docker socket access is restricted.

## Decision Log

- October 9: retain message identity, author, chronology, provenance and thread relationships; replace deleted text with a tombstone and detach mentions/attention. Retain send fingerprint/key so retries cannot restore deleted text.
- Admin moderation applies to shared work chats. DMs retain participant-only access and own-message deletion.
- October 9 visual follow-up: the user requested a blank outline with only muted “Message deleted,” without names or identifiers. Hide all visible author/avatar/time/source/actions on deleted rows while retaining stored identity and thread relationships. Existing replies remain reachable through the placeholder itself; undeleted neighboring rows retain their own attribution.

## Outcomes & Retrospective

Own-message deletion, shared work-Chat admin moderation and history-preserving access removal are implemented and verified within the environments below. Deletion preserves replies, attribution and retry identity. The removal confirmation uses Inertia onBefore: browser testing caught that cancelling an onSubmit handler did not cancel its request. No release authorized; keep this plan active for native extension and PostgreSQL concurrency acceptance.

## Context and Orientation

Branch main, baseline e4b721865f09e403fe836520b6851d67885bbbc8 plus existing working-tree edits. ConversationAccess controls shared/DM visibility. CollaborationController and MessageResource serve shared web/extension React components. OrganizationMemberController already removes access without deleting history.

## Plan of Work

Add a deletion timestamp and authorized scoped endpoint, scrub content transactionally, preserve thread anchors, refetch through existing signal events, add shared confirmation/error UI. Add focused regression coverage and clarify member removal.

## Concrete Steps

Use supported runtime for focused tests, types, lint/build and browser checks when available. Run Node documentation checks and git diff --check. Record actual outcomes below.

## Validation and Acceptance

Own messages allowed; other members' messages denied; work-chat admins allowed; outsiders, removed members and DM nonparticipants denied. Root deletion preserves replies and retries return tombstones. Removal blocks web/API reads while remaining members retain attribution/history. Required desktop/narrow UI checks cover confirmation, failure and focus.

## Idempotence and Recovery

Deletion is repeatable and retains send identity. Migration adds a nullable timestamp; rolling back schema does not restore erased text. Use disposable test databases only.

## Artifacts and Notes

October 9, 2026, baseline `e4b721865f09e403fe836520b6851d67885bbbc8` plus this uncommitted working-tree patch. Unrelated invitation/navigation edits were already present and continued changing during this task; they were preserved.

- Locked dependency installation: initial host DNS/partial-download failures; completed using an isolated `sail-8.4/app` container. No shared database used. Node 24.14.1; host PHP 8.5.1 for build tooling/static analysis; backend acceptance PHP 8.4.
- `docker run --rm --entrypoint php -v /private/tmp/sidewire-deletion-review/test-environment:/var/www/html/.env:ro -v /Users/bradenboggs/Documents/GitHub/PageRelay:/var/www/html -w /var/www/html sail-8.4/app artisan test --filter='MessageDeletionTest|PilotCollaborationTest|OrganizationFoundationTest|PageChatMessageTest'`: 33 passed, 198 assertions. The test-only configuration sets APP_ENV=testing, a disposable APP_KEY, SQLite :memory:, array cache/session/mail, sync queue and null broadcast. Earlier missing-key/missing-file and incorrect disposable DB configuration runs failed or warned; the corrected run was clean.
- Same isolated container/configuration with `artisan test`: 161 passed, 1016 assertions; one existing PostgreSQL-only concurrency test skipped. This does not verify PostgreSQL races.
- `composer validate --strict`: passed. `php -d memory_limit=1G vendor/bin/phpstan analyse --no-progress --debug`: passed, zero errors. Earlier parallel host analysis could not bind a socket; debug mode avoids that restriction and increased memory resolves the default 128MB limit.
- `vendor/bin/pint --test` on DeleteMessage, CollaborationController, MessageResource, Message, the deletion migration and MessageDeletionTest: passed.
- `npm run types:check`, `npm run build`: passed for web and extension; repeated after final focus fix.
- `npx vp lint` on changed shared client/conversation/organization UI and browser scenario: passed. Scoped `vp fmt` passed. Full `npm run check` reports pre-existing formatting issues in 16 other files; no blanket formatter changes were made.
- `bash scripts/check-foundation-boundaries.sh`: passed. `node --test scripts/check-docs.test.mjs scripts/collaboration-ui.test.mjs`: 27 passed. `node scripts/check-docs.mjs` and `git diff --check`: passed.
- `SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/010-message-deletion node tests/Browser/message-deletion.cjs`: passed against a loopback PHP 8.4 server with a separate temporary SQLite file and only synthetic fixtures. Chrome at 1440px/390px exercised own-message deletion, cancel, injected 500 failure/retry, focus restoration, tombstone display, responsive overflow, admin action visibility, removal cancel/confirm, retained author/body and removed-member 403; no page JavaScript errors. Screenshots: [desktop](../artifacts/010-message-deletion/deletion-1440.png), [narrow](../artifacts/010-message-deletion/deletion-390.png).

Native Chrome side-panel interaction, live Reverb propagation and PostgreSQL simultaneous races were not exercised in this task. Existing signal-only delivery and shared extension API are reused; API deletion, types and built extension are covered separately. No production data, migration, merge or deployment.

## Interfaces and Dependencies

Reuse Laravel transactions, existing signal-only MessageCreated event, Radix dialog and CollaborationClient. No package or extension permission changes.

## Bounded follow-up — muted deleted-message outline

October 9, 2026, same baseline `e4b721865f09e403fe836520b6851d67885bbbc8` plus preserved working-tree changes. Source fingerprint SHA-256 `281a5ae51626589b9ff5ffa9109400f4d01c32bd93a0194ef348904912ad77d4` covers sorted paths plus NUL plus bytes for `conversation.tsx`, `workspace.css` and `tests/Browser/message-deletion.cjs`. Verified runtime copies matched these exact sources. Shared rendering now returns an outlined, muted placeholder before author/body/actions rendering and breaks grouping around deleted rows. No backend or schema change in this follow-up.

- `npm run build` in the actual workspace: passed for web (2322 modules) and extension (1644 modules), using a temporary `APP_CONFIG_CACHE`, testing environment, ephemeral key, SQLite `:memory:` and array cache/session to avoid the unrelated cached local configuration. Actual local compiled assets were rebuilt; no real `.env` or cached configuration changed.
- `npm run types:check`: web and extension passed. Locked `vp fmt --check` and `vp lint` on the conversation component/browser scenario passed. `node --test scripts/collaboration-ui.test.mjs`: 9 passed.
- Isolated `vendor/bin/phpunit tests/Feature/Conversations/MessageDeletionTest.php`: 5 passed, 44 assertions with PHP 8.5.1/SQLite memory and an ephemeral key. This focused regression does not replace the earlier PHP 8.4 acceptance or verify PostgreSQL.
- `SIDEWIRE_BROWSER_URL=http://127.0.0.1:8034 SIDEWIRE_DELETION_IDENTITY=/private/tmp/sidewire-deleted-outline-identity.json SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/010-message-deletion/muted-placeholder node tests/Browser/message-deletion.cjs`: passed using locked Playwright 1.56.1 and installed Chrome, a loopback PHP server and a newly migrated disposable SQLite file with synthetic users. At 1440px/390px, verifies exact placeholder text, absent metadata/actions, solid outline, deletion cancel/failure/retry/focus, responsive overflow and preserved access-removal behavior. Screenshots inspected: [desktop](../artifacts/010-message-deletion/muted-placeholder/deletion-1440.png), [narrow](../artifacts/010-message-deletion/muted-placeholder/deletion-390.png).
- Supplemental temporary Playwright harness `/private/tmp/sidewire-bootstrap-browser/deleted-thread-check.cjs`, run with `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/sidewire-bootstrap-browser/browsers node /private/tmp/sidewire-bootstrap-browser/deleted-thread-check.cjs`: passed at 1440px/390px. It created a synthetic root/reply/neighbor using authenticated API requests, deleted the root, opened retained replies through the placeholder and checked that the undeleted neighbor still shows its author. Both stream and thread-root placeholders have only the label, muted color and an outline; no page errors. Screenshots: [desktop thread](../artifacts/010-message-deletion/muted-placeholder/thread-1440.png), [narrow thread](../artifacts/010-message-deletion/muted-placeholder/thread-390.png). Desktop thread and narrow deletion screenshots were visually inspected.

- `node scripts/check-docs.mjs`, `node --test scripts/check-docs.test.mjs` (18 passed), and `git diff --check`: passed after documentation updates.

Native extension interaction, live Reverb and PostgreSQL races remain unverified as above. No deployment or shared database writes.
