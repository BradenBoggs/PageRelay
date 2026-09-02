# Chrome browser extension

Status: proposed; foundation shell is planned in `docs/plans/000-execplan.md`.

This document owns the Chrome extension shell, side-panel lifecycle, permissions, authentication surface, active-tab awareness, and navigation between extension views. Page identity belongs to `page-contexts.md`.

## Purpose

The extension makes SideWire available beside the website where work is happening. It should feel like a persistent collaboration utility, not an overlay that takes control of the host application.

## MVP surface

Use Chrome Manifest V3 and the native side-panel API. The panel provides:

- signed-out and session-expired states;
- the current supported page context;
- page conversation access;
- a compact path to inbox, team conversations, direct messages, and tasks as those features ship;
- account and organization identity;
- clear offline, reconnecting, permission-denied, and unsupported-page states.

Opening SideWire is an intentional user action. The extension does not continuously record background browsing.

## Permissions and host-page behavior

Request the minimum Chrome permissions necessary for approved behavior. Phase 0 should not require a content script, DOM access, scripting permission, browsing-history permission, network interception, or broad host access.

The extension must not alter the source page, inject widgets, read forms, copy page content, access host cookies or local storage, capture screens, or execute source-page scripts. Any future capability requiring one of these actions needs a separate feature revision and permission/privacy review.

Restricted Chrome pages, local files, extension pages, new-tab pages, unsupported schemes, unavailable tab metadata, and denied permissions are expected states. They must not create false contexts.

## Tab and panel lifecycle

When the panel opens or the active tab changes while the panel is open, SideWire may resolve the newly active supported page. The interface must clearly show the context change and preserve unsent drafts per context when practical.

Do not send or attach a draft to a newly active context automatically. A message submission must identify the context currently shown and be rejected safely if client state is stale.

## Authentication

Use an approved browser-extension authentication handoff. Keep the minimum session material in extension-owned storage and support expiry, rotation, sign-out, removal, and server-side revocation. Never expose tokens to the host page, URLs, analytics events, or logs.

## Distribution and compatibility

Development begins as a loadable unpacked extension. Chrome Web Store packaging, disclosures, screenshots, privacy-policy requirements, review, update signing, release channels, and minimum Chrome versions must be completed before public pilot distribution.

Firefox, Safari, Edge-specific packaging, native mobile apps, and install-free embed scripts are later possibilities.

## Acceptance behavior

The panel opens reliably, works at narrow and resized widths, survives browser and extension restarts as designed, handles active-tab changes, authenticates safely, identifies unsupported pages, and never requires host-page modification for the MVP workflow.

