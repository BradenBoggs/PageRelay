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

## Idempotence and Recovery

The migration is additive. Back up before deployment; rollback removes new collaboration/attention metadata and is not automatic production recovery. Prefer a forward fix. Retries preserve a request UUID, fingerprint and uncertain draft payload. Direct pairs have a database uniqueness constraint. Failed display/acknowledgement claims expire after 45 seconds for a later attempt.

## Artifacts and Notes

The named run's pilot-verification-evidence artifact contains result codes, logs, revision, tracked source and synthetic web/extension screenshots. It excludes .env files, runtime identity/token files, real customer data and dependencies. Artifacts have short retention; the run and this plan preserve the durable outcome summary. Final PR status must name its current revision and fresh check results.

## Interfaces and Dependencies

Reuse Laravel, Sanctum, Reverb, Pusher, React and existing memberships. No runtime dependency or lockfile changes. Browser verification installs pinned Playwright only in an isolated temporary test directory. See [Chrome notifications](https://developer.chrome.com/docs/extensions/reference/api/notifications), [Chrome alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms) and [Reverb origins](https://laravel.com/docs/13.x/reverb#allowed-origins) for provider constraints; consult the actual installed versions before changing behavior.
