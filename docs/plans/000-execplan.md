# Execution plan 000: trusted SideWire foundation

Status: approved and implementation started on September 2, 2026.

## Purpose / Big Picture

Create the smallest trustworthy technical foundation on which SideWire's page-aware collaboration loop can be built. At the end of this initiative, a developer can run one repository locally, authenticate in a Laravel/Inertia React web application, create the single supported organization and its default workspace, manage organization members, inspect internal records through Filament, run the queue and realtime foundation, and load a development Chrome side panel without confusing Organization, Workspace, and Team.

The foundation installs and correctly owns Cashier per-seat billing data, Sanctum extension API authentication, Reverb broadcasting, Horizon queue operations, and Filament internal administration. It does not select a production price or claim that complete checkout, failed-payment, cancellation, page messaging, tasks, inbox/search, integrations, marketing, deployment, or Chrome Web Store review is finished.

## Progress

- [x] 2026-09-02: Create repository-level contributor guidance and product, architecture, UI, feature, roadmap, and execution-plan documents.
- [x] 2026-09-02: Establish selective class documentation, feature implementation maps, code-to-specification references, and ExecPlan file-orientation rules in `docs/DOCUMENTATION.md`.
- [x] 2026-09-02: Approve the Laravel/Inertia React foundation and supporting package stack.
- [x] 2026-09-02: Approve Organization as the tenant and Stripe customer, Workspace as a collaboration container, and Team as an organization-owned member group.
- [x] 2026-09-02: Approve removal of all upstream team-switching and personal-team behavior before the tenant concept is renamed to Organization.
- [ ] Scaffold the pinned official Laravel React starter on the implementation branch without overwriting repository documentation.
- [ ] Remove team switching and personal-team behavior while the generated tenant concept is still named Team.
- [ ] Rename the stripped tenant concept to Organization and verify no current-tenant state remains.
- [ ] Add the real Workspace, Team, and TeamMembership foundation under Organization.
- [ ] Install and wire Cashier, Sanctum, Reverb, Horizon, Filament, PostgreSQL defaults, and Redis defaults.
- [ ] Implement and test one-organization-per-user isolation, default workspace creation, and active-seat calculation.
- [ ] Scaffold the Chrome Manifest V3 extension with a native side panel and minimal permissions.
- [ ] Add automated checks, continuous integration, secure seed behavior, and contributor setup instructions.
- [ ] Run all approved verification commands and record actual evidence here.

## Surprises & Discoveries

- The original repository contained documentation only, so the framework must be merged around those sources of truth rather than replacing them.
- The official starter's Teams variant includes `current_team_id`, URL-scoped current-team routing, switching methods, a team selector, fallback behavior, and personal teams. Renaming those pieces would create exactly the wrong Organization model, so removal is an explicit pre-rename milestone.
- SideWire can deliver the first context workflow without a content script. Keeping content scripts and broad host permissions out of Phase 0 materially reduces privacy and extension-review risk.

Add implementation findings here with dates and evidence.

## Decision Log

- Decision: Use SideWire as the user-facing product name and retain PageRelay only as the repository codename. Reason: SideWire is the current preferred name while the repository already exists as PageRelay. Date: 2026-09-02.
- Decision: Keep SideWire independent from the owner's other products and data models. Reason: Its horizontal value depends on augmenting any browser-based tool. Date: 2026-09-02.
- Decision: Use the official Laravel React starter pinned to upstream commit `0bc7a8d4538bed1d4ea8ef9469e2a6d915be2ec8`. Reason: it provides maintained Laravel 13, Fortify, Inertia 3, React 19, TypeScript, Tailwind 4, tests, static analysis, and starter UI without adopting a third-party SaaS architecture. Date: 2026-09-02.
- Decision: Use the upstream Teams feature as source material, but remove current-team switching, personal teams, fallback selection, and selector UI before renaming the tenant concept. Reason: Organization is the company tenant, not a selectable collaboration workspace. Date: 2026-09-02.
- Decision: The MVP supports exactly one organization per user and has no dormant organization-switching state. Reason: this is simpler to authorize, test, bill, and expose safely to the extension. Date: 2026-09-02.
- Decision: Organization is the tenant and Cashier customer; Workspace is a collaboration container; Team is a group of organization members. Reason: the business concepts must remain distinct in code, schema, and user-facing language. Date: 2026-09-02.
- Decision: Use single-database row-level organization isolation instead of a database-switching tenancy package. Reason: explicit organization-scoped relationships and policies are sufficient and easier to audit for the MVP. Date: 2026-09-02.
- Decision: Use Cashier, Sanctum, Reverb, Horizon, Redis, and Filament. Reason: these maintained Laravel packages cover subscription quantities, extension API sessions, realtime delivery, queues, and internal administration while keeping customer product UI in React. Date: 2026-09-02.
- Decision: Begin with Chrome Manifest V3 and the native side panel without a content script or broad host permissions. Date: 2026-09-02.

Record material implementation decisions and deviations here. Permanent behavior must also be updated in its owning document.

## Outcomes & Retrospective

Implementation is underway on `feature/sidewire-foundation`. No verification result is complete until a command or CI job is actually run and recorded below.

When this plan completes, record what shipped, deviations from the plan, verification evidence, remaining risks, and lessons for the page-collaboration initiative.

## Context and Orientation

Before implementation, the repository contains documentation and no application source. The implementation branch is created from the merged main documentation commit.

Primary source documents:

- `AGENTS.md` defines contributor and agent behavior.
- `docs/PRODUCT.md` defines SideWire's purpose, vocabulary, boundaries, and MVP direction.
- `docs/ARCHITECTURE.md` defines the approved stack and mandatory trust, privacy, tenancy, billing, extension, and page-identity constraints.
- `docs/UI.md` defines shared web and side-panel interaction rules.
- `docs/DOCUMENTATION.md` defines code-documentation and implementation-map rules.
- `docs/features/accounts-and-organizations.md` owns tenant membership, roles, invitations, and the removal-before-rename invariant.
- `docs/features/workspaces-and-teams.md` owns the distinct Workspace and Team concepts beneath Organization.
- `docs/features/billing-and-product-access.md` owns Cashier, seats, and paid access.
- `docs/features/browser-extension.md` owns the extension shell and permission boundary.
- `PLANS.md` defines the execution-plan standard and roadmap.

The upstream scaffold is Laravel's `laravel/react-starter-kit` Teams branch at commit `0bc7a8d4538bed1d4ea8ef9469e2a6d915be2ec8`. Its generated switching behavior must not survive as renamed organization behavior.

Expected stable application entry points after implementation include:

- `app/Models/Organization.php`
- `app/Models/OrganizationMembership.php`
- `app/Models/OrganizationInvitation.php`
- `app/Models/Workspace.php`
- `app/Models/Team.php`
- `app/Models/TeamMembership.php`
- `app/Policies/OrganizationPolicy.php`
- `app/Http/Middleware/EnsureOrganizationMembership.php`
- `app/Domain/Billing/SyncOrganizationSeatQuantity.php`
- `app/Jobs/Billing/SyncOrganizationSeatQuantity.php`
- `app/Providers/Filament/AdminPanelProvider.php`
- `apps/extension/`
- `tests/Feature/Organizations/`
- `tests/Feature/Billing/`

## Plan of Work

### Milestone 1: Merge the official starter safely

Generate or copy the pinned official Laravel React starter into a temporary location, then merge application files into the repository without overwriting `AGENTS.md`, `PLANS.md`, `docs/`, or project-specific README content. Commit dependency manifests and lockfiles generated by the selected package managers.

Expected changed paths include Laravel's conventional `app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `storage/`, and `tests/` directories plus root framework manifests.

### Milestone 2: Strip the generated tenant switch while it is still Team

Before any Team-to-Organization replacement, remove:

- the `current_team_id` migration and model property;
- current-team relationships and URL defaults;
- switch actions, methods, routes, selectors, menus, and frontend types;
- personal-team columns, creation behavior, and UI;
- fallback-team behavior after deletion or removal;
- route prefixes that rely on a selected team.

Retain only reusable membership, invitation, role, policy, and tenant-scoping behavior. Add a repository check that fails when forbidden current-team symbols return.

### Milestone 3: Rename the stripped tenant to Organization

Rename the remaining tenant files, classes, tables, routes, policies, data objects, UI, tests, and vocabulary from Team to Organization. Use `organization_memberships` instead of a generic `memberships` table. Do not add a `current_organization_id` replacement.

Registration creates an organization and owner membership. Invitation acceptance joins the one supported organization. Routes derive the organization from authenticated membership rather than a client-selected tenant slug.

### Milestone 4: Add actual workspaces and teams

Create organization-owned `Workspace`, `Team`, and `TeamMembership` models and migrations. Create one default workspace when an organization is created. Team membership must reference a user who has an active membership in the same organization.

Do not implement team-based access control, workspace guests, custom roles, or separate billing in this milestone.

### Milestone 5: Install the Laravel service foundation

Install and configure:

- Cashier with `Organization` as the customer model;
- Sanctum and a versioned extension API boundary;
- Reverb and private-channel authorization plumbing;
- Redis and Horizon;
- Filament at `/admin` with explicit SideWire super-admin access;
- PostgreSQL defaults and SQLite test configuration.

Customer organization and billing screens remain in React. Filament is for internal operators only.

### Milestone 6: Enforce and test organization isolation and seats

Add database constraints, policies, scoped route binding, middleware, factories, and tests proving:

- same-organization access succeeds;
- cross-organization reads and writes fail without revealing record existence;
- one user cannot acquire a second organization membership through normal application paths;
- default workspace creation is idempotent;
- team membership cannot cross organizations;
- active billable organization memberships produce the correct seat count;
- pending and removed memberships do not count;
- a member in multiple teams still counts once;
- seat synchronization is idempotent and safe to retry.

### Milestone 7: Scaffold the Chrome extension

Create `apps/extension` using Manifest V3, React, and TypeScript. Add the native side-panel declaration and minimal permissions. Do not add a content script, scripting permission, history permission, tab monitoring, `<all_urls>` host permission, or source-page DOM access.

Extension authentication and active-page metadata behavior may be completed in the remainder of this plan after the server foundation passes.

### Milestone 8: Continuous integration and handoff

Create CI that installs locked dependencies, builds the web application and extension, runs backend tests and static analysis, checks frontend and extension types, runs formatting and lint checks, and inspects forbidden switching symbols.

Update README with actual setup commands. Add concise implementation maps to implemented feature documents. Record actual verification evidence in this plan.

## Concrete Steps

The planned repository commands are:

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
pnpm install --frozen-lockfile
pnpm build
php artisan test
composer types:check
composer lint:check
pnpm check
pnpm types:check
```

Package installation commands used during scaffolding are expected to include:

```bash
composer require laravel/cashier laravel/sanctum laravel/reverb laravel/horizon filament/filament
php artisan install:api --no-interaction
php artisan install:broadcasting --no-interaction
php artisan horizon:install
php artisan filament:install --panels --no-interaction
```

These commands are planned, not yet claimed as successful. Replace or annotate them with the exact verified commands and versions produced by implementation.

## Validation and Acceptance

The initiative is complete only when all of the following are observed and recorded:

- fresh setup succeeds from documented prerequisites and locked dependencies;
- registration and verified authentication work;
- no predictable production user is seeded;
- no `current_team_id`, `current_organization_id`, switch route, organization selector, personal team/organization, or fallback tenant survives;
- the code has separate Organization, Workspace, and Team models and tables;
- Organization is the Cashier customer and active organization membership is the only seat source;
- database constraints and tests enforce the approved one-organization boundary;
- cross-organization reads, writes, opaque-ID guesses, broadcast/API access, workspace access, and team membership fail closed;
- Filament is inaccessible to ordinary organization owners and members;
- the extension manifest contains only approved permissions and no content script;
- clean backend tests, static analysis, formatter checks, frontend checks, web build, and extension build pass;
- CI passes from committed lockfiles;
- implemented feature documents contain accurate concise implementation maps;
- no documentation claims unimplemented pricing, checkout policy, messaging, deployment, or Chrome Web Store approval.

## Idempotence and Recovery

Framework scaffolding is not safe to rerun over an initialized repository. Generate into a temporary directory and merge only reviewed files. Preserve documentation and existing user changes.

The removal-before-rename transformation must be scripted or committed in a reviewable sequence. A failed transformation must leave the implementation branch recoverable by resetting to the last reviewed commit; never repair it by force-updating `main`.

Database migrations are additive and reversible during the pre-production foundation. Test rollback locally or in CI before recording success. Never reset or erase a shared or production database to repair a migration.

Seat synchronization recalculates quantity and may be retried. Extension builds may be deleted and regenerated only in their explicit build-output directory.

If an extension permission proves insufficient, stop and document the exact failed behavior and the smallest possible permission change. Do not silently broaden the manifest.

## Artifacts and Notes

Preserve concise evidence here during implementation:

- pinned upstream starter commit and resolved dependency versions;
- final repository tree for application and extension workspaces;
- forbidden-switch symbol scan;
- migration and rollback results;
- organization-isolation and billing test names and results;
- sanitized extension manifest;
- final verification command output;
- CI run reference and job results.

Do not paste secrets, access tokens, complete environment files, or sensitive browsing URLs.

## Interfaces and Dependencies

The foundation targets these interfaces:

- `User::organizationMembership()` and `User::organization()` as singular approved relationships;
- `Organization::memberships()`, `members()`, `workspaces()`, `teams()`, and `billableSeatCount()`;
- `OrganizationMembership` with role, status, and billable state;
- `Workspace::organization()`;
- `Team::organization()` and `Team::memberships()`;
- an organization membership resolver or middleware that derives the tenant from the authenticated user;
- a versioned `auth:sanctum` extension API namespace;
- an idempotent organization seat synchronization service and queued job;
- a private Reverb channel authorization boundary;
- a Filament Admin panel protected by explicit super-admin authorization;
- repository-owned setup, development, check, test, and build commands.

Expected dependencies are Laravel 13, PHP 8.3 or newer, PostgreSQL, Redis, Fortify, Inertia 3, React 19, TypeScript, Tailwind 4, Cashier, Sanctum, Reverb, Horizon, Filament, and the selected extension build tool. Exact resolved versions belong in lockfiles and implementation evidence.
