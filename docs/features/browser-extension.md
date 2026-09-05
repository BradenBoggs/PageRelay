# Chrome browser extension

Status: the extension shell and secure authentication handoff are implemented by `docs/plans/000-execplan.md`; This Page, page-chat, manual linking, Activity, Chats discovery, shared unread behavior, lookup-only resolution, explicit manual chat creation, and event-scoped loading are implemented through milestone 5 of `docs/plans/001-page-chats-and-linking.md`. Manual Chrome verification remains pending.

This document owns the extension shell, side-panel lifecycle, permissions, authentication surface, active-tab awareness, and navigation between extension views. Page identity and Apps grouping belong to `page-contexts.md`; shared chats belong to `page-conversations.md`.

## Purpose

The extension makes SideWire available beside the website where work is happening. It should feel like a persistent collaboration utility, not an overlay that takes control of the host application.

## MVP surface

Use Chrome Manifest V3 and the native side-panel API. The panel provides:

- signed-out and session-expired states;
- This Page with the current supported page context and its associated chat, if any;
- an inline **Create chat for this page** form when the active page has no persisted context/chat;
- eligible linking controls and a visible list of linked source pages;
- compact Activity and Chats views with all/unread and Apps filters;
- compact navigation to Activity, Chats, organization chat, DMs, and later tasks as those features ship;
- account and organization identity;
- clear offline, reconnecting, permission-denied, unresolved, conflict, and unsupported-page states.

Apps is a browsing/filtering aid, not a workspace or tenant selector. Opening SideWire is intentional; the extension does not continuously record background browsing or import every external record.

## Permissions and host-page behavior

Request minimum Chrome permissions for approved behavior. The persistent panel uses `tabs` to read only the active tab's URL, title, and favicon when it opens and as the user changes tabs. Chrome may describe this capability with a browsing-activity warning, but SideWire does not enumerate background tabs or retain browsing history. Phase 0 does not require a content script, DOM access, scripting permission, network interception, or broad host access.

The extension must not alter the page, inject widgets, read forms, copy page content, access host cookies or local storage, capture screens, or execute source-page scripts. Any such future capability requires separate feature and permission/privacy approval.

Restricted pages, local files, extension pages, new-tab pages, unsupported schemes, unavailable metadata, and denied permissions are normal states. They must not create false contexts. Unsafe temporary or credential-bearing URLs follow `page-contexts.md` and must not become stored source links.

## Tab and panel lifecycle

When the panel opens or the active tab's URL changes while it is open, SideWire may resolve the newly active supported page. Deduplicate resolution by active tab and URL; repeated `tabs.onUpdated` events for title, favicon, loading state, or the same URL must not cause another request. Resolution is a read-only lookup and must not persist a page context, request key, browsing event, visible chat, subscription, or notification.

If no persisted context exists, keep only the validated ephemeral page descriptor needed for the current This Page state. Show an inline creation form with editable Page title, Page URL, and Chat name fields prefilled from the active tab; do not show a message composer. **Create chat** or an eligible manager's **Link to existing chat** action resubmits the page metadata to the server, which revalidates it and creates the context atomically with the chosen action. Do not put ephemeral page descriptors into Apps, Chats, Activity, search, or durable extension storage.

Do not run periodic page-chat, Activity, or Chats refresh timers in the MVP panel. Load the current page once when the panel connects, load Activity or Chats when the user enters that view or changes its filters/search, reload affected data after a successful mutation, and provide a clear user-triggered **Refresh** action for current server state. A future realtime extension connection requires separate approval; unrelated Chrome activity must never refresh SideWire data.

A new tab may resolve to a different context but the same shared chat. Keep the current source context visually accurate without duplicating history, realtime subscriptions, or chat-level unread state.

Preserve drafts with their intended chat and source context when practical. Do not automatically send a draft to a newly selected page, relabel its source, or follow a changed association on submit. A send includes its explicit chat and selected source context; the server validates their current authorized relationship. Conflicts require a clear reload/retry path.

A message composed from Activity or another non-page view has no inferred source unless the user explicitly selects one. Never use the last active tab as hidden message metadata.

## Authentication

The implemented browser-to-web handoff uses a short-lived, one-time request bound to a PKCE verifier. The extension creates the verifier and keeps the handoff secret; the browser confirmation URL contains only an opaque public identifier. A signed-in, verified user with an active organization membership must explicitly approve the connection before the extension can exchange the secret and verifier for a scoped, expiring Sanctum token.

The extension stores only that token, expiry, and minimum user and organization display identity in `chrome.storage.local`. Disconnect revokes the current token on the server before clearing local state. Expired, revoked, unverified, or removed accounts fail closed on the next authenticated request. Never expose tokens or handoff secrets to the host page, browser URLs, analytics, or logs.

## Distribution and compatibility

Development begins as a loadable unpacked extension. Chrome Web Store packaging, disclosures, screenshots, privacy-policy requirements, review, update signing, release channels, and minimum Chrome versions must be completed before public pilot distribution.

Firefox, Safari, Edge-specific packaging, native mobile apps, and install-free embed scripts remain later possibilities.

## Acceptance behavior

The panel opens reliably at narrow/resized widths, survives browser and extension restarts as designed, handles active-tab and shared-chat transitions, authenticates safely, identifies unsupported or unsafe pages, protects draft attribution, avoids duplicate resolution requests for an unchanged URL, does not react to unrelated tabs or windows, uses no background refresh timer, persists no visit-only context, and never requires host-page modification for the MVP workflow. The prefilled creation form remains usable with detected values unchanged or with deliberate manual corrections.

## Implementation map

Primary entry points:

- Extension workspace: `apps/extension/`
- Manifest: `apps/extension/public/manifest.json`
- Side-panel entry: `apps/extension/src/sidepanel/main.tsx`
- Authentication client: `apps/extension/src/auth/session.ts`
- Extension UI boundary: `apps/extension/src/components/ui/`
- Background service worker: `apps/extension/src/background/service-worker.ts`
- Extension styles: `apps/extension/src/styles/app.css`
- Page-chat API client: `apps/extension/src/page-chat/api.ts`
- This Page and chat interface: `apps/extension/src/sidepanel/main.tsx`
- Build configuration: `apps/extension/vite.config.ts`
- Handoff API: `POST` and `PUT /api/v1/extension/handoffs`
- Scoped session API: `GET` and `DELETE /api/v1/extension/session`
- Browser confirmation: `app/Http/Controllers/ExtensionConnectionController.php` and `resources/js/pages/extension/connect.tsx`
- Authentication domain: `app/Domain/Extension/`
- Handoff model/table: `app/Models/ExtensionHandoff.php` and `extension_handoffs`
- Token boundary: `app/Http/Middleware/EnsureExtensionAccessToken.php`
- Tests: `tests/Feature/Api/ExtensionHandoffTest.php`, `tests/Feature/Api/ExtensionConnectionPageTest.php`, `tests/Feature/Api/ExtensionSessionTest.php`, and `tests/Feature/Broadcasting/OrganizationChannelAuthorizationTest.php`
- Page workflow tests: `tests/Feature/PageContexts/` and `tests/Feature/Conversations/`
- Activity/read tests: `tests/Feature/Activity/`

The development manifest adds only the exact `http://localhost:8000/*` host permission needed to call the local SideWire API. Its approved `tabs` permission supplies active-tab URL, title, and favicon metadata across standard HTTP and HTTPS work pages; the side panel queries only the active tab. A production API origin and its disclosure require distribution approval; no broad host permission or content script is present.

Related specifications:

- `docs/features/page-contexts.md`
- `docs/features/page-conversations.md`
