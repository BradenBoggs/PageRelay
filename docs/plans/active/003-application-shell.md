# Reusable authenticated application shell

## Purpose / Big Picture

Implement the user's September 26 screenshot/HTML direction as the actual reusable React web layout, with references and owning documentation. Reuse existing chat actions and server data. The operations-themed mockup is visual guidance, not approval for unrelated features.

## Progress

- [x] Inspect current main, contributor guidance, product/UI/architecture/docs rules, active chat plan, routes, controller, discovery, components, and tests.
- [x] Record the user's explicit request for a real application layout as implementation approval.
- [x] Compose reusable global chrome, discovery, chat header/composer, responsive regions, and session UI cache.
- [x] Add scoped discovery props to selected-chat routes and actual paginator totals.
- [x] Add owning shell specification, source interpretation, structural reference, and six regression tests.
- [ ] Complete supported-runtime verification; record only actual results below.
- [ ] Complete authenticated-browser, screen-reader, and failure/reconnect verification.

## Surprises & Discoveries

PageRelay is the repository codename; SideWire is the product. Approved vocabulary is Activity, Chats, Apps. Named Chat creation and direct sends already exist. Chat detail previously lacked the discovery props needed for the middle panel. Web page-linking is not implemented; the existing manager linking workflow is in the extension.

## Decision Log

2026-09-26: Replace active AppLayout composition, not a standalone demo route. Leave authentication and extension surfaces unchanged. Treat mock features as reference-only. Reuse UI primitives and existing domain commands. Keep organization read-only. Store source provenance and a structural HTML reference under docs. Use member/organization-scoped in-memory draft/scroll state rather than adding a Draft database model.

## Outcomes & Retrospective

Implementation is prepared for verification. Prior results in plan 002 are baseline evidence, not test results for this change. Update this section after the new checks actually execute.

## Context and Orientation

Baseline main is `f10295cac765c790c9dde6895893def185085b95`. `resources/js/app.tsx` chooses `layouts/app-layout.tsx`. Chat/Activity pages use ChatController and authoritative ConversationDiscovery. Existing routes already provide named-chat creation, direct sending, discovery, and read positions. Existing Button, Avatar, Input, Dialog, Sheet, and UserMenuContent are reused.

Permanent ownership: `docs/UI.md`, `docs/features/application-shell.md`, `page-conversations.md`, and `inbox-and-unread.md`. Previous work is in plans 001 and 002. No billing, marketing, extension, membership, or permissions refactor is included.

## Plan of Work

Replace `resources/js/layouts/app-layout.tsx`; extract `components/application-shell/` and `components/chats/`. Add `resources/css/application-shell.css`, `types/chat.ts`, and `lib/chat-navigation.ts`. Compose `pages/chats/index.tsx` and `show.tsx`; retain the existing Activity wrapper. Normal application pages inherit global chrome without a chat list.

Extract ChatController's existing discovery payload builder so index and detail share scoped filters, Apps, and pagination; include actual total. Retain authorization, source data, latest-100-message limit, routes, and domain commands. Add `tests/Feature/Conversations/ApplicationShellTest.php` for tenant scoping, selected-chat/filter separation, Activity, pagination, and direct-send provenance.

Add the owning spec and reference index/example, and link from the UI guide. Do not duplicate permanent behavior across documents. Temporary work-branch verification infrastructure must not become an additional production CI pipeline.

## Concrete Steps

Supported checks:

```bash
./vendor/bin/sail artisan test tests/Feature/Conversations/ApplicationShellTest.php
./vendor/bin/sail composer test
./vendor/bin/sail npm run foundation:check
./vendor/bin/sail npm run check
./vendor/bin/sail npm run types:check
./vendor/bin/sail npm run build
git diff --check
```

Equivalent checks may run in the existing GitHub CI environment with pinned Node/PHP. Syntax/transpile checks alone are not a type check, build, or backend test run.

## Validation and Acceptance

Desktop has header/navigation/list/chat; tablet has list/chat and navigation Sheet; narrow screens show list or chat with Back. Long text must not widen the viewport. Settings retain only the outer shell. Every visible production action has supported behavior.

Chat detail uses authorized discovery. Surface/filter/page survive selection and return. A filtered-out selected chat stays open. No foreign tenant data leaks. Fetching lists/details does not mark read. Direct sends never infer an external source.

Verify create, send, keyboard submit, duplicate clicks, validation failure, private realtime, scroll recovery, message deep links, draft A/B/A, reload/logout semantics, account boundaries, focus/escape, zoom, and safe source links. Existing older-history limitations remain explicit.

## Idempotence and Recovery

No migration or data rewrite. Revert the code commit to restore the old layout without deleting chats/messages. Existing idempotency protects creation and send retries. Never force-update a moving main ref; reconcile concurrent work first.

## Artifacts and Notes

Verification pending. The initial local runtime does not have the repository's installed dependencies; do not claim full local application verification. Original reference uploads are named in the reference README. Authenticated browser and PostgreSQL concurrency checks require separate verification even when CI passes.

## Interfaces and Dependencies

No new package, route, table, Chrome permission, provider contract, or external service. ChatDiscovery retains the existing discovery shape plus total. Chat retains the detail response. chatDiscoveryUrl carries discovery navigation only, not tenant or message-source authority. Laravel commands and Inertia remain the integration boundaries.
