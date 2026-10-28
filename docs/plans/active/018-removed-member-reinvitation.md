# 018 — Removed-member reinvitation

Lifecycle: verification-pending
Approval: October 28, 2026 user chose to let removed accounts rejoin by accepting a new invitation (option 1), after a reported failure accepting a Profile invitation with an existing account.
Verification: focused and full PHP suites passed on PHP 8.5.12/SQLite (217 passed, PostgreSQL concurrency test skipped); PostgreSQL row-lock and browser acceptance pending.
Release: not released; deployment outside scope.

## Purpose / Big Picture

An existing account that was previously removed from an Organization could be invited and saw **Accept** in Profile, but acceptance failed with 409. Let it join the inviting Organization. Owner: [Accounts](../../features/accounts-and-organizations.md). Non-goals: multi-organization membership, restoring sessions or old team access, schema changes, friendlier error pages for unusable invitations.

## Progress

- [x] Reproduce: removed member invited to another Organization receives 409 on accept.
- [x] Reactivate the single membership row on acceptance; clear stale team memberships.
- [x] Regression tests for other-Organization, same-Organization and active-member cases.
- [x] Update owning feature.
- [ ] PostgreSQL concurrency and authenticated-browser acceptance.

## Surprises & Discoveries

Removal keeps the membership row as `removed`. Invitation creation and Profile check only active membership, but `accept()` checked any row and `organization_memberships.user_id` is unique, so a second membership row could never be created.

## Decision Log

October 28: reuse the existing row (one membership per user remains the schema rule). Reactivation takes the invitation's Organization and role, sets active/billable, resets `joined_at`, clears `removed_at`, and deletes any team memberships left for the earlier Organization so old group access is not revived. The earlier removal record is not retained. An administrator's invitation plus recipient acceptance is the explicit reactivation action.

## Outcomes & Retrospective

Removed accounts can accept invitations; active members still receive 409. No migration.

## Context and Orientation

Baseline `ebf6752`. Entry points: `OrganizationInvitationController::accept`, `HasOrganization::organizationMembership` (active only), `OrganizationMemberController::destroy` (marks removed), `ProfileController::edit`. Tests: `tests/Feature/Settings/ProfileUpdateTest.php`.

## Plan of Work

Change only acceptance: reject when an active membership exists; under the invitation lock, lock the user's membership row, clear stale team memberships, then update-or-create the membership.

## Concrete Steps

Run focused PHPUnit suites, the full suite, scoped Pint, PHPStan and documentation checks.

## Validation and Acceptance

A removed member accepts an invitation from another Organization and lands in Messages with exactly one active membership in that Organization. A removed member rejoins the same Organization with no prior team memberships. An active member's acceptance returns 409 and leaves membership and invitation unchanged. The new removed-member tests fail with 409 against the baseline controller.

## Idempotence and Recovery

No schema change. Acceptance runs in one transaction; a failure leaves the invitation pending and the membership unchanged. Rollback restores the baseline controller; reactivated memberships remain valid active rows.

## Artifacts and Notes

October 28, 2026, `ebf6752` plus this patch. PHP 8.5.12, SQLite memory, disposable local `.env`/key, locally built web assets.

- Baseline controller with new tests: `php artisan test tests/Feature/Settings/ProfileUpdateTest.php`: both removed-member tests failed with 409.
- `php artisan test tests/Feature/Settings tests/Feature/Organizations tests/Feature/Auth tests/Feature/WorkspacesAndTeams`: 73 passed, 389 assertions.
- `php artisan test`: 217 passed, 1 skipped (`PostgresPageChatConcurrencyTest`, requires PostgreSQL).
- Scoped `vendor/bin/pint --test`: passed. `php -d memory_limit=1G vendor/bin/phpstan analyse --no-progress`: passed, zero errors.

Supported PHP 8.4/Sail, PostgreSQL locking and browser acceptance not run. No shared database, deployment or merge.

## Interfaces and Dependencies

Existing Eloquent models and routes; no new dependency or endpoint.
