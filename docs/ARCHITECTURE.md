# SideWire architecture

Status: approved foundation; implementation is tracked in `docs/plans/000-execplan.md`. The page-chat and linking revision is planned separately in `docs/plans/001-page-chats-and-linking.md` and is not implemented by this documentation update.

## System shape

Keep SideWire in one repository with two client surfaces backed by one Laravel application and one PostgreSQL database:

- a Chrome Manifest V3 extension whose primary interface is the native side panel;
- an Inertia React web application for authentication, onboarding, organization settings, cross-tool views, billing, and administration workflows intended for customers;
- one Laravel server that owns authentication, authorization, organization isolation, page-context resolution, collaboration data, billing state, and realtime events;
- one PostgreSQL database as the durable source of truth;
- Redis for queues, cache, sessions, Horizon, and later Reverb scaling.

The approved application foundation is the official Laravel React starter kit at pinned upstream commit `0bc7a8d4538bed1d4ea8ef9469e2a6d915be2ec8`, which provides the selected Laravel 13, Fortify, Inertia 3, React 19, TypeScript, Tailwind 4, and maintained starter UI foundation. The upstream Teams feature is used only as source material for memberships, invitations, roles, and authorization. Its switching and personal-team behavior must be removed while the generated concept is still named `Team`; only then may that tenant concept be renamed to `Organization`.

The approved supporting packages are:

- Laravel Cashier for Stripe subscriptions and per-seat quantities;
- Laravel Sanctum for authenticated extension API sessions;
- Laravel Reverb and Echo for private realtime delivery;
- Redis and Laravel Horizon for queued work and queue operations;
- Filament as an internal SideWire administration panel at `/admin`;
- Spatie Laravel Activitylog when organization-owned auditable actions are introduced.

Filament is Livewire-based and intentionally separate from the customer-facing React application. Customer product screens stay in React. Filament is restricted to SideWire operators and may inspect multiple organizations only through explicit super-admin authorization.

## Account hierarchy and vocabulary

These are separate domain concepts:

- **Organization:** tenant, customer account, security boundary, and Stripe customer.
- **Workspace:** the existing organization-owned collaboration container. The MVP uses the default workspace, not a workspace per app or domain.
- **Team:** a reusable group of organization members, not a channel or paying tenant.
- **User:** an individually authenticated person.
- **Seat:** one active billable organization membership.

The MVP has no organization switching. A user belongs to one organization, derived from authenticated active membership. Retain `organization_memberships` as the single authoritative relationship. Do not introduce a parallel `users.organization_id` authority, `current_organization_id`, a tenant selector, switch endpoint, personal organization, or fallback organization. Supporting multiple organizations requires a separately approved migration and authorization review.

Apps groups page contexts for browsing and does not define tenancy, ownership, billing, external-app permissions, or a new workspace. User-facing Chat maps to the internal conversation concept; Activity maps to the cross-tool view. Do not add duplicate domain entities or rename-only migrations for those labels.

Organization, workspace, team, chat, and context identifiers supplied by a browser are never proof of access. Domain ownership and feature behavior remain in the relevant specifications.

## Tenancy approach

Use single-database row-level tenancy. Do not install a database-switching multitenancy package for the MVP.

Every organization-owned aggregate must either contain `organization_id` or belong through an unambiguous organization-owned parent. Enforce isolation in route binding, policies, queries, jobs, notifications, broadcasts, search, admin actions, and provider callbacks. Prefer explicit organization-scoped relationships over unscoped model lookups.

A user's organization relationship is singular in the foundation. Database constraints and tests enforce the approved one-organization membership boundary; neither a hidden selector nor a client preference can authorize another tenant.

## Billing boundary

`Organization` uses Cashier's `Billable` concern and is configured as Cashier's customer model. Stripe subscription quantity equals the authoritative count of active billable organization memberships. The owner counts as one seat; pending invitations, removed members, teams, workspace access, App groups, and chat links do not add seats.

Seat synchronization recalculates the complete quantity and calls Cashier's quantity update method. Do not rely on blind increments or decrements because retried jobs and webhooks must remain idempotent. Stripe webhook signatures must be verified, and provider events must be safe to repeat.

Exact price, trial duration, proration policy, failed-payment behavior, and cancellation recovery remain product decisions in `docs/features/billing-and-product-access.md`. Package installation and correct data ownership do not authorize unapproved pricing behavior.

## Authentication surfaces

The web application uses Fortify-backed Laravel session authentication and CSRF protection. The extension uses a versioned Sanctum-protected API and an approved browser-to-web handoff. A normal source page must never receive SideWire credentials.

Extension credentials stay in extension-owned storage, are scoped to minimum abilities, expire, can be revoked, and are checked together with active organization membership on every request. Do not copy a normal web session cookie or password into the extension.

## Trust boundaries

The server is authoritative. The extension and web application are untrusted clients. Derive organization context from active membership and enforce it throughout reads, mutations, async work, and delivery.

Use public opaque identifiers in client routes and payloads. Opaque identifiers are not authorization credentials. Validate the complete organization, workspace, chat, and context relationship rather than authorizing each identifier independently.

The extension may report the active tab's URL, title, and favicon only after the user invokes SideWire and with minimum approved permissions. The server owns URL safety validation, normalization, and context resolution. Never use a client-generated normalized key as authorization or expose a raw URL as a database lookup boundary.

Source-page access is not proof of SideWire access, and SideWire does not claim to mirror the external app's permissions. A message's source context is attributed client context validated against the chat association, not a trusted integration event.

## Extension constraints

Use Manifest V3 and the native Chrome side-panel API. Request the least privilege possible. Prefer `sidePanel`, `activeTab`, and narrowly justified capabilities over broad host permissions.

Do not inject content scripts, alter the source page, scrape page content, execute scripts in the host page, monitor browsing history, or request `<all_urls>` for convenience. A broader permission requires documented necessity, user-facing disclosure, and rejected alternatives before implementation.

Treat restricted pages, browser-internal pages, local files, extension pages, new-tab pages, and unavailable tab metadata as normal states. Explain when SideWire cannot attach a context rather than inventing one.

Keep extension tokens out of web-page JavaScript and content-script contexts. Store minimum session material in extension-owned storage, use secure expiring credentials, rotate or revoke them safely, and never log tokens or secrets.

## Page identity and chat ownership

`docs/features/page-contexts.md` owns safe URL handling, normalized identity, metadata, and App grouping. A context belongs to one organization and its default workspace. Preserve only safe source URLs and minimum display metadata; reject unsafe access/session links instead of persisting them or guessing a canonical resource.

`docs/features/page-conversations.md` owns the chat as the durable message-history aggregate. Multiple distinct contexts may point to one page chat; a context has at most one current primary chat. The chat has its own organization/workspace ownership rather than deriving it from whichever context was linked first.

URL recognition, page-to-chat linking, and history merging are separate operations. Linking must not rewrite identities, copy messages, change the audience, or alter billing. Context aliases, canonical-link reading, context merges, and organization-defined normalization rules remain separate future approvals.

## Collaboration delivery

Persist messages before presenting them as sent. Use server-generated timestamps and IDs. Make retries idempotent so a network retry cannot create duplicate messages, links, or tasks.

Guard message creation and link changes against stale mappings and concurrent first sends. Feature-specific eligibility, provenance, unlinking, and recovery are defined in `page-conversations.md`.

Realtime, read markers, and message notification identities must follow the chat/message, not multiply by linked page. Authorize private broadcast subscriptions against active organization membership and relevant chat access. On reconnect or missed events, refetch authoritative history and read state. Activity and notification policy remain in their owning documents.

Do not introduce end-to-end encryption claims. Use TLS in transit, appropriate managed-infrastructure encryption at rest, private access controls, and clear retention behavior once approved.

## Application-wide security and privacy rules

- Require verified authentication for internal product access.
- Rate-limit authentication, context resolution, messaging, link changes, invitations, and other abuse-prone endpoints.
- Validate and safely render user text and external metadata; never execute it as HTML or script.
- Prevent unsafe URL schemes and open redirects in source links.
- Protect cookie-authenticated requests against CSRF and bearer credentials against leakage.
- Keep secrets, tokens, sensitive URLs, and full message bodies out of routine logs.
- Verify provider webhook signatures and make callbacks safe to repeat.
- Keep production credentials out of the repository and generated client bundles.
- Provide deliberate web-session and extension-session revocation paths before pilot use.

Feature-specific behavior belongs in its owning feature file and should not be duplicated here.
