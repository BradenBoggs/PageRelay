# Direct messages

Status: discussed product direction; planned after the core page workflow.

This document owns private conversations between selected members of one organization.

## Purpose

Direct messages let coworkers discuss sensitive or person-specific matters without leaving SideWire. They support the broader promise that team communication can live in one place while page conversations retain work context.

## Proposed behavior

- A member can start a one-to-one conversation with another active member of the same organization.
- The same pair should resolve to one durable direct conversation rather than creating duplicates.
- Messages use the same persistence, idempotency, pagination, safe rendering, realtime recovery, and failed-send behavior as page messages.
- Direct conversations appear only to their active participants and in each participant's inbox/search.
- Removing a member immediately blocks new access. Historical retention and how remaining participants see the removed author require an explicit policy.

Small group direct messages may be added later. If supported, participant identity must be stable and adding a participant should create a new privacy boundary rather than silently exposing old history.

## Privacy and authorization

Organization membership alone does not authorize a direct message. Every read, write, search result, realtime subscription, unread count, notification, and attachment must also verify current conversation participation.

Owners and administrators do not automatically receive access to employee direct messages. Any future compliance or export capability requires explicit policy, disclosure, and legal review.

## Open decisions

- Whether direct messages belong in the MVP.
- Group direct-message limits and participant changes.
- Blocking, reporting, moderation, retention, and organization exports.
- Whether users can delete or hide a conversation locally.
- Message editing/deletion and attachment behavior.

## Out of scope

Messages between different organizations, public usernames, consumer messaging, guest DMs, anonymous chat, voice/video calling, and hidden administrator access are not approved.

