# Durable Chats, linked pages, and message provenance

Status: **Draft for owner review. Core target.** The baseline documents durable work Chats, explicit creation, manual linking, and source attribution as implemented through `docs/plans/001-page-chats-and-linking.md` and `002-durable-work-chats.md`; manual Chrome verification remained pending. Public/private channel audiences and the new common messaging features are proposals, not implementation claims.

This document owns page-to-chat association, explicit page-aware creation, concurrency, unlinking, and historical source attribution. [Channels](team-conversations.md) owns shared-chat audiences/lifecycle, [Page contexts](page-contexts.md) owns identity, and [Messaging](messaging-and-composer.md) owns common content/delivery. Existing `Conversation`, the internal `page` discriminator, and this filename remain compatibility names, not duplicate product concepts.

## One history, optional pages

A shared Chat has its own Organization/default-Workspace ownership and can exist before any external page is linked. Proposed channels extend that durable experience; do not create a second copy of existing work-Chat histories or require a rename-only migration.

A page context has zero or one current primary chat. An eligible shared chat has zero, one, or many contexts from one or several Apps. The external records remain distinct; messages exist once. Neither the first context nor its App owns the history. DMs and protected General are not primary page-link destinations. A channel topic need not represent an external record.

The documented baseline permits all active members to discover/use work Chats. That must not be mistaken for the target permission rule once private channels exist. Proposed target access follows the current channel audience everywhere, including context metadata and linked-page lookup. Existing public histories must not silently become private or disappear during adoption.

## Explicit creation

Any member allowed to create channels may create a named shared Chat directly in SideWire without a page. Empty named chats are durable and discoverable according to audience, but do not generate message unread counts or Activity events simply by existing.

For This Page with no eligible existing association, show **Create chat for this page** and, for eligible managers, **Link to existing chat**. Do not show a message composer that creates a chat implicitly on first send. Creation displays editable Page title, Page URL, and Chat name, plus a clearly disclosed audience. Prefill safe browser metadata when available; the user may correct it. Explain what will be stored.

An explicit submission validates and normalizes the URL, checks current membership and creation permission, and atomically creates/reuses the context and empty chat. No message is fabricated. Retries or competing creation/link requests cannot make duplicate contexts, overwrite a hidden association, or expose an unauthorized destination. The web app may offer the same deliberate operation using a manually supplied URL; the target does not require installing Chrome.

## Linking permission and workflow

Retain the proposed initial rule that only Organization owners/administrators may link/unlink. Channel-manager status alone does not grant page-linking authority. The actor must also have actual access to both relevant chats and contexts; organization role does not bypass a private audience. Confirm this restriction during owner review rather than silently broadening it.

Links stay within the Organization/default Workspace. The destination must be an authorized, active, eligible shared chat, not a DM, protected General, retired chat, or archived channel. Opening a source page never joins someone to the destination or mirrors the source service's permissions.

From the page, the actor searches eligible chats, selects one, reviews its audience and linked-page meaning, and confirms: **This page will open the same complete chat history.** Linking is not merely saving a bookmark. If the association already points to that destination, return idempotent success without replaying old messages or notifications.

## Empty-history restriction

A context may be reassigned only when it has no chat or its different current chat has never accepted message history. A message posted through any other linked context still counts. Filtering, hiding, author deletion, moderation, tombstones, or later retention cleanup cannot make a once-nonempty chat eligible for automatic reassignment.

Example: a work Chat has 20 messages and another page has no chat. Linking that page is allowed. If the second page already opens a different chat with messages, combining them is blocked. The product must not silently merge, move, copy, discard, or split histories.

When reassigning from an empty chat, preserve all other context associations. An empty abandoned chat may be retired only without destroying history or unrelated links. Normal channel archive/deletion permissions still apply. General related references can always remain ordinary safe links instead of primary associations.

## Concurrency and recovery

At mutation time recheck active membership, organization/workspace, linking role, channel access, target lifecycle, current mapping, and empty-history eligibility. Guard against a concurrent first send and enforce at most one current association per context.

Stale mappings, conflicting relinks, access removal, or a newly nonempty source return a recoverable conflict; they never silently choose another destination. A failed draft retains its intended chat, thread, and source. Retrying an already-successful send returns its original authorized result, not a new message at the latest mapping.

Link/unlink changes are audited with actor, context, old/new chat identifiers, and server time. Keep sensitive raw URLs and message bodies out of routine logs. Linking does not alter seats, read positions, membership, subscriptions, or history identity.

## Unlinking and historical attribution

An eligible actor may unlink after confirming that history stays in its current chat. Unlinking changes future page routing, not prior messages, audience, unread state, or delivered notifications. A chat remains discoverable to its authorized audience after its last page is removed. Revisiting that page shows an appropriate no-current-chat state; it does not reconstruct or split old history.

Each message/reply may explicitly select a source context. Validate that the source belongs to the same organization/workspace and is currently linked to the submitted chat at send time. A direct web, Activity, or DM send has no inferred browser source. A thread reply does not inherit its parent's source merely by replying.

Show wording such as **Sent while viewing [source app]**. This means SideWire recorded the selected context, not that the external app produced or imported the message. Attribution is not proof of external-record access or authorship.

Preserve the permitted safe historical source information with the original message's access boundary. Later unlinking/relinking, changed titles, visibility changes, or association deletion must not relabel an old message or fetch newly private context metadata into an older public preview. Never store rejected credential-bearing URLs as provenance. Current linked pages and historical message sources are distinct UI concepts.

## Presentation and shared behavior

Show a recognizable chat title, current audience, linked-page list, and optional actual source per message. An archived linked destination remains explicitly read-only rather than causing a replacement chat. Directly opening a chat in the extension does not attach the current tab; returning to This Page resolves normally.

History, threads, notifications, search, files, reactions, and unread state follow one underlying chat/message identity, not one copy per page. Proposed rich composition, full-history pagination, and live extension delivery are owned by their feature documents; the baseline's plain-text/manual-refresh limits are not target requirements.

## Acceptance behavior

A chat works with no pages; two pages from different apps can open exactly one history. Explicit concurrent creation yields one context/chat without a fabricated message. Linking a page with no/empty history succeeds only for an authorized actor; nonempty-history reassignment fails without changes, including after deletion/retention. Unlinking preserves history and accurate source labels. Private metadata never leaks through link pickers or page resolution. No action implicitly changes audience, source attribution, subscriptions, or billable seats.

## Implementation map — documented baseline only

- Extension routes: `routes/api.php` under `/api/v1/extension/page-contexts`, `/api/v1/extension/page-chats`, and `/api/v1/extension/work-chats`.
- Web routes: `GET/POST /chats`, `GET /chats/{conversation}`, `POST /chats/{conversation}/messages`, and `POST /chats/{conversation}/read`.
- Domain services: `app/Domain/Conversations/CreateWorkChat.php`, `CreatePageChat.php`, `SendPageMessage.php`, `LinkPageContext.php`, and `UnlinkPageContext.php`.
- Models/tables: `Conversation`/`conversations`, `Message`/`messages`, and current association on `page_contexts`; standalone-creation migration `database/migrations/2026_09_05_150000_add_creation_key_to_conversations.php`.
- Read state: `ConversationRead`/`conversation_reads`, `app/Domain/Activity/MarkConversationRead.php`.
- Authorization: `app/Policies/ConversationPolicy.php`, `PageContextPolicy.php`, and transactional membership checks.
- Realtime/audit: `app/Events/MessageCreated.php`, `routes/channels.php`, Spatie Activitylog using `App\Models\OrganizationActivity`/`activity_log`.
- UI: `apps/extension/src/sidepanel/main.tsx`, `resources/js/pages/chats/index.tsx`, and `show.tsx`.
- Existing tests: `tests/Feature/Conversations/`, including `WorkChatTest.php`.

No new endpoint, migration, or implementation sequence is prescribed by this review.
