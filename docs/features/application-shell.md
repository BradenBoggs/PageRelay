# Application shell

Status: implemented for the authenticated React web application; verification is recorded in `docs/plans/003-application-shell.md`.

This document owns the web shell's regions, reusable composition, dimensions, responsive navigation, and interpretation of the September 26 visual reference. `docs/UI.md` owns shared web/extension principles. Chat ownership, linking, provenance, discovery, and read state remain in `page-conversations.md` and `inbox-and-unread.md`.

## Reference and intent

Use the user's September 26, 2026 screenshot and HTML as visual direction, not as a feature specification. `docs/references/application-shell/README.md` records the source and adaptations; `reference-layout.html` is an isolated structural example, not a second application. Original uploads remain conversation reference assets.

Retain the compact dark header, pale navigation, dense three-pane composition, restrained warm accent, persistent linked-page strip, left-aligned messages, and pinned composer. Build reusable React components around actual server data. Do not import the source HTML, CDN scripts, remote avatars, or fictional operational data into production.

## Region contract

**Global header.** SideWire identity, the current organization label, search across authorized SideWire chats, and the existing account menu. The organization label is read-only. Search uses the existing Chats query rather than external customer records. Ctrl/Command + K focuses search.

**Primary navigation.** Activity, Chats, Overview, and Apps filters. Activity and Chats retain different relevance rules. Apps lists actual authorized source hosts when discovery data is available; it does not imply provider integration, synchronized data, external permissions, or one Workspace per domain. Non-discovery screens retain primary navigation and a Browse all chats action. Do not invent counts or status dots.

**Discovery panel.** Current Activity or Chats results, All/Unread filters, Create chat dialog, selection, previews, linked hosts, unread labels, actual result total, and pagination. A selected row uses a durable chat route. Carry the discovery surface, filters, and result page into selection/back navigation. Filtering may exclude the selected chat from the list without silently replacing the open chat. Listing data never marks it read.

**Main content.** A feature-owned slot. Chat routes compose a header, linked-page strip, independently scrolling history, and composer. Without a selected chat, desktop shows a selection prompt. Settings and Overview use the available main width without inheriting the discovery panel or a giant enclosing card. Authentication and extension-connect layouts are unchanged.

## Dimensions, tokens, and scrolling

The frame uses viewport height (`100dvh` with `100vh` fallback), not body scrolling. The desktop header is 48px; primary navigation is 240px; discovery is 320px; main content absorbs the remainder. `resources/css/application-shell.css` owns semantic `--sw-*` color, surface, border, radius, and dimension tokens. Use the existing application's font and icon infrastructure. No runtime Tailwind CDN, icon font, or remote avatar dependency is introduced.

Navigation, discovery results, history, and normal page content scroll independently. Shrinkable flex children have explicit minimum-size and overflow contracts. Discovery and history declare Inertia scroll regions. Keep the composer reachable and wrap long message text. Truncate long page labels while retaining the source host.

At 1100px and above, show all three panes. At 768–1099px, move primary navigation into the existing accessible Sheet and retain list/detail. Below 768px, show either the list or selected chat, with an explicit Back to chat list action. The narrow header is 56px; composer padding respects safe areas. The Chrome side panel remains a separate narrow surface, not a compressed desktop layout.

## Messages and composition

Render plain, escaped React text, consistently left-aligned, with author, timestamp, and optional recorded source. A source label means SideWire recorded that context when the message was sent; it does not indicate a message imported from another service. Linked pages are current routes into the shared history, not owners of the history.

Direct web sends use the existing endpoint with no inferred page source. Enter creates a newline; Ctrl/Command + Enter submits except during IME composition. A synchronous submit guard and processing state prevent repeated clicks; success clears the draft and rotates the idempotency key. Validation failure preserves input.

An in-memory shell cache preserves drafts and scroll positions by chat during in-app navigation. The provider is keyed by member and organization. Drafts do not move between chats or silently acquire an external source. This is session UI state, not a Drafts destination or a server/localStorage/cross-device feature. Full reload or logout clears it.

Realtime uses the existing private chat channel. Refresh history, the last loaded message identifier, and discovery data; do not force a reader away from older content. Follow new content only while already near the end. The existing latest-100-message server limit is unchanged; this milestone does not add older-history pagination.

Advance the read position only when the last loaded message intersects the actual history scroller and the document is visible. Background discovery and hidden history do not count. Server-owned read positions remain authoritative and monotonic.

## Supported actions versus the mockup

Create chat, search, filtering, pagination, account/settings, direct sending, and linked-page return links use implemented flows. Page linking remains the existing authorized extension workflow. The mockup does not approve a new web linking endpoint.

Do not render inactive Mentions, Starred, Drafts, Assign, dispatch queues, participant controls, attachments, rich formatting, slash commands, notification bells, synchronization timestamps, or latency numbers merely because they appear in the reference. These remain subject to their owning feature approvals. No new database model, migration, browser permission, provider integration, or organization-switching behavior is introduced.

## Accessibility and states

Use actual links/buttons, accessible icon names, a skip link, labeled regions, visible focus, non-color selected/unread indicators, and existing Dialog/Sheet/account-menu primitives. Keep submission/validation announcements scoped; do not announce the entire message history on every refresh. Respect reduced motion and forced colors.

Provide intentional no-selection, no-chats, empty-Activity, no-match, nothing-unread, no-messages, and no-linked-pages states. Show pending submissions and recoverable validation errors. Existing authentication/authorization errors remain server-owned. Do not fabricate an offline/synchronized indicator. Session expiry, unexpected network failure, reconnect, screen-reader behavior, zoom, and real browser navigation need end-to-end verification before release readiness is claimed.

## Implementation map

- Active frame: `resources/js/layouts/app-layout.tsx`, selected by existing `resources/js/app.tsx`.
- Global chrome and session UI cache: `resources/js/components/application-shell/`.
- Discovery/header/composer: `resources/js/components/chats/`.
- Pages: `resources/js/pages/chats/` and existing `pages/activity/index.tsx`.
- Contracts/navigation: `resources/js/types/chat.ts`, `resources/js/lib/chat-navigation.ts`.
- Web tokens and responsive regions: `resources/css/application-shell.css`.
- Server composition: `app/Http/Controllers/ChatController.php`; existing `ConversationDiscovery` remains the authorization/filter source.
- Tests: `tests/Feature/Conversations/ApplicationShellTest.php`, existing Conversation and Activity suites.

The starter sidebar template is no longer the active AppLayout composition. Keep unrelated starter components rather than making this an opportunistic cleanup. New feature pages extend this frame instead of copying global chrome.
