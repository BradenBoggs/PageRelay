# Execution plan 007: close registration and bootstrap the first owner

Lifecycle: completed
Approval: October 9, 2026 user request to disable registration and add a first-user/Organization command; Organization name confirmed as Braden Company.
Verification: 41 focused backend tests, full PHP static analysis, web build/types, focused formatting/lint and desktop/mobile browser checks passed.
Closed: 2026-10-09
Closure: scoped registration/bootstrap acceptance passed in the isolated checkout; commands and evidence below. Deployment and live provisioning remain outside scope.
Release: not deployed; no live account created by this task.

## Purpose / Big Picture

Disable public account registration and provide a server-console command that creates the first verified user, owned Organization and default Workspace. Reuse existing account/membership services. [Accounts](../../features/accounts-and-organizations.md) owns the behavior. Keep supplied credentials out of tracked files, command arguments and output. Do not add tenant switching, an internal operator grant, new member provisioning, a deployment or a shared-database reset.

## Progress

- [x] Inspect current `main` at `522021e`, authentication, membership/default-Workspace creation and signup links.
- [x] Record scoped approval and confirmed Organization name.
- [x] Disable signup routes/UI and eliminate invitation mail links to registration.
- [x] Implement transactional, guarded CLI bootstrap and focused route/command tests.
- [x] Run isolated checks, inspect the diff, and record results and omissions.

## Surprises & Discoveries

Fortify registration is enabled and login/welcome link to its generated routes. Invitation email also links to registration. The unused registration page imports generated routes that disappear once the feature is disabled, so remove that page and the unused provider view binding. Existing CreateOrganization provisions the active billable owner and Main default Workspace; User's password cast hashes credentials. Production web password policy is stronger than the user-specified bootstrap password.

## Decision Log

October 9: disable registration globally, including invitation signup; existing account login/invitation acceptance remains. Use `sidewire:bootstrap` with email, name and Organization options and hidden password/confirmation prompts. A trusted console bootstrap accepts at least eight characters to support the explicit user-selected initial password; leave production web password/reset rules unchanged. Mark the server-provisioned initial account verified so it can sign in immediately. No internal SideWire operator access is implicitly granted.

Refuse initialized databases instead of updating credentials, reassigning membership or creating another Organization. Serialize creation through the configured shared cache lock and recheck empty state inside the transaction. Do not hold the lock during interactive prompts. Commands intended to run concurrently must share the application's lock store.

## Outcomes & Retrospective

Public registration is closed, login/recovery remain usable and the console bootstrap creates the existing owner/membership/default-Workspace structure with hashed credentials. Focused verification passed. No live account was created, deployment was not performed, and no production data or provided credentials were used in fixtures.

## Context and Orientation

Entry points: `config/fortify.php`, `app/Providers/FortifyServiceProvider.php`, `app/Actions/Organizations/CreateOrganization.php`, `app/Domain/Workspaces/EnsureDefaultWorkspace.php`, `app/Models/User.php`, `resources/js/pages/auth/login.tsx`, `resources/js/pages/welcome.tsx`, and invitation notification. Existing auth tests and Organization foundation tests define retained behavior.

## Plan of Work

Remove the Fortify registration feature and web entry points, leave authentication/recovery intact, add the console bootstrap using existing CreateOrganization and User hashing, and add refusal/rollback/validation/login tests. Update Accounts, the README and this evidence record.

## Concrete Steps

Use locked PHP dependencies already installed in a temporary directory; build a separate temporary checkout without application .env or shared database configuration. Run tests only against SQLite memory and an ephemeral app key. Install locked npm dependencies in that checkout if available, regenerate Wayfinder and verify the web build/types. Run Pint, focused PHPUnit checks, documentation checks and diff checks. Never run bootstrap against a shared or Forge database from this workspace.

## Validation and Acceptance

GET/POST signup, including invitation variants, cannot create accounts. Login/welcome contain no signup links; invitation mail resolves to login. Bootstrap creates exactly one hashed, verified user, one active billable owner membership, one Organization and one default Workspace; no operator grant. Duplicate/nonempty bootstrap is refused without modifying records/passwords. Validation, lock contention and organization-creation failure leave no partial identity. Login works with the created account. Real deployment and live bootstrap remain separate from code verification.

### October 9 verification evidence

Revision: `522021e` plus the implementation patch, committed during verification as `9f867ae`. Remaining changes after that commit are browser-script formatting and this documentation closure. The source checkout at `/private/tmp/sidewire-bootstrap-check` was created with `git archive` and overlaid with changed source; it contained no copied application `.env` or shared database credentials. Locked Composer dependencies were reused from the previous temporary installation and its autoloader regenerated. Runtime: macOS, PHP 8.5.1, Laravel 13.30.1, PHPUnit 12.5.34, Node 24.14.1. PHPUnit used SQLite `:memory:` and an ephemeral app key. No tests used the requested owner email or a real organization.

Observed checks:

- `APP_KEY=<ephemeral> vendor/bin/phpunit tests/Feature/Auth tests/Feature/Console/BootstrapSidewireTest.php tests/Feature/Organizations`: 41 passed, 151 assertions, no skips. Earlier focused command/registration run: 13 passed, 71 assertions. The tests include creation/login, active billable ownership/default Workspace, hashed password/verified email/no operator grant, refused retries and nonempty installs, validation failures, transaction rollback, actual cache-lock contention, noninteractive refusal and command-only production password acceptance.
- `APP_ENV=testing APP_KEY=<ephemeral> CACHE_STORE=array vendor/bin/phpstan analyse --memory-limit=1G --no-progress --debug`: full configured PHP static analysis passed, zero errors. Initial parallel-worker execution could not open a socket under the sandbox; the supported debug mode completed without workers.
- `APP_ENV=testing APP_KEY=<ephemeral> CACHE_STORE=array npm run build:web`: passed; Wayfinder regenerated without registration routes and no stale signup imports remained. `npm run types:check:web`: passed.
- Locked `vp fmt --check` and `vp lint` on login/welcome plus the new browser script: passed after formatting. Pint checks on all changed/new PHP files passed. The temporary localhost app server was stopped after browser verification. Browser script syntax check passed.
- With isolated app served on `127.0.0.1:8017` (`APP_ENV=testing`, SQLite memory, array cache/session, sync queue, ephemeral key), `tests/Browser/closed-registration.cjs` ran using pinned Playwright 1.56.1/Chromium 141.0.7390.37 from a temporary install. Set `SIDEWIRE_PLAYWRIGHT_PACKAGE` to its temporary package.json, `PLAYWRIGHT_BROWSERS_PATH` to its temporary browser directory, `SIDEWIRE_BROWSER_URL` to that origin, and `SIDEWIRE_BROWSER_EVIDENCE_DIR` to the retained artifact directory. Actual compiled login/home showed no signup at 1440px and 390px; email-to-password keyboard focus, login controls, password-recovery navigation, no horizontal overflow, `/register` 404 and absence of JavaScript page errors passed. Empty-form [desktop](../artifacts/007-closed-registration/login-1440.png) and [mobile](../artifacts/007-closed-registration/login-390.png) screenshots were inspected.
- `node scripts/check-docs.mjs`: passed. `node --test scripts/check-docs.test.mjs`: 18 passed. `git diff --check`: passed.

Initial lock-contention test mocks interfered with the app cache manager; replaced them with a real held cache lock before the passing runs. Native browser connectors were unavailable; the isolated automated browser harness verified the compiled web UI. Automatic permission review timed out once on the combined browser setup/run command; separate file preparation plus the permitted retry succeeded. No permission or test was weakened to pass.

Not run: the full application test suite, PostgreSQL/MySQL command execution, exhaustive cross-process/bootstrap races, a Forge deployment or live initial-account creation. The shared lock's multi-process behavior relies on the configured application lock store; tests exercised contention in the isolated array cache. These are limits on broader certification, not unverified steps in the scoped tested acceptance.

## Idempotence and Recovery

Repeated bootstrap fails safely once an identity or Organization exists. Existing accounts are never overwritten. A failed create transaction rolls back user/Organization/member/Workspace changes. Use hidden prompts and never log password input. Cached routes/config must be rebuilt by normal deployment after disabling the feature. No migrations or data deletion are needed.

## Artifacts and Notes

Actual commands, baseline plus patch, environment and results are recorded above. Do not persist the provided password or real identity in test fixtures or documentation.

## Interfaces and Dependencies

Reuse Laravel Fortify, existing User password casts, CreateOrganization, Cache locks and transaction boundaries. No new package or schema. Provider reference checked October 9: [Laravel feature configuration](https://laravel.com/framework/docs/starter-kits), [Artisan secret prompts](https://laravel.com/framework/docs/artisan/commands).
