# Chrome side panel and page-aware collaboration

Status: **Draft for owner review. Core target.** Baseline docs describe the shell, authentication handoff, This Page, explicit creation/linking, Activity, Chats, and read state as implemented through plans `000`, `001`, and `002`. They deliberately use event-scoped loading/manual Refresh rather than extension realtime. Manual Chrome verification remained pending; this review does not change that status.

This document owns extension permissions, authentication, active-tab lifecycle, and the narrow panel experience. Common messaging, audience, identity, and source attribution belong to their feature owners.

## Role beside the complete web app

The extension brings the same authorized chats beside work pages; it is not required to use SideWire. This Page is the extension's contextual entry point. Chats, channels, DMs, Activity, search, and followed threads remain accessible without associating the current tab. Wider workflows can open an exact authorized destination in the web app, preserving the user's place.

Do not compress every desktop pane into the panel. Use focused list/detail/thread states, a reachable composer, compact source and audience labels, accessible back navigation, and explicit loading/offline/access states. Apps is an optional source-site filter, not a Workspace selector.

## Permissions and privacy boundary

Retain Manifest V3 and the native side panel. The approved `tabs` capability is used only to read the active tab's URL, browser-provided title, and favicon while the user-invoked panel is open. Chrome's capability warning does not authorize browsing-history collection.

Do not enumerate background tabs, retain visit logs, inject content scripts, modify host pages, read DOM/forms/cookies/local storage, capture screenshots, intercept network requests, or request `<all_urls>` for convenience. A new recording or other capability requires separate approval and disclosure. SideWire API host permissions must be narrowly scoped to the deployed API origin.

Unsupported schemes, browser-internal pages, local files, new tabs, denied permissions, missing metadata, and credential-bearing URLs are normal unsupported states. They must not create false identities or persistent collaboration records.

## Tab and context transitions

Resolve when the panel opens or the active supported URL changes while it is open. Deduplicate repeated title/favicon/loading events and unchanged URLs. Resolution is read-only. Unknown pages remain ephemeral until explicit creation/linking; do not persist descriptors in durable extension storage or turn them into Apps/Activity entries.

The no-chat form retains editable safe Page title, Page URL, and Chat name and discloses the proposed audience. Only successful explicit creation/linking exposes the This Page composer. A hidden private mapping cannot be overwritten or named in an error.

Distinguish a changed tab, changed context, and changed chat. Two contexts may route to the same chat: update the current-page indicator without duplicating history, subscriptions, or unread counts. Keep drafts bound to their original chat/thread/source. Navigation must not silently relabel an existing draft or submit it to a newly mapped destination.

Opening a chat directly does not attach the active page. Returning to This Page performs its normal lookup. Automatic page following must not interrupt direct chat/thread work or steal focus from a draft; where following would change the destination, show the new-page state and require a deliberate navigation choice. More elaborate follow/pin preferences are optional and must preserve these invariants.

## Live delivery target and recovery

The target is live authorized messaging while the panel is open, not a manual-refresh-only primary experience. Connect only for the current user's authorized collaboration state; page associations must not multiply subscriptions. Reconnect after interruption, revalidate membership, and reconcile persisted history/read state without duplicate messages or stale private content.

This replaces the baseline transport limitation only when separately implemented and verified. Do not reintroduce undocumented periodic polling or continuously monitor browsing to simulate realtime. Keep a manual Refresh action as recovery, not the normal mechanism for receiving coworkers' messages.

Closing the panel is not a promise of a persistent browser process or closed-browser delivery. Supported notification/background behavior belongs to [Notifications](mentions-and-notifications.md) and requires its own capability review. Permission denial or suspended browser operation must be stated honestly.

## Authentication and session lifecycle

Preserve the documented short-lived, one-time PKCE-bound web handoff. The confirmation URL exposes only an opaque request identifier; a signed-in verified active member explicitly approves before a scoped expiring Sanctum token is issued. Normal host pages never receive SideWire credentials.

Store only approved token/session material and minimum identity in extension-owned storage. Sign-out/disconnect revokes the session server-side and clears sensitive local state; when offline, local credentials must still be cleared and the user must be told if server revocation remains unconfirmed. Expired/revoked/removed sessions fail closed, clear visible/cached private data, and provide a safe reconnect path. Draft storage follows its separate privacy rules, not unrestricted local history caching.

## Distribution and acceptance

Development remains an unpacked extension unless store distribution is separately completed. Production API origin, supported Chrome versions, store disclosures/review, privacy policy, update behavior, and browser compatibility must be verified before release claims. Other browsers and native apps are separate decisions.

Acceptance requires live delivery/reconnect across two authorized clients, safe tab changes with drafts, supported narrow widths, correct same-chat/different-source behavior, no visit-only persistence, no hidden-audience leakage, and session revocation without host-page credentials or expanded browsing collection.

## Implementation map — documented baseline only

- Workspace/manifest/build: `apps/extension/`, `public/manifest.json`, `vite.config.ts`.
- UI/client: `apps/extension/src/sidepanel/main.tsx`, `src/components/ui/`, `src/styles/app.css`, `src/page-chat/api.ts`.
- Session/background: `apps/extension/src/auth/session.ts`, `src/background/service-worker.ts`.
- Direct chat API: `app/Http/Controllers/Api/V1/WorkChatController.php`, `/api/v1/extension/work-chats`.
- Handoff/session: `POST/PUT /api/v1/extension/handoffs`, `GET/DELETE /api/v1/extension/session`, `app/Domain/Extension/`, `app/Models/ExtensionHandoff.php`, `extension_handoffs`.
- Web approval: `app/Http/Controllers/ExtensionConnectionController.php`, `resources/js/pages/extension/connect.tsx`.
- Authorization: `app/Http/Middleware/EnsureExtensionAccessToken.php`.
- Existing tests: `tests/Feature/Api/ExtensionHandoffTest.php`, `ExtensionConnectionPageTest.php`, `ExtensionSessionTest.php`, `tests/Feature/Broadcasting/OrganizationChannelAuthorizationTest.php`, and PageContexts/Conversations/Activity suites.

The documented development API permission is `http://localhost:8000/*`; it is not a production deployment configuration or proof that the new live-delivery target is implemented.
