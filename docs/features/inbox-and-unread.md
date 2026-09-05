# Activity and unread state

Status: the minimal page-chat Activity, discovery, and unread milestone is implemented by `docs/plans/001-page-chats-and-linking.md`. Organization chat, DMs, mentions, notification delivery, and broader search remain separately gated.

This document owns the Activity view, chat discovery, unread calculations, read position, recency ordering, and navigation back to sources. Notification delivery belongs to `mentions-and-notifications.md`. The legacy filename remains a stable documentation entry point; Inbox is not the user-facing label.

## Purpose

Activity answers **What changed or needs my attention?** across the team's tools. Chats answers **Where is that discussion?** They are related views, not interchangeable names for the same list.

Activity is not an email inbox, a mandatory zero-inbox workflow, or an organization-wide browsing feed. A chronological per-record history could later be called a timeline; that is not the name of this cross-tool catch-up view.

## Activity contents and relevance

Activity may combine authorized page-chat, organization-chat, DM, and mention activity as those features ship. Task activity and threaded replies appear only after their features are approved and implemented.

Each item identifies its destination type, recognizable chat title, relevant sender and safe preview, activity time, unread state, and navigation action. Where available, distinguish the actual message's source page from the chat's complete list of linked pages.

Keep relevance rules explicit and deterministic. Merely resolving a page or belonging to the organization must not automatically subscribe the user to every page chat or send a notification. Notification defaults and subscriptions remain governed by their owning specification.

For the first page-chat Activity implementation, a chat is relevant after the member has opened and marked loaded history read or has authored a message in it. Chats remains the broader authorized discovery surface. Activity shows the latest event once per relevant chat; it is not a feed of every page chat the organization has ever created.

## Chat discovery and Apps

Chats provides authorized discussion discovery with search and recent activity rather than a permanently expanded channel tree containing every CRM lead. The current page's chat remains directly reachable through This Page even when it is not recent.

Apps is a browsing/filtering aid defined in `page-contexts.md`. For chat discovery, an app filter matches a chat through its currently linked contexts. A chat linked to Supermove and Docusign can appear under either filter but appears once in the combined result set. Its latest message can have a different source app from the selected filter; show the actual message source rather than relabeling it.

History-bearing chats remain discoverable when their last page link is removed, according to the same chat access policy. Do not delete or hide historical communication merely because it no longer has a current source-page association.

## Read state and deduplication

Read state is personal to the member. Track a durable server-owned monotonic read position per member and chat, not per page context or App. Opening the shared chat through any linked page uses and updates that same position.

Mark only content actually loaded and viewed as read. Receiving a background event, resolving a context, linking another page, or discovering a chat in a list must not mark it read.

A message contributes once to unread calculations regardless of how many contexts point to its chat. Retried events and joins through multiple page associations must not inflate counts or create duplicate chat rows. Linking and unlinking must not reset read positions or generate unread copies of existing messages.

Counts must be reproducible after restart and shared by web and extension clients. Unauthorized destinations disappear without leaking counts. Another member's read state remains private.

The implemented read marker stores the greatest message identifier actually loaded while the chat view is visible. Stale requests cannot move it backward. Unread counts include later messages from other members; a member's own messages do not become unread work for that member. Opening either linked page, the web chat, or an Activity result advances the same chat-level marker only after messages are loaded and visible.

## Ordering and filters

Use deterministic relevant recency ordering. The first version supports all and unread views, chat search, and the Apps browsing filter. Mentions use their approved notification behavior. Assigned tasks, archived views, saved filters, advanced subscriptions, and algorithmic or AI prioritization require their own decisions.

The first search is a private database-backed match over authorized chat titles, linked page titles/hosts, and message text. It does not use an external index, fuzzy/vector ranking, excerpts from external page contents, or AI processing.

Permission to view a chat does not require broadcasting every update as a notification; distinguish chat discovery, unread state, and notification delivery.

## Panel and web behavior

The panel offers compact Activity for catch-up; the web application offers more room using the same server state. Selecting an item opens the authorized chat/message once and offers appropriate safe source links.

For a shared page chat, preserve the specific message's source when available and allow navigation to current linked pages. Do not assume the first linked app is the owner or invent a source for an organization chat or DM. Existing deep links should target durable chat/message identity, not depend on a page remaining linked forever.

## Acceptance behavior

A member can leave a page, find relevant authorized activity, open the correct chat, mark loaded messages read consistently across clients, and return to a safe source page. The same shared chat has one unread state when opened from either app. Combined lists and counts are not duplicated by linked contexts. Unlinking preserves historical access, and unauthorized chat, source, and read-state data remain private.

## Implementation map

Primary entry points:

- Read-state migration/model: `database/migrations/2026_09_05_130000_create_conversation_reads_table.php` and `app/Models/ConversationRead.php`
- Domain boundaries: `app/Domain/Activity/ConversationDiscovery.php` and `MarkConversationRead.php`
- Web routes/controller: `GET /activity`, `GET /chats`, `POST /chats/{conversation}/read`, and `app/Http/Controllers/ChatController.php`
- Extension API: `GET /api/v1/extension/discovery` and `POST /api/v1/extension/page-chats/{conversation}/read`
- API controllers/resource: `app/Http/Controllers/Api/V1/ConversationDiscoveryController.php`, `PageConversationReadController.php`, and `app/Http/Resources/ConversationActivityResource.php`
- Web interfaces: `resources/js/pages/activity/index.tsx`, `resources/js/pages/chats/index.tsx`, and `resources/js/pages/chats/show.tsx`
- Extension interface/client: `apps/extension/src/sidepanel/main.tsx` and `apps/extension/src/page-chat/api.ts`
- Tests: `tests/Feature/Activity/` and `tests/Feature/Conversations/ChatIndexTest.php`

Related specifications:

- `docs/features/page-contexts.md`
- `docs/features/page-conversations.md`
- `docs/features/browser-extension.md`
