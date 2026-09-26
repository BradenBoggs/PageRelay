# Durable named work Chats and page routing

## Purpose / Big Picture

SideWire's durable collaboration object is a named work Chat. A Chat can be created and used from SideWire before any external page is attached, and authorized page contexts can later route into that same history. Opening a linked Supermove project, Docusign agreement, or other work page opens the associated Chat automatically; opening Chats in the extension lets a member use the same history without first navigating to a source page.

This milestone delivers channel-like persistence without implementing Slack-style public/private channel membership, channel categories, archive administration, bots, imports, threads, or automatic external-project creation. Page contexts remain organization-private entry points, not business-record mirrors. Existing page chats continue to work and become page-linkable work Chats without a rename-only database migration.

## Progress

- [x] Product direction approved by the user.
- [x] Relevant product, architecture, UI, feature, documentation, and prior-plan context reviewed.
- [x] Living ExecPlan created before application changes.
- [x] Permanent specifications updated to make durable work Chats and page routing authoritative.
- [x] Backend creation, discovery, direct history, sending, and page-link eligibility implemented.
- [x] Web Chats creation interface implemented from existing components.
- [x] Extension Chats creation and in-panel Chat experience implemented from existing primitives.
- [x] Available focused and repository-level verification recorded; supported-runtime tests and manual Chrome verification remain pending as described below.

## Surprises & Discoveries

- The existing data model already places messages on `Conversation`, permits many `PageContext` records to reference one conversation, and preserves history when the last page is unlinked.
- The internal `ConversationType::Page` value currently gates every implemented shared work-chat query and policy. Retaining it as the compatibility value for page-linkable work Chats avoids a risky rename migration while the user-facing concept remains Chat.
- Existing discovery and link-candidate queries intentionally exclude empty Chats. Durable named Chats require those queries to include explicitly created empty Chats.
- The extension Chats list currently opens each Chat in the web application. A channel-like panel experience requires a scoped direct-Chat API and local panel selection with unattributed sends.

## Decision Log

- 2026-09-05: Make the named work Chat the durable collaboration object and treat linked pages as routes into it.
- 2026-09-05: Implement organization-wide work Chats only. All active organization members can create, discover, view, and send; existing administrator-only page linking and unlinking remains unchanged in this milestone.
- 2026-09-05: Retain `ConversationType::Page` as the internal compatibility discriminator for page-linkable work Chats. Do not perform a rename-only schema migration.
- 2026-09-05: Show empty, non-retired work Chats in Chats and link pickers; Activity remains message/relevance driven.
- 2026-09-05: Direct messages sent from the extension Chats view have no source-page attribution. Messages sent from This Page retain the validated current context.
- 2026-09-05: A non-null standalone creation key marks an explicitly durable work Chat. Empty page-created Chats may still retire when orphaned, while explicitly created work Chats survive removal of their last page.
- 2026-09-05: Use existing Button, Input, Card, native extension form, and native dialog patterns. No new shared UI component or public component API is approved or required.

## Outcomes & Retrospective

The first milestone is implemented. Members can create durable named work Chats on the web or in the extension, empty Chats appear in Chats and manager link pickers, and the extension opens and messages a selected Chat without a page source. Existing This Page creation and manager linking continue to route linked pages into the same underlying history. The implementation reused existing shared web components and the extension Button/native-form patterns; it introduced no UI component API.

Supported-runtime Laravel tests and production builds remain unverified because Docker/Podman was not running and the host provides PHP 8.3.6 and Node 18.19.1 instead of the repository-required PHP 8.4.1 and Node 22.18 or newer. Manual Chrome behavior also remains pending. These are verification gaps, not claimed passes.

## Context and Orientation

Permanent product behavior is owned by `docs/PRODUCT.md`, `docs/features/page-conversations.md`, `docs/features/page-contexts.md`, `docs/features/team-conversations.md`, `docs/features/inbox-and-unread.md`, `docs/features/browser-extension.md`, and `docs/UI.md`. The preceding implemented initiative is `docs/plans/001-page-chats-and-linking.md`.

The shared aggregate is `app/Models/Conversation.php`, discriminated by `app/Enums/ConversationType.php`; page associations are stored by `app/Models/PageContext.php` through `page_contexts.conversation_id`. `app/Domain/Conversations/CreatePageChat.php` creates a context and Chat together, `LinkPageContext.php` links another context, `SendPageMessage.php` sends either with a validated source context or directly to a conversation, and `ConversationDiscovery.php` supplies Chats and Activity.

Web entry points are `app/Http/Controllers/ChatController.php`, `routes/web.php`, `resources/js/pages/chats/index.tsx`, and `resources/js/pages/chats/show.tsx`. Extension entry points are `routes/api.php`, controllers under `app/Http/Controllers/Api/V1/`, `apps/extension/src/page-chat/api.ts`, and `apps/extension/src/sidepanel/main.tsx`. Existing tests are under `tests/Feature/Conversations/` and `tests/Feature/Activity/`.

## Plan of Work

First, update the owning specifications and roadmap so the Chat-first relationship, durable empty state, page-link behavior, and deferred channel features are unambiguous.

Add an idempotent `CreateWorkChat` domain boundary and request/controller endpoints for web and extension clients. The organization and default workspace come only from authenticated active membership. Add a nullable creation idempotency key to conversations through a forward migration; existing conversations remain valid. Keep the internal `page` discriminator as the linkable work-Chat type.

Update `ConversationDiscovery` so Chats includes non-retired work Chats even when empty while Activity remains relevant and message-driven. Update link-candidate lookup to include empty durable work Chats. Add an extension direct-Chat show/send boundary scoped to organization, default workspace, type, and retirement state; direct sends carry no source page.

Update `resources/js/pages/chats/index.tsx` to create a named Chat using existing web components. Update `apps/extension/src/page-chat/api.ts` and `apps/extension/src/sidepanel/main.tsx` so members can create, open, read, and send in a work Chat from the Chats view, then return to Chats or This Page. Reuse the current page-link dialog to attach the current page.

Changed paths are `docs/PRODUCT.md`, `docs/UI.md`, `docs/features/page-contexts.md`, `docs/features/page-conversations.md`, `docs/features/team-conversations.md`, `docs/features/inbox-and-unread.md`, `docs/features/browser-extension.md`, `PLANS.md`, this plan, `database/migrations/2026_09_05_150000_add_creation_key_to_conversations.php`, `app/Domain/Conversations/CreateWorkChat.php`, `app/Domain/Conversations/LinkPageContext.php`, `app/Domain/Conversations/UnlinkPageContext.php`, `app/Domain/Activity/ConversationDiscovery.php`, `app/Http/Requests/CreateWorkChatRequest.php`, `app/Http/Controllers/ChatController.php`, `app/Http/Controllers/Api/V1/WorkChatController.php`, `app/Http/Controllers/Api/V1/PageConversationController.php`, `app/Models/Conversation.php`, `routes/web.php`, `routes/api.php`, `resources/js/pages/chats/index.tsx`, `apps/extension/src/page-chat/api.ts`, `apps/extension/src/sidepanel/main.tsx`, `tests/Feature/Conversations/WorkChatTest.php`, and `tests/Feature/Conversations/ChatIndexTest.php`.

## Concrete Steps

Run focused checks first, then the established repository checks when the supported Sail runtime is available:

```bash
./vendor/bin/sail artisan test tests/Feature/Conversations
./vendor/bin/sail artisan test tests/Feature/Activity
./vendor/bin/sail composer test
./vendor/bin/sail npm run check
./vendor/bin/sail npm run types:check
./vendor/bin/sail npm run build
./vendor/bin/sail npm run foundation:check
git diff --check
```

If Sail is unavailable, run only compatible host syntax, formatting, and TypeScript checks and record the limitation rather than claiming supported-runtime verification.

## Validation and Acceptance

An active member can create one named work Chat from the web or extension, and a retry with the same idempotency key returns the same Chat. The server ignores client organization/workspace authority. Cross-organization and non-default-workspace access fails without leaking existence.

The empty Chat immediately appears in Chats and in an administrator's page-link picker, but not in Activity or unread results. A manager can attach an ephemeral or persisted eligible page context. Opening that page then loads the same Chat and its one message history. Multiple linked pages do not duplicate the Chat in discovery.

The extension can open a Chat from Chats without navigating to an external page, load its messages, mark visible messages read, and send a message without source-page attribution. Returning to This Page restores current-page routing; a page send retains its source attribution. Empty, loading, validation, offline, permission, and unexpected-failure states remain recoverable at narrow panel widths.

No custom audience, private channel, automatic external-record creation, automatic page matching, content script, host-page access, new Chrome permission, or cross-organization learning is introduced.

## Idempotence and Recovery

Explicit work-Chat creation uses a client UUID scoped to organization and creator so network retries converge. Existing page-based creation continues to converge through normalized page identity. Page linking retains its current transactional association version, empty-history guard, audit event, and idempotence.

The migration is additive. Rolling back may remove only the nullable creation-key column/index; it must not delete a Chat or message. If shared deployment reveals a query or interface problem, disable new creation routes and ship a forward correction while existing conversations remain readable.

## Artifacts and Notes

2026-09-05 available verification:

- `npm run types:check` passed for web and extension.
- Focused Oxfmt checking with the repository's established 80-column/single-quote style and focused Oxlint passed for the three changed TypeScript/TSX files.
- Focused Pint checking and PHP syntax checks passed for all changed PHP files.
- `composer validate --strict --no-check-publish`, `npm run foundation:check`, and `git diff --check` passed.
- `./vendor/bin/sail artisan test tests/Feature/Conversations/WorkChatTest.php` could not run because Docker or Podman was not running.
- Direct host `php artisan test` could not boot Laravel 13 under PHP 8.3.6 and reported a parser error from the unsupported runtime.
- `npm run check` and `npm run build` could not run through Vite Plus under Node 18.19.1 because `node:util.styleText` is unavailable; the project requires Node 22.18 or newer. Direct TypeScript and focused formatter/linter checks passed as recorded above.
- No migration execution or manual Chrome behavior is claimed.

Do not include live customer URLs, access links, or credentials in later evidence.

## Interfaces and Dependencies

Reuse Laravel validation, authenticated organization middleware, the default Workspace, `Conversation`, `PageContext`, `ConversationRead`, `SendPageMessage`, existing page association commands, Inertia, the extension's scoped Sanctum session, and current shared UI primitives. No provider integration, external service, new Chrome permission, or new package is required.
