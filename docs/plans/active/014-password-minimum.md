# 014 — Eight-character password minimum

Lifecycle: verification-pending
Approval: October 13, 2026 user requests password requirements of only eight characters.
Verification: 18 focused policy/reset/settings tests passed (99 assertions) on PHP 8.5.1/SQLite; supported PHP 8.4 acceptance pending.
Release: not released; deployment outside scope.

## Purpose / Big Picture

Use an eight-character minimum in every environment for registration, reset and password changes. Owner: [Accounts](../../features/accounts-and-organizations.md). Preserve confirmation, current-password checks and existing authentication/access boundaries.

## Progress

- [x] Inspect actual shared policy and consumers.
- [x] Replace production complexity/breach rules with the approved minimum.
- [x] Run focused validation and auth checks.
- [ ] Verify supported PHP 8.4 runtime.

## Surprises & Discoveries

Production previously required 12 characters, mixed case, letters/numbers/symbols and uncompromised validation. Other environments used the framework minimum. Bootstrap already uses eight.

## Decision Log

October 13 explicit user direction approves an eight-character minimum without character classes or breach checks; longer passwords remain valid. Preserve unrelated todo-description changes.

## Outcomes & Retrospective

Shared registration/reset/password-update rules now use the approved minimum. Focused tests passed. No migration or release.

## Context and Orientation

Main baseline 6aa57df plus existing description edits. AppServiceProvider configures shared Password defaults; PasswordValidationRules preserves required/string/confirmation validation.

## Plan of Work

Update only shared password defaults, owning docs, and meaningful production/nonproduction validation coverage.

## Concrete Steps

Run focused PHPUnit auth/security tests on disposable SQLite and scoped Pint/analysis/docs checks.

## Validation and Acceptance

Eight simple letters or digits accepted in production/local; seven rejected; longer accepted; mismatched confirmation rejected. Existing reset/settings authentication checks remain.

## Idempotence and Recovery

No persisted passwords or database schema change. Policy affects only future validation; rollback restores prior defaults.

## Artifacts and Notes

October 13, 2026, `6aa57df` plus this patch and preserved task-description edits. PHP 8.5.1, SQLite memory, disposable application key.

- `APP_KEY=<disposable key> vendor/bin/phpunit tests/Feature/Auth/PasswordPolicyTest.php tests/Feature/Auth/PasswordResetTest.php tests/Feature/Settings`: 18 passed, 99 assertions. Production/local simple-eight acceptance, seven-character rejection and confirmation rejection covered along with reset/settings flows.
- Scoped `vendor/bin/pint` on provider/policy test: passed. `php -d memory_limit=1G vendor/bin/phpstan analyse --no-progress --debug`: passed, zero errors.
- `node scripts/check-docs.mjs` and `git diff --check`: passed.

Full suite, browser and supported PHP 8.4 not rerun. No shared database, saved passwords, migration, deployment or merge changed.

## Interfaces and Dependencies

Existing Laravel Password rule and Fortify actions; no new dependency.
