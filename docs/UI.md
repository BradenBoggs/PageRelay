# SideWire UI and extension experience

## Purpose

SideWire has one design system expressed through a narrow Chrome side panel and a responsive web application. Share visual language and components without pretending these surfaces have the same information density or navigation needs.

This document owns application-wide interface rules. Feature-specific screens and states belong in their owning feature documents.

## Experience principles

SideWire should feel calm, lightweight, and native beside a team's tools. The source website remains the primary work surface; SideWire provides context without competing for attention.

- Prioritize This Page and its chat in the side panel.
- Make the current source page and the shared chat distinct and recognizable.
- Keep common actions reachable without deep navigation.
- Preserve drafts and scroll position when safe, without silently changing a draft's chat or source attribution.
- Distinguish browser-tab changes, page-context changes, and chat changes: two linked contexts can open the same chat.
- Prefer a clean light theme for the initial product. Dark mode should not delay a coherent first release.
- Avoid generic AI-product styling, excessive gradients, glowing effects, oversized marketing treatments, and decorative cards around every element.

## Vocabulary and navigation

Use **Chat**, **Activity**, **Chats**, **Apps**, and **This Page** according to `docs/PRODUCT.md`. Conversation and Inbox may remain internal names and filenames, not competing interface labels. Thread is reserved for separately approved message replies.

Activity is for catching up; Chats is for finding a discussion; Apps groups or filters existing contexts/chats. Do not create one workspace per domain, one mandatory channel per external record, an expanded tree of every CRM lead, or a page/channel/hybrid onboarding selector.

Retain the existing default Workspace internally. Do not require its selection before the user can chat beside a page.

## Reuse before invention

Reuse an existing shared component or layout first, then compose, extend, and only finally create a new component when no established pattern fits.

Use semantic color, type, spacing, radius, border, shadow, and state tokens. Do not accumulate arbitrary Tailwind values or a separate design system for each feature.

## Side-panel shell

The panel must work at realistic narrow widths and variable heights; it is not a desktop dashboard squeezed into a column.

The normal This Page view has a compact current-page header, safe source-page action, the associated chat as the main scroll region, a reachable composer, and compact navigation to Activity, Chats, and account state as those features ship.

For a shared page chat, show its recognizable title and linked-page list without implying that the current app owns the history. Show per-message source attribution when recorded. A message sent while viewing Docusign remains attributed to Docusign even when read beside Supermove.

Long titles and URLs truncate without hiding the source domain. Do not make full raw URLs primary labels. Unsupported, signed-out, offline, inaccessible, and unresolved states must explain what happened and offer a safe next action.

No chat yet is an intentional state. Merely visiting a page should not create a visible empty discussion or notify the organization.

Do not overlay SideWire UI into the host page during the MVP.

## Web-application shell

Use the web application for authentication, onboarding, organization administration, Activity, Chats/search, billing, and workflows needing more width. Use the same server chat and read state as the extension.

Deep links open the relevant authorized chat or message and preserve a source context when supplied. They must not depend on a page remaining linked forever. A web message without an explicitly selected source has no inferred external-page attribution.

## Interaction patterns

Use full pages for primary destinations and substantial forms, dialogs for short decisions or confirmations, sheets for contextual inspection, and popovers/dropdowns for lightweight controls.

The page-linking dialog follows `docs/features/page-conversations.md`. It distinguishes sharing an entire chat from posting a related link and explains when an existing nonempty history prevents linking. Do not use the ambiguous term unused page. Unlink confirmation explains that existing messages remain in the shared chat.

Show linking controls only to eligible roles. Do not expose inaccessible chat titles or previews through the picker. Provide a reload/retry path for stale links without silently choosing another chat.

Messages prioritize author, time, content, recorded source, and delivery state. Do not add reactions, nested threads, rich-text toolbars, attachments, or AI actions before approval.

The composer needs an accessible name, clear multiline/submission behavior, duplicate prevention, sending/failure states, and recoverable draft text. Drafts remain bound to their intended chat and source context; navigating to another linked page must not silently relabel a draft.

## Responsive and accessible behavior

Test resizing, zoom, long words and titles, large font settings, keyboard navigation, screen-reader names, focus order, reduced motion, and high-contrast states at realistic panel widths.

Icon-only controls need accessible names and meaningful tooltips. Do not rely only on color for unread, error, or task states. New-message announcements must not overwhelm assistive technology.

## Required states

Account for signed out, expired session, loading/sync, no context, no current chat, no messages, unsupported page, offline/reconnecting, sending/failure, permission denial, removed membership, linking conflict, empty Activity/search, and unexpected request failure.

A historical chat with no current linked pages is not a missing-history error. Do not delete its messages or invent an external source. Feature-specific behavior follows its owning specification.
