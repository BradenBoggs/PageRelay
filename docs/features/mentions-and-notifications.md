# Mentions and notifications

Status: proposed Phase 2 feature; not implemented. Implementation requires a separately approved ExecPlan.

This document owns `@` mentions, in-product notification records, delivery preferences, and later external notification channels. Activity ordering and chat read position belong to `inbox-and-unread.md`; task assignment belongs to its own specification.

## Purpose

Mentions direct a teammate's attention without requiring them to monitor every chat. Notifications communicate important activity without turning SideWire into a constant interruption.

## Mentions

The proposed first version supports mentioning an active organization member in an authorized page or organization chat. DMs already identify their recipients and do not require mention semantics for basic delivery.

Resolve stable member identifiers rather than trusting display-name text. Renaming a member must not change the historical recipient. Suggestions reveal only discoverable members; removed members cannot be newly mentioned.

Mention identity follows the original message and recipient, not each linked page context. Retried messages or a chat linked to several apps must not produce duplicate mentions or deliveries.

## In-product notifications

A notification belongs to one recipient and organization and references an authorized source event. Types may include mention, DM, task assignment, task due soon, and invitation status only when those features exist.

Use durable notification read state, creation time, safe destination, and deduplication. Deduplicate by the relevant event/message, recipient, and notification type rather than source-page association. Linking or unlinking a page does not replay old messages, issue a new mention, or reset read state.

Navigate to durable chat/message identity. The original message may include its safe historical source page; do not substitute a newly linked page as the event's origin. Recheck authorization at delivery and navigation, including DM participation. Losing access must not expose content through stale previews.

## Delivery channels

Start with in-product delivery through Activity or a notification view. Browser notifications, email, digests, Slack/Teams forwarding, SMS, mobile push, and per-channel rules require separate approval and opt-in behavior.

Request browser notification permission in context after explaining the benefit, not during installation simply because it might be useful later.

## Preferences and noise control

The initial direction is mentions and DMs by default, with broader chat activity opt-in. Exact notification and subscription defaults remain open. Merely visiting a page or adding a link must not subscribe every organization member.

Respect membership removal, muted destinations, source authorization, and user timezone for any later digest behavior. Permission to discover a chat is distinct from subscription to its notifications.

## Acceptance behavior

An authorized mention creates one durable recipient notification and navigates to authorized content without alerting unrelated members. Multiple linked contexts, retries, later edits/deletion, unlinking, and access removal must not create duplicate or leaking notifications. Chat-level unread state remains consistent with `inbox-and-unread.md`.
