# Client coverage, accessibility, and cross-device continuity

Status: **Draft for owner review. Core responsive web and Chrome side panel; native clients are a separate expansion.** The baseline has a React web shell and extension, not a verified native desktop/mobile or offline platform. See [review scope](README.md).

This document owns client expectations, accessibility outcomes, and cross-device continuity. The web and extension specifications own their layouts and permissions.

## Complete web product

A team can join, use channels/DMs, reply, search retained history, manage attention, and access supported resources without an extension, source URL, or provider connection. Account/security/billing workflows remain reachable on narrow screens.

Desktop and mobile-width web clients use the same authorized server data. Narrow screens provide deliberate list/detail/thread navigation, reachable composition, safe areas, and useful touch targets rather than squeezed desktop panes. Publish exact browser/OS/version support after validation; this document does not invent a support matrix.

Capabilities such as calls, desktop alerts, uploads, and installation may differ by client. Show availability and an appropriate alternative rather than inactive controls or an unexplained account error.

## Cross-device and offline behavior

Messages, edits, deletions, reactions, read progress, preferences, and supported drafts converge across authorized clients. Deep links restore the exact conversation/message/thread after authentication and permission checks. External source links remain separate deliberate navigation actions. Multiple clients must not multiply alerts or move drafts between destinations.

When disconnected, distinguish cached content, unsaved drafts, pending uploads, and acknowledged messages. A cached view is not necessarily current; a queued mutation is not sent. Reconnect revalidates access. Any offline cache requires bounded retention, shared-device privacy controls, and sign-out/revocation cleanup. Offline access must not be advertised as indefinite access after revocation.

Ordinary offline drafts do not auto-send when connectivity returns. Scheduled messages are the explicit exception defined by their feature. A responsive website on a phone does not establish native/background notification support.

## Accessibility outcomes

Core communication must work by keyboard, touch, and assistive technology. Use semantic regions, clear labels, visible focus, logical ordering, dialog focus restoration, and non-hover message actions. Shortcuts must be discoverable and avoid text-entry/IME conflicts; ordinary controls remain available.

Do not rely only on color, emoji, sound, or animation for status. Support text zoom, long labels, reduced motion, high contrast, and readable wrapping. New-message updates should neither steal focus nor repeatedly announce the whole history. Convey sending/failure without overwhelming announcements.

Images support alternate descriptions; files have accessible names/states; audio/video exposes supported captions/transcripts and their limitations. Hidden accessibility labels and cached previews must not reveal inaccessible private content.

## Installation and native clients

Native desktop and iOS/Android clients are optional expansions, not current capabilities. Select them for specific needs such as reliable OS notifications or approved device capture, rather than assuming every platform needs a separate application. A wrapper is not automatically a tested native product.

An installable web experience also needs explicit behavior for caching, badges, push, updates, and support. Client/server compatibility errors should offer a safe upgrade path without losing drafts or misrepresenting successful mutations. Organization switching remains a separate account-model decision.

## Acceptance behavior and decisions

Verify the main communication loop on keyboard-operated desktop and narrow touch browsers without page context. Resizing, history pagination, interrupted uploads, deep links, and logout must not lose or expose private work. Record the supported-client test matrix before making accessibility/support claims; this specification is not a certification.

Owner decisions: supported browsers/OS versions, offline-cache policy, native-client priority, and supported push behavior. No broader browser permissions or multi-organization switching are approved here.

Reference coverage: [Slack application and accessibility help catalog](https://slack.com/help/categories/200111606-Using-Slack).
