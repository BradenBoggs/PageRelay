# Durable work Chats and linked page contexts

Status: implemented through milestone 5 of `docs/plans/001-page-chats-and-linking.md`; manual Chrome verification remains pending.

This document owns durable named work Chats, messages, delivery, page-to-Chat linking and unlinking, and message source attribution. `page-contexts.md` owns URL identity and Apps grouping. `inbox-and-unread.md` owns Activity and read state. The filename, `Conversation` model, and internal `page` conversation discriminator remain compatibility names; the user-facing term is Chat.

## Purpose

Give a piece of work one durable named Chat, usable directly in SideWire and available beside every linked external page. A Chat may be created before any page is attached. When the same work spans pages or tools, explicitly route those contexts into the existing history instead of copying messages or requiring SideWire to model the external business record.

```text
Supermove project context ----+
                              +---- one work Chat ---- messages
Docusign agreement context ---+          |
                                         +---- direct use in SideWire
```

The records remain separate contexts. Messages exist once, in the Chat. This does not create a SideWire Project model, automatically create a Chat for every external record, or synchronize native messages from external services.

## Ownership and cardinality

A work Chat belongs to one organization and its default workspace in the MVP. It is not owned by an App, domain, page, or whichever context was linked first. All active organization members may discover, open, and send to these work Chats in the initial scope; per-Chat audiences are deferred.

A page context has zero or one current primary Chat. A work Chat can have zero, one, or multiple linked contexts. The future default organization Chat and DMs have their own scopes and cannot receive page-context links in this MVP.

Any active member may explicitly create a named work Chat from Chats without attaching a page. The server derives the organization and default workspace from authenticated membership, validates the name, and makes retried creation safe to repeat. The empty Chat is durable and immediately discoverable in Chats and eligible link pickers, but it does not appear in Activity or unread results until message/read behavior makes it relevant.

Resolve an existing Chat when its context is opened. When no persisted context/Chat exists, show **Create chat for this page** and, for eligible managers, **Link to existing chat**. Do not show the This Page message composer until a Chat exists, and do not create a Chat by sending a first message. The Chats surface may independently open any authorized work Chat and send without a source page.

The creation form is intentionally small and inline in the This Page view. It contains editable **Page title**, **Page URL**, and **Chat name** fields. Prefill the page title and URL from the active tab and default the chat name to the detected title so the MVP can compare browser-detected information with deliberate user corrections. The favicon may be detected automatically but is not a required manual field. Explain that the values will be saved to the organization's SideWire data when the user selects **Create chat**.

Submitting the form validates and normalizes the URL on the server, then creates or reuses the organization/default-workspace context and creates its empty work Chat in one transaction. All active organization members may create a work Chat. The client-supplied title, URL, Chat name, favicon, organization, and workspace are untrusted; server membership, URL safety, normalization, scoping, and length rules remain authoritative. Repeated and concurrent creation requests for the same normalized identity return the one resulting context/Chat without duplicating either record. If a manager links the ephemeral page to an existing Chat instead, create or reuse the context and associate it atomically without creating another Chat.

Browsing, resolution, editing the form, and draft entry do not persist a context, subscribe members, or produce a visible empty discussion. Every explicitly created empty work Chat is durable and visible in Chats and on any linked page. It stays out of Activity and unread results until their message/relevance rules include it.

## Access

All active organization members may initially create, discover, read, and send work-Chat messages. The default workspace does not add restricted membership. Page-specific privacy, guests, private work Chats, channel membership, and external-customer access remain out of scope.

Only an organization owner or administrator may link or unlink page contexts in the MVP. Being able to send a message does not grant linking permission. Every candidate lookup, mutation, source label, message, count, search result, and realtime subscription must enforce current SideWire authorization.

Links must stay inside the same organization and default workspace. A link must never expand the audience of a restricted chat. DMs and organization-wide chats are ineligible regardless of the actor's organization role. Future restricted workspaces or chats require a separately approved audience-compatibility rule and security tests.

Viewing an external URL is not proof of permission. SideWire does not automatically mirror Supermove, Docusign, or another service's authorization.

## Manual linking workflow

From a recognized page, an eligible owner or administrator selects **Link to existing chat**, searches authorized work Chats, chooses the intended Chat, and confirms that the linked page will open the same complete history.

The current page is eligible when it has no persisted context, its context has no Chat, or its current Chat has no persisted message history. The destination is an existing authorized non-retired work Chat, including an empty Chat with no linked pages. Linking an ephemeral page creates its context inside the link transaction. A context already linked to the requested destination returns idempotent success, even when that Chat contains messages.

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

Safe linkification may be added without rich previews. Editing, deletion, reactions, threaded replies, attachments, rich formatting, typing indicators, presence, voice notes, and AI summaries require later decisions. Thread is reserved for message-level replies, not a synonym for the entire Chat.

## Realtime and failure recovery

The web application may receive realtime messages on the chat identifier, not one separate stream per linked context. For the milestone 5 extension simplification, do not poll chat history in the background. Load history when the chat opens, after the local user sends or changes an association, and when the user selects **Refresh**. Durable server history remains authoritative; a later extension realtime transport requires separate implementation approval after the manual creation lifecycle is stable.

Retain failed drafts with their intended chat and source context, and retry with the same idempotency key. Do not silently carry a draft to a newly selected page or relinked chat. Do not present a message as sent before server confirmation. Do not reintroduce periodic polling as an undocumented fallback.

## Presentation

The side panel distinguishes the current page context from the shared chat's recognizable title and linked pages. A link list makes cross-app sharing visible. Message source labels identify the page selected for that message, not necessarily the page currently open.

The web and extension Chats views list authorized, non-retired work Chats, including empty Chats and Chats with no currently linked pages. Each result shows the Chat title, message count, currently linked source hosts, and a concise latest-message preview with author/time context when one exists. Chats order by latest message and then creation. Retired Chats, other conversation types, other workspaces, and other organizations do not appear.

Selecting a Chat in the extension opens its history and composer inside the panel. Messages sent there have no source-page attribution. Returning to This Page does not link the active page implicitly or reuse the last-opened Chat as hidden source metadata.

After explicit chat creation, the message list is the main scroll region and the composer stays reachable. Before creation, the compact creation form occupies that primary region and the composer is absent. Provide explicit empty, loading, refreshing, offline, validation, permission, conflict, send-failure, expired-session, and removed-member states. Linking controls appear only for eligible roles.

Activity, unread counts, mention notifications, and message search operate on the one underlying chat/message identity; linked pages do not duplicate them. Feature-specific implementations are owned by their respective specifications.

## Deferred behavior and retention

Nonempty-Chat merges, automatic cross-app matching, context identity merges/splits, one context opening several primary Chats, per-Chat membership/visibility, and administrator-selectable operating modes are not part of this MVP. Durable named work Chats are channel-like but do not imply Slack-style channel administration.

Automatic retention, legal hold, export, reporting, moderation, author editing/deletion, and organization deletion remain open. Linking and unlinking do not authorize irreversible deletion or a new retention policy.

## Acceptance behavior

Prove all of the following before implementation is complete:

- The same page resolves to one persisted context and at most one primary chat under repeated or concurrent explicit creation requests; no message is created with the chat.
- Retried standalone Chat creation returns one organization/default-workspace-scoped Chat, and the empty Chat is immediately discoverable without appearing in Activity or unread results.
- Two distinct contexts from different apps can open one durable shared history with accurate per-message source attribution.
- Linking a context with no chat or an empty chat succeeds for eligible managers without duplicating messages; linking two different nonempty histories fails without changes.
- Relinking to the already-associated chat is idempotent, and a concurrent first send cannot be lost or moved.
- Unlinking retains all messages, historical source labels, and access to a history-bearing chat even when it has no remaining pages.
- Ordinary members cannot link/unlink; cross-organization, cross-workspace, DM, and organization-chat targets fail without leaking existence.
- A message cannot be sent before explicit creation or linking. Stale drafts and mappings fail safely, web sends without a selected source remain unattributed, and unsafe links are never retained as provenance.
- Activity, read markers, notifications, search, and realtime delivery do not multiply a message because several pages point to its chat.
- The extension can open and send to a work Chat directly; that send has no source attribution, while a later send from a linked page records the validated page source.

## Implementation map

Primary entry points:

- Extension API routes: `routes/api.php` under `/api/v1/extension/page-contexts`, `/api/v1/extension/page-chats`, and `/api/v1/extension/work-chats`
- Web Chat routes: `GET/POST /chats`, `GET /chats/{conversation}`, `POST /chats/{conversation}/messages`, and `POST /chats/{conversation}/read`
- Domain services: `app/Domain/Conversations/CreateWorkChat.php`, `CreatePageChat.php`, `SendPageMessage.php`, `LinkPageContext.php`, and `UnlinkPageContext.php`
- Models/tables: `Conversation`/`conversations`, `Message`/`messages`, and the current association on `page_contexts`; `database/migrations/2026_09_05_150000_add_creation_key_to_conversations.php` marks idempotent standalone creation
- Read state: `ConversationRead`/`conversation_reads` with `app/Domain/Activity/MarkConversationRead.php`
- Authorization: `app/Policies/ConversationPolicy.php`, `app/Policies/PageContextPolicy.php`, and transactional membership checks in the domain services
- Realtime event and channel: `app/Events/MessageCreated.php` and `routes/channels.php`
- Audit boundary: Spatie Activitylog with `App\Models\OrganizationActivity` and `activity_log`
- Extension interface: `apps/extension/src/sidepanel/main.tsx`
- Web interfaces: `resources/js/pages/chats/index.tsx` and `resources/js/pages/chats/show.tsx`
- Tests: `tests/Feature/Conversations/`, including `WorkChatTest.php`

Related specifications:

- `docs/features/page-contexts.md`
- `docs/features/browser-extension.md`
- `docs/features/inbox-and-unread.md`
