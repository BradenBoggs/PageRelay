# Chrome browser extension

Status: the extension shell and secure authentication handoff are implemented by `docs/plans/000-execplan.md`. Page-chat and linking behavior is planned in `docs/plans/001-page-chats-and-linking.md`; it is not implemented by the foundation.

This document owns the extension shell, side-panel lifecycle, permissions, authentication surface, active-tab awareness, and navigation between extension views. Page identity and Apps grouping belong to `page-contexts.md`; shared chats belong to `page-conversations.md`.

## Purpose

The extension makes SideWire available beside the website where work is happening. It should feel like a persistent collaboration utility, not an overlay that takes control of the host application.

## MVP surface

Use Chrome Manifest V3 and the native side-panel API. The panel provides:

- signed-out and session-expired states;
- This Page with the current supported page context and its associated chat, if any;
- eligible linking controls and a visible list of linked source pages;
- compact navigation to Activity, Chats, organization chat, DMs, and later tasks as those features ship;
- account and organization identity;
- clear offline, reconnecting, permission-denied, unresolved, conflict, and unsupported-page states.

Apps is a browsing/filtering aid, not a workspace or tenant selector. Opening SideWire is intentional; the extension does not continuously record background browsing or import every external record.

## Permissions and host-page behavior

Request minimum Chrome permissions for approved behavior. Phase 0 should not require a content script, DOM access, scripting permission, browsing-history permission, network interception, or broad host access.

The extension must not alter the page, inject widgets, read forms, copy page content, access host cookies or local storage, capture screens, or execute source-page scripts. Any such future capability requires separate feature and permission/privacy approval.

Restricted pages, local files, extension pages, new-tab pages, unsupported schemes, unavailable metadata, and denied permissions are normal states. They must not create false contexts. Unsafe temporary or credential-bearing URLs follow `page-contexts.md` and must not become stored source links.

## Tab and panel lifecycle

When the panel opens or the active tab changes while it is open, SideWire may resolve the newly active supported page. Resolution alone does not create a visible chat, subscribe members, or issue notifications.

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

The panel opens reliably at narrow/resized widths, survives browser and extension restarts as designed, handles active-tab and shared-chat transitions, authenticates safely, identifies unsupported or unsafe pages, protects draft attribution, and never requires host-page modification for the MVP workflow.

## Implementation map

Primary entry points:

- Extension workspace: `apps/extension/`
- Manifest: `apps/extension/public/manifest.json`
- Side-panel entry: `apps/extension/src/sidepanel/main.tsx`
- Authentication client: `apps/extension/src/auth/session.ts`
- Extension UI boundary: `apps/extension/src/components/ui/`
- Background service worker: `apps/extension/src/background/service-worker.ts`
- Extension styles: `apps/extension/src/styles/app.css`
- Build configuration: `apps/extension/vite.config.ts`
- Handoff API: `POST` and `PUT /api/v1/extension/handoffs`
- Scoped session API: `GET` and `DELETE /api/v1/extension/session`
- Browser confirmation: `app/Http/Controllers/ExtensionConnectionController.php` and `resources/js/pages/extension/connect.tsx`
- Authentication domain: `app/Domain/Extension/`
- Handoff model/table: `app/Models/ExtensionHandoff.php` and `extension_handoffs`
- Token boundary: `app/Http/Middleware/EnsureExtensionAccessToken.php`
- Tests: `tests/Feature/Api/ExtensionHandoffTest.php`, `tests/Feature/Api/ExtensionConnectionPageTest.php`, `tests/Feature/Api/ExtensionSessionTest.php`, and `tests/Feature/Broadcasting/OrganizationChannelAuthorizationTest.php`

The development manifest adds only the exact `http://localhost:8000/*` host permission needed to call the local SideWire API. A production API origin and its disclosure require distribution approval; no broad host permission or content script is present.

Related specifications:

- `docs/features/page-contexts.md`
- `docs/features/page-conversations.md`
