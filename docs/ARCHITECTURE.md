# SideWire architecture

Status: approved foundation; implementation is tracked in `docs/plans/000-execplan.md`.

## System shape

Keep SideWire in one repository with two client surfaces backed by one Laravel application and one PostgreSQL database:

- a Chrome Manifest V3 extension whose primary interface is the native side panel;
- an Inertia React web application for authentication, onboarding, organization settings, cross-tool views, billing, and administration workflows intended for customers;
- one Laravel server that owns authentication, authorization, organization isolation, page-context resolution, collaboration data, billing state, and realtime events;
- one PostgreSQL database as the durable source of truth;
- Redis for queues, cache, sessions, Horizon, and later Reverb scaling.

The approved application foundation is the official Laravel React starter kit at pinned upstream commit `0bc7a8d4538bed1d4ea8ef9469e2a6d915be2ec8`, which currently provides Laravel 13, Fortify, Inertia 3, React 19, TypeScript, Tailwind 4, and the maintained Laravel starter UI. The upstream Teams feature is used only as source material for memberships, invitations, roles, and authorization. Its switching and personal-team behavior must be removed while the generated concept is still named `Team`; only then may that tenant concept be renamed to `Organization`.

The approved supporting packages are:

- Laravel Cashier for Stripe subscriptions and per-seat quantities;
- Laravel Sanctum for authenticated extension API sessions;
- Laravel Reverb and Echo for private realtime delivery;
- Redis and Laravel Horizon for queued work and queue operations;
- Filament as an internal SideWire administration panel at `/admin`;
- Spatie Laravel Activitylog when organization-owned auditable actions are introduced.

Filament is Livewire-based and intentionally separate from the customer-facing React application. Customer product screens stay in React. Filament is restricted to SideWire operators and may inspect multiple organizations only through explicit super-admin authorization.

## Account hierarchy and vocabulary

These are separate domain concepts and must not be aliases:

- **Organization:** the tenant, customer account, security boundary, and Stripe customer. An organization normally represents a company.
- **Workspace:** a collaboration environment owned by an organization. The schema may support more than one workspace even when the first release creates only a default workspace.
- **Team:** a group of organization members such as Sales, Operations, or Design. Team membership never creates a second paid seat for the same organization member.
- **User:** an individually authenticated person.
- **Seat:** one active billable organization membership.

The MVP has no organization switching. A user belongs to one organization, and the server derives that organization from the authenticated active membership. Do not add `current_organization_id`, an organization selector, a switch endpoint, a personal organization, or fallback-organization behavior. Supporting multiple organizations later requires a separately approved migration and authorization review.

Organization, workspace, and team identifiers supplied by a browser are never proof of access. Every organization-owned query and mutation must derive or verify the organization through authenticated membership.

## Tenancy approach

Use single-database row-level tenancy. Do not install a database-switching multitenancy package for the MVP.

Every organization-owned aggregate must either contain `organization_id` or belong through an unambiguous organization-owned parent. Enforce isolation in route binding, policies, queries, jobs, notifications, broadcasts, search, admin actions, and provider callbacks. Prefer explicit organization-scoped relationships over unscoped model lookups.

A user's organization relationship is singular in the foundation. A unique database constraint on active membership prevents the web and extension clients from manufacturing an unsupported multi-organization state.

## Billing boundary

`Organization` uses Cashier's `Billable` concern and is configured as Cashier's customer model. Stripe subscription quantity equals the authoritative count of active billable organization memberships. The owner counts as one seat; pending invitations, removed members, teams, and workspace access do not add seats.

Seat synchronization recalculates the complete quantity and calls Cashier's quantity update method. Do not rely on blind increments or decrements because retried jobs and webhooks must remain idempotent. Stripe webhook signatures must be verified, and provider events must be safe to repeat.

Exact price, trial duration, proration policy, failed-payment behavior, and cancellation recovery remain product decisions in `docs/features/billing-and-product-access.md`. Package installation and correct data ownership do not authorize unapproved pricing behavior.

## Authentication surfaces

The web application uses Fortify-backed Laravel session authentication and CSRF protection. The extension uses a versioned Sanctum-protected API and an approved browser-to-web handoff. A normal source page must never receive SideWire credentials.

Extension credentials stay in extension-owned storage, are scoped to the minimum abilities, expire, can be revoked, and are checked together with active organization membership on every request. Do not copy a normal web session cookie or password into the extension.

## Trust boundaries

The server is authoritative. The extension and web application are untrusted clients.

Every organization-owned query and mutation must derive the organization from the authenticated membership and enforce it in queries, policies, route binding, broadcasts, jobs, search, and provider callbacks. Never accept a browser-supplied organization ID, role, page-context identifier, URL, workspace ID, team ID, or extension state as proof of access.

Use public opaque identifiers in client routes and payloads. Opaque identifiers are not authorization credentials.

The extension may report the active tab's URL, title, and favicon only after the user invokes SideWire and only with the minimum approved Chrome permissions. The server owns normalization and page-context resolution. Never use a client-generated normalized key as authorization or directly expose a raw URL as a database lookup boundary.

## Extension constraints

Use Manifest V3 and the native Chrome side-panel API. Request the least privilege possible. Prefer `sidePanel`, `activeTab`, and narrowly justified capabilities over broad host permissions.

Do not inject content scripts, alter the source page, scrape page content, execute scripts in the host page, monitor browsing history, or request `<all_urls>` merely for convenience. If Chrome requires a broader permission to meet approved behavior, document why, what data becomes visible, the user-facing disclosure, and the rejected alternatives before implementation.

Treat restricted pages, browser-internal pages, local files, extension pages, new-tab pages, and unavailable tab metadata as normal states. The panel should explain when SideWire cannot attach a context rather than failing or inventing one.

Keep extension authentication tokens out of web-page JavaScript and content-script contexts. Store the minimum session material in extension-owned storage, use secure expiring credentials, rotate or revoke them safely, and never log tokens or secrets.

## Page-context identity

A page context belongs to exactly one organization and one workspace. Store the original source URL separately from a normalized identity used for matching. Preserve enough display metadata to help humans recognize the page without collecting page content.

The default normalization direction is conservative:

- require an approved `http` or `https` URL;
- normalize scheme and host consistently;
- remove fragments because they usually represent in-page navigation;
- remove known tracking parameters;
- preserve path and unknown query parameters until a rule proves they are non-identifying;
- never merge different URLs based only on title, favicon, or a browser-supplied guess;
- version normalization behavior so later improvements do not silently corrupt existing context identity.

Application-specific adapters may later produce more stable identities, but the universal URL-based path must remain functional. Context merging, aliases, canonical URLs, route-template recognition, and organization-defined rules are not foundation features.

## Collaboration delivery

Persist a message before presenting it as sent. Use server-generated timestamps and IDs. Make client retries idempotent so a network retry does not create duplicate messages or tasks.

Realtime delivery is an optimization over durable server state. On reconnect or missed events, clients must refetch authoritative conversation and unread state. Authorize every private broadcast channel against active organization membership and the relevant workspace or conversation access.

Do not introduce end-to-end encryption claims. Use TLS in transit, appropriate encryption at rest from managed infrastructure, private access controls, and clear retention behavior once approved.

## Application-wide security and privacy rules

- Require verified authentication for internal product access.
- Rate-limit authentication, context resolution, messaging, invitations, and other abuse-prone endpoints.
- Validate and safely render user-generated text. Never execute message content or external page metadata as HTML or script.
- Prevent unsafe URL schemes and open redirects when linking back to source pages.
- Protect against cross-site request forgery where cookie authentication is used and against token leakage where bearer credentials are used.
- Redact secrets, tokens, full message bodies, and sensitive URLs from logs whenever practical.
- Verify signatures on provider webhooks and make callbacks safe to repeat.
- Keep production credentials out of the repository and generated client bundles.
- Provide deliberate web-session and extension-session revocation paths before pilot use.

Feature-specific behavior belongs in the relevant feature file and should not be duplicated here.
