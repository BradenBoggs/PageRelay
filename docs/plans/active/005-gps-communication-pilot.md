# 005 — GPS communication pilot

Lifecycle: verification-pending
Approval: Braden requested implementation on October 8, 2026: a usable GPS pilot prioritizing browser desktop notifications, mentions, direct messages and threads. This authorizes the bounded communication slice, not every draft feature, production deployment or invitations/messages to real employees. The subsequent request for a massive UI/UX overhaul and a more polished app authorizes refinement of these existing web/extension flows within this same initiative.
Verification: historical pilot evidence below remains tied to its named revisions. The October 8 UI follow-up is a review-branch implementation candidate based on 1e6ba769f4d5e6674e4103b61312746f0e9d9014. Pure presentation-helper tests, documentation checks, syntax review and a separate synthetic HTML-preview review are not a compiled-app test. Current application types/build/lint and authenticated/native extension acceptance remain pending; do not carry the old CI passes forward to this UI revision.
Release: not released. No production origin, server, team setup or public distribution was provisioned.

## Purpose / Big Picture

A coworker can use the web app or Chrome extension to send a private one-to-one message, mention an eligible coworker and reply in a one-level thread. Related messages remain discoverable in Activity and produce opt-in generic desktop alerts. Existing page-linked Chats retain their history and source/link safeguards.

The owners are [Direct messages](../../features/direct-messages.md), [Threads](../../features/threads.md), [Notifications](../../features/mentions-and-notifications.md) and [Browser extension](../../features/browser-extension.md). Group DMs, private-channel administration, uploads, reactions, AI, calls, email/SMS, notification schedules and production provisioning are excluded.

## Progress

- [x] Inspect membership policies, page-send transactions, handoff, UI and feature owners.
- [x] Implement shared authorization, one-to-one identity, thread/mention persistence and durable attention.
- [x] Implement shared web/extension UI, history navigation, source-bound drafts and opt-in background alerts.
- [x] Run automated backend and PostgreSQL pilot tests, static/types, builds and documentation checks; correct identified failures without weakening assertions.
- [x] Exercise two authenticated users and a built installed extension for DM/mention/live-thread/privacy behavior; inspect synthetic screenshots.
- [x] Prepare the approved UI refinement in a local patch: shared visual tokens, single messaging navigation, directory, responsive thread pane, composer/mention improvements and compact notification/extension controls.
- [x] Publish the prepared UI changes to the same pilot branch and PR 3 on the user's subsequent explicit "push them" request; no merge or deployment.
- [ ] Review the published UI candidate and run its locked formatter, type checks, builds and authenticated browser scenario.
- [ ] Confirm all aggregate checks on the final handoff revision.
- [ ] Test native Chrome/OS notifications, real side-panel lifecycle, permission denial, sleep/wake, linked-page draft transitions and removal/reconnect on GPS devices.
- [ ] Run dedicated simultaneous-start/send/claim concurrency acceptance before claiming those races verified; sequential/idempotency tests are not that evidence.

## Surprises & Discoveries

The earlier manifest/API defaults disagreed about the local server port. The build now derives one exact API permission from the same validated app origin. Reverb separately requires the actual extension ID in its origin-host allowlist; allowing the web hostname alone prevented live replies reaching the panel. The browser harness derives and explicitly allows the installed test extension ID rather than disabling origin protection.

The null broadcast driver returns without executing channel authorization callbacks. The DM privacy regression now uses the real signing driver, as the existing broadcast tests do, and asserts both nonparticipant denial and participant success. No application authorization rule was weakened.

The assistant environment lacked an executable local Sail/application setup. Dependency, database and browser checks ran in isolated hosted CI. Local tools inspected downloaded tracked source, logs and synthetic screenshots; this is not a local Sail run.

## Decision Log

- October 9 notification-panel refinement: the user authorizes the top-bar bell to open a dropdown containing retained notification history and a settings gear that opens the existing settings modal. Include read and unread events, with pagination and exact message/thread links. Opening or listing history must not mark messages read or change desktop delivery; reuse current membership, recipient and conversation access checks. Verify backend history isolation and interactive dropdown/modal behavior at desktop/mobile widths. No deployment or new notification source is authorized.

- Keep ConversationType::Page for organization-wide work Chats. Direct conversations require participant membership; do not introduce a private-channel model or rename migration.
- One reply level inherits its Chat audience. Root/reply authors receive subsequent thread attention; selected stable-ID mentions notify eligible recipients. Manual follow/unfollow remains outside this slice.
- Create one durable attention item per recipient/message, with mention precedence over DM/thread. Marking actual visible message IDs read does not clear unseen replies.
- Desktop alerts are opt-in and generic: no customer/coworker name, message body or source URL. A 45-second server claim coalesces competing clients. Lost acknowledgement may repeat an alert; exactly-once OS display is not promised.
- Open clients use signal-only Reverb events and newly authorized HTTP reads, with disclosed 30-second collaboration recovery checks. Opted-in extension alarms check only notification records about once a minute with the panel closed; no background browsing lookup occurs.
- Notifications is an optional Chrome permission requested by an explicit button. Alarms is used for notification delivery only. No DOM access, content script or broad host permission is added.
- Stack on documentation PR 2 at 89c27d8e01393c7f85268fbcf8fd43bab0526749. Do not merge it or import separate URL-selector PR 1. Initiative 004 remains reserved for that existing work; this plan is 005.

### October 8 UI follow-up decisions

During UI preparation, the connected GitHub tools exposed reads only. Edits were prepared from the tracked source artifact matching `1e6ba769f4d5e6674e4103b61312746f0e9d9014` in a local working tree and packaged with an independently runnable synthetic HTML preview. On the subsequent explicit "push them" request, the prepared changes were published to `work/gps-communication-pilot-20261008` and existing draft PR 3 using available GitHub writes. Runtime source matches that handoff; documentation status is updated for publication. Publishing does not extend historical CI evidence to this UI revision and does not merge or deploy it.

Split the former combined messaging component into a small barrel plus provider, directory, conversation, composer, notifications, primitives and display helpers. Reuse the already-locked Radix dialog and Lucide dependencies. Do not change backend audience rules, notification delivery, URLs/permissions, pricing, migrations or package locks. Preserve the existing legacy discovery routes rather than removing capabilities during a presentation pass.

Use one light visual system; a compact messaging rail; thread split only when there is usable width; distinct draft ownership and read observers; privacy-preserving message previews; resolved mention highlighting; keyboard suggestions; and notification settings in a dialog. No decorative controls for unavailable calls, attachments, reactions or AI.

## Outcomes & Retrospective

The implemented pilot flow works in the named automated test environments. Actual GPS desktops, native OS toasts, real side-panel-container operation and deployment are not certified. Keep this plan active until remaining acceptance is resolved or explicitly rescoped; do not equate browser-test success with release.

The temporary branch-scoped authoring/formatting workflows and literal repair patch were removed. The retained pilot verification workflow is read-only and does not commit, merge, provision or deploy.

## Context and Orientation

Baseline main is f7c7212ae12f1453daea5df7b26d11f0e503b02b. SendPageMessage remains the page/source/version transaction owner; the new sender composes it inside one transaction. ConversationAccess is the shared audience boundary. Web requests use sessions/CSRF; extension requests use existing scoped expiring Sanctum tokens.

## Plan of Work

The additive migration introduces direct-pair/participants, thread parents, mentions, attention and opt-in preferences. Shared route/controller contracts serve both clients. Common React components render work Chats, DMs, Activity, replies, mention selection and controls. The Chrome worker performs notification-only checks and the build derives one API host permission. No live GPS records or provider credentials were used.

## Concrete Steps

Use the supported [workflow](../../engineering/WORKFLOW.md). The read-only pilot workflow installs locked dependencies, builds assets before tests, runs the full backend suite plus a PostgreSQL pilot pass, static/types/format/boundary/documentation checks and the isolated authenticated browser script. Test identities/tokens stay outside uploaded artifacts. Use [GPS setup](../../engineering/GPS-PILOT.md) for remaining deployment and device checks.

## Validation and Acceptance

Observed at source a6a80ae85ec581ff174ed02d70bbabbe4628c61d in [pilot run 37737994225](https://github.com/BradenBoggs/PageRelay/actions/runs/37737994225): full SQLite backend suite passed 123 tests with 747 assertions and one skipped test; the 18 pilot tests passed on PostgreSQL with 124 assertions and no skips. PHP static checks, web/extension TypeScript, builds, frontend lint/format, foundation boundaries and documentation checks passed. PHP formatting reported one fully-qualified-type style issue in the pilot test, corrected by the following import-only test change. This run itself is not represented as all-green.

The same run's real authenticated browser test passed: installed extension to web DM, selected mention, one generic notification API call for overlapping reasons, live web-to-extension reply, root/reply separation and nonparticipant-admin HTTP denial. Screenshots of web and 390-pixel extension views were inspected. The owner Notification API was instrumented instead of displaying an OS toast; the extension's real page was opened as a browser tab, not in the native side-panel container.

Remaining requirements include actual device permission/OS behavior, closed-panel background delivery, sleep/wake, revoked-session cleanup and linked-page draft transitions in the native panel. Dedicated concurrent database races were not executed. The tests cover sequential pair reuse, safe retries, recipient/privacy checks, claim exclusion/expiry and history beyond 100 messages; do not describe these as exhaustive concurrency or device verification.

### Local UI candidate checks and limits

The follow-up handoff records nine passing pure TypeScript presentation-helper tests and nine passing synthetic-preview checks (three interaction scenarios plus six viewport checks from 320px to 1440px). The preview uses the candidate CSS but a separate in-memory JavaScript demonstration, not the compiled React components. Its desktop, narrow extension-style and mobile screenshots were inspected. The sample notification test simulates a UI message and requests no OS permission.

Documentation structure/tests, source syntax and patch applicability are recorded in the handoff evidence. Local Node is 22.16, below the repository application's declared runtime range; the globally available TypeScript is used only for helper/syntax checks. Locked npm dependencies and the supported Laravel runtime are unavailable here. Therefore full type resolution, locked formatting/lint, app/extension builds, Radix behavior in the compiled clients, authenticated flows, source transitions, native panel behavior and OS notifications remain unverified for this patch.

The browser test source now waits for the loaded extension page before using storage, instead of the previous service-worker startup assumption. It also targets the new accessible UI and asserts independent drafts. These are candidate test corrections, not evidence that the prior fixture issue or the new full app test has passed. Existing hosted CI stays read-only; the new pure-helper check is added without authoring/deployment permissions.

### October 9 bounded sidebar correction

User requested that Activity retain the larger sidebar icons. On local `main` at `07fa6668364d8205c3b8b78d04522acd2dbfd2ee` plus this working-tree patch, the shell stylesheet now applies the existing 82px rail (76px at tablet widths) across authenticated routes. Mobile retains Sheet navigation; discovery pages retain their linked-work shortcuts with bounded labels. No routes or permission behavior changed.

Checks on macOS with Node 24.14.1: `node scripts/check-docs.mjs` passed; `node --test scripts/check-docs.test.mjs` passed all 18 tests; `git diff --check` passed. Reviewed the CSS diff and responsive selector precedence. Compiled-app, authenticated Activity navigation, keyboard and wide/narrow browser verification remain pending: local locked npm/vendor dependencies are absent, and `docker ps` could not access the Docker socket under the sandbox. This correction is not deployed or certified by the earlier pilot evidence.

### October 9 mention-notification audit

User reported missing mention notifications across all surfaces and requested an audit of workflows and notifications. Inspected local `main` at `e4b721865f09e403fe836520b6851d67885bbbc8` plus the existing working-tree changes; no production account, deployment, or application behavior was changed during this audit.

Confirmed a split send workflow: `resources/js/components/chats/chat-composer.tsx` posts only body/idempotency data to `ChatController::store`, which calls `SendPageMessage` without mention recipient persistence or `RecordMessageAttention`. Even submitting explicit mention IDs to that legacy endpoint produces no mention or attention rows. The collaboration composer at `/messages` selects stable recipient IDs and submits to `SendCollaborationMessage`, which synchronously persists both within its transaction. Plain @text and self-mentions intentionally do not notify; do not fix this gap by guessing recipients from names.

The legacy `/activity` route is work-chat discovery, whereas mention/DM/thread attention is `/messages?view=activity`. The current working-tree navigation distinguishes them. This routing difference and the legacy composer can explain missing attention, but the live incident's sending route and persisted records have not been inspected.

Desktop consent is per user/organization and is absent for newly created users, including accounts created through direct operator scripts. Browser/extension permission alone does not set that preference. Read attention is excluded from desktop claims; focused visible messages are acknowledged every 800ms. Reverb depends on a queue worker and configured server/browser connection; HTTP recovery still runs approximately every 30 seconds without realtime. Durable attention creation itself does not depend on a worker. The provider catches delivery/fetch errors with a generic connection status, and the extension worker silently retries; neither identifies the failing stage to the user.

Verification used a disposable copy at `/private/tmp/sidewire-mention-audit`, copied current source and existing locked dependencies from `/private/tmp/sidewire-bootstrap-check`, and no project `.env`. macOS PHP 8.5.1/SQLite in-memory, array cache/session, sync queue, null broadcast, explicit testing environment/key: `php artisan test --filter=PilotCollaborationTest` passed 18 tests/124 assertions. `node --test scripts/collaboration-ui.test.mjs` passed 9 helper tests. A temporary test `test_audit_legacy_send_ignores_mention_ids` reproduced the gap with six assertions: message exists, mention/attention tables remain empty, and recipient unread count is zero. Its source is retained in that disposable copy, not added as a regression that endorses the gap. These tests do not establish PHP 8.4/PostgreSQL, live Forge configuration, authenticated browser/OS delivery, or hosted workflow success.

### October 9 bounded mention-search refinement

The user requested case-insensitive matching anywhere in a name and complete names in chat tagging. Baseline `e4b721865f09e403fe836520b6851d67885bbbc8` on main plus preserved working-tree edits. `CollaborationController::members` now uses Laravel's case-insensitive `whereLike` with surrounding wildcards (PostgreSQL `ILIKE`). The existing shared composer already displays and inserts the entire stored `User.name`; this follow-up verifies that behavior rather than inventing missing surnames. Stable selected IDs, active organization membership and DM participant restrictions remain authoritative. No frontend, schema, dependency or extension permission changes.

Source fingerprint SHA-256 `235ec29315c9c73dfca11fe047993a59bb1a83b54a9e9878a793a12673e5707b` covers sorted paths plus NUL plus bytes for `CollaborationController.php`, `PilotCollaborationTest.php` and `tests/Browser/mention-search.cjs`. Backend runtime copies matched the exact changed sources.

- Reproduced before fixing: two new partial/mixed-case search regressions failed on PHP 8.4.23/PostgreSQL 18 because the old `LIKE` returned no matches. After the change, `vendor/bin/phpunit tests/Feature/Conversations/PilotCollaborationTest.php` passed 20 tests/151 assertions on PHP 8.4.23/PostgreSQL 18 and separately on host PHP 8.5.1/SQLite memory. Fixtures cover mixed-case first/surname/infix/spanning-name queries, complete response names, absent results, removed/outside members and private DM audience.
- PostgreSQL execution: `docker run --rm --link sidewire-mention-search-db:mention-db -v /private/tmp/sidewire-registration-flag-check:/var/www/html -w /var/www/html -e APP_ENV=testing -e APP_CONFIG_CACHE=/tmp/mention-config.php -e APP_KEY=<ephemeral-test-key> -e DB_CONNECTION=pgsql -e DB_HOST=mention-db -e DB_PORT=5432 -e DB_DATABASE=sidewire_mentions -e DB_USERNAME=postgres -e DB_PASSWORD=<disposable-test-password> -e DB_URL= -e CACHE_STORE=array -e SESSION_DRIVER=array -e QUEUE_CONNECTION=sync -e BROADCAST_CONNECTION=null -e MAIL_MAILER=array --entrypoint php sail-8.4/app vendor/bin/phpunit tests/Feature/Conversations/PilotCollaborationTest.php`. The dedicated database container had no persistent volume and no shared application data. SQLite used the same disposable source copy, no project `.env`, the ephemeral key and existing memory-only PHPUnit configuration.
- `php -d memory_limit=1G vendor/bin/phpstan analyse app/Http/Controllers/CollaborationController.php --no-progress --debug`: passed, zero errors. `vendor/bin/pint --test` on the controller and pilot tests: passed. Locked `vp fmt --check`/`vp lint` on the browser scenario passed. `node --test scripts/collaboration-ui.test.mjs`: 9 passed. `bash scripts/check-foundation-boundaries.sh`: passed.
- `SIDEWIRE_PLAYWRIGHT_PACKAGE=/private/tmp/sidewire-bootstrap-browser/package.json SIDEWIRE_BROWSER_URL=http://127.0.0.1:8035 SIDEWIRE_MENTION_IDENTITY=/private/tmp/sidewire-registration-flag-check/mention-identity.json SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/005-mention-search node tests/Browser/mention-search.cjs`: passed at 1440px/390px against the isolated PHP 8.4/PostgreSQL loopback app using Playwright 1.56.1 and installed Chrome. Verified mixed-case first/surname/infix/spanning-name matches, full-name options/chips/body/highlight, keyboard arrows/Escape/Enter, selected recipient ID in the send and response, empty results, injected search failure preserving draft, focus and no horizontal overflow/page errors. Screenshots visually inspected: [desktop picker](../artifacts/005-mention-search/picker-1440.png), [narrow picker](../artifacts/005-mention-search/picker-390.png). An initial sandbox Chrome launch failed; approved local execution resolved it. The first harness run typed before the composer's scheduled caret restoration; waiting for that existing animation frame corrected the harness, and both final viewport scenarios passed.

`node scripts/check-docs.mjs`, `node --test scripts/check-docs.test.mjs` (18 passed) and `git diff --check` passed after documentation updates. Current compiled web assets from the preceding workspace build were reused because this correction changes only backend search and tests. Native side-panel/OS notification behavior, realtime delivery and production deployment remain unverified. This scoped pass does not close the pilot's broader acceptance gaps. No real user or shared database was changed.

### October 9 bounded thread-root highlighting

The user requested that the original message be highlighted when its thread opens beside chat history on a large screen. Baseline `e4b721865f09e403fe836520b6851d67885bbbc8` plus preserved working-tree edits. The shared `ConversationView` passes its current thread to main history only in the existing split layout (message stage at least 760px). Matching rows gain `sw-thread-active` and `aria-current`; the semantic accent surface/outline survives hover/focus. Switching, closing and narrowing follow current view state rather than changing scroll targets or drafts. Deleted roots retain only their anonymous label, with neutral muted selection emphasis. Forced-color mode uses a system highlight outline. No backend, schema, permission or dependency changes.

Source fingerprint SHA-256 `df104dd99c1f8ee917af1af04c346f31c462bbc16c852c3ff07e740ac8d7a3c0` covers sorted paths plus NUL plus bytes for `conversation.tsx`, `workspace.css` and `tests/Browser/thread-highlight.cjs`. Shared source copies matched the disposable runtime; its web assets were copied from the actual workspace build.

- `npm run build`: actual workspace web (2322 modules) and extension (1644 modules) passed. Used the same temporary `APP_CONFIG_CACHE`, ephemeral testing key and SQLite memory/array-cache configuration as the preceding visual follow-up, without modifying real `.env` or cached configuration. `npm run types:check`: web and extension passed.
- Locked `vp fmt --check`/`vp lint` on `conversation.tsx` and `tests/Browser/thread-highlight.cjs`: passed. `node --test scripts/collaboration-ui.test.mjs`: 9 passed. No PHP suite was rerun for this UI-only correction.
- `SIDEWIRE_PLAYWRIGHT_PACKAGE=/private/tmp/sidewire-bootstrap-browser/package.json SIDEWIRE_BROWSER_URL=http://127.0.0.1:8036 SIDEWIRE_THREAD_IDENTITY=/private/tmp/sidewire-registration-flag-check/thread-highlight-identity.json SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/005-thread-highlight node tests/Browser/thread-highlight.cjs`: passed using Playwright 1.56.1/installed Chrome against a loopback PHP 8.5.1 app with a newly migrated disposable SQLite file and synthetic verified user/chat. At 1440px, verified one current original row, stable highlight on hover/focus, switching roots, close cleanup and preserved main draft. Resizing to 390px clears current-row state and retains focused replies without overflow; resizing back restores the current root. Deleted roots remain label-only/muted. No page errors. Inspected screenshots: [desktop highlight](../artifacts/005-thread-highlight/highlight-1440.png), [narrow thread](../artifacts/005-thread-highlight/thread-390.png). The first scenario run used the replies region to find a header close button; corrected its locator to the thread pane and reran successfully. Sandbox loopback binding required approved local execution.

`node scripts/check-docs.mjs`, `node --test scripts/check-docs.test.mjs` (18 passed) and `git diff --check` passed after documentation updates. Native extension side-panel interaction and forced-color visual acceptance were not exercised; shared builds/types cover compilation only. No production data, release or deployment. Broader pilot acceptance stays pending.

Workflow review: general CI runs pilot backend tests via the full suite and presentation helpers; dedicated pilot verification adds PostgreSQL and an authenticated browser harness. That harness replaces the web Notification API and cannot certify native toast delivery. The pilot workflow pushes only on its named pilot branch, though scoped pull requests also trigger it. The old shell verification workflow still mutates/commits/pushes on its historical branch, contradicting the earlier removal statement in this plan; see SW-DEBT-001 in the debt tracker. No workflows were executed or changed in this audit.

## Idempotence and Recovery


The migration is additive. Back up before deployment; rollback removes new collaboration/attention metadata and is not automatic production recovery. Prefer a forward fix. Retries preserve a request UUID, fingerprint and uncertain draft payload. Direct pairs have a database uniqueness constraint. Failed display/acknowledgement claims expire after 45 seconds for a later attempt.

## Artifacts and Notes

The named run's pilot-verification-evidence artifact contains result codes, logs, revision, tracked source and synthetic web/extension screenshots. It excludes .env files, runtime identity/token files, real customer data and dependencies. Artifacts have short retention; the run and this plan preserve the durable outcome summary. Final PR status must name its current revision and fresh check results.

## Interfaces and Dependencies

Reuse Laravel, Sanctum, Reverb, Pusher, React and existing memberships. No runtime dependency or lockfile changes. Browser verification installs pinned Playwright only in an isolated temporary test directory. See [Chrome notifications](https://developer.chrome.com/docs/extensions/reference/api/notifications), [Chrome alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms) and [Reverb origins](https://laravel.com/docs/13.x/reverb#allowed-origins) for provider constraints; consult the actual installed versions before changing behavior.
