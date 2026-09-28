# Execution plan 000: trusted SideWire foundation

Status: implementation complete locally on September 5, 2026. The first GitHub Actions run remains pending until these changes are committed and pushed.

## Purpose / Big Picture

Create the smallest trustworthy technical foundation on which SideWire's page-aware collaboration loop can be built. At the end of this initiative, a developer can run one repository locally, authenticate in a Laravel/Inertia React web application, create the single supported organization and its default workspace, manage organization members, inspect internal records through Filament, run the queue and realtime foundation, and load a development Chrome side panel without confusing Organization, Workspace, and Team.

The foundation installs and correctly owns Cashier per-seat billing data, Sanctum extension API authentication, Reverb broadcasting, Horizon queue operations, and Filament internal administration. It does not select a production price or claim that complete checkout, failed-payment, cancellation, page messaging, tasks, inbox/search, integrations, marketing, deployment, or Chrome Web Store review is finished.

## Progress

- [x] 2026-09-02: Create repository-level contributor guidance and product, architecture, UI, feature, roadmap, and execution-plan documents.
- [x] 2026-09-02: Establish selective class documentation, feature implementation maps, code-to-specification references, and ExecPlan file-orientation rules in `docs/DOCUMENTATION.md`.
- [x] 2026-09-02: Approve the Laravel/Inertia React foundation and supporting package stack.
- [x] 2026-09-02: Approve Organization as the tenant and Stripe customer, Workspace as a collaboration container, and Team as an organization-owned member group.
- [x] 2026-09-02: Approve removal of all upstream team-switching and personal-team behavior before the tenant concept is renamed to Organization.
- [x] 2026-09-03: Scaffold the pinned official Laravel React starter without overwriting repository-owned documentation.
- [x] 2026-09-03: Remove team switching and personal-team behavior while the generated tenant concept is still named Team.
- [x] 2026-09-03: Rename the stripped tenant concept to Organization and verify that no current-tenant state remains.
- [x] 2026-09-03: Add the real Workspace, Team, and TeamMembership foundation under Organization.
- [x] 2026-09-05: Install and wire Cashier, Sanctum, Reverb, Horizon, Filament, PostgreSQL defaults, and Redis defaults.
- [x] 2026-09-05: Implement and test one-organization-per-user isolation, default workspace creation, and active-seat calculation.
- [x] 2026-09-04: Scaffold the Chrome Manifest V3 extension with React, Tailwind CSS, a native side panel, a build watcher, and only `sidePanel`, `activeTab`, and `storage` permissions.
- [x] 2026-09-05: Add the PKCE authentication handoff, scoped Sanctum session, confirmation UI, and signed-in/signed-out side-panel states.
- [x] 2026-09-05: Add automated checks, continuous integration, secure seed behavior, internal operator resources, and contributor setup instructions.
- [x] 2026-09-05: Run all approved local verification commands and record actual evidence here.
- [ ] Observe the first GitHub Actions run from committed lockfiles after this implementation is pushed.

## Surprises & Discoveries

- The original repository contained documentation only, so the framework must be merged around those sources of truth rather than replacing them.
- The official starter's Teams variant includes `current_team_id`, URL-scoped current-team routing, switching methods, a team selector, fallback behavior, and personal teams. Renaming those pieces would create exactly the wrong Organization model, so removal is an explicit pre-rename milestone.
- SideWire can deliver the first context workflow without a content script. Keeping content scripts and broad host permissions out of Phase 0 materially reduces privacy and extension-review risk.
- 2026-09-04: The merged starter uses npm with a committed `package-lock.json`; pnpm is not installed in the current development environment. The extension joins the repository through npm workspaces while `pnpm-workspace.yaml` remains aligned for a future deliberate package-manager decision.
- 2026-09-04: The original shell had Node 18.19.1, but the resolved Vite toolchain requires a modern Node release and failed there while importing `node:util.styleText`. Local development now selects Node 24 LTS while retaining Node 22.18 as the lowest supported LTS runtime.
- 2026-09-04: Adding the extension as a JavaScript workspace makes Vite+ require an explicit package target for app commands. Root web commands now use `vp -C .`; the Sail workflow runs the web watcher and extension watcher together without competing for the container's forwarded Vite port.
- 2026-09-05: The locked Symfony 8.1 packages require PHP 8.4.1 or newer. The repository and CI now declare PHP 8.4.1+ and the verified Sail runtime is PHP 8.4.25.
- 2026-09-05: The Reverb installer published the expected configuration and routes before stopping at an interactive prompt despite `--no-interaction`; the published boundary was inspected and verified directly.
- 2026-09-05: shadcn 4.21 detects the retained `pnpm-workspace.yaml` and attempts pnpm even though this repository currently uses npm. Installing the CLI in the npm root and configuring both MCP clients to invoke it through Sail avoids that initializer mismatch and the host's obsolete Node 18 runtime.
- 2026-09-05: The first forbidden-symbol check appeared to pass in Sail even though `rg` was unavailable. The script now deliberately falls back to recursive `grep` and treats search errors as failures; the corrected audit passed without command errors.
- 2026-09-05: A live Chrome connection returned HTTP 403 after browser approval. The account had an active organization membership but no verified email; `User` inherited Laravel's verification methods without implementing `MustVerifyEmail`, so web `verified` middleware had been a no-op while the exchange correctly failed closed. Implementing the contract aligned both boundaries, and an unverified-handoff regression test now proves authorization cannot occur.

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
- Decision: Use the repository's currently locked npm workflow for the first extension scaffold instead of introducing an unverified package-manager migration. Reason: npm and `package-lock.json` are already present, while pnpm is not installed locally. Date: 2026-09-04.
- Decision: Run PHP and JavaScript development commands through Sail with PHP 8.4 and Node 24. Reason: the locked dependencies exceed the host PHP and Node versions, and one runtime prevents host/container watcher conflicts. Date: 2026-09-05.
- Decision: Authenticate the extension with a short-lived, one-time, PKCE-bound web confirmation handoff that exchanges for an expiring `extension:access` Sanctum token. Reason: neither the bearer token nor handoff secret belongs in a browser URL or host page, and cookie sessions must not cross the extension API boundary. Date: 2026-09-05.
- Decision: Add only the exact localhost API host permission to the development extension manifest. Reason: the side panel must call the local server, but no content script or broad website access is required. Production origin permissions remain part of distribution approval. Date: 2026-09-05.
- Decision: Keep Filament operator resources read-only and require an explicit `is_sidewire_admin` grant on an existing account. Reason: foundation observability does not require cross-tenant mutation tools or a predictable seeded administrator. Date: 2026-09-05.
- Decision: Use existing shadcn Button and Card patterns for the web confirmation, and a separate shadcn-compatible Button boundary inside the extension package. Reason: the web application and extension are separate UI surfaces and should not create an unsupported cross-bundle component dependency. Date: 2026-09-05.

## Outcomes & Retrospective

The foundation now ships the Laravel/Inertia application, enforced Organization/Workspace/Team model, organization-owned Cashier records and seat reconciliation, Redis/Horizon queue operations, Reverb private-channel plumbing, explicit read-only Filament administration, and a loadable Chrome side panel with a secure web authentication handoff.

The implementation deliberately does not include a price, checkout or portal UI, failed-payment product behavior, page contexts, chats, tasks, Activity, third-party integrations, production deployment, or Chrome Web Store packaging. Those remain governed by their owning feature documents and later plans.

Local migrations, rollback, tests, analysis, formatting, types, builds, route boundaries, extension permissions, and the combined development command all pass. The remaining external evidence is the first GitHub Actions run after commit and push; this plan must record that run rather than predicting its result.

## Context and Orientation

Before implementation, the repository contained documentation and no application source. It now contains the merged Laravel/Inertia application, extension workspace, service configuration, CI workflow, and tests while retaining the repository-owned source documents.

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
- `app/Domain/Extension/`
- `app/Models/ExtensionHandoff.php`
- `app/Http/Middleware/EnsureExtensionAccessToken.php`
- `app/Http/Controllers/ExtensionConnectionController.php`
- `app/Providers/Filament/AdminPanelProvider.php`
- `app/Filament/Resources/`
- `routes/api.php`
- `routes/channels.php`
- `resources/js/pages/extension/connect.tsx`
- `apps/extension/`
- `.github/workflows/ci.yml`
- `scripts/check-foundation-boundaries.sh`
- `tests/Feature/Organizations/`
- `tests/Feature/Billing/`
- `tests/Feature/Api/`
- `tests/Feature/Administration/`

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

Resolved foundation packages are Cashier 16.8.0, Sanctum 4.3.3, Reverb 1.11.1, Horizon 5.48.3, and Filament 5.7.8. Cashier customer columns live on `organizations`; Filament resources under `app/Filament/Resources/` expose only list and view behavior for users, organizations, memberships, subscriptions, and failed jobs.

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

The scaffold uses `apps/extension/public/manifest.json`,
`apps/extension/src/sidepanel/main.tsx`,
`apps/extension/src/background/service-worker.ts`, and
`apps/extension/vite.config.ts`. Root npm workspace scripts build and watch the
extension independently from the Laravel Vite application.

Extension authentication is implemented in `app/Domain/Extension/`, `routes/api.php`, `app/Http/Controllers/ExtensionConnectionController.php`, `resources/js/pages/extension/connect.tsx`, and `apps/extension/src/auth/session.ts`. Active-page metadata remains part of the later page-context initiative.

### Milestone 8: Continuous integration and handoff

Create CI that installs locked dependencies, builds the web application and extension, runs backend tests and static analysis, checks frontend and extension types, runs formatting and lint checks, and inspects forbidden switching symbols.

Update README with actual setup commands. Add concise implementation maps to implemented feature documents. Record actual verification evidence in this plan.

The implemented paths are `.github/workflows/ci.yml`, `scripts/check-foundation-boundaries.sh`, `.nvmrc`, `README.md`, `docs/features/browser-extension.md`, `docs/features/billing-and-product-access.md`, and this plan. The workflow is ready for its first run after commit and push; no remote result is claimed here.

## Concrete Steps

The implemented local workflow is npm-based and runs application tooling through Sail. From a fresh WSL checkout, install Composer dependencies with the PHP 8.4 Sail Composer image as documented in `README.md`, copy `.env.example`, and then run:

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail npm ci
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm run dev:all
```

The foundation packages were installed and published with:

```bash
./vendor/bin/sail composer require laravel/cashier:^16.8 laravel/sanctum:^4.3 laravel/reverb:^1.11 laravel/horizon:^5.48 filament/filament:^5.7 --with-all-dependencies
./vendor/bin/sail artisan install:api --no-interaction
./vendor/bin/sail artisan horizon:install --no-interaction
./vendor/bin/sail artisan filament:install --panels --no-interaction
```

Reverb configuration and routes were published by its installer before its interactive prompt stopped the command. The resulting files were inspected and verified; rerunning the installer is not a setup requirement.

The verified local checks are:

```bash
./vendor/bin/sail composer validate --strict
./vendor/bin/sail pint --test
./vendor/bin/sail composer types:check
./vendor/bin/sail artisan test
./vendor/bin/sail npm run foundation:check
./vendor/bin/sail npm run check
./vendor/bin/sail npm run types:check
./vendor/bin/sail npm run build
```

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

- 2026-09-04 extension scaffold verification: TypeScript completed without
  errors using Node 22.18.0 and TypeScript 5.9.3. Vite 8.2.2 produced
  `apps/extension/dist/manifest.json`, `sidepanel.html`, `service-worker.js`,
  and locally bundled side-panel JavaScript and CSS. A manifest audit reported
  only `sidePanel`, `activeTab`, and `storage`, with no `content_scripts` or
  `host_permissions` entries. `git diff --check` passed.
- 2026-09-05 dependency evidence: the application retains upstream starter commit `0bc7a8d4538bed1d4ea8ef9469e2a6d915be2ec8`; Composer reports Cashier 16.8.0, Sanctum 4.3.3, Reverb 1.11.1, Horizon 5.48.3, and Filament 5.7.8. Sail reports PHP 8.4.25 and Node 24.20.0.
- 2026-09-05 migration evidence: `migrate:fresh --seed --force` applied every migration through `2026_09_05_050322_add_subscription_item_foreign_key` in an isolated SQLite file, and `migrate:rollback --force` reversed every migration. The temporary database was then removed; the local PostgreSQL database was not reset.
- 2026-09-05 extension and operator focused tests: 13 tests passed with 63 assertions for the PKCE handoff, confirmation page, and Filament access. The expanded admin-only resource test then passed separately with 4 tests and 19 assertions, including the read-only failed-job table.
- 2026-09-05 static and frontend evidence: Pint passed, PHPStan passed with zero errors, Vite+ reported all checked files formatted with no lint warnings, web and extension TypeScript passed, and Vite 8.2.2 built both applications.
- 2026-09-05 clean-install and full-suite evidence: `composer install --no-interaction --prefer-dist --optimize-autoloader` verified the Composer lock on PHP 8.4, and `npm ci` installed 543 packages from `package-lock.json` with zero reported vulnerabilities. After the live email-verification boundary fix, the final backend suite passed 73 tests with 266 assertions; frontend checks covered 111 formatted files and 74 linted files without warnings.
- 2026-09-05 process evidence: `npm run dev:all` started the web Vite server, extension watcher, Horizon, and Reverb together; the SSR dependency graph warmed without the earlier `window is not defined` error. The process was then stopped intentionally with `Ctrl+C`.
- 2026-09-05 boundary evidence: the corrected forbidden-switch audit ran inside Sail using its `grep` fallback and passed. The extension build contains `sidePanel`, `activeTab`, and `storage`, one exact localhost API host permission, and no content script. A real Chrome-origin preflight returned HTTP 204 with the required method and header allowances, and the behavior now has a regression test.
- 2026-09-05 shadcn MCP evidence: Codex lists the `shadcn` stdio server enabled through Sail. A direct MCP session completed initialization, listed tools, returned the `@shadcn` registry, inspected Button and Card registry items and demos, and returned its component audit checklist. A new Codex session is required for normal tool exposure.
- 2026-09-05 CI status: `.github/workflows/ci.yml` contains the locked install, boundary, format, analysis, test, type, and build stages. The same stages pass locally; the first remote run is still pending commit and push.

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

The implemented dependencies are Laravel 13, PHP 8.4.1 or newer, PostgreSQL 18, Redis, Fortify, Inertia 3, React 19, TypeScript, Tailwind 4, Vite 8, Cashier, Sanctum, Reverb, Horizon, and Filament. Node 24 LTS is the primary JavaScript runtime; Node 22.18 or newer remains allowed by `package.json`. Exact resolved versions remain locked in `composer.lock` and `package-lock.json`.
