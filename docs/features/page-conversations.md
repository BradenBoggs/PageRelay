# Page conversations

Status: proposed MVP feature; not implemented.

This document owns messages attached to a page context, conversation history, delivery, realtime updates, and message-level behavior.

## Purpose

A page conversation lets coworkers discuss the exact CRM record, design, order, document, dashboard, or other page they are viewing. It is SideWire's primary differentiator and the first useful collaboration loop.

## Access

Every conversation inherits its page context's organization. All active organization members may initially view and send page messages. Page-specific membership, guests, private page channels, and external customer access are out of scope.

## Message behavior

A message has an opaque identifier, organization, page context, author, plain-text body, server timestamps, and idempotency data. The server must:

- require a non-empty trimmed body and enforce an approved maximum length;
- authorize and persist before acknowledging success;
- return the same result for a repeated idempotency key;
- order history deterministically using server-owned values;
- paginate history;
- render content as untrusted user text;
- reject stale or mismatched context submissions safely.

Safe linkification may be added without rich previews. Editing, deletion, reactions, threads, attachments, rich formatting, typing indicators, presence, voice notes, and AI summaries require later decisions.

## Realtime and failure recovery

Authorized connected teammates should receive new messages without manually refreshing. Realtime transport is subordinate to durable server state. After disconnect, missed event, sleep, or extension restart, refetch authoritative history.

When a send fails, keep recoverable draft text and provide explicit retry using the same idempotency key. Do not show a message as successfully sent before the server confirms it. A temporary polling fallback must be documented honestly.

## Conversation presentation

The panel header shows the current context's source host and title. The message list is the primary scroll region and the composer stays reachable. Empty, loading, offline, permission, send-failure, expired-session, and removed-member states must be intentional.

## Retention and moderation

Automatic retention, legal hold, export, message reporting, administrator moderation, author editing/deletion, and organization deletion behavior remain open. Do not add irreversible deletion until history and audit consequences are approved.

## Acceptance behavior

Two authorized members can resolve the same page, exchange durable messages, see updates, reconnect without losing history, return to the source page, and safely recover failed sends. Cross-organization access fails for history, posting, realtime channels, counts, and existence checks.
