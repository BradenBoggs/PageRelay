# SideWire UI and extension experience

## Purpose

SideWire has one design system expressed through two related surfaces: a narrow Chrome side panel used beside another website, and a responsive web application used for broader workflows. They should share visual language and components without pretending they have the same information density or navigation needs.

This document owns application-wide interface rules. Feature-specific screens and states belong in the relevant feature document.

## Experience principles

SideWire should feel calm, lightweight, and native beside a team's existing tools. The source website remains the primary workspace; SideWire provides useful context without competing for attention.

- Prioritize the current page's conversation in the side panel.
- Make the source site and current page context unmistakable.
- Keep the most common actions reachable without deep navigation.
- Preserve drafts and scroll position when the active tab changes whenever safe and practical.
- Clearly distinguish changing tabs from changing SideWire contexts.
- Prefer a clean light theme for the initial product. Dark mode may be added later but should not delay a coherent first release.
- Avoid generic AI-product styling, excessive gradients, glowing effects, oversized marketing treatments, and decorative cards around every element.

## Reuse before invention

For UI changes, use this order:

1. Reuse an existing shared component or layout.
2. Compose existing components.
3. Extend an existing component with a reusable variant.
4. Create a new shared component only when no established pattern fits.

Use semantic color, type, spacing, radius, border, shadow, and state tokens. Do not accumulate arbitrary Tailwind values or create a separate mini-design system for each feature.

## Side-panel shell

The panel must work at realistic narrow widths and variable heights. It is not a desktop dashboard squeezed into a column.

The normal page-context view should contain:

- a compact header with the recognizable source site and current page title;
- a safe action to open or copy the source-page link when appropriate;
- the page-scoped conversation as the primary scroll region;
- a persistent composer at the bottom;
- a small navigation path to the cross-tool inbox and account state.

Long titles and URLs must truncate without hiding the source domain. Do not display a full raw URL as the primary label. When the active page is unsupported, signed out, offline, inaccessible, or unresolved, replace the conversation with a clear state and next action.

Do not overlay SideWire UI into the host page during the MVP.

## Web-application shell

Use the web application for authentication, onboarding, organization administration, inbox/search, billing, and workflows that need more width. Deep links from the extension may open the relevant SideWire web view without losing the originating page context.

The web app should remain responsive, but it does not need to reproduce the host-page-plus-panel arrangement.

## Interaction patterns

Use a full page for primary destinations and substantial forms. Use dialogs for short decisions or destructive confirmations. Use sheets for contextual inspection that benefits from retaining the underlying view. Use popovers and dropdowns only for lightweight controls. Keep the primary action visible instead of hiding it in overflow menus.

Messages should optimize for scanning. Show author, time, content, delivery failure, and relevant action state without excessive chrome. Do not add reactions, nested threads, rich-text toolbars, attachments, or AI actions before their behavior is approved.

The message composer must keep a visible label or accessible name, support keyboard submission without making multiline entry confusing, prevent accidental duplicates, communicate sending/failure state, and preserve recoverable text after a failed request.

## Responsive and accessible behavior

Treat the narrow panel as a first-class layout. Test resizing, zoom, long words, long page titles, large font settings, keyboard navigation, screen-reader names, focus order, reduced motion, and high-contrast states.

Icon-only controls require accessible names and tooltips when their meaning is not universally obvious. Do not rely on color alone for unread, error, presence, task, or completion state. New-message announcements must not overwhelm assistive technology.

## Required states

Every implemented workflow must account for the relevant states:

- signed out and session expired;
- loading and initial sync;
- no page context yet;
- no messages yet;
- unsupported or restricted page;
- offline and reconnecting;
- sending and send failure;
- permission denied or removed membership;
- empty inbox or search results;
- unexpected request failure.

Do not leave a blank panel where the user needs an explanation or recovery action.
