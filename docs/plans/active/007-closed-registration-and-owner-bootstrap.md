# Execution plan 007: close registration and bootstrap the first owner

Lifecycle: in-progress
Approval: October 9, 2026 user request to disable registration and add a first-user/Organization command; Organization name confirmed as Braden Company.
Verification: implementation and isolated checks in progress.
Release: not deployed; no live account created by this task.

## Purpose / Big Picture

Disable public account registration and provide a server-console command that creates the first verified user, owned Organization and default Workspace. Reuse existing account/membership services. [Accounts](../../features/accounts-and-organizations.md) owns the behavior. Keep supplied credentials out of tracked files, command arguments and output. Do not add tenant switching, an internal operator grant, new member provisioning, a deployment or a shared-database reset.

## Progress

- [x] Inspect current `main` at `522021e`, authentication, membership/default-Workspace creation and signup links.
- [x] Record scoped approval and confirmed Organization name.
- [ ] Disable signup routes/UI and eliminate invitation mail links to registration.
- [ ] Implement transactional, guarded CLI bootstrap and focused route/command tests.
- [ ] Run isolated checks, inspect the diff, and record results and omissions.

## Surprises & Discoveries

Fortify registration is enabled and login/welcome link to its generated routes. Invitation email also links to registration. The unused registration page imports generated routes that disappear once the feature is disabled, so remove that page and the unused provider view binding. Existing CreateOrganization provisions the active billable owner and Main default Workspace; User's password cast hashes credentials. Production web password policy is stronger than the user-specified bootstrap password.

## Decision Log

October 9: disable registration globally, including invitation signup; existing account login/invitation acceptance remains. Use `sidewire:bootstrap` with email, name and Organization options and hidden password/confirmation prompts. A trusted console bootstrap accepts at least eight characters to support the explicit user-selected initial password; leave production web password/reset rules unchanged. Mark the server-provisioned initial account verified so it can sign in immediately. No internal SideWire operator access is implicitly granted.

Refuse initialized databases instead of updating credentials, reassigning membership or creating another Organization. Serialize creation through the configured shared cache lock and recheck empty state inside the transaction. Do not hold the lock during interactive prompts. Commands intended to run concurrently must share the application's lock store.

## Outcomes & Retrospective

No implementation verification or production account creation is established yet.

## Context and Orientation

Entry points: `config/fortify.php`, `app/Providers/FortifyServiceProvider.php`, `app/Actions/Organizations/CreateOrganization.php`, `app/Domain/Workspaces/EnsureDefaultWorkspace.php`, `app/Models/User.php`, `resources/js/pages/auth/login.tsx`, `resources/js/pages/welcome.tsx`, and invitation notification. Existing auth tests and Organization foundation tests define retained behavior.

## Plan of Work

Remove the Fortify registration feature and web entry points, leave authentication/recovery intact, add the console bootstrap using existing CreateOrganization and User hashing, and add refusal/rollback/validation/login tests. Update Accounts, the README and this evidence record.

## Concrete Steps

Use locked PHP dependencies already installed in a temporary directory; build a separate temporary checkout without application .env or shared database configuration. Run tests only against SQLite memory and an ephemeral app key. Install locked npm dependencies in that checkout if available, regenerate Wayfinder and verify the web build/types. Run Pint, focused PHPUnit checks, documentation checks and diff checks. Never run bootstrap against a shared or Forge database from this workspace.

## Validation and Acceptance

GET/POST signup, including invitation variants, cannot create accounts. Login/welcome contain no signup links; invitation mail resolves to login. Bootstrap creates exactly one hashed, verified user, one active billable owner membership, one Organization and one default Workspace; no operator grant. Duplicate/nonempty bootstrap is refused without modifying records/passwords. Validation, lock contention and organization-creation failure leave no partial identity. Login works with the created account. Real deployment and live bootstrap remain separate from code verification.

## Idempotence and Recovery

Repeated bootstrap fails safely once an identity or Organization exists. Existing accounts are never overwritten. A failed create transaction rolls back user/Organization/member/Workspace changes. Use hidden prompts and never log password input. Cached routes/config must be rebuilt by normal deployment after disabling the feature. No migrations or data deletion are needed.

## Artifacts and Notes

Record actual commands, baseline plus patch, environment and results below. Do not persist the provided password or real identity in test fixtures or documentation.

## Interfaces and Dependencies

Reuse Laravel Fortify, existing User password casts, CreateOrganization, Cache locks and transaction boundaries. No new package or schema. Provider reference checked October 9: [Laravel feature configuration](https://laravel.com/framework/docs/starter-kits), [Artisan secret prompts](https://laravel.com/framework/docs/artisan/commands).
