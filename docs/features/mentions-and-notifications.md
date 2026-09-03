# Mentions and notifications

Status: proposed Phase 2 feature; not implemented.

This document owns `@` mentions, in-product notification records, delivery preferences, and later external notification channels. It does not own general inbox ordering or task assignment rules.

## Purpose

Mentions let a teammate direct attention to a specific person without requiring that person to monitor every conversation. Notifications communicate important activity without turning SideWire into a constant interruption.

## Mentions

The proposed first version supports mentioning an active organization member in an authorized page or team conversation. Direct messages already identify their recipients and do not require mention semantics for basic delivery.

Mention parsing must resolve stable member identifiers, not trust display-name text alone. Renaming a member must not change the historical recipient. A message retry must not create duplicate mention notifications.

Mention suggestions only reveal members the current user is allowed to discover. Removed members cannot be newly mentioned.

## In-product notifications

A notification belongs to one recipient and organization and references an authorized source event. Initial types may include mention, direct message, task assignment, task due soon, and invitation status when those features exist.

Notifications have unread/read state, creation time, safe destination, and deduplication behavior. Deleting or losing access to a source must not expose its content through stale notification previews.

## Delivery channels

Start with in-product delivery through the inbox or a notification view. Browser notifications, email, daily digests, Slack/Teams forwarding, SMS, mobile push, and per-channel rules require separate approval and opt-in behavior.

Browser notification permission must be requested in context after explaining the benefit, never during extension installation merely because it may be useful later.

## Preferences and noise control

The initial preference direction is mentions and direct messages by default, with broader conversation activity opt-in. Exact defaults remain open. Notification delivery must respect membership removal, muted destinations, user timezone for digests, and source authorization.

## Acceptance behavior

An authorized mention creates one durable recipient notification, updates the recipient's relevant unread state, navigates to authorized content, and does not alert unrelated members. Retries, edits if later allowed, deletion, and access removal cannot create duplicate or leaking notifications.
