# 005 — GPS communication pilot

Lifecycle: in-progress
Approval: Braden requested implementation on October 8, 2026: a usable GPS pilot prioritizing browser desktop notifications, mentions, direct messages, and threads. This is approval for this bounded communication slice, not every draft feature, production deployment, or messages/invitations to real employees.
Verification: implementation drafted; automated, supported-runtime, browser, and native desktop checks are pending until actual results are recorded below.
Release: not released. No production origin, server, team setup, or public distribution is established here.

## Purpose / Big Picture

A coworker can use the web app or Chrome panel to send a private one-to-one message, mention an eligible coworker, and reply in a one-level thread. Relevant messages remain discoverable in Activity and produce opt-in generic desktop alerts. Existing page-linked Chats keep their history and source/link safeguards.

The owners are [Direct messages](../../features/direct-messages.md), [Threads](../../features/threads.md), [Notifications](../../features/mentions-and-notifications.md), and [Browser extension](../../features/browser-extension.md). Broader channel administration, group DMs, uploads, reactions, AI, calls, email/SMS, notification schedules, and production setup are excluded.

## Progress

- [x] Inspect baseline code, membership policies, page-send transaction, extension handoff, UI and feature owners.
- [x] Draft shared authorization, one-to-one identity, thread/mention persistence, attention records and private desktop delivery claims.
- [x] Draft shared web/panel interface and opt-in Chrome background notification checks.
- [ ] Run and repair supported runtime, static, formatting, migration and regression checks.
- [ ] Exercise two authenticated clients and the built extension, including failure and privacy cases.
- [ ] Verify native Chrome/OS notifications on GPS machines before pilot deployment.

## Surprises & Discoveries

The legacy extension manifest allowed localhost port 8001 while API clients defaulted to 8000. The build now derives the exact host permission from the same validated app origin. The local assistant environment cannot reach GitHub through Git/DNS and lacks application PHP extensions, Composer and Sail; local application checks cannot be represented as executed.

## Decision Log

- Keep `ConversationType::Page` for current organization-wide work Chats. Add participant-only `Direct` conversations; no rename migration or implied private-channel launch.
- One level of replies inherits its Chat audience. The root author and reply authors receive subsequent thread activity; stable-ID mentions notify eligible recipients. Manual following/unfollowing is a later slice.
- Create one durable attention item per recipient/message, with mention precedence over DM/thread reasons. Reading actual visible IDs clears only those attention items, not unseen replies.
- Desktop alerts are opt-in, generic and contain no message text, customer names or source URLs. Server delivery leases coalesce competing clients. Lost acknowledgement can cause a later retry; exactly-once OS delivery is not promised.
- Open clients subscribe to existing Reverb/Pusher signal-only events and reconcile through authorized HTTP. A disclosed 30-second collaboration fallback provides recovery; it never polls host pages. The extension may check notification records about once per minute with the panel closed after opt-in. Alarms are not guaranteed delivery while Chrome/OS is suspended or closed.
- Notifications is an optional Chrome permission requested from an explicit button; alarms is used only for the opt-in delivery check. No DOM access, content script, broad host permission or background browsing collection is added.
- Stack this implementation on documentation PR 2's revision `89c27d8e01393c7f85268fbcf8fd43bab0526749`. Do not merge PR 2 or import the separate URL-selector PR 1. Reserve initiative 004 for that existing branch; this work is 005.

## Outcomes & Retrospective

Pending validation. Source exists as an implementation candidate, not a verified or deployed pilot.

## Context and Orientation

Baseline main is `f7c7212ae12f1453daea5df7b26d11f0e503b02b`. `SendPageMessage` owns existing page/source/version transaction safety; the new sender composes it inside one transaction instead of bypassing linking rules. `ConversationAccess` is the shared audience boundary. Web requests use sessions/CSRF; extension requests use existing scoped expiring Sanctum tokens.

## Plan of Work

New migration adds direct-pair/participants, thread parent, mention recipients, attention records and opt-in preferences. Conversation and notification controllers share routes under web and extension authentication. Common React client/components render DMs, work Chats, Activity, replies, mention selection and delivery controls. The Chrome worker performs notification-only checks; the built manifest derives one API origin. No database credentials or production records are touched.

## Concrete Steps

Use the checked-in supported [workflow](../../engineering/WORKFLOW.md) and existing CI. Add focused `PilotCollaborationTest` coverage, run all backend regressions, PHP static analysis, frontend types and builds, and documentation checks. Formatting must use the locked repository tooling without suppressing failed checks. Keep any temporary authoring workflow scoped to this branch and remove write automation before handoff.

## Validation and Acceptance

Required: same-pair DM reuse, nonparticipant-admin and tenant isolation, removed-member denial, source-free DMs, valid same-chat thread roots, eligible stable mentions, idempotent sends, one attention item for overlapping reasons, explicit visible read behavior, history older than 100 messages, opt-in/no-backlog delivery, competing claims, generic previews, revoked access, pause and test controls. Verify real authenticated web and narrow built-panel flows separately from native OS delivery. Record exact commands, revision and omissions.

## Idempotence and Recovery

Migration is additive. Back up before deployment; rolling it back deletes new conversation/attention metadata and is not an automatic production recovery procedure. Prefer a forward fix. Message retries keep one request UUID and fingerprint; uncertain sends retain their payload rather than silently generating duplicate sends. Direct pairs have a database uniqueness constraint. Notification claims expire after 45 seconds when display/acknowledgement fails.

## Artifacts and Notes

[GPS pilot setup](../../engineering/GPS-PILOT.md) records deployment and device checks. Only synthetic accounts/data belong in automated artifacts. No real GPS recipient addresses or credentials are supplied or invented.

## Interfaces and Dependencies

Reuse Laravel, Sanctum, Reverb, Pusher, React and existing memberships. No new dependency or lockfile changes. User-approved browser desktop notifications require optional `notifications` and notification-only `alarms`; Chrome background scheduling can be delayed. Source references consulted October 8, 2026: [Chrome notifications](https://developer.chrome.com/docs/extensions/reference/api/notifications), [Chrome alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms), [MDN notification permission](https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission_static).
