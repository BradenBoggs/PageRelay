# Activity, discovery, following, and unread state

Status: **Draft for owner review. Core target.** The documented baseline implements minimal work-Chat discovery, Activity relevance, Apps filtering, and a monotonic chat read position under `docs/plans/001-page-chats-and-linking.md`. Broader audiences, thread state, explicit following, and manual mark-unread are proposed. See [review scope](README.md).

This document owns catch-up views, relevance, discovery, and personal read state. [Notifications](mentions-and-notifications.md) owns attention events and delivery; [Threads](threads.md) owns reply following/progress. Inbox remains a filename, not the interface label.

## Separate three questions

**Chats** helps locate a discussion, including authorized public channels the member has not joined and empty named channels. **Activity** shows relevant changes and attention events. **Notifications** decide whether an event should interrupt the user. Access, participation, following, unread state, and alert delivery are not interchangeable.

The web application must offer these without a browser page. The extension can show compact equivalents backed by the same server state. Do not turn Activity into an organization-wide browsing feed or a compulsory zero-inbox workflow.

## Relevance and discovery

The baseline makes a work Chat relevant after the member views/marks loaded history read or authors a message. The proposed target adds explicit following for accessible channels and deterministic relevance for joined channels, participating DMs, followed threads, mentions, and personal reminders. Joining General is a disclosed exception; page resolution, search previews, page linking, and simply opening a public channel do not silently opt users into notifications.

Joining/following after history already exists must not send old alerts. Show retained history normally and establish an attention baseline deliberately; do not claim unseen old messages were read. Leaving/unfollowing removes subscription-driven attention while keeping actual access and personal read history governed by the channel/DM rules. Explicit mentions may still be relevant when authorized, subject to notification preferences.

Offer All, Unread, Mentions, and relevant Threads/DM filters once their features exist. Favorites and custom personal sidebar sections organize navigation, not permissions or subscriptions. A high-volume collection of page-linked chats belongs in search/recent discovery, not an automatically expanded sidebar containing every CRM lead.

Apps filters match currently linked authorized contexts. A chat with two matching pages appears once. Historical message-source filtering is a separate explicitly labeled option. A latest-message preview retains its actual recorded source even when a different linked app matched the filter.

## Read positions and manual actions

Keep server-owned, per-member progress for each chat and independently for threads. Automatic read advancement occurs only for content actually loaded and visible; receipt of an event, opening a background tab, listing a preview, and source-page resolution do not count. The baseline monotonic marker must not be moved backward by a stale client.

**Mark unread from here** is an intentional personal revisit marker, not falsifying another person's delivery/read receipt or rewriting message timestamps. Represent its semantics separately from ordinary monotonic read advancement. A newer explicit revisit action must not be immediately erased by a delayed automatic read request from another tab; reopening/clearing it is intentional. Indicate the revisit location even when its messages were previously viewed.

**Mark chat read** and **Mark all read** are explicit acknowledgements of the authorized scope as of a captured server snapshot. They may clear unviewed messages because the user deliberately requested it; newer arrivals remain unread. State clearly whether a bulk action includes followed threads and filters; do not clear hidden destinations by accident. Background pagination and search never invoke these actions.

Opening either linked page, web chat, or exact message uses the same underlying progress. Thread opening does not clear unrelated main-chat messages; viewing the root alone does not clear unseen replies. The member's own posts are not unread work for that member. Another user's read progress stays private; public read receipts are not proposed.

## Counts, events, and lifecycle

Unread-message counts count eligible messages once. Attention badges count actionable notification records once; label them rather than mixing message, chat, and alert counts into an unexplained number. A mention in a followed thread is one recipient event even when visible in several filters. Multi-page joins and retried events must not inflate results.

Marking a notification seen does not prove its message was read. Reading the exact message may acknowledge its corresponding attention event. Reactions/edits do not turn all prior history unread. Deletion removes content from previews; a tombstone may preserve a safe navigation destination. Unlinking pages does not reset progress. Archived channels preserve historical access/read state but generate no new messages while archived.

Authorization is checked before rows, counts, suggestions, previews, and subscriptions are returned. Access loss removes private destination metadata and queued delivery; stale client content is cleared when access is revoked/revalidated. Never expose private unread counts through a global badge.

## Acceptance behavior

A person can find a discussion, catch up on relevant changes, mark a place to revisit, and clear an explicit snapshot consistently across web/extension. Viewing a public channel does not secretly subscribe them. Several linked pages yield one chat and one message count. Hidden tabs and thread roots do not mark unseen messages read. Concurrent explicit mark-unread and stale automatic read updates resolve predictably without erasing the latest user intent.

## Implementation map — documented baseline only

- Read state: `database/migrations/2026_09_05_130000_create_conversation_reads_table.php`, `app/Models/ConversationRead.php`.
- Domain: `app/Domain/Activity/ConversationDiscovery.php`, `MarkConversationRead.php`.
- Web: `GET /activity`, `GET /chats`, `POST /chats/{conversation}/read`, `app/Http/Controllers/ChatController.php`.
- Extension: `GET /api/v1/extension/discovery`, `POST /api/v1/extension/page-chats/{conversation}/read`.
- API: `app/Http/Controllers/Api/V1/ConversationDiscoveryController.php`, `PageConversationReadController.php`, `app/Http/Resources/ConversationActivityResource.php`.
- UI: `resources/js/pages/activity/index.tsx`, `resources/js/pages/chats/`, `apps/extension/src/sidepanel/main.tsx`, `src/page-chat/api.ts`.
- Existing tests: `tests/Feature/Activity/`, `tests/Feature/Conversations/ChatIndexTest.php`.

These entry points do not establish implementation of the expanded read/notification semantics. Reference coverage: [Slack catch-up and preferences catalog](https://slack.com/help/categories/200111606-Using-Slack).
