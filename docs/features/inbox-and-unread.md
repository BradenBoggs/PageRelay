# Cross-tool inbox and unread state

Status: proposed Phase 2 feature; not implemented.

This document owns the unified activity inbox, unread calculations, read position, recency ordering, and navigation back to conversation sources. Notification delivery belongs to `mentions-and-notifications.md`.

## Purpose

The inbox turns SideWire from isolated page chats into one source of truth across the team's tools. A user can see where communication happened, catch up, and return to the source page without reopening every CRM, design tool, or portal individually.

## Inbox contents

The inbox may combine authorized activity from:

- page conversations;
- team conversations;
- direct messages;
- mentions;
- later task assignments and task discussion.

Each item identifies its destination type, recognizable title, source site when applicable, latest relevant sender and preview, activity time, unread state, and safe navigation action.

## Read state

Unread state is personal to the member. Track a durable server-owned read position or equivalent monotonic marker per member and destination. Opening a conversation may mark visible content read after it is actually loaded; merely receiving a background realtime event must not.

Unread counts must be reproducible after restart and must not depend only on local extension storage. Retried events must not inflate counts. Removed or unauthorized destinations disappear and cannot leak counts.

## Ordering and filters

The default inbox orders by relevant recent activity. The first version should support all and unread views. Mentions, assigned tasks, destination type, source application, and archived filters may follow once real usage proves the need.

Do not build algorithmic prioritization or an AI summary before deterministic inbox behavior is reliable.

## Panel and web behavior

The panel provides a compact inbox optimized for quick triage. The web application may provide a wider view and richer filters. Both surfaces use the same server state.

Selecting a page item opens its SideWire conversation and offers a safe return link to the source page. Selecting a team or direct item opens that conversation without inventing a source URL.

## Acceptance behavior

A member can navigate away from a page, receive authorized activity, find it in one inbox, open the correct destination, mark it read consistently across extension and web, and return to the originating page. Another member's read state and another organization's activity remain private.
