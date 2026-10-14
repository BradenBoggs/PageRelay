# Admin work Chats, unread counts, and incoming sounds

Lifecycle: verification-pending
Approval: Braden's October 13, 2026 requests authorize admin-only creation/editing of work Chats, unseen-message counts, and sounds for incoming messages from other users.
Verification: scoped PHP/SQLite, web desktop/mobile, TypeScript, builds and static checks passed; native panel/PostgreSQL race checks pending
Release: not released; deployment outside scope

## Purpose / Big Picture

Restrict work-Chat creation and name editing to active Organization owners/admins. Preserve member messaging and DMs. Show unread messages and play an incoming sound in open clients. Owners retain the existing admin hierarchy. See [work Chats](../../features/page-conversations.md), [read state](../../features/inbox-and-unread.md), and [notifications](../../features/mentions-and-notifications.md).

## Progress

- [x] Inspect branch, owners, current policies and read/delivery boundaries.
- [x] Implement role enforcement and name editing in shared web/panel UI.
- [x] Implement unread counts and authorized incoming-message detection/sound.
- [x] Verify focused permissions, counts, retries, web flows and static checks.
- [x] Record evidence and outstanding runtime/native-panel checks.

## Surprises & Discoveries

Creation allowed any active member; no work-Chat rename endpoint existed. Shared messaging lists showed attention-item counts rather than unread messages. Root read positions existed; thread reading previously cleared attention only. The working tree contains earlier unrelated changes which must be preserved.

## Decision Log

October 13 sidebar-count follow-up: Braden requests count badges on unseen messages in the main sidebar. Show separate authorized unseen-message totals on Messages (DMs) and Work chats, across all accessible conversations rather than only the current list page. Reuse exact visible-message reads and current recovery/realtime refresh; no attention-event substitution, read-on-listing or new poll. Preserve the existing work-only per-chat count map, add aggregate direct/work totals, and validate privacy and read updates.

October 13: interpret chat editing as changing its name, preserving own-message editing. Organization owners inherit admin rights. Keep websocket payloads signal-only; sound decisions require fresh authorized HTTP reads. Do not replay initial history or edits/deletions as new sounds.

## Outcomes & Retrospective

Implemented admin creation/name editing, exact unseen-message counts and authorized incoming audio synthesis. Scoped checks passed; native panel/PostgreSQL race coverage remains pending, so this plan stays active. No deployment authorized.

## Context and Orientation

Local main at `6aa57dfb5d29f2f04289664dceb450a2e8c8740a`, with pre-existing staged/unstaged changes. Existing CreateWorkChat/CreatePageChat, ConversationPolicy, CollaborationController/provider, work-chat discovery and panel entry points own the change.

## Plan of Work

Enforce role at request and transactional mutation boundaries. Add shared rename endpoint/dialog. Preserve existing chat read positions during migration and retain exact seen message IDs to avoid clearing unseen threads. Add authorized updates endpoint with cursor-based new-message detection, share counts/sound through the provider and update existing list surfaces. Update feature owners and quality map.

## Concrete Steps

Run focused PHP conversation/activity tests, Pint/Larastan, TypeScript, web/extension builds, foundation/doc checks and authenticated disposable SQLite browser checks. Try Sail for PHP 8.4/PostgreSQL acceptance; record unavailable environments accurately.

## Validation and Acceptance

Members cannot create/rename by HTTP or direct domain calls; owners/admins can. Cross-tenant, revoked, retired and DM rename attempts fail. Retrying creation preserves identity. Members can still send messages. Counts exclude own/deleted messages, follow read positions, and preserve unseen replies. Incoming sounds ignore initial history, own sends and message edits/deletions. Verify web desktop/narrow dialogs and recovery. Native Chrome panel and PostgreSQL concurrency remain required before closing if unavailable.

## Idempotence and Recovery

Creation retains existing keys/normalization; rename repeats safely without changing history/links. The read migration is additive and uses disposable test data. No shared database resets, deployment or destructive operation authorized.

## Artifacts and Notes

October 13, 2026, base main `6aa57dfb5d29f2f04289664dceb450a2e8c8740a` plus this patch and preserved pre-existing work. Host PHP 8.5.1, Node 24.14.1; SQLite memory tests; disposable browser database/storage under `/private/tmp/sidewire-controls-browser/`. No shared database migrations, deployment or merge performed.

- `php artisan test tests/Feature/Conversations tests/Feature/Activity`: 65 passed, 735 assertions, one PostgreSQL-only skip before the added migration-upgrade test. `php artisan test tests/Feature/Conversations/WorkChatControlsTest.php` after that addition: six passed, 92 assertions. Coverage includes active owner/admin/member and demoted/removed actors, web/panel requests, direct domain calls, creation retry after demotion, tenant/DM/retired isolation, exact root/reply acknowledgements, own/deleted exclusion, incoming cursor deduplication and preservation of prior reads during migration.
- `php artisan test`: 188 passed, one pre-existing registration expectation failure (`RegistrationTest::test_public_registration_remains_closed`, expected GET 404, actual 200), one PostgreSQL skip; 1,360 assertions. No registration code changed. Existing SW-DEBT-002 tracks it.
- Scoped `vendor/bin/pint`: passed. `php -d memory_limit=1G vendor/bin/phpstan analyse --no-progress --debug`: passed, zero errors. Ordinary parallel PHPStan could not bind a sandbox loopback socket; debug mode resolved it.
- `npm run types:check` and `npm run build`: web and extension passed. Focused `vp fmt`/`vp lint` passed for affected files; inherited compact board/panel formatting retained. `npm run check` remains blocked by 21 formatting findings across both existing compact files and unrelated prior work; no whole-tree formatting performed.
- `node --test scripts/check-docs.test.mjs scripts/collaboration-ui.test.mjs`: 33 passed. `node scripts/check-docs.mjs`, `npm run foundation:check` and `git diff --check`: passed.
- `SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/016-work-chat-controls node tests/Browser/work-chat-controls.cjs`: Chrome passed against isolated fixtures. Covers creation, name-edit cancel, injected save failure/draft retention/retry at 1440/390px, immediate matching header titles, member controls hidden, incoming unread/read changes, initial/own/repeated-refresh silence, successful Web Audio oscillator scheduling and no page errors or overflow. This validates audio synthesis, not an audible physical speaker. Browser autoplay requires interaction. Screenshots: [desktop](../artifacts/016-work-chat-controls/work-chat-1440.png), [mobile](../artifacts/016-work-chat-controls/work-chat-390.png); mobile inspected visually.
- Initial Docker inspection was sandbox-blocked; scoped escalation established Docker and running Sail PHP 8.4.23. `./vendor/bin/sail artisan test tests/Feature/Conversations tests/Feature/Activity`: 66 passed, 738 assertions, one PostgreSQL-only skip on PHP 8.4.23 with disposable SQLite.

Outstanding: native Chrome side-panel interaction, live Reverb transport and PostgreSQL concurrency. Do not infer these from browser/SQLite checks. The additive `message_reads` migration must be applied when installing the change; previous exact historical reads without persisted evidence cannot be reconstructed. Each open client can play its own cue; cross-client sound claims and configurable preferences are outside scope.

## Interfaces and Dependencies

Reuse Laravel active membership, policies, shared CollaborationClient/provider/dialog and Web Audio. No dependency or extension permission changes.

## Bounded follow-up: opening chats at the bottom

Braden requested this correction on October 13 while finishing the work. The existing first-load scroll used an animation frame after scheduling React state, which could run before messages committed. Apply pending scroll intent in `useLayoutEffect` after rendering, preserving explicit deep-link targets, reader position and hidden-pane intent. Only shared `conversation.tsx` and its messaging owner/browser evidence are changed. `node tests/Browser/chat-opening-scroll.cjs` passed at 1440px/390px with a 90-message synthetic chat: ordinary Messages/Work chats opens reached the bottom, background refresh preserved a scrolled-up reader, and explicit message links remained targeted. The first test incorrectly expected the explicit Refresh/jump-to-latest control to preserve position; corrected it to exercise a background focus/recovery signal and reran successfully. Web/extension TypeScript, both builds, focused lint and documentation/diff checks passed after the change.

## Bounded follow-up: main-sidebar unseen-message badges

Braden's October 13 request authorizes separate count badges on the main navigation's Messages and Work chats destinations. Starting at `6ffde7fd1ca576860264d418b1bd481048f01f6c` with preserved image-preview work, the updates endpoint supplied only per-work-Chat counts. It now returns `unread_totals.direct` and `unread_totals.work` from the same authorized exact-message query across every accessible non-retired conversation. The existing work-only `unread_counts` contract remains intact. The provider carries totals through its existing realtime/recovery cadence and clears them on auth loss. Navigation badges hide at zero/unknown, cap visual counts at 99+, and expose the exact value in accessible names/tooltips. Desktop rail and mobile drawer share the same state. No migration, new poll, read-on-listing, notification scope or dependency change.

Current verification revision: `492113e` plus the small accessible-role/browser-evidence working-tree follow-up. A concurrent workspace commit captured the earlier implementation during verification; this task did not run a commit, push, merge or deployment. Runtime checks below apply to that inspected implementation and follow-up, preserving the unrelated thumbnail changes.

October 13, 2026 environment: Node 24.14.1, host PHP 8.5.1, existing Sail PHP 8.4, installed headless Chrome and isolated SQLite test fixtures. Browser database/storage/seed/reset scripts are confined to `/private/tmp/sidewire-sidebar-count-browser/` and guarded by its exact testing database path. Test resets affect only generated fixture reads and generated incoming messages, never shared data.

- `php artisan test --compact --filter=WorkChatControlsTest` and `./vendor/bin/sail artisan test --compact --filter=WorkChatControlsTest`: 7 passed, 104 assertions each. New coverage includes totals across 31 work Chats, unseen DM roots/replies, own/deleted/retired exclusion, foreign tenant/private-pair isolation, counts independent of attention events, exact root reads preserving hidden replies, shared web/extension totals, revoked DM access and removed membership.
- `php -d memory_limit=1G vendor/bin/phpstan analyse --no-progress --debug`: zero errors. Scoped Pint, focused `vp check` format/lint, `npm run types:check`, and web/extension builds passed. Final web assets include the explicit accessible badge role; no whole-tree formatting or full-suite rerun was performed.
- `SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/016-sidebar-unseen-counts node tests/Browser/sidebar-unseen-counts.cjs`: passed at 1440px/390px on actual workspace assets with two disposable reader identities. Verifies exact DM/work counts and 99+ presentation, accessible full counts, unchanged counts on directory previews, visible-message acknowledgement, hidden DM/work replies, zero-badge removal, incoming messages updating both destinations, responsive layout and clearing on access loss; no page errors. The test was corrected to allow legitimate additional visible main-pane reads on desktop and to query the visible mobile drawer rather than its hidden desktop rail.
- `node --test scripts/check-docs.test.mjs scripts/collaboration-ui.test.mjs`: 33 passed. Documentation structure, foundation boundaries and `git diff --check`: passed.

Visually inspected [desktop rail](../artifacts/016-sidebar-unseen-counts/sidebar-counts-1440.png) and [mobile drawer](../artifacts/016-sidebar-unseen-counts/sidebar-counts-390.png). Live Reverb transport, native extension interaction and PostgreSQL concurrency remain separately pending; this scoped pass does not close plan 016 or claim a release.
