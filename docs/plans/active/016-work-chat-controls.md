# Admin work Chats, unread counts, and incoming sounds

Lifecycle: in-progress
Approval: Braden's October 13, 2026 requests authorize admin-only creation/editing of work Chats, unseen-message counts, and sounds for incoming messages from other users.
Verification: pending
Release: not released; deployment outside scope

## Purpose / Big Picture

Restrict work-Chat creation and name editing to active Organization owners/admins. Preserve member messaging and DMs. Show unread messages and play an incoming sound in open clients. Owners retain the existing admin hierarchy. See [work Chats](../../features/page-conversations.md), [read state](../../features/inbox-and-unread.md), and [notifications](../../features/mentions-and-notifications.md).

## Progress

- [x] Inspect branch, owners, current policies and read/delivery boundaries.
- [ ] Implement role enforcement and name editing in shared web/panel UI.
- [ ] Implement unread counts and authorized incoming-message detection/sound.
- [ ] Verify focused permissions, counts, retries, web flows and static checks.
- [ ] Record evidence and outstanding runtime/native-panel checks.

## Surprises & Discoveries

Creation allowed any active member; no work-Chat rename endpoint existed. Shared messaging lists showed attention-item counts rather than unread messages. Root read positions existed; thread reading previously cleared attention only. The working tree contains earlier unrelated changes which must be preserved.

## Decision Log

October 13: interpret chat editing as changing its name, preserving own-message editing. Organization owners inherit admin rights. Keep websocket payloads signal-only; sound decisions require fresh authorized HTTP reads. Do not replay initial history or edits/deletions as new sounds.

## Outcomes & Retrospective

Implementation and verification in progress. No deployment authorized.

## Context and Orientation

Local main at `6aa57dfb5d29f2f04289664dceb450a2e8c8740a`, with pre-existing staged/unstaged changes. Existing CreateWorkChat/CreatePageChat, ConversationPolicy, CollaborationController/provider, work-chat discovery and panel entry points own the change.

## Plan of Work

Enforce role at request and transactional mutation boundaries. Add shared rename endpoint/dialog. Preserve existing chat read positions during migration and retain exact seen message IDs to avoid clearing unseen threads. Add authorized updates endpoint with cursor-based new-message detection, share counts/sound through the provider and update existing list surfaces. Update feature owners and quality map.

## Concrete Steps

Run focused PHP conversation/activity tests, Pint/Larastan, TypeScript, web/extension builds, foundation/doc checks and authenticated disposable SQLite browser checks. Try Sail for PHP 8.4/PostgreSQL acceptance; record unavailable environments accurately.

## Validation and Acceptance

Members cannot create/rename by HTTP or direct domain calls; owners/admins can. Cross-tenant, revoked, retired and DM rename attempts fail. Retrying creation preserves identity. Members can still send messages. Counts exclude own/deleted messages, follow read positions, and preserve unseen replies. Incoming sounds ignore initial history, own sends and message edits/deletions. Verify web desktop/narrow dialogs and recovery. Native Chrome panel and supported database/runtime results remain required before closing if unavailable.

## Idempotence and Recovery

Creation retains existing keys/normalization; rename repeats safely without changing history/links. The read migration is additive and uses disposable test data. No shared database resets, deployment or destructive operation authorized.

## Artifacts and Notes

Evidence pending. Host PHP 8.5.1 and Node 24.14.1 available; initial Docker socket inspection denied by sandbox.

## Interfaces and Dependencies

Reuse Laravel active membership, policies, shared CollaborationClient/provider/dialog and Web Audio. No dependency or extension permission changes.
