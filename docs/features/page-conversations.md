# Page chats and linked page contexts

Status: implemented through milestone 5 of `docs/plans/001-page-chats-and-linking.md`; manual Chrome verification remains pending.

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

Resolve an existing chat when its context is opened. When no persisted context/chat exists, show **Create chat for this page** and, for eligible managers, **Link to existing chat**. Do not show the message composer until a chat exists, and do not create a chat by sending a first message.

The creation form is intentionally small and inline in the This Page view. It contains editable **Page title**, **Page URL**, and **Chat name** fields. Prefill the page title and URL from the active tab and default the chat name to the detected title so the MVP can compare browser-detected information with deliberate user corrections. The favicon may be detected automatically but is not a required manual field. Explain that the values will be saved to the organization's SideWire data when the user selects **Create chat**.

Submitting the form validates and normalizes the URL on the server, then creates or reuses the organization/default-workspace context and creates its empty page chat in one transaction. All active organization members may create a page chat. The client-supplied title, URL, chat name, favicon, organization, and workspace are untrusted; server membership, URL safety, normalization, scoping, and length rules remain authoritative. Repeated and concurrent creation requests for the same normalized identity return the one resulting context/chat without duplicating either record. If a manager links the ephemeral page to an existing chat instead, create or reuse the context and associate it atomically without creating another chat.

Browsing, resolution, editing the form, and draft entry do not persist a context, subscribe members, or produce a visible empty discussion. An explicitly created empty chat is durable and visible on This Page, but it stays out of Chats and Activity until their existing history/relevance rules include it.

## Access

All active organization members may initially read and send page-chat messages. The default workspace does not add restricted membership. Page-specific privacy, guests, private page channels, and external-customer access remain out of scope.

Only an organization owner or administrator may link or unlink page contexts in the MVP. Being able to send a message does not grant linking permission. Every candidate lookup, mutation, source label, message, count, search result, and realtime subscription must enforce current SideWire authorization.

Links must stay inside the same organization and default workspace. A link must never expand the audience of a restricted chat. DMs and organization-wide chats are ineligible regardless of the actor's organization role. Future restricted workspaces or chats require a separately approved audience-compatibility rule and security tests.

Viewing an external URL is not proof of permission. SideWire does not automatically mirror Supermove, Docusign, or another service's authorization.

## Manual linking workflow

From a recognized page, an eligible owner or administrator selects **Link to existing chat**, searches authorized page chats, chooses the intended chat, and confirms that either linked page will open the same complete history.

The current page is eligible when it has no persisted context, its context has no chat, or its current chat has no persisted message history. The destination is an existing authorized page chat. Linking an ephemeral page creates its context inside the link transaction. A context already linked to the requested destination returns idempotent success, even when that chat contains messages.

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

The web application may receive realtime messages on the chat identifier, not one separate stream per linked context. For the milestone 5 extension simplification, do not poll chat history in the background. Load history when the chat opens, after the local user sends or changes an association, and when the user selects **Refresh**. Durable server history remains authoritative; a later extension realtime transport requires separate implementation approval after the manual creation lifecycle is stable.

Retain failed drafts with their intended chat and source context, and retry with the same idempotency key. Do not silently carry a draft to a newly selected page or relinked chat. Do not present a message as sent before server confirmation. Do not reintroduce periodic polling as an undocumented fallback.

## Presentation

The side panel distinguishes the current page context from the shared chat's recognizable title and linked pages. A link list makes cross-app sharing visible. Message source labels identify the page selected for that message, not necessarily the page currently open.

The web Chats index lists authorized, non-retired page chats with message history in latest-message order. Each result shows the chat title, a concise latest-message preview, author and time context, message count, and currently linked source hosts. A history-bearing chat remains listed when it has no currently linked pages. Empty or retired chats, other conversation types, other workspaces, and other organizations do not appear. The initial index is paginated browsing; full-text search, Apps filters, unread state, and Activity remain separately gated.

After explicit chat creation, the message list is the main scroll region and the composer stays reachable. Before creation, the compact creation form occupies that primary region and the composer is absent. Provide explicit empty, loading, refreshing, offline, validation, permission, conflict, send-failure, expired-session, and removed-member states. Linking controls appear only for eligible roles.

Activity, unread counts, mention notifications, and message search operate on the one underlying chat/message identity; linked pages do not duplicate them. Feature-specific implementations are owned by their respective specifications.

## Deferred behavior and retention

Nonempty-chat merges, automatic cross-app matching, context identity merges/splits, one context opening several primary chats, custom channels, and administrator-selectable operating modes are not part of this MVP.

Automatic retention, legal hold, export, reporting, moderation, author editing/deletion, and organization deletion remain open. Linking and unlinking do not authorize irreversible deletion or a new retention policy.

## Acceptance behavior

Prove all of the following before implementation is complete:

- The same page resolves to one persisted context and at most one primary chat under repeated or concurrent explicit creation requests; no message is created with the chat.
- Two distinct contexts from different apps can open one durable shared history with accurate per-message source attribution.
- Linking a context with no chat or an empty chat succeeds for eligible managers without duplicating messages; linking two different nonempty histories fails without changes.
- Relinking to the already-associated chat is idempotent, and a concurrent first send cannot be lost or moved.
- Unlinking retains all messages, historical source labels, and access to a history-bearing chat even when it has no remaining pages.
- Ordinary members cannot link/unlink; cross-organization, cross-workspace, DM, and organization-chat targets fail without leaking existence.
- A message cannot be sent before explicit creation or linking. Stale drafts and mappings fail safely, web sends without a selected source remain unattributed, and unsafe links are never retained as provenance.
- Activity, read markers, notifications, search, and realtime delivery do not multiply a message because several pages point to its chat.

## Implementation map

Primary entry points:

- Extension API routes: `routes/api.php` under `/api/v1/extension/page-contexts` and `/api/v1/extension/page-chats`
- Web chat routes: `GET /chats`, `GET /chats/{conversation}`, `POST /chats/{conversation}/messages`, and `POST /chats/{conversation}/read`
- Domain services: `app/Domain/Conversations/CreatePageChat.php`, `SendPageMessage.php`, `LinkPageContext.php`, and `UnlinkPageContext.php`
- Models/tables: `Conversation`/`conversations`, `Message`/`messages`, and the current association on `page_contexts`
- Read state: `ConversationRead`/`conversation_reads` with `app/Domain/Activity/MarkConversationRead.php`
- Authorization: `app/Policies/ConversationPolicy.php`, `app/Policies/PageContextPolicy.php`, and transactional membership checks in the domain services
- Realtime event and channel: `app/Events/MessageCreated.php` and `routes/channels.php`
- Audit boundary: Spatie Activitylog with `App\Models\OrganizationActivity` and `activity_log`
- Extension interface: `apps/extension/src/sidepanel/main.tsx`
- Web interfaces: `resources/js/pages/chats/index.tsx` and `resources/js/pages/chats/show.tsx`
- Tests: `tests/Feature/Conversations/`

Related specifications:

- `docs/features/page-contexts.md`
- `docs/features/browser-extension.md`
- `docs/features/inbox-and-unread.md`
