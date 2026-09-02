# Team conversations

Status: discussed product direction; not part of the first page-conversation milestone.

This document owns general organization conversations that are not attached to an external page. Direct one-to-one or group-private communication belongs to `direct-messages.md`.

## Purpose

SideWire should eventually let a team keep general communication in the same source of truth as page-aware discussion. This prevents users from needing a separate chat product for every message that does not naturally belong to a source page.

## Proposed behavior

Organizations can have named team conversations, commonly understood as channels. A conversation has a name, optional description, organization membership scope, creator, archive state, messages, and timestamps.

The smallest useful version should provide:

- one default organization-wide conversation;
- additional named conversations created by approved roles;
- organization-member visibility for public team conversations;
- plain-text durable messages using the same delivery guarantees as page messages;
- archive and restore rather than immediate permanent deletion;
- inclusion in inbox, unread, mentions, notifications, and search.

## Relationship to page contexts

Team conversations are not page contexts and do not require a source URL. A page conversation should be linkable in a team message, but messages should not be silently copied between destinations.

Do not model every page as a channel or place thousands of automatically created page contexts in channel navigation.

## Open decisions

- Whether channels are required for MVP or should follow page collaboration.
- Who can create, rename, archive, and restore conversations.
- Public organization channels only versus private membership.
- Whether group conversations are channels or direct messages.
- Message editing/deletion, reactions, threads, attachments, retention, and moderation.
- Default conversations created during onboarding.

## Out of scope

Cross-organization communities, customer channels, federated chat, voice/video meetings, Slack import, bots, apps inside channels, and enterprise compliance are not currently planned.

