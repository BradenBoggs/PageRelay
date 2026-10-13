# 017 — Image-link thumbnails in messages

Lifecycle: in-progress
Approval: October 13, 2026 user requests thumbnails when image URLs are posted.
Verification: pending
Release: not released; deployment outside scope.

## Purpose / Big Picture

Preview direct image links in authorized messages and replies while retaining the original clickable URL. Owners: [Files and links](../../features/files-and-links.md), [Messaging](../../features/messaging-and-composer.md). No uploads, webpage scraping, arbitrary unfurls or external authentication.

## Progress

- [x] Inspect rendering, URL safety and extension constraints.
- [ ] Implement bounded authorized image proxy and lazy shared thumbnails.
- [ ] Verify access/fetch boundaries, fallback, desktop and mobile.

## Surprises & Discoveries

A browser-only image load would expose readers to remote hosts/cookies. Existing NormalizePageUrl rejects credential-bearing and temporary signed/session URLs. Reuse that validation without changing stored text. Concurrent plan 016 documentation edits remain untouched.

## Decision Log

October 13: recognize direct raster-image paths, max four distinct candidates per message. Resolve public IPv4 destinations and pin cURL to the validated address; reject private/reserved hosts, redirects and authenticated URLs. Fetch without cookies/referrer/proxy, max 2 MiB and 8 seconds; validate actual image content/dimensions. No persistent caching. Each delivery checks current message/chat access. Readers can hide previews; failures retain the original link. Native extension permissions unchanged.

## Outcomes & Retrospective

Implementation/checks pending; no release.

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

Checks pending. No live remote URLs/customer data or shared database mutation authorized.

## Interfaces and Dependencies

Reuse Laravel HTTP client, cURL, NormalizePageUrl, React and existing signal refresh. No package or extension permission additions.
