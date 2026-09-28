# Messaging, composer, and complete conversation history

Status: **Draft for owner review. Core target.** The documented baseline supports durable plain-text work-Chat messages, server acknowledgement, idempotent sends, web realtime, and limited extension refresh. Rich composition and message actions are new proposals. See [review scope](README.md).

This document owns common message content, lifecycle, delivery, ordering, and history for channels and DMs. It does not own their audiences. Replies, attachments, drafts/scheduling, notifications, and page associations have separate feature documents.

## Content and composition

Provide one recognizable composer across the full web app and narrow extension. Support paragraphs, emphasis, lists, quotations, inline code, code blocks, safe labeled links, emoji, and stable-ID mentions. Provide readable plain-text fallbacks for search/accessibility and notifications. Render a bounded, sanitized content format, never executable user HTML or arbitrary embeds.

A message may contain text, authorized attachments, or both. Require meaningful content and enforce configured length/attachment limits with clear feedback. Support copy/paste and chosen-file drag/drop without reading the host page. Do not interpret typed slash text as a destructive action; approved slash actions have explicit previews and confirmation where needed.

Preserve the existing default: Enter adds a newline and Ctrl/Command + Enter sends, except during IME composition. A personal Enter-to-send preference can offer Shift + Enter for a newline, with a visible hint. The preference must not cause accidental sends during composition, autocomplete, or dialog interaction.

## Identity, delivery, and history

Persist before displaying success. A send has a stable client request identity, server message identity/time, explicit destination and optional thread, and optional validated source context. Show sending, sent, failed, and retry states without duplicate messages. Retrying an acknowledged send returns the original result, not a second post or a post to a newly mapped page.

Web and open extension clients receive authorized updates promptly through a supported live connection. Recovery refetches authoritative history and revisions; transport success is not proof of persistence. Do not silently send failed/offline drafts later merely because connectivity returns. Authorization, archive state, posting restrictions, and source associations are rechecked on every mutation.

All retained history must be reachable with stable pagination and jump-to-message behavior. The current latest-100-message shell is a baseline limitation, not an acceptable target retention boundary. Loading older messages must preserve scroll position. Live arrival does not drag a reader away from older content; offer a new-message indicator and jump-to-latest action. Ordering remains deterministic when timestamps match and events arrive out of order.

## Message actions

Authors may edit their own retained messages under the proposed default. Show an edited marker and preserve identity, original author/time, replies, reactions, and original source attribution. Version conflicts must not silently overwrite a newer edit. Mention changes follow notification rules; editing does not replay delivery to every original recipient.

Authors may delete their own messages, with confirmation for destructive actions. Hide content and attachments from ordinary access immediately. Preserve a neutral tombstone when required for replies, references, ordering, and audit; deletion must never make a history-bearing chat eligible for a destructive merge/relink. Physical purge/recovery follows the approved retention policy, not an invented period here. Channel managers may moderate messages only in channels they can access; administrators do not gain DM access through moderation.

Members may add/remove their own emoji reactions. Show aggregate counts and authorized reactors; repeat actions are idempotent. Reactions do not advance unread position, notify an entire channel, or create extra messages. Custom organization emoji and expanded reaction preferences are optional enhancements, not dependencies.

Provide durable message permalinks, copy-link, and sharing to another authorized conversation. A reference preview is evaluated for each recipient; posting a private-message link in a public channel must not copy its body or reveal metadata to unauthorized readers. Explicit text copying is a separate user disclosure, never a hidden forwarding side effect.

## Source attribution

Page context is optional and independently validated for each message or reply. A direct web/DM send has no inferred active tab. Show source labels as SideWire attribution, not imported third-party messages. Edits, sharing, unlinking, and channel renaming must not rewrite the original source. [Page linking](page-conversations.md) owns the full contract.

## Acceptance behavior

Two clients converge on the same acknowledged messages, edits, deletions, and reactions after missed or repeated events. Retrying cannot duplicate a post. A reader can retrieve and deep-link a message older than the latest batch. Rich content and filenames cannot execute code. Removed participants cannot send or retrieve message derivatives. Drafts remain recoverable on failure and cannot move silently between chats, threads, or source pages.

## Owner decisions

Confirm author edit/delete permissions, any disclosed edit window, moderation permissions, custom emoji scope, and maximum message size. Retention policy and recovery periods must be settled before enabling permanent purge. Public read receipts, exact online tracking, nested reply trees, and automatic AI actions are not included.

Reference coverage: [Slack messaging](https://slack.com/help/articles/201457107-Send-and-read-messages), [message actions and formatting catalog](https://slack.com/help/categories/200111606-Using-Slack).
