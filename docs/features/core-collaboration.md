# Core page collaboration

Status: approved for documentation and planning; not implemented. Execution begins with `docs/plans/000-execplan.md` after explicit implementation approval.

This document is the authoritative source for the first SideWire page-context and conversation workflow. Organization invitations, billing, full inbox behavior, mentions, tasks, attachments, native integrations, and analytics require later feature specifications or an explicit revision to this document.

## Purpose

Core collaboration lets authenticated members of the same organization open SideWire beside a web page and share a private conversation associated with that page. A teammate returning to the same recognized context should see the same durable conversation and be able to return to the source page.

The feature provides a collaboration layer around existing web tools. It does not copy, edit, synchronize, or replace the data inside those tools.

## Organization ownership and access

Every page context and message belongs to exactly one organization. Derive the organization from the authenticated member on the server. Never accept a client-supplied organization ID as proof of ownership.

Every active organization member may resolve contexts, view conversations, and send messages within that organization for the initial release. Custom channel memberships, page-specific access controls, guest access, external customers, and private direct messages are out of scope.

Users from another organization must never discover a context, source URL, title, favicon, participant, message, unread state, or existence signal belonging to the first organization.

Exact owner/admin/member management and whether one user may join multiple organizations remain foundation decisions. This feature must consume the approved organization boundary rather than invent a second team model.

## Resolving the active page

When the user deliberately opens or activates SideWire, the extension sends the server the minimum approved metadata for the active tab:

- the current `http` or `https` source URL;
- the browser-provided page title when available;
- the browser-provided favicon URL when available;
- a client request identifier for safe retries.

The server validates the URL, computes the versioned normalized identity, and finds or creates the organization-private page context. Repeating the same request must not create duplicate contexts.

A page context records an opaque public identifier, organization ownership, original source URL, normalized identity and normalization version, source host, last known display title, optional favicon reference, creator, and timestamps. Exact internal storage details may change as long as the behavior and privacy boundary remain intact.

Fragments and known tracking parameters may be removed by the approved normalizer. Unknown query parameters must be preserved by default because they may identify a specific record. Do not infer sameness from similar titles or manually strip parameters without a documented rule and regression tests.

Restricted Chrome pages, unsupported URL schemes, missing tab permission, or unavailable metadata must produce an unsupported-context state. They must not create a context.

## Context presentation

The panel shows the source host and a human-recognizable page title. The source host remains visible when the title is long. A user can safely return to the stored source URL, subject to URL-scheme validation.

The stored title and favicon are display hints, not identity or authorization inputs. Later visits may refresh display metadata without creating a new context or allowing one organization to affect another.

The MVP does not include manual context merging, splitting, aliases, custom labels, site-wide channels, route templates, or application-specific adapters.

## Messages

A message belongs to one page context and organization and records an opaque public identifier, author, plain-text body, server timestamps, and any internal idempotency information needed for safe retries.

Message requirements:

- the body is required after trimming and has a server-enforced maximum length chosen in the implementation plan;
- content is treated as user text and never rendered as trusted HTML;
- the server persists and authorizes the message before acknowledging success;
- a retry with the same idempotency key does not create a duplicate;
- conversation order is deterministic using server-owned values;
- pagination supports long conversations without loading an unlimited history;
- a reconnect refetches authoritative server state rather than trusting missed realtime events.

All active organization members may initially read and send messages. Message editing, deletion, reactions, threads, attachments, rich text, link previews, typing indicators, presence, external guests, and retention automation are out of scope.

URLs in message text may be linkified only through a safe renderer that prevents script schemes and unsafe markup. Automatic rich previews are not part of the MVP.

## Realtime and offline behavior

New messages should appear for connected authorized teammates without a manual refresh. The implementation may use the framework's maintained private broadcasting facilities and an approved transport.

Durable server state remains authoritative. If realtime delivery is unavailable, the client must communicate degraded state and recover by refetching. The first implementation plan may approve short polling as a temporary local-development fallback, but it must not misrepresent polling as verified realtime delivery.

When offline, users may read already loaded messages. The MVP does not require a persistent offline outbox. A failed send must preserve the draft and offer an explicit retry without duplicating a message.

## Minimal conversation discovery

The foundation may expose a simple list of recently active page contexts so users can recover a conversation after navigating away. A complete inbox, unread calculations, mentions, notification delivery, search ranking, filters, and task aggregation belong to Phase 2 and later feature documents.

Do not let a temporary recent list become an undocumented inbox implementation.

## Privacy and browser behavior

Resolve a context only in response to an intentional SideWire interaction. The MVP must not record general browsing history, background tab changes, page contents, form values, DOM text, screenshots, cookies, local storage from the host page, or network traffic.

The extension must not inject or modify the source page for this feature. Browser permissions must match the minimum behavior documented in `docs/ARCHITECTURE.md` and the active plan.

## Acceptance behavior

The feature is useful when two authorized members can:

1. sign in to the same organization;
2. open the same supported source page in Chrome;
3. resolve to the same organization-private SideWire context;
4. exchange durable messages from the side panel;
5. receive new authorized messages without losing durable history;
6. navigate away and later recover the conversation and source link;
7. receive a clear state on unsupported pages, expired sessions, offline connections, and failed sends.

Isolation tests must prove that a member of another organization cannot observe or mutate any part of this workflow even when opaque identifiers or source URLs are known.

## Out of scope

The first feature excludes native integrations, scraping, DOM annotations, screenshots, file attachments, direct messages, public links, guests, customer portals, voice/video, AI summaries, workflow automation, full-text search, advanced notifications, configurable retention, message edits/deletes, mobile apps, non-Chrome browsers, and page-related tasks.

