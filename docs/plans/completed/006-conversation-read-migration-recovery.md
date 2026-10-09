# Execution plan 006: recover a partial conversation-read migration

Lifecycle: completed
Approval: October 9, 2026 user request to fix repeated deployment migration failures.
Verification: nine focused tests passed on SQLite and MySQL 8.0.46; formatting, syntax and documentation checks passed. Forge state not directly inspected.
Closed: 2026-10-09
Closure: scoped migration recovery gate passed on disposable databases; see Validation and Acceptance. Production deployment is outside scope.
Release: not deployed by this task.

## Purpose / Big Picture

Recover the existing Activity read-state migration after MySQL retains part of a failed attempt, without dropping member data or weakening chat/message scope constraints. [Activity and unread](../../features/inbox-and-unread.md) owns behavior. No database-engine migration, new feature, production database edit or deployment is included.

## Progress

- [x] Inspect current `main`, owning migration and user-provided failures.
- [x] Implement resumable table, index and foreign-key creation with a shorter lookup index name.
- [x] Run focused disposable SQLite/MySQL recovery and scope checks, formatting and documentation checks.
- [x] Record outcomes and limits; update the owning implementation map.

## Surprises & Discoveries

The first supplied log failed on an existing message scope index. Commit `07fa666` guarded that index, but the next user log failed because `conversation_reads` already existed. MySQL commits DDL independently; this does not establish that later indexes or constraints exist. The original automatic lookup index name is 69 characters, exceeding MySQL's 64-character identifier limit. A disposable reproduction confirmed this error (1059) and the retained partial table. The historical Forge error before the supplied logs was not inspected.

## Decision Log

October 9: inspect index/foreign-key metadata and add missing definitions individually. Accept equivalent indexes/keys even under historical names; reject incompatible definitions instead of silently accepting them. Keep existing rows and the guarded rollback policy. Keep PostgreSQL as the documented primary backend; this repair addresses the user's actual MySQL deployment without certifying general MySQL compatibility.

## Outcomes & Retrospective

The migration recovers fresh and interrupted states, preserves read positions, validates existing definitions and retained relationships, and restores scope constraints. All focused checks passed. No Forge database was accessed or deployed; PostgreSQL and the full application suite were not run.

## Context and Orientation

Baseline `main` is `8ef7065`. Migration: `database/migrations/2026_09_05_130000_create_conversation_reads_table.php`. Earlier foundation migration owns parent tables and composite scope indexes. Existing Activity behavior tests remain unchanged. The new focused test uses isolated minimal parent fixtures and never reads the application environment or shared databases.

## Plan of Work

Guard base-table creation, require expected columns, use a bounded lookup-index name, and restore all four foreign keys plus both read-state indexes. Verify fresh, existing-index-only, bare-table, partially constrained and completed states; preserve read rows; reject an incompatible index; enforce message scope after recovery. Update the feature implementation map and this evidence record.

## Concrete Steps

Install locked Composer dependencies without application scripts in `/private/tmp/sidewire-recovery-locked`. Run the focused PHPUnit file with an explicit temporary autoloader. Use SQLite memory by default and a newly created MySQL 8.0 container on loopback port 33127 with only the disposable `sidewire_migration_recovery_test` database. Run Pint on changed PHP, PHP syntax checks, `node scripts/check-docs.mjs`, `node --test scripts/check-docs.test.mjs`, and `git diff --check`. Remove the disposable container afterward.

## Validation and Acceptance

Fresh installation and repeated `up()` must succeed. Interrupted-state recovery must preserve read positions and install required indexes and all four foreign keys. Wrong-scope read positions must fail at the database boundary. Existing incompatible definitions must fail visibly without deleting rows. No real deployment success is claimed without a fresh Forge result.

### October 9 evidence

Revision: `8ef7065` plus this working-tree patch, macOS, PHP 8.5.1, locked Laravel 13.30.1 and PHPUnit 12.5.34 installed without application scripts in `/private/tmp/sidewire-recovery-locked`. Default database was SQLite memory. MySQL 8.0.46 ran in a newly created `sidewire-migration-recovery-test` container with only disposable fixtures; the container was removed after verification.

- `php /private/tmp/sidewire-recovery-locked/vendor/bin/phpunit --no-configuration --bootstrap /private/tmp/sidewire-recovery-locked/vendor/autoload.php tests/Unit/Database/ConversationReadsMigrationTest.php`: 9 tests passed, 62 assertions, no skips.
- Same command prefixed with `SIDEWIRE_MIGRATION_MYSQL_PORT=33127`: 9 tests passed, 82 assertions, no skips. Covers fresh/repeated runs, index-only, bare and partially constrained tables, row preservation, incompatible indexes/keys, missing columns, invalid retained scope followed by repair/retry, and wrong-scope writes after recovery.
- Exact original source from `git show 07fa666:database/migrations/2026_09_05_130000_create_conversation_reads_table.php` was executed against the same minimal MySQL parent fixture: failed with error 1059 on the 69-character lookup-index name, retained `conversation_reads`. Executing the patched migration twice recovered it and showed all four foreign keys. Temporary reproduction procedure invoked the focused test's setup/teardown and inspected `Schema::getForeignKeys`; no real data was used.
- `php /private/tmp/sidewire-recovery-locked/vendor/bin/pint --test database/migrations/2026_09_05_130000_create_conversation_reads_table.php tests/Unit/Database/ConversationReadsMigrationTest.php`: passed after formatting.
- `php -l` on both changed PHP files: passed.
- `node scripts/check-docs.mjs`: passed; `node --test scripts/check-docs.test.mjs`: 18 passed; `git diff --check`: passed.

Initial fixture checks failed because Capsule's static connection had not been initialized; corrected the fixture to use its instance connection before the passing runs. The first dependency install failed under sandbox network restrictions; dependencies were then installed successfully in a separate temporary directory. No lockfile was changed. Full application/backend static analysis, PostgreSQL and real Forge migration state/deployment were not tested; these focused results do not certify general MySQL support or deployment success.

## Idempotence and Recovery

Each schema operation is conditional on inspected metadata; do not skip the whole migration merely because the table exists. Invalid stored relationships or incompatible definitions stop recovery for review. Never use `migrate:fresh`, drop the table, or manually mark the migration applied on a shared database. The existing rollback refuses deletion of nonempty read state.

## Artifacts and Notes

Source plus working-tree diff records the fix. Command outcomes are recorded below. Disposable test credentials are unrelated to application credentials.

## Interfaces and Dependencies

Use locked Laravel Schema metadata APIs (`getIndexes`, `getForeignKeys`, `hasTable`, `hasColumns`) and PHPUnit. No dependency or lockfile change. Technical references checked October 9: [Laravel schema builder](https://api.laravel.com/docs/13.x/Illuminate/Database/Schema/Builder.html), [MySQL atomic DDL](https://dev.mysql.com/doc/refman/8.0/en/atomic-ddl.html).
