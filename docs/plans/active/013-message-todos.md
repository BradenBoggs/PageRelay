# 013 — Message-linked todos and assignment

Lifecycle: verification-pending
Approval: October 13, 2026 user request authorizes converting messages to tasks, message checkmarks, a referenced todo list and user assignment.
Verification: focused SQLite permissions/lifecycle tests, PHP analysis, shared web/extension types/builds and Chrome 1440px/390px acceptance passed. Full suite retains the existing registration failure; supported PHP 8.4/PostgreSQL, concurrency, live Reverb and native side-panel checks remain pending.
Release: not released; deployment outside scope.

## Purpose / Big Picture

Convert a retained message into one shared todo, assign an eligible coworker, complete/reopen it and follow its message reference. Owner: [Tasks](../../features/tasks.md). No due dates, reminders, independent lists, attachments, boards or new notification delivery.

## Progress

- [x] Inspect current branch, shared UI, chat access and task proposals.
- [x] Implement scoped persistence, assignment, message affordances and todo list.
- [x] Verify permissions, retries and desktop/mobile flows; record evidence.
- [ ] Verify PHP 8.4/PostgreSQL concurrency, live Reverb and native side panel.

## Surprises & Discoveries

Main baseline b6b1a79 includes earlier Resend and author-editing changes; working tree initially clean. Shared React collaboration components serve the web and extension. Existing signal-only events can refresh task changes without broadcasting private content.

## Decision Log

October 13: one todo per message; all active members with chat access can manage it unless the chat is retired. Assignees must have active membership and actual chat access. Unassigned todos are valid. Completion retains actor/time. Version conflicts reject stale updates; identical uncertain retries succeed. Task title is explicitly reviewed during conversion; original message preview stays a live reference. Deleted originals retain the todo and show a tombstone reference. Removed assignees remain visible as needing reassignment, without granting access.

October 13 design follow-up: user selected concept 2. Messages show only a checkbox, task title and link; assignment/editing live in a selected details panel on Todos. Preserve existing audiences, retries and completion behavior.

## Outcomes & Retrospective

Message-linked todos, eligible assignment, completion/reopening and original-message references are implemented. Scoped web/SQLite checks passed; wider supported-runtime acceptance remains pending. No release authorized.

## Context and Orientation

ConversationAccess owns audiences. CollaborationController, MessageResource, shared MessageRow and provider own existing HTTP/render/refresh behavior. AppNavigation owns web navigation. Existing task specification is a broader draft; only the approved slice above is implemented.

## Plan of Work

Create message-owned todos with a unique message constraint, a small Todo domain action/controller/resource and scoped routes. Reuse dialogs and member picker endpoint. Show a completion checkbox/status in messages and a paginated global accessible list with assignment/filtering and message links; use shared list in the extension board too.

## Concrete Steps

Inspect nearest guidance. Run isolated SQLite tests, PHP analysis/formatting, shared types/builds, Node documentation checks and authenticated desktop/mobile browser checks with synthetic data.

## Validation and Acceptance

Accessible messages convert once, including threads/DMs. Cross-tenant and DM outsiders cannot list, reference, assign or mutate todos. Assignment never grants access. Removed members lose reads/writes; duplicate creates/updates are safe. Completion/reopen and reassignment converge between list and messages; mobile dropdown and failure draft recovery are usable.

## Idempotence and Recovery

Unique message ownership plus row locks prevent duplicate conversion. Versioned patches protect stale updates. Migration is additive; rollback removes task records and must only run on disposable data. No shared migration/reset authorized.

## Artifacts and Notes

October 13, 2026, main `b6b1a79` plus this working-tree patch. PHP 8.5.1, Node 24.14.1, SQLite in memory for tests and disposable `/private/tmp/sidewire-edit-browser/data.sqlite` for browser fixtures. This task did not migrate any shared database.

- `APP_KEY=<disposable key> vendor/bin/phpunit tests/Feature/Conversations/MessageTodoTest.php tests/Feature/Conversations/MessageEditingTest.php tests/Feature/Conversations/MessageDeletionTest.php`: 12 passed, 156 assertions. Covers conversion/duplicate retries, completion/reopen, version conflicts, active/removed/DM/cross-tenant assignees, preserved live message references/deletion, retired chats, older loaded history refresh and shared extension list/update routes. Initial history setup hit the real send rate limit; replaced bulk fixture sends with direct disposable row replication, retaining actual endpoint checks for conversion and updates.
- `APP_KEY=<disposable key> vendor/bin/phpunit`: 180 passed, 1 failed, 1 PostgreSQL-only skip, 1241 assertions. Existing `RegistrationTest::test_public_registration_remains_closed` expects `/register` 404 but gets 200; same SW-DEBT-002 from the prior editing task. Registration code unchanged.
- `php -d memory_limit=1G vendor/bin/phpstan analyse --no-progress --debug`: passed, zero errors after adding the actual resource array return type. Scoped `vendor/bin/pint --test` on changed PHP and tests: passed.
- `npm run types:check` and `npm run build`: passed for web and extension; rebuilt after responsive spacing and mobile todo-edit action adjustments. Scoped `npx vp fmt`/`npx vp lint` on changed formatted UI/browser files: passed. Existing compact board/CSS style preserved.
- `SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/013-message-todos node tests/Browser/message-todos.cjs`: Chrome passed at 1440px/390px against synthetic verified author/assignee fixtures. Covers conversion cancel, injected 500/create retry preserving title/assignment, eligible assignee picker, message completion checkbox, todo list completion filter, reassignment/Mine filter, reopen, exact original-message link and absence of page errors/overflow. Initial Playwright `check()` asserted before server acknowledgement; switched to clicking then awaiting the actual confirmed completion state. Mobile uses dropdown conversion/edit actions with inline completion.
- Retained screenshots: [desktop message](../artifacts/013-message-todos/message-todo-1440.png), [mobile message](../artifacts/013-message-todos/message-todo-390.png), [desktop list](../artifacts/013-message-todos/todos-1440.png), [mobile list](../artifacts/013-message-todos/todos-390.png). Desktop message and mobile list visually inspected; mobile spacing refined following inspection.
- `node --test scripts/check-docs.test.mjs scripts/collaboration-ui.test.mjs`: 27 passed. `node scripts/check-docs.mjs`, `bash scripts/check-foundation-boundaries.sh`, `composer validate --strict` and `git diff --check`: passed.

No production data, notifications, email, deployment, merge or new package/extension permission. PHP 8.4, PostgreSQL simultaneous conversion/reassignment/removal races, live Reverb and native Chrome side-panel interaction remain unverified. Built extension/types and its shared HTTP contract do not certify native interaction.

## Interfaces and Dependencies

Reuse Laravel, existing signal event, CollaborationClient, Radix dialogs/dropdown and existing semantic tokens. No new packages or extension permissions.
