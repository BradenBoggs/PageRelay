# Application shell and standalone web experience

Status: **GPS messaging UI refinement approved October 8, 2026; implementation candidate on the GPS pilot review branch, not released.** The historical shell remains the foundation. The approved refinement covers the existing pilot messages, DMs, mentions, threads and notification controls under [plan 005](../plans/active/005-gps-communication-pilot.md). Other channel/resource/draft expansions below remain proposals.

This document owns web regions, composition, navigation, dimensions, and responsive behavior. Individual feature documents own their actions and permissions. The extension retains its separate narrow shell.

## Reference and visual continuity

The October 8 UI approval supersedes the September 26 dark-header treatment for the messaging pilot: use a light compact header, pale navigation, restrained warm accent, list/detail composition, left-aligned messages, optional linked-page strip, and reachable composer. `docs/references/application-shell/README.md` and its isolated `reference-layout.html` record the reference. Do not import fictional data, CDN scripts, remote avatars, or sample controls as approved features.

Reuse the existing React layout and shared semantic tokens. This approved UI overhaul does not authorize decorative enclosing cards, unimplemented feature controls or separate visual languages for each feature.

## Navigation contract

The web app must function as the primary communication workspace without an extension or source page. Keep a read-only Organization identity in the header; this proposal does not add organization switching. The existing global search remains authorized work-chat/source discovery. It is not claimed to search DM bodies or all retained messages. The messaging directory has a clearly labeled current-page filter, not a second universal search.

The implemented candidate uses one primary rail on messaging routes: **Messages**, **Direct**, **Activity**, **Work chats**, and **Overview**. Messages opens the all-conversation directory; Direct and Activity are query views of the same communication surface. Work chats retains the existing source-aware discovery route. Remove the old duplicate Messages text link and expanded notification banner. A dedicated Threads destination and channels remain expansions. Favorites and joined/recent conversations provide fast access without listing every external record. Later, Drafts, Tasks, Files, and people/settings destinations appear only when implemented and entitled. Distinguish labels such as **Later** (saved items) from actual product-release status.

Apps belongs in an optional filter/browse surface or channel source details, not as a required domain-based web hierarchy. No empty list of connected apps or extension installation gate may prevent communication. Avoid duplicate destinations for existing work Chats and proposed channels representing the same history.

The discovery panel owns result selection, All/Unread and relevant filters, search, create actions, previews, actual counts, and pagination. Carry filters, selected result, and return position through navigation. A filter excluding the currently open chat must not silently replace it. Previews and list visibility do not mark history read.

## Main content and detail surfaces

Chat detail composes title, audience/status, optional description/topic and linked pages, independently scrolling history, and composer. A thread may occupy a contextual detail pane at sufficient width; narrow layouts use a focused thread view with a clear return path. Do not create an unusable four-pane layout on ordinary laptop widths.

Show current linked pages separately from the historical source of an individual message. A chat without pages is complete, not an error. Offer deliberate add/link source actions only to eligible actors and show access/lifecycle restrictions. General and DMs do not offer primary page linking.

Shared files/pins/canvas/list surfaces appear as contextual resources after their features exist. People, settings, and administrative pages use the main width without a forced chat discovery column or giant surrounding card. Never present inactive buttons as though the functionality ships.

## Dimensions and scrolling

Retain viewport-height framing (`100dvh` with fallback). The candidate uses a 60px header, an 82px labeled messaging rail (76px on tablet), a 300px conversation directory (270px in narrower compositions), and a 340px thread pane only when the conversation stage is at least 760px. Non-messaging routes retain the expanded navigation. `resources/css/sidewire-tokens.css` owns shared semantic `--sw-*` dimensions, colors and surfaces; `application-shell.css` and the messaging stylesheet own their respective compositions.

At wide widths use rail, directory, conversation and, only when it fits, a contextual thread. At 768–1099px the messaging rail remains compact while other web pages use the existing accessible Sheet navigation. Below 768px the primary navigation uses the Sheet, and messaging shows either the directory or selected conversation with a clear back action and safe-area composer spacing. Thread/resource panes replace or collapse another region when needed. Navigation, results, history, and ordinary page content scroll independently with defined minimum-size/overflow contracts.

The target supports all retained history with stable older-message pagination and jump-to-message context. The GPS pilot provides older-message pagination; the historical latest-100 limit is not the candidate UI contract. Preserve scroll while loading older messages; follow new arrivals only when already near the end.

## State, composition, and accessibility

Common composer behavior follows [Messaging](messaging-and-composer.md); persistent drafts follow [Drafts](drafts-and-scheduled-messages.md). Preserve source/destination binding, IME-safe submission, failed input, and separate thread drafts. The current shell's in-memory cache is not proof that cross-device drafts exist.

Read state advances only for genuinely viewed content or explicit mark-read actions, never because a notification, background tab, hidden pane, or search preview was rendered. Thread and main-chat progress remain distinct.

Use labeled regions, actual links/buttons, visible focus, skip navigation, accessible menus/dialogs, non-color unread states, reduced motion, and bounded announcements. Ctrl/Command + K should open/focus the authorized search/quick-navigation experience without conflicting with active composition. Provide keyboard access to message actions without requiring hover.

Design meaningful no-selection, no-chats, empty Activity, no-match, no-unread, empty-thread, no-pages, archived, access-lost, sending, validation, reconnecting, and expired-session states. Do not fabricate online/synchronized indicators or numeric performance claims.

## Acceptance behavior

An organization can create channels, send DMs, find retained history, manage attention, and navigate on a narrow mobile browser without installing the extension. Opening a thread/resource does not lose the chat draft or collapse useful navigation unpredictably. Search, menus, uploads, history, and back navigation remain usable by keyboard and assistive technology. Private data disappears when authorization changes.

## Implementation map — existing shell and GPS UI candidate

- Frame: `resources/js/layouts/app-layout.tsx`, selected by `resources/js/app.tsx`.
- Global regions/cache: `resources/js/components/application-shell/`.
- Chat composition: `resources/js/components/chats/`.
- Pages: `resources/js/pages/chats/`, `resources/js/pages/activity/index.tsx`.
- Types/navigation: `resources/js/types/chat.ts`, `resources/js/lib/chat-navigation.ts`.
- Shared tokens: `resources/css/sidewire-tokens.css`; shell composition: `resources/css/application-shell.css`.
- Messaging page: `resources/js/pages/collaboration/index.tsx`.
- Shared UI: `resources/js/components/collaboration/board.tsx`, `conversation.tsx`, `composer.tsx`, `notifications.tsx`, `ui.tsx`, and `workspace.css`.
- Delivery/provider: `provider.tsx`; existing API and draft store: `client.ts`; pure display helpers: `presentation.ts`. The `workspace.tsx` barrel preserves existing import entry points.
- Display-helper tests: `scripts/collaboration-ui.test.mjs`; authenticated pilot scenario: `tests/Browser/pilot.cjs`. The latter is updated but has not run against this candidate.
- Server composition: `app/Http/Controllers/ChatController.php`, existing `ConversationDiscovery`.
- Existing tests: `tests/Feature/Conversations/ApplicationShellTest.php`, Conversation and Activity suites.

Keep unrelated starter components; this is not approval for opportunistic cleanup. New feature pages extend this frame rather than copying it.
