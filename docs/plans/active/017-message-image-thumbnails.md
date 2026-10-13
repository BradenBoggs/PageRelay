# 017 — Image-link thumbnails in messages

Lifecycle: verification-pending
Approval: October 13, 2026 user requests thumbnails when image URLs are posted.
Verification: 25 focused backend tests (168 assertions), PHP analysis, shared types/builds and Chrome 1440px/390px mocked-thumbnail acceptance passed. Full suite retains the existing registration failure; PHP 8.4 and native extension acceptance pending; public live cURL/TLS smoke check passed.
Release: not released; deployment outside scope.

## Purpose / Big Picture

Preview direct image links in authorized messages and replies while retaining the original clickable URL. Owners: [Files and links](../../features/files-and-links.md), [Messaging](../../features/messaging-and-composer.md). No uploads, webpage scraping, arbitrary unfurls or external authentication.

## Progress

- [x] Inspect rendering, URL safety and extension constraints.
- [x] Implement bounded authorized image proxy and lazy shared thumbnails.
- [x] Verify access/fetch boundaries, fallback, desktop and mobile.
- [x] Verify public live cURL/TLS image transport.
- [ ] Verify PHP 8.4 and native extension.

## Surprises & Discoveries

A browser-only image load would expose readers to remote hosts/cookies. Existing NormalizePageUrl rejects credential-bearing and temporary signed/session URLs. Reuse that validation without changing stored text. Concurrent plan 016 documentation edits remain untouched.

## Decision Log

October 13: recognize direct raster-image paths, max four distinct candidates per message. Resolve public IPv4 destinations and pin cURL to the validated address; reject private/reserved hosts, redirects and authenticated URLs. Fetch without cookies/referrer/proxy, max 2 MiB and 8 seconds; validate actual image content/dimensions. No persistent caching. Each delivery checks current message/chat access. Readers can hide previews; failures retain the original link. Native extension permissions unchanged.

## Outcomes & Retrospective

Authorized direct-image thumbnails are implemented; scoped mocked-transport/web acceptance passed. Wider supported-runtime/native checks remain pending. No release.

## Context and Orientation

Main 6d56c86 with existing quality/plan-016 documentation edits. Shared MessageResource and MessageRow serve web/extension routes and clients. ConversationAccess owns audiences; image links grant no access.

## Plan of Work

Add ImagePreview candidate extraction/safe fetch, scoped controller route and image resource metadata. Add lazy authenticated thumbnail component using local blobs with cleanup. Update owners and regression evidence.

## Concrete Steps

Use fake remote responses and disposable SQLite for authorization/security tests. Run PHP analysis/format, shared types/builds, parser/docs checks and synthetic browser image success/failure/navigation at desktop/mobile widths.

## Validation and Acceptance

Images are bounded and lazy, URLs stay clickable, broken/blocked images fall back. Tenant/DM/removed/deleted/mismatched-message requests denied before fetch. Public resolution is pinned; credentials/private IPs/redirects/oversized/nonimage content rejected. Editing/deletion cleans old blobs.

## Idempotence and Recovery

Read-only preview requests; no schema/migration, durable external content or new send identity. Failed fetches can be retried by hiding/showing previews. Revert to link-only rendering safely.

## Artifacts and Notes

October 13, 2026, baseline `6d56c86` plus this patch and preserved concurrent notification/Chat-control changes. PHP 8.5.1, Node 24.14.1, SQLite memory for tests and existing disposable browser fixtures.

- `APP_KEY=<disposable key> vendor/bin/phpunit tests/Feature/Conversations/MessageImagePreviewTest.php tests/Feature/Conversations/MessageEditingTest.php tests/Feature/Conversations/MessageDeletionTest.php`: 25 passed, 168 assertions. Covers tenant/DM/chat/key/deletion/removal, post-fetch access recheck, public-DNS pinning, cookies/referrer/auth absence, private/mixed/reserved/no-resolution blocks, redirects, MIME, body/header size limits, transfer progress abort and extension authenticated delivery. Final focused image suite rerun: 17 passed, 83 assertions.
- `APP_KEY=<disposable key> vendor/bin/phpunit`: 208 passed, 1 failed, 1 PostgreSQL-only skip, 1478 assertions. Same unchanged registration test expects `/register` 404 but gets 200 (SW-DEBT-002); no registration code modified.
- `php -d memory_limit=1G vendor/bin/phpstan analyse --no-progress --debug`: passed, zero errors after using explicit boolean validation conditions and the actual image metadata shape. Scoped Pint passed after one blank-line correction; scoped frontend/browser lint and formatter passed.
- `npm run types:check` and `npm run build`: web/extension passed. `node --test scripts/check-docs.test.mjs scripts/collaboration-ui.test.mjs`: 33 passed. Documentation structure and diff whitespace checks passed.
- Browser: `SIDEWIRE_BROWSER_URL=http://127.0.0.1:18014 SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/017-message-images node tests/Browser/message-images.cjs`: Chrome 1440px/390px passed. Synthetic raster fixture plus intercepted thumbnail endpoint success/422 responses verify image load, link preservation, badge coexistence, hide/show/retry, fallback, deletion cleanup and no overflow/page errors. Actual backend remote fetch is covered with fake HTTP/DNS responses, not a live public image service.
- Initial browser attempts could not load the email field because a concurrent dev server created `public/hot`. Temporary router bootstraps Laravel then overrides only its Vite hot-file location to use built assets; no shared hot/config file changed. The first router attempt set Vite before providers booted and was overwritten; corrected before the passing run. Synthetic PNG fixture generation emitted a PHP 8.5 imagedestroy deprecation; no production source uses that function.
- Screenshots inspected: [mobile](../artifacts/017-message-images/images-390.png), [desktop](../artifacts/017-message-images/images-1440.png).

Transport review found Guzzle's `stream=true` can select a PHP stream handler instead of cURL, losing DNS pinning. The implementation now requires cURL, sets stream=false, disables content decompression and enforces the byte cap through transfer progress plus body reads. Tests assert transport options. HTTP connect/transfer are bounded; system DNS resolution uses the host resolver. No proxy, redirect, thumbnail cache, external-user cookies or organization credentials are forwarded.

A final live transport smoke check ran `ImagePreview::fetch("https://httpbin.org/image/png")` through a disposable testing CLI bootstrap: passed, actual `image/png`, 8090 bytes. It exercised public DNS pinning, cURL/TLS and actual raster validation against a public test endpoint, without customer data/credentials or persistence. Final head `6ffde7f` plus the thumbnail patch and preserved concurrent work.

Native side panel and PHP 8.4 were not exercised. No shared database migration, customer data, remote production requests, deployment or merge.

## Interfaces and Dependencies

Reuse Laravel HTTP client, cURL, NormalizePageUrl, React and existing signal refresh. No package or extension permission additions.
