# Organization chat and future channels

Status: one organization-wide chat is part of the approved MVP direction after the core page workflow. Custom named channels are deferred. Implementation requires a separately approved ExecPlan.

This document owns shared organization communication that is not attached to an external page. Private one-to-one communication belongs to `direct-messages.md`. The existing filename is retained; user-facing labels use Chat.

## Purpose

Keep general communication alongside page-aware discussion without requiring users to find an external page for every message. This does not make named channels the organizational parent of page chats.

## MVP boundary

Provide one default organization-wide chat when this milestone ships. All active organization members may view and send its messages. It has no required source URL and is not the chat of a particular Team membership group.

Use the same durable plain-text messaging, idempotency, pagination, safe rendering, realtime recovery, and failed-send guarantees as page chats. Include it in Activity, unread state, mentions, notifications, and search as those features ship.

The initial organization chat does not imply an admin-only announcements stream, custom channel creation, private channel memberships, archive management, or a configurable operating mode.

## Relationship to page contexts

Page chats remain page-first. A message in the organization chat may contain a link to a page chat, but must not absorb or copy that chat's messages.

The MVP page-linking operation targets page chats only, not this organization chat or a DM. Do not place thousands of automatically generated page contexts in channel navigation.

## Later custom channels

Channels such as Sales and Announcements are a possible next expansion for ongoing topics that do not map to one external record. They can reuse messaging infrastructure but require separately approved behavior for creation, naming, membership, visibility, posting, archive/restore, and notifications.

An Announcements name alone does not create restricted posting permissions. A Sales Team alone does not create a Sales channel or determine its audience.

Custom channels are not required for the MVP and are not an alternative page/channel/hybrid setup selected during onboarding.

## Open decisions for later work

Channel creation and management roles, public versus private channels, archive/restore, announcement posting restrictions, and retention/moderation remain open. Message editing/deletion, reactions, threads, and attachments are not implicitly approved here.

## Out of scope

Cross-organization communities, customer channels, federated chat, voice/video meetings, Slack import, bots, apps inside channels, enterprise compliance, and mandatory channel-per-project workflows are not approved.
