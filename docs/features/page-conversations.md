# Page chats and linked page contexts

Status: approved MVP product behavior; not implemented. Implementation is planned in `docs/plans/001-page-chats-and-linking.md` and requires separate implementation approval.

This document owns page chats, messages, delivery, page-to-chat linking and unlinking, and message source attribution. `page-contexts.md` owns URL identity and Apps grouping. `inbox-and-unread.md` owns Activity and read state. The filename and any existing `Conversation` model remain valid internal names; the user-facing term is Chat.

## Purpose

Start a discussion on the page where work already happens. When the same work spans tools, explicitly attach another page context to the existing discussion instead of creating and maintaining a channel for every external project.

```text
Supermove project context ----+
                              +---- one page chat ---- messages
Docusign agreement context ---+
```

The records remain separate contexts. Messages exist once, in the chat. This does not create a SideWire Project model or synchronize native messages from external services.

## Ownership and cardinality

A page chat belongs to one organization and its default workspace in the MVP. It is not owned by an App, domain, or whichever context was linked first.

A page context has zero or one current primary chat. A page chat can have multiple linked contexts. Organization-wide chats and DMs have their own scopes and cannot receive page-context links in this MVP.

Resolve an existing chat when its context is opened. Create a new chat only when the user explicitly starts a discussion or sends the first message; creating the chat and first message must be safe under retries and concurrent sends. Linking a context to an existing chat must not also create another chat. Browsing and resolution alone do not subscribe members or produce a visible empty discussion.

## Access

All active organization members may initially read and send page-chat messages. The default workspace does not add restricted membership. Page-specific privacy, guests, private page channels, and external-customer access remain out of scope.

Only an organization owner or administrator may link or unlink page contexts in the MVP. Being able to send a message does not grant linking permission. Every candidate lookup, mutation, source label, message, count, search result, and realtime subscription must enforce current SideWire authorization.

Links must stay inside the same organization and default workspace. A link must never expand the audience of a restricted chat. DMs and organization-wide chats are ineligible regardless of the actor's organization role. Future restricted workspaces or chats require a separately approved audience-compatibility rule and security tests.

Viewing an external URL is not proof of permission. SideWire does not automatically mirror Supermove, Docusign, or another service's authorization.

## Manual linking workflow

From a recognized page, an eligible owner or administrator selects **Link to existing chat**, searches authorized page chats, chooses the intended chat, and confirms that either linked page will open the same complete history.

The current page context is eligible when it has no chat or its current chat has no persisted message history. The destination is an existing authorized page chat. A context already linked to the requested destination returns idempotent success, even when that chat contains messages.

Use the precise phrase **no chat or an empty chat**. Do not call the external page unused: it may have extensive business activity in its own app.

If the current context's different chat contains any messages, block reassignment. It does not matter whether those messages were posted from this specific context or another context sharing that chat. A filtered view, hidden message, or future tombstone must not make a chat with history eligible. Do not silently move, copy, hide, or discard an existing history.

Example: a Supermove chat has 20 messages and the Docusign page has no SideWire chat. Linking is allowed. If the Docusign page already opens a different chat with 10 messages, joining them requires a later chat-history merge and is blocked in the MVP.

The confirmation identifies the destination and linked pages and explains: **Messages posted from either page will appear in this shared chat.** Linking immediately exposes the destination's existing history through the new entry point, subject to the unchanged audience. This is not merely a related-page bookmark.

Reassigning a context from an empty chat must preserve other context associations. An empty chat left with no contexts can be retired from discovery without affecting any history-bearing chat. Do not add a generalized message-deletion capability for this cleanup.

## Concurrency and recovery

The server must recheck active membership, linking role, organization, workspace, current association, and empty-history eligibility at mutation time. Guard linking against a concurrent first send so a context cannot be moved away from a message that was just committed. Enforce at most one current chat association per context at the database level.

Link and unlink commands are idempotent. Stale association revisions, conflicting relinks, or a newly nonempty source chat return a clear conflict and require reloading the current state; they must not silently redirect a message or reinterpret the intended target. A previously successful send retry returns its original authorized result rather than posting into a newly linked chat.

Record successful link and unlink changes as organization-owned audit events with actor, context, old/new chat identifiers, and server time. Do not place sensitive raw URLs or message bodies in ordinary logs. Exact migrations and boundary services belong to the implementation plan.

## Unlinking

An owner or administrator may remove a context's current chat association after confirmation. Unlinking affects where the page opens next, not the chat's history, membership, unread state, or previously delivered notifications.

Keep all historical messages in their original chat and preserve their original source attribution. Do not split history by source page, move messages into a new chat, or imply that unlinking retracts information people already saw.

A chat with history remains reachable through SideWire's authorized chat history and Activity even if its last page is unlinked. Do not delete it or turn it into a custom channel. Revisiting an unlinked page shows no current chat until a user starts a new one or an authorized manager links it again.

## Messages and source attribution

A message has an opaque identifier, organization, chat, author, plain-text body, server timestamps, and idempotency data. It may also reference the source page context explicitly selected when sent, with only the safe display/link information permitted by `page-contexts.md`.

When a source context is provided, validate that it belongs to the same organization/workspace and is currently linked to the submitted chat at send time. Client metadata is not trusted authorization or proof that the external service produced the message.

Use wording such as **Sent while viewing Supermove** with a safe source-page action. These are SideWire messages, not imports from Supermove or Docusign. Sending from the web application or Activity without an explicitly selected page records no external source; never infer one from the last browser tab.

Source attribution is historical and independent of the current links. Unlinking or later relinking a context must not relabel old messages as coming from another page. Safe historical source information remains subject to the original chat's access rules and must not cascade-delete with an association.

The server must require a non-empty trimmed body and an approved maximum length, authorize and persist before acknowledging success, deduplicate retries, order history deterministically, paginate, safely render untrusted text, and reject stale or mismatched chat/context submissions.

Safe linkification may be added without rich previews. Editing, deletion, reactions, threaded replies, attachments, rich formatting, typing indicators, presence, voice notes, and AI summaries require later decisions. Thread is reserved for message-level replies, not a synonym for the entire page chat.

## Realtime and failure recovery

Authorized teammates should receive new messages without refreshing. Realtime delivery follows the chat identifier, not one separate message stream per linked context. Durable server history is authoritative; refetch after disconnect, missed events, sleep, or extension restart.

Retain failed drafts with their intended chat and source context, and retry with the same idempotency key. Do not silently carry a draft to a newly selected page or relinked chat. Do not present a message as sent before server confirmation. Any temporary polling fallback must be documented honestly.

## Presentation

The side panel distinguishes the current page context from the shared chat's recognizable title and linked pages. A link list makes cross-app sharing visible. Message source labels identify the page selected for that message, not necessarily the page currently open.

The message list is the main scroll region and the composer stays reachable. Provide explicit empty, loading, offline, permission, conflict, send-failure, expired-session, and removed-member states. Linking controls appear only for eligible roles.

Activity, unread counts, mention notifications, and message search operate on the one underlying chat/message identity; linked pages do not duplicate them. Feature-specific implementations are owned by their respective specifications.

## Deferred behavior and retention

Nonempty-chat merges, automatic cross-app matching, context identity merges/splits, one context opening several primary chats, custom channels, and administrator-selectable operating modes are not part of this MVP.

Automatic retention, legal hold, export, reporting, moderation, author editing/deletion, and organization deletion remain open. Linking and unlinking do not authorize irreversible deletion or a new retention policy.

## Acceptance behavior

Prove all of the following before implementation is complete:

- The same page resolves to one context and at most one primary chat under concurrent first messages.
- Two distinct contexts from different apps can open one durable shared history with accurate per-message source attribution.
- Linking a context with no chat or an empty chat succeeds for eligible managers without duplicating messages; linking two different nonempty histories fails without changes.
- Relinking to the already-associated chat is idempotent, and a concurrent first send cannot be lost or moved.
- Unlinking retains all messages, historical source labels, and access to a history-bearing chat even when it has no remaining pages.
- Ordinary members cannot link/unlink; cross-organization, cross-workspace, DM, and organization-chat targets fail without leaking existence.
- Stale drafts and mappings fail safely, web sends without a selected source remain unattributed, and unsafe links are never retained as provenance.
- Activity, read markers, notifications, search, and realtime delivery do not multiply a message because several pages point to its chat.
