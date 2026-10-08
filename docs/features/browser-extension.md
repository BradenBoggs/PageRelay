# Chrome side panel and page-aware collaboration

Status: **GPS communication pilot approved October 8, 2026; implementation candidate under validation.** The baseline shell, authentication, page linking and work Chats are extended with the one-to-one DM, individual mention, thread and desktop-alert slice in [plan 005](../plans/active/005-gps-communication-pilot.md). Native side-panel/device acceptance and production deployment are not implied by source changes or builds. Broader communication proposals remain drafts.

This document owns extension permissions, authentication, active-tab lifecycle, build/distribution configuration and the narrow panel experience. Message semantics, audience, URL identity and source attribution remain with their feature owners.

## Role beside the web app

The extension brings the same authorized conversations beside work pages; it is optional. This Page is the contextual entry point. Messages & DMs provides direct access to shared work Chats, private one-to-one DMs and mention/reply Activity without attaching the current tab. Open web app opens the full communication surface.

Use focused list/detail/thread states, a reachable composer, visible audience/source labels, return navigation, and explicit loading/offline/access states rather than compressing several desktop panes into the panel. Group DMs, private channels, files, manual thread-follow controls and other expansion features are not part of this pilot.

## Permissions and privacy

Retain Manifest V3 and the native side-panel API. The tabs capability reads only the active tab's URL, browser title and favicon while the user-invoked panel is running. It does not authorize browsing-history collection.

The pilot adds alarms for notification-only background checks and optional notifications permission requested by an explicit Enable on this browser button. It does not add a content script, DOM/form/cookie access, scripting, screenshot capture, network interception, background-tab enumeration or broad website host permission.

The extension build derives its single SideWire API host permission from validated VITE_SIDEWIRE_APP_URL. HTTPS is required except for localhost/127.0.0.1 development. The checked-in development manifest and API client both use port 8000. A production origin is a deployment input, not an invented domain.

Restricted browser pages, local files, new tabs, unsupported schemes, unsafe credential-bearing URLs and unavailable metadata are ordinary unsupported states. DMs and other non-contextual communication remain usable; unsupported pages must not create false persistent contexts.

## Page lookup and transitions

Resolve when the panel opens or the active supported URL changes. Repeated title/favicon/loading events for an unchanged URL must not refetch SideWire page state. Lookup is read-only: unknown descriptors stay ephemeral until an explicit create/link action. No page-visit record, chat, subscription or attention item is created by passive navigation.

The no-chat form retains editable Page title, Page URL and Chat name. It discloses the organization-wide audience. Successful explicit creation or authorized linking exposes the composer. Manager-only linking uses the existing server-side source/version checks; DMs are never eligible destinations. Separate nonempty histories cannot be merged.

A tab, page context and conversation are different identities. Two linked pages can open one conversation without duplicating history or subscriptions. Keep drafts bound to their original conversation/thread/source even as the current-page indicator changes. Directly opening a chat does not attach the current page. Returning to This Page performs the normal lookup. A draft must never silently move to a new linked destination on submit.

## Live collaboration and desktop delivery

Open clients use the existing Reverb service for signal-only events and retrieve message/attention data through freshly authorized HTTP requests. Reconnect/focus/online events reconcile state. The pilot explicitly permits a 30-second collaboration recovery check; this supersedes the earlier manual-refresh-only transport limit for this approved slice, not the prohibition on periodic page lookup or browsing collection.

The actual installed extension ID must be included alongside the app hostname in the server's explicit REVERB_ALLOWED_ORIGINS list. Reverb compares origin hosts, so use the extension ID, not a wildcard. API host permission, WebSocket origin acceptance and authenticated channel authorization are distinct boundaries. The browser harness derives the installed test extension's ID rather than disabling origin protection.

With local extension alert opt-in and server preference enabled, Chrome checks notification records approximately once a minute even when the panel is closed. Closing Chrome, suspension, sleep and operating-system notification settings may delay or suppress alerts. This is not guaranteed instant closed-browser push. No background page or tab lookup is performed for alert delivery.

Generic previews, durable attention, claims across clients, pause/test controls and exact-message click navigation belong to [Notifications](mentions-and-notifications.md). Merely displaying or dismissing an alert does not mark its message read.

## Authentication and recovery

Preserve the short-lived, one-time PKCE-bound web handoff and scoped expiring Sanctum token. A verified active member explicitly approves the connection; only an opaque identifier appears in the approval URL. Host websites never receive SideWire credentials.

Store approved session material and minimum identity only in extension-owned storage. Keep drafts in memory for the pilot. Expired/revoked/removed sessions fail closed and clear inaccessible content; the background worker clears expired stored credentials and its alarm. Disconnect clears local credentials even when server revocation cannot be confirmed offline, and tells the user about that limitation.

Cancelled or obsolete history/page requests must not repopulate a different destination. Preserve the identity and payload of an uncertain send for a safe same-message retry. Manual Refresh remains available as recovery rather than the normal way to receive coworkers' messages.

## Distribution and acceptance

The pilot remains an unpacked extension, with minimum Chrome 120 recorded in the manifest. Public store distribution, disclosures, exact production origin, supported-device validation, updates and privacy-policy publication are separate release requirements. Other browsers and native apps are separate decisions.

Acceptance includes authenticated web-to-extension and extension-to-web exchange, live replies, correct mention recipients, source-bound drafts, no visit-only persistence, same-chat page transitions, revoked access and narrow layouts. Testing an installed extension page is not testing the native side-panel container. Notification API mocks are not proof of a visible native OS toast. [GPS setup](../engineering/GPS-PILOT.md) lists the remaining device checks.

## Implementation map

Extension entry points are `apps/extension/src/sidepanel/main.tsx`, `src/background/service-worker.ts`, `src/auth/session.ts`, `src/page-chat/api.ts`, `public/manifest.json` and `vite.config.ts`. Shared collaboration UI/client code is under `resources/js/components/collaboration/`. Authenticated collaboration routes are included from `routes/collaboration.php`; existing handoff and page-association services remain in use.

`PilotCollaborationTest` covers the new HTTP privacy/delivery boundaries. `tests/Browser/pilot.cjs` exercises authenticated web and the built installed extension; `extension-origin.cjs` derives its allowed origin. Existing handoff, page/context, linking, unread and foundation suites remain relevant. Actual results are recorded in the owning plan, not inferred from this map.
