# SideWire UI and extension experience

## Purpose

SideWire has one design system expressed through a narrow Chrome side panel and a responsive web application. Share visual language and components without pretending these surfaces have the same information density or navigation needs.

This document owns application-wide interface rules. Feature-specific screens and states belong in their owning feature documents.

## Approved GPS UI refinement — October 8, 2026

Braden requested a substantial UI/UX overhaul and a more polished app after the pilot implementation. This approves the presentation and navigation refinement of the existing GPS communication slice, not the remaining Slack-style proposals. The candidate is prepared against `1e6ba769f4d5e6674e4103b61312746f0e9d9014`; its execution and verification status belong to [plan 005](plans/active/005-gps-communication-pilot.md).

Use warm neutral surfaces, dark readable text, restrained terracotta emphasis, consistent initials avatars, and fine dividers. Prefer a quiet, light header over the historical dark-header reference. No gradients, decorative grids, fabricated online indicators, or inactive feature toolbars. Shared palette, typography and dimensions live in `resources/css/sidewire-tokens.css`; the existing shell and shared messaging components consume them.

## Experience principles

SideWire should feel calm, lightweight, and native beside a team's tools. The source website remains the primary work surface; SideWire provides context without competing for attention.

- Prioritize This Page and its linked Chat while making durable work Chats directly usable from the side panel.
- Make the current source page and the shared chat distinct and recognizable.
- Keep common actions reachable without deep navigation.
- Preserve drafts and scroll position when safe, without silently changing a draft's chat or source attribution.
- Distinguish browser-tab changes, page-context changes, and chat changes: two linked contexts can open the same chat.
- Prefer a clean light theme for the initial product. Dark mode should not delay a coherent first release.
- Avoid generic AI-product styling, excessive gradients, glowing effects, oversized marketing treatments, and decorative cards around every element.

## Vocabulary and navigation

Use **Chat**, **Activity**, **Chats**, **Apps**, and **This Page** according to `docs/PRODUCT.md`. Conversation and Inbox may remain internal names and filenames, not competing interface labels. The GPS pilot uses **Messages**, **Direct**, and **Thread** for its approved messaging destinations and one-level replies. **Work chats** labels the retained source-aware discovery screen, not a second copy of history.

Activity is for catching up; Chats is for finding a discussion; Apps groups or filters existing contexts/chats. Do not create one workspace per domain, one mandatory channel per external record, an expanded tree of every CRM lead, or a page/channel/hybrid onboarding selector.

Retain the existing default Workspace internally. Do not require its selection before the user can chat beside a page.

## Reuse before invention

Reuse an existing shared component or layout first, then compose, extend, and only finally create a new component when no established pattern fits.

Use semantic color, type, spacing, radius, border, shadow, and state tokens. Do not accumulate arbitrary Tailwind values or a separate design system for each feature.

## Side-panel shell

The panel must work at realistic narrow widths and variable heights; it is not a desktop dashboard squeezed into a column.

The normal This Page view has a compact current-page header and safe source-page action. The two primary tabs are **This Page** and **Messages & DMs**. The latter includes shared work Chats, private one-to-one DMs and **Mentions & replies**. Notification preferences live behind a labeled bell button; account/disconnect actions are separate. When a Chat is linked, its history is the main scroll region and the composer stays reachable. When no Chat is linked, replace the history and composer with compact actions to create a Chat for the page or, for eligible managers, link an existing work Chat.

The Messages & DMs directory lists durable named work Chats, including newly created empty Chats, and authorized one-to-one conversations. Selecting one opens its history and composer inside the panel without requiring an external page. A direct Chat send has no inferred source-page attribution. Provide a clear return to Chats and preserve the separate This Page destination.

For a work Chat with linked pages, show its recognizable title and linked-page list without implying that the current app owns the history. Show per-message source attribution when recorded. A message sent while viewing Docusign remains attributed to Docusign even when read beside Supermove.

Long titles and URLs truncate without hiding the source domain. Do not make full raw URLs primary labels. Unsupported, signed-out, offline, inaccessible, and unresolved states must explain what happened and offer a safe next action.

No chat yet is an intentional state. Merely visiting a page or editing the prefilled creation form must not persist a context, create a visible empty discussion, or notify the organization.

Do not overlay SideWire UI into the host page during the MVP.

## Web-application shell

The authenticated web shell is implemented through `resources/js/layouts/app-layout.tsx`. Its region, responsive-layout, token, and reference rules are owned by `docs/features/application-shell.md`; the September 26 reference is indexed in `docs/references/application-shell/README.md`. Compose new web features into this frame rather than copying its header and navigation. The browser extension keeps its separate narrow shell.

Use the web application for authentication, onboarding, organization administration, Activity, Chats/search, billing, and workflows needing more width. Use the same server chat and read state as the extension.

Deep links open the relevant authorized chat or message and preserve a source context when supplied. They must not depend on a page remaining linked forever. A web message without an explicitly selected source has no inferred external-page attribution.

## Interaction patterns

Use full pages for primary destinations and substantial forms, dialogs for short decisions or confirmations, sheets for contextual inspection, and popovers/dropdowns for lightweight controls. Creating a work Chat is a short named action that may use an inline form in Chats; linking the current page remains a focused dialog.

The page-linking dialog follows `docs/features/page-conversations.md`. It distinguishes sharing an entire chat from posting a related link and explains when an existing nonempty history prevents linking. Do not use the ambiguous term unused page. Unlink confirmation explains that existing messages remain in the shared chat.

Show linking controls only to eligible roles. Do not expose inaccessible chat titles or previews through the picker. Provide a reload/retry path for stale links without silently choosing another chat.

Messages prioritize author, time, content, recorded source, and delivery state. Do not add reactions, nested threads, rich-text toolbars, attachments, or AI actions before approval.

The creation form uses explicit labels, identifies which page information was detected automatically, allows deliberate edits, explains that submission stores organization data, and retains input after validation or network failure. Its primary action is **Create chat**. The composer appears only for an existing or explicitly created chat and needs an accessible name, clear multiline/submission behavior, duplicate prevention, sending/failure states, and recoverable draft text. Drafts remain bound to their intended chat and source context; navigating to another linked page must not silently relabel a draft.

## Message and attention presentation

Use a legible left-aligned message timeline, date separators and restrained author grouping. Group consecutive messages only when author, source, thread and calendar day match and the timestamps are close. Keep timestamps available on hover and keyboard focus. Highlight only recipients resolved by the server; plain @text and email addresses must not acquire mention semantics through styling.

Keep the conversation visible beside a thread when the message stage has at least 760px; otherwise show a focused thread with a clear back action. Main-chat and thread composers keep separate source-bound in-memory drafts. A hidden main pane must not mark its messages read. Refresh merges already loaded history rather than dropping earlier pages, and new messages do not force a reader away from older content.

The composer provides an eligible-coworker mention picker, recipient chips, a clear send action, sending/retry feedback and source disclosure when relevant. Enter inserts a newline; Ctrl/Command + Enter sends, except during IME composition. Mention suggestions support arrows, Enter and Escape. Pending uncertain sends retain the same immutable payload and request identity.

Desktop permission/test/pause controls belong in an accessible notification dialog, not a persistent full-width control block above every conversation. Display the real connection and preference states. This UI change does not change desktop delivery, privacy, notification scope or server claims.

## Responsive and accessible behavior

Test resizing, zoom, long words and titles, large font settings, keyboard navigation, screen-reader names, focus order, reduced motion, and high-contrast states at realistic panel widths.

Icon-only controls need accessible names and meaningful tooltips. Do not rely only on color for unread, error, or task states. New-message announcements must not overwhelm assistive technology.

## Required states

Account for signed out, expired session, loading/sync, no context, no current chat, no messages, unsupported page, offline/reconnecting, sending/failure, permission denial, removed membership, linking conflict, empty Activity/search, and unexpected request failure.

A historical chat with no current linked pages is not a missing-history error. Do not delete its messages or invent an external source. Feature-specific behavior follows its owning specification.
