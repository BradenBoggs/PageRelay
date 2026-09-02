# Execution plan 000: trusted SideWire foundation

Status: proposed on September 2, 2026; documentation complete; application implementation requires explicit approval.

## Purpose / Big Picture

Create the smallest trustworthy technical foundation on which SideWire's page-aware collaboration loop can be built. At the end of this initiative, a developer can run one repository locally, start the server and web client, load a development Chrome extension, authenticate through an approved extension-to-server flow, and verify organization isolation and active-page metadata capture without yet shipping the complete messaging product.

This initiative establishes the application, extension, tenancy, authentication, testing, continuous integration, and permission boundaries. It does not implement production billing, invitations unless required for test fixtures, page conversations, tasks, full inbox/search, tool-specific integrations, screenshots, content extraction, marketing pages, referrals, or deployment.

## Progress

- [x] 2026-09-02: Create repository-level contributor guidance and product, architecture, UI, feature, roadmap, and execution-plan documents.
- [ ] Confirm the recommended stack, framework versions, repository layout, authentication flow, and organization-membership rules.
- [ ] Scaffold the server and responsive web application with secure authentication.
- [ ] Implement and test the single-organization tenancy boundary selected for the MVP.
- [ ] Scaffold the Chrome Manifest V3 extension with a native side panel and minimal permissions.
- [ ] Connect extension authentication to the server without exposing credentials to host pages.
- [ ] Add supported/unsupported active-page metadata capture without creating durable page contexts.
- [ ] Add automated checks, continuous integration, secure seed behavior, and contributor setup instructions.
- [ ] Run all approved verification commands and record actual evidence here.

## Surprises & Discoveries

- The GitHub repository began empty, so no existing framework, package versions, build commands, or deployment assumptions can be treated as implemented.
- SideWire can deliver the first context workflow without a content script. Keeping content scripts and broad host permissions out of Phase 0 materially reduces privacy and extension-review risk.

Add unexpected implementation findings here with dates and evidence.

## Decision Log

- Decision: Use SideWire as the user-facing product name and retain PageRelay only as the repository codename. Reason: SideWire is the current preferred name while the repository already exists as PageRelay. Date: 2026-09-02.
- Decision: Keep SideWire independent from the owner's other products and data models. Reason: Its horizontal value depends on augmenting any browser-based tool. Date: 2026-09-02.
- Decision: Begin with Chrome Manifest V3 and the native side panel. Reason: It matches the core beside-the-current-page experience while avoiding an injected overlay. Date: 2026-09-02.
- Decision: Do not add a content script or broad host permissions in Phase 0. Reason: active-tab metadata is sufficient to prove the foundation and keeps the permission boundary narrow. Date: 2026-09-02.
- Proposed decision requiring approval: Use a Laravel/PostgreSQL server and React/TypeScript for both web and extension clients in a single repository. Reason: this is a productive, maintainable solo-developer stack and keeps shared vocabulary and schemas close. Date proposed: 2026-09-02.

Record material decisions and approved changes here. Permanent product behavior must also be updated in its owning document.

## Outcomes & Retrospective

Only the documentation skeleton has been created. No application code, database, extension package, authentication flow, or test suite has been implemented or verified.

When this plan completes, record what shipped, deviations from the plan, verification evidence, remaining risks, and lessons for the page-collaboration initiative.

## Context and Orientation

The repository currently contains documentation only:

- `AGENTS.md` defines contributor and agent behavior.
- `docs/PRODUCT.md` defines SideWire's purpose, audience, vocabulary, boundaries, and MVP direction.
- `docs/ARCHITECTURE.md` defines the proposed system shape and mandatory trust, privacy, extension, and page-identity constraints.
- `docs/UI.md` defines shared web and side-panel interaction rules.
- `docs/features/core-collaboration.md` defines the first product workflow.
- `PLANS.md` defines how execution plans work and the phased roadmap.

The planned system has one server/database trust boundary, one responsive web application, and one Chrome extension. The extension displays the side panel and requests limited active-tab metadata. The server will later resolve organization-private page contexts and own durable collaboration data.

Before implementation, inspect current official Chrome extension requirements and the selected framework's current starter and authentication options. Record exact selected versions in this plan and lockfiles. Do not rely on the framework versions used by another repository.

## Plan of Work

### Milestone 1: Approve technical and account foundations

Resolve the choices that would otherwise force rework:

- exact Laravel, PHP, Node, React, TypeScript, and PostgreSQL versions;
- package-manager and monorepo/workspace layout;
- local development method;
- whether an MVP user belongs to exactly one organization;
- owner/member roles needed before invitations and billing;
- extension authentication mechanism and session revocation;
- realtime transport deferred to the conversation plan;
- minimum supported Chrome version.

Update `docs/ARCHITECTURE.md`, the relevant feature document, and this decision log. Approval of this plan authorizes only the choices stated in the approved revision.

### Milestone 2: Scaffold the server and web application

Create the selected official framework foundation with React and TypeScript. Establish secure registration, sign-in, sign-out, password reset, email verification, session management, and a minimal authenticated web shell. Disable demo or predictable production accounts.

Add formatting, static analysis, unit/integration tests, frontend type checking, linting, and production builds through repository-owned commands. Commit dependency lockfiles.

Acceptance: a new developer can follow `README.md`, reach the authenticated shell locally, and run the foundation checks without undocumented manual steps.

### Milestone 3: Implement organization tenancy

Create the single approved organization and membership model. Derive organization context from the authenticated membership on the server. Add database constraints, policies, scoped queries, and cross-organization tests before creating collaboration records.

Do not add configurable enterprise roles, organization switching, billing quantities, or invitations unless explicitly approved for this milestone.

Acceptance: automated tests demonstrate allowed same-organization access and denied cross-organization access using both normal and guessed opaque identifiers.

### Milestone 4: Scaffold the Chrome extension

Create a separate extension workspace using Manifest V3, React, and TypeScript. Add the native side-panel declaration, service worker only if required, shared theme primitives, development build, production build, and instructions for loading the unpacked extension.

Request only permissions proved necessary by the milestone. Do not add a content script, scripting permission, history permission, tab monitoring, `<all_urls>` host permission, or source-page DOM access.

Acceptance: the unpacked extension opens a responsive SideWire panel on a supported Chrome version and displays signed-out, loading, unsupported-page, and authenticated-shell states.

### Milestone 5: Authenticate the extension safely

Implement the approved server-to-extension authentication flow. Keep credentials in extension-owned storage, use secure expiring material, support sign-out and server-side revocation, handle expiry clearly, and prevent authentication data from entering host-page contexts or logs.

Prefer a standards-based browser-extension flow or short-lived handoff over copying ordinary web-session secrets. Document any external redirect URIs and local-development setup.

Acceptance: a user can authenticate from the extension, restart Chrome, sign out, and recover from an expired or revoked session. Security tests cover unauthorized API access and revoked credentials.

### Milestone 6: Prove minimal active-page awareness

When the user opens or activates SideWire, read only the current tab metadata allowed by the approved permissions. Validate `http` and `https` schemes, represent unsupported pages explicitly, and display domain/title/favicon safely in the panel.

Do not persist browsing metadata or create page-context records in this milestone. That behavior belongs to the page-collaboration implementation plan after the normalizer is specified and tested.

Acceptance: manual and automated extension tests cover ordinary HTTPS pages, missing metadata, browser-internal pages, new tabs, permission denial, tab navigation, long titles, unsafe favicon values, and extension reloads.

### Milestone 7: Continuous integration and handoff

Create CI that installs locked dependencies, builds the web application and extension, runs backend tests, tenant-isolation tests, frontend type checking, linting, formatting checks, extension tests, production builds, and dependency/security audits appropriate to the chosen stack.

Update `README.md` with actual setup commands and `AGENTS.md` only if repository commands or source-of-truth rules change. Record actual command output and CI links or run identifiers in this plan.

Acceptance: the clean repository setup and CI workflow both pass; the extension artifact is buildable but is not represented as Chrome Web Store approved or production deployed.

## Concrete Steps

The exact commands depend on the approved stack and will replace this provisional sequence before implementation. Do not execute placeholders as if they were verified commands.

Expected categories are:

1. Scaffold the selected server/web starter in the repository root without overwriting documentation.
2. Add the approved extension workspace and shared package structure.
3. Install dependencies and commit every lockfile.
4. Create development environment examples without secrets.
5. Run database migrations and the secure default seeder.
6. Run backend tests and static analysis.
7. Run frontend and extension type checks, linting, tests, and production builds.
8. Load the built development extension into Chrome and complete the manual acceptance matrix.
9. Push the exact verified source and confirm CI independently.

After Milestone 1, replace this section with exact repository commands such as the selected setup command, test commands, formatter checks, type checks, and build commands.

## Validation and Acceptance

The initiative is complete only when all of the following are observed and recorded:

- fresh local setup succeeds from the documented prerequisites and commands;
- registration/authentication and verified internal access work as approved;
- no default seed creates a predictable production user;
- database constraints and tests enforce the approved one-organization boundary;
- cross-organization reads, writes, opaque-ID guesses, and broadcast/API access fail closed;
- the extension manifest contains only approved permissions;
- no content script or source-page modification exists;
- the panel works at narrow and resized widths with keyboard and accessible names;
- supported HTTPS metadata renders as untrusted text;
- unsafe or unsupported page schemes do not create links or durable records;
- extension credentials expire, revoke, and sign out as designed without appearing in logs or host-page contexts;
- clean test, static-analysis, type-check, lint, audit, web build, and extension build commands pass;
- CI passes from the committed lockfiles;
- no documentation claims realtime messaging, billing, Chrome Web Store approval, or deployment is complete.

## Idempotence and Recovery

Framework scaffolding is not assumed safe to rerun over an initialized repository. Perform it in a temporary directory or use a reviewed generation path, then merge intended files without overwriting documentation or user changes.

Database migrations must be additive and reversible during the pre-production foundation. Test rollback locally before recording success. Never reset or erase a shared or production database to repair a migration.

Extension builds may be deleted and regenerated only in their explicit build-output directory. Never use broad recursive deletion against the repository or workspace root.

Authentication and membership seed/test helpers must be safe to repeat in isolated test environments. Production seed behavior must create no known credentials.

If an extension permission proves insufficient, stop and document the exact failed behavior and smallest possible permission change. Do not silently broaden the manifest.

## Artifacts and Notes

Preserve concise evidence here during implementation:

- selected version output;
- final repository tree for application and extension workspaces;
- sanitized extension manifest;
- migration and rollback results;
- tenant-isolation test names and results;
- extension permission inspection;
- manual Chrome acceptance matrix;
- final verification command output;
- CI run reference.

Do not paste secrets, access tokens, complete environment files, or sensitive browsing URLs.

## Interfaces and Dependencies

Exact names are provisional until Milestone 1. The foundation should result in interfaces equivalent to:

- an authenticated `User` domain model;
- one `Organization` domain model and one membership relationship with database-enforced constraints;
- server policies or authorization services that scope organization-owned resources;
- a versioned authenticated extension API namespace;
- an extension auth/session service with explicit sign-in, refresh or renewal, sign-out, expiry, and revocation behavior;
- an active-tab metadata value containing only validated URL, optional title, optional favicon, and supported/unsupported reason;
- shared request/response schemas where they reduce client/server drift;
- repository-owned commands for setup, development, checks, tests, and builds.

Likely dependencies include the selected Laravel starter/authentication facilities, PostgreSQL driver, React, TypeScript, a maintained extension build tool, and test runners already compatible with those choices. Broadcasting, billing, object storage, analytics, AI providers, and native third-party integrations are not Phase 0 dependencies.

