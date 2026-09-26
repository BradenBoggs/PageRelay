# Organization chat and future channels

Status: one organization-wide general Chat remains a later milestone. Durable named organization-wide work Chats that accept page links are approved under `docs/plans/002-durable-work-chats.md`. Slack-style custom channel audiences and administration remain deferred.

This document owns the default organization-wide general Chat and future channel-specific audiences. Durable named work Chats and their page links belong to `page-conversations.md`; private one-to-one communication belongs to `direct-messages.md`. The existing filename is retained; user-facing labels use Chat.

## Purpose

Keep general communication alongside page-aware work Chats. The default organization Chat is distinct from the multiple named work Chats governed by `page-conversations.md`.

## MVP boundary

Provide one default organization-wide chat when this milestone ships. All active organization members may view and send its messages. It has no required source URL and is not the chat of a particular Team membership group.

Use the same durable plain-text messaging, idempotency, pagination, safe rendering, realtime recovery, and failed-send guarantees as work Chats. Include it in Activity, unread state, mentions, notifications, and search as those features ship.

The initial organization chat does not imply an admin-only announcements stream, custom channel creation, private channel memberships, archive management, or a configurable operating mode.

## Relationship to page contexts

A message in the organization Chat may contain a link to a work Chat, but must not absorb or copy that Chat's messages.

The MVP page-linking operation targets work Chats only, not this organization Chat or a DM. Do not place automatically generated page contexts in Chat navigation.

## Work Chats are not full custom channels

The MVP may provide multiple durable named work Chats to all active organization members and allow page contexts to route into them. These Chats are channel-like because they persist independently and appear in Chats, but they have no separate membership, visibility, posting-role, or archive model. They remain governed by `page-conversations.md`.

## Later custom channels

Channels such as Sales and Announcements are a possible next expansion for ongoing topics that do not map to one external record. They can reuse messaging infrastructure but require separately approved behavior for creation, naming, membership, visibility, posting, archive/restore, and notifications.

An Announcements name alone does not create restricted posting permissions. A Sales Team alone does not create a Sales channel or determine its audience.

Custom channels are not required for the MVP and are not an alternative page/channel/hybrid setup selected during onboarding.

## Open decisions for later work

Channel creation and management roles, public versus private channels, archive/restore, announcement posting restrictions, and retention/moderation remain open. Message editing/deletion, reactions, threads, and attachments are not implicitly approved here.

## Out of scope

Cross-organization communities, customer channels, federated chat, voice/video meetings, Slack import, bots, apps inside channels, enterprise compliance, and mandatory channel-per-project workflows are not approved.
