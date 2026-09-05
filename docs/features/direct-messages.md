# Direct messages

Status: one-to-one DMs are part of the approved MVP direction after the core page workflow. Implementation requires a separately approved ExecPlan. Group DMs remain deferred.

This document owns private chats between selected members of one organization. Existing internal conversation terminology may remain; user-facing copy uses Chat or Direct messages.

## Purpose

Direct messages let coworkers discuss sensitive or person-specific matters without leaving SideWire. They support a shared communication product while page chats retain work context.

## Behavior

- A member can start a one-to-one chat with another active member of the same organization.
- The same pair resolves to one durable direct chat rather than creating duplicates.
- Messages use the same persistence, idempotency, pagination, safe rendering, realtime recovery, and failed-send behavior as page messages.
- Direct chats appear only to their active participants in Chats, Activity, and search.
- Removing a member immediately blocks new access. Historical retention and how remaining participants see the removed author require an explicit policy.

Small group DMs require separate approval. Adding participants must not silently expose earlier private history.

## Privacy and authorization

Organization membership alone does not authorize a DM. Every read, write, search result, realtime subscription, unread count, notification, and future attachment must verify current participation.

Owners and administrators do not automatically receive access to employee DMs. Future compliance or export capabilities require explicit policy and disclosure.

DMs are not eligible destinations for page-context linking. An administrator cannot turn a private chat into a page chat by attaching a context. A participant may share an ordinary authorized link in a message without changing the chat's audience or importing the linked history.

A DM has no inferred external source page. Do not attach the user's last browser context or label the message as originating from an external app.

## Open decisions

Group limits and participant changes, blocking, reporting, moderation, retention, organization exports, local hiding, message editing/deletion, and attachments remain open.

## Out of scope

Messages between organizations, public usernames, consumer messaging, guest DMs, anonymous chat, voice/video calling, hidden administrator access, and page-to-DM linking are not approved.
