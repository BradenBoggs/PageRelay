# SideWire architecture

Status: proposed foundation. The empty repository has not yet committed an application stack. The choices below are the recommended baseline for review in `docs/plans/000-execplan.md`, not a claim that they are implemented.

## System shape

Keep SideWire in one repository with two client surfaces backed by one application API and database:

- a Chrome Manifest V3 extension whose primary interface is the native side panel;
- a responsive web application for authentication, onboarding, organization settings, inbox/search, billing, and other full-page workflows;
- one server application that owns authentication, authorization, page-context resolution, collaboration data, and realtime events;
- one PostgreSQL database as the durable source of truth.

The recommended starting stack is Laravel, PHP, PostgreSQL, React, TypeScript, Tailwind CSS, and Laravel's maintained authentication and broadcasting facilities. The extension should use React and TypeScript and share schemas, domain vocabulary, and reusable UI primitives where practical without forcing the panel and web application into the same layout.

Confirm exact framework versions, package manager, monorepo layout, test tools, local container strategy, deployment provider, email provider, realtime transport, and billing package during Phase 0. Prefer first-party framework behavior and a small dependency surface. Do not introduce microservices, a generic event bus, a browser automation framework, or separate databases for the MVP.

## Trust boundaries

The server is authoritative. The extension and web application are untrusted clients.

Every organization-owned query and mutation must derive the organization from the authenticated membership and enforce it in queries, policies, route binding, broadcasts, jobs, search, and provider callbacks. Never accept a browser-supplied organization ID as proof of access.

Use public opaque identifiers in client routes and payloads. Opaque identifiers are not authorization credentials.

The extension may report the active tab's URL, title, and favicon only after the user invokes SideWire and only with the minimum approved Chrome permissions. The server owns normalization and page-context resolution. Never use a client-generated normalized key as authorization or directly expose a raw URL as a database lookup boundary.

## Extension constraints

Use Manifest V3 and the native Chrome side-panel API. Request the least privilege possible. Prefer `sidePanel`, `activeTab`, and narrowly justified capabilities over broad host permissions.

Do not inject content scripts, alter the source page, scrape page content, execute scripts in the host page, monitor browsing history, or request `<all_urls>` merely for convenience. If Chrome requires a broader permission to meet an approved behavior, document why, what data becomes visible, the user-facing disclosure, and the rejected alternatives before implementation.

Treat restricted pages, browser-internal pages, local files, extension pages, new-tab pages, and unavailable tab metadata as normal states. The panel should explain when SideWire cannot attach a context rather than failing or inventing one.

Keep extension authentication tokens out of web-page JavaScript and content-script contexts. Store the minimum session material in extension-owned storage, use secure expiring credentials, rotate or revoke them safely, and never log tokens or secrets.

## Page-context identity

A page context belongs to exactly one organization. Store the original source URL separately from a normalized identity used for matching. Preserve enough display metadata to help humans recognize the page without collecting page content.

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

Realtime delivery is an optimization over durable server state. On reconnect or missed events, clients must refetch authoritative conversation and unread state. Authorize every private broadcast channel against active organization membership.

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
- Provide a deliberate account/session revocation path before pilot use.

Feature-specific behavior belongs in the relevant feature file and should not be duplicated here.

