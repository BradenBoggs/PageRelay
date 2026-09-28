# Execution plan 001: page chats and cross-app linking

Status: milestones 1-4 are implemented and have supported-runtime automated evidence as of September 5, 2026. Milestone 5 is implemented with host-compatible static verification; supported-runtime automated tests and manual Chrome verification remain pending. This plan follows the foundation in `000-execplan.md` and does not replace it.

## Purpose / Big Picture

Deliver SideWire's page-first communication loop without a channel per external project. A recognized page opens its chat; an organization owner or administrator can attach another context with no chat or an empty chat to that same history. Both pages remain distinct identities. Messages record an explicitly selected safe source context when present.

Retain authoritative organization memberships and the existing default Workspace. Apps is browsing metadata, not another tenant or workspace. Use Chat and Activity in the interface while preserving existing internal Conversation names. One context has at most one current primary chat; a chat may have several contexts.

The last milestone adds minimal Activity, chat-level read state, and discovery for this workflow. Organization-wide chat, DMs, notification delivery, and broader search are separate initiatives; their specs must consume the same chat/message identities without duplicates.

Milestone 5 corrects the page-context lifecycle so ordinary page visits perform only an isolated lookup. A context is persisted only after the user explicitly creates a chat or an eligible manager links the page to an existing chat; sending the first message is no longer an implicit creation path. The existing per-request resolution-key table and all five-second extension refresh loops are removed. This reduces unnecessary private-data retention and unrelated-window refreshes without weakening normalized identity, source attribution, concurrency, or command idempotency.

## Progress

- [x] 2026-09-04: Record the product vocabulary, membership-retention decision, Apps grouping, manual linking boundary, provenance, and deferred channel/history-merge scope.
- [x] 2026-09-04: Align the owning specifications, interface guidance, agent instructions, and roadmap.
- [x] 2026-09-05: Obtain explicit implementation approval for milestones 1-3.
- [x] 2026-09-05: Confirm foundation authentication, default-workspace isolation, extension handoff, and service readiness against actual code/tests.
- [x] 2026-09-05: Implement safe context resolution, page chats, and first-message creation.
- [x] 2026-09-05: Implement linking/unlinking, source attribution, conflict handling, and audit events.
- [x] 2026-09-05: Implement and automatically verify the extension and web page-chat workflow.
- [x] 2026-09-05: Obtain approval and replace `activeTab` with `tabs` so the persistent panel can resolve external work pages and follow active-tab changes.
- [x] 2026-09-05: Obtain scoped approval and implement the web `/chats` index without starting Activity, unread state, Apps filters, or full search.
- [x] 2026-09-05: Obtain explicit implementation approval for the remainder of milestone 4.
- [x] 2026-09-05: Implement minimal Activity, chat-level unread state, chat search, and Apps discovery across web and extension clients.
- [x] 2026-09-05: Run and record the supported-runtime milestone 4 migration, test, static-analysis, format, and build suite.
- [x] 2026-09-05: Record real migration, automated-test, static-analysis, and build evidence.
- [x] 2026-09-05: Approve and document lookup-only page resolution, create-on-collaboration context persistence, and removal of durable resolution keys.
- [x] 2026-09-05: Refine milestone 5 to require an explicit prefilled Create chat form, prohibit first-message creation, remove extension polling, and ignore unrelated tab/window events.
- [x] 2026-09-05: Obtain explicit implementation approval for milestone 5.
- [x] 2026-09-05: Implement milestone 5 without deleting contexts that have collaboration or audit history, and record the available host-compatible verification.
- [ ] Complete and record manual Chrome side-panel verification.

## Surprises & Discoveries

Repository inspection used `feature/sidewire-foundation` at commit `f52045abcf75c503a5a786e4b1600d7645264b2e`, ahead of documentation-only `main`. OrganizationMembership, Workspace, Team, and their foundation paths already exist. Do not rebuild or remove them simply to adopt the new interface vocabulary.

The previous page-message specification attached message ownership directly to a page context. This revision makes the chat the history aggregate and source context optional historical attribution. The previous general-chat and DM specs also left their MVP inclusion open; the product direction now retains one organization chat and one-to-one DMs while deferring custom channels.

Implementation status recorded in earlier plans is not proof of a passing test. Inspect the current branch and record actual results before proceeding.

The host shell has PHP 8.3 and Node 18 while the locked application requires PHP 8.4 and Node 22.18 or newer. Initial sandbox access could not reach Docker, but approved Sail access provided the supported PHP, Node, and PostgreSQL runtimes for final automated verification.

The original development host permission exposed complete tab metadata on `localhost:8000`, masking that `activeTab` did not reliably grant metadata to a persistent side panel opened through every Chrome side-panel path or after later tab changes. On external HTTPS pages, `tabs.query()` could therefore return a tab without `url`, causing the interface to misclassify a valid work page as unsupported.

The conversation API's linking candidate query was not a suitable web Chats index: it is capped for a picker and omits the latest-message summary and pagination needed for durable browsing. The web index therefore uses its own organization/default-workspace-scoped read query while preserving the same page-chat identity and authorization boundary.

Activity needed an explicit first-version relevance rule because organization membership alone must not turn it into a feed of every page chat. A page chat becomes relevant after the member opens loaded history or authors a message; Chats remains the broader authorized collection.

The implemented resolver writes a `page_contexts` row for the first resolution of every normalized URL and writes a new `page_context_resolution_keys` row for every client request key, including repeat visits to an existing context. The extension also reacts to general `tabs.onUpdated` events, which may issue several resolution requests during one navigation. These writes retain private page metadata before collaboration exists and the resolution keys have no bounded cleanup, so milestone 5 replaces them with an indexed read-only lookup and create-on-collaboration commands.

The extension independently polls the current page chat and the selected Activity/Chats view every five seconds. Its tab listeners also ignore the event tab identifier, window identifier, and changed properties, so activity in an unrelated tab or Chrome window can trigger a new active-page resolution. Milestone 5 removes both polling loops and scopes navigation-driven resolution to the panel's own active tab when its URL actually changes.

## Decision Log

- 2026-09-04: Keep `organization_memberships` as the sole organization relationship; do not move it onto users or add switching.
- 2026-09-04: Retain the default Workspace; group contexts by App without creating per-domain workspaces or requiring an App table.
- 2026-09-04: Use Chat and Activity as interface terms; preserve internal Conversation names and existing feature filenames. Threaded replies remain deferred.
- 2026-09-04: Link different contexts to one chat manually. Only an unassociated context or a context whose different chat has no message history can move. An already-identical link is idempotent.
- 2026-09-04: Restrict link changes to organization owners/administrators and to page chats in the same organization/default workspace. No DM or organization-chat targets.
- 2026-09-04: Preserve history and provenance on unlink; never split or move messages. Keep one read position per member/chat and deduplicate downstream activity by chat/message.
- 2026-09-04: Defer nonempty-history merges, automatic matching, custom channels, multi-chat pages, and administrator-selectable operating modes.
- 2026-09-05: Store the optional current chat directly on `page_contexts` with a database foreign key and monotonic `association_version`; this enforces zero-or-one current chat without introducing dormant many-chat selection.
- 2026-09-05: Use versioned SHA-256 normalized-identity keys plus per-user resolution request keys. Store safe normalized source URLs and reject credentials or fragment-routed identity before persistence.
- 2026-09-05: Serialize send/link/unlink operations by locking the active membership and page context. Message retry lookup occurs both before and after contention locks so a successful retry cannot move to a new association.
- 2026-09-05: Use Spatie Activitylog with an organization-owned activity model for link/unlink events. Audit properties contain identifiers but no raw URL or message body.
- 2026-09-05: Use authorized five-second durable-history refresh in the panel as the documented temporary recovery path; the same message event is also broadcast once on a private conversation channel after commit.
- 2026-09-05: With explicit user approval, replace `activeTab` with `tabs`. This avoids broad host access and supplies only the tab metadata needed for reliable active-page resolution; implementation remains limited to the active tab while the panel is open and does not read page contents or retain browsing history.
- 2026-09-05: Treat the explicit `/chats` request as approval for recent page-chat browsing only. Include history-bearing chats with no linked pages, exclude empty/retired/non-page/cross-workspace/cross-organization records, and defer query search, Apps filters, Activity, and unread counts.
- 2026-09-05: Implement milestone 4 with one durable monotonic read position per member/chat. Count later messages from other members as unread, never duplicate through linked contexts, and advance only to a loaded message while its chat view is visible.
- 2026-09-05: Define initial Activity relevance as page chats the member has opened/read or participated in. Add private database-backed chat search and exact normalized-host Apps filters; defer external indexing, fuzzy/vector ranking, mentions, notifications, organization chat, and DMs.
- 2026-09-05: Supersede the per-user resolution-request-key decision for future implementation. Resolution of a page with no persisted context is read-only and returns an ephemeral descriptor; only explicit **Create chat** or **Link to existing chat** may create the context. Remove `page_context_resolution_keys` rather than replacing it with another durable visit log. Keep message idempotency and transactional normalized-identity uniqueness as the write guarantees.
- 2026-09-05: Deduplicate extension resolution by active tab and URL. Ignore title, favicon, loading-state, and repeated `tabs.onUpdated` events when the active URL has not changed.
- 2026-09-05: Do not show the composer or create a context/chat through a first message. Show an inline form with editable Page title, Page URL, and Chat name fields prefilled from Chrome. Submitting it explicitly and atomically creates the context and empty chat; all values remain untrusted and are revalidated on the server.
- 2026-09-05: Remove the extension's five-second page-chat and discovery polling. Fetch on panel/view entry, relevant URL change, filter/search change, successful mutation, or explicit user Refresh. Defer an extension realtime transport until separately approved.

## Outcomes & Retrospective

Milestones 1-5 now have scoped APIs, transactional create/send/link boundaries, lookup-only resolution, explicit page-chat creation, private realtime events, an extension This Page/chat workflow, web and extension Activity/Chats discovery, Apps and all/unread filters, one monotonic member/chat read position, and durable web chat pages. Milestone 5 removes resolution-key writes and timer polling, scopes panel refreshes to relevant navigation and explicit actions, and preserves prior context/chat history. Supported-runtime and manual Chrome verification for milestone 5 are not yet claimed.

## Context and Orientation

Read `AGENTS.md`, `PLANS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/UI.md`, and `docs/DOCUMENTATION.md` first.

Behavior owners are `docs/features/page-contexts.md` for identity and Apps, `docs/features/page-conversations.md` for chats/linking/provenance, `docs/features/browser-extension.md` for panel lifecycle, and `docs/features/inbox-and-unread.md` for Activity/read state. Read `search.md` and `mentions-and-notifications.md` for downstream identity contracts. Organization chat and DMs remain in their own feature documents.

Existing foundation entry points include `app/Models/Organization.php`, `app/Models/OrganizationMembership.php`, `app/Models/Workspace.php`, `app/Concerns/HasOrganization.php`, `app/Http/Middleware/EnsureOrganizationMembership.php`, `app/Domain/Workspaces/EnsureDefaultWorkspace.php`, `resources/js/`, and `routes/`. Existing tests include `tests/Feature/Organizations/OrganizationFoundationTest.php` and `tests/Feature/WorkspacesAndTeams/WorkspacesAndTeamsFoundationTest.php`.

Implemented entry points are `app/Domain/PageContexts/`, `app/Domain/Conversations/`, `app/Domain/Activity/`, `app/Models/PageContext.php`, `Conversation.php`, `Message.php`, and `ConversationRead.php`, the extension routes in `routes/api.php`, `app/Http/Controllers/ChatController.php`, `apps/extension/public/manifest.json`, `apps/extension/src/page-chat/api.ts`, `apps/extension/src/sidepanel/main.tsx`, and the Activity/Chats pages under `resources/js/pages/`. Focused tests live under `tests/Feature/PageContexts/`, `tests/Feature/Conversations/`, and `tests/Feature/Activity/`.

Milestone 5 uses `app/Domain/PageContexts/ResolvePageContext.php` for read-only descriptors, `CreatePageContext.php` as the persistence boundary shared by `app/Domain/Conversations/CreatePageChat.php` and `LinkPageContext.php`, and `database/migrations/2026_09_05_140000_drop_page_context_resolution_keys.php` to remove the former request-key table. `SendPageMessage.php` now requires an existing association. The extension's scoped navigation listeners, explicit refresh actions, and in-memory creation form live in `apps/extension/src/sidepanel/main.tsx`. Resolution and concurrency coverage lives under `tests/Feature/PageContexts/` and `tests/Feature/Conversations/`.

## Plan of Work

### Milestone 1: Confirm boundaries and implement the page-chat core

Verify foundation prerequisites, then define organization/workspace-scoped contexts, chats, messages, and current associations. Choose the smallest database representation that enforces zero-or-one primary chat per context and supports many contexts per chat; do not add dormant many-chat selection.

Changed paths are `app/Models/`, `app/Domain/PageContexts/`, `app/Domain/Conversations/`, `app/Policies/`, `app/Http/Requests/`, `app/Http/Resources/`, `routes/`, `database/migrations/`, and `tests/Feature/PageContexts/` and `tests/Feature/Conversations/`. Existing Conversation vocabulary is reused. Resolution alone does not create a visible chat.

### Milestone 2: Implement linking and source attribution

Add explicit link/unlink boundary services under the existing conversation domain, owner/admin authorization, an authorized page-chat destination picker, association-change auditing, and stale-mapping conflicts. Check empty-history eligibility transactionally against concurrent sends. Preserve every historical message and source when unlinking, including the last linked page.

Spatie Activitylog is used only for organization-owned association events. Focused tests are under `tests/Feature/Conversations/`; `PostgresPageChatConcurrencyTest` now runs two separate Laravel processes against PostgreSQL to verify that concurrent explicit creates converge on one context and chat.

### Milestone 3: Connect the page-first interfaces

The implementation reuses the web application layout/Button and the extension Button without expanding their APIs. Page-specific semantic controls and native dialogs implement This Page, chat history, explicit source attribution, linking confirmation, safe source links, and draft/conflict recovery. The milestone changed `apps/extension/public/manifest.json` and `apps/extension/src/sidepanel/main.tsx`; the manifest uses the approved `tabs` metadata permission so the persistent panel works across standard HTTP and HTTPS pages and tab changes, while missing metadata has a distinct recovery message. No content script, broad host permission, or host-page access was added.

Add concise implementation maps to the owning feature documents once code exists. Record actual paths if they differ from this proposal.

### Milestone 4: Minimal cross-tool Activity handoff

Obtain separate milestone approval. Implement chat discovery, recent activity, all/unread views, Apps filtering, and a durable monotonic read position per member/chat. Shared chats and messages must appear/count once across linked apps; unlinking cannot erase history or reset read state.

Milestone 4 adds `conversation_reads`, `ConversationRead`, `app/Domain/Activity/`, shared web/extension discovery and mark-read endpoints, web Activity/Chats views, compact panel navigation, deterministic all/unread and Apps filtering, and focused tests under `tests/Feature/Activity/`. It does not add organization chat, DMs, mentions, notifications, external search, or content from source websites.

Expected changes are the existing conversation/query layer, read-state migrations, React web/extension views, and `tests/Feature/Activity/`. Do not implement custom channels, a full external search index, notification providers, or DMs inside this milestone. Their later plans must honor the same identity and authorization contracts.

### Milestone 5: Persist contexts only with collaboration

Obtain separate implementation approval. Change page resolution into an organization/default-workspace-scoped, normalized, read-only lookup. An existing context returns as before. A missing context returns a validated ephemeral descriptor sufficient for the current This Page interface, but creates no context, resolution key, Apps entry, chat, subscription, notification, or other durable visit record.

Add one explicit create-page-chat command and API boundary. When resolution finds no persisted context/chat, the This Page view shows an inline form with editable Page title, Page URL, and Chat name fields. Prefill the first two from Chrome's active-tab metadata and default the chat name to the detected title. The favicon remains optional detected metadata rather than a required form control. Explain that **Create chat** stores these values in the organization's SideWire data. Preserve the form after validation, offline, or unexpected request failures.

The create command accepts the untrusted form and detected metadata, normalizes and validates the URL again on the server, checks active membership, derives the organization/default workspace on the server, and atomically creates or reuses the context plus its empty page chat. It sends no message. The normalized-identity and current-association constraints must make retries and concurrent creation converge on one context/chat. If another action already created or linked that identity, return the authoritative current state rather than overwriting it with stale form data.

Do not show or enable the message composer until resolution returns an existing chat or the explicit create/link command succeeds. Remove implicit context/chat creation from the first-message path; sends once again require an authorized persisted chat and retain the existing message idempotency and source-validation behavior. Linking must accept the untrusted ephemeral page descriptor when no context identifier exists, create or reuse its context atomically, and apply the existing destination, role, empty-history, version, and conflict rules without creating another chat.

Remove all reads and writes of `page_context_resolution_keys`, then remove the table in a forward migration. Do not introduce a replacement visit, request-key, or ephemeral-context table. Existing message idempotency remains authoritative for sends; repeated links to the same normalized identity and destination remain idempotent through the association and unique-identity constraints.

Update `apps/extension/src/page-chat/api.ts` and `apps/extension/src/sidepanel/main.tsx` to represent existing and ephemeral This Page states without inventing a persisted context identifier. Deduplicate active-page resolution by the panel's Chrome window, active tab identifier, and URL. Ignore events from other windows or inactive tabs, and do not issue another lookup for title, favicon, loading-state, or same-URL update events. Keep ephemeral descriptors and form input in memory only; do not write page metadata or visit history to `chrome.storage`.

Remove the five-second current-page and Activity/Chats intervals. Fetch the page on initial connection and relevant URL changes; fetch discovery when its view opens or its search/filter changes; refresh affected state after successful create, link, unlink, or send actions; and expose an explicit **Refresh** action for current server data. Do not add a replacement background timer or extension realtime dependency in this milestone.

Expected changed paths are `app/Domain/PageContexts/`, a new create-page-chat domain service, `app/Domain/Conversations/SendPageMessage.php`, `app/Domain/Conversations/LinkPageContext.php`, the page-context/chat/association controllers, requests, and resources, `routes/api.php`, a new forward migration under `database/migrations/`, `apps/extension/src/page-chat/api.ts`, `apps/extension/src/sidepanel/main.tsx`, and focused tests under `tests/Feature/PageContexts/` and `tests/Feature/Conversations/`. Update the feature implementation maps when actual entry points change.

## Concrete Steps

The resolved verification commands for milestones 1-3 are:

```bash
./vendor/bin/sail artisan test tests/Feature/PageContexts
./vendor/bin/sail artisan test tests/Feature/Conversations
./vendor/bin/sail artisan test
./vendor/bin/sail composer types:check
./vendor/bin/sail composer lint:check
./vendor/bin/sail npm run foundation:check
./vendor/bin/sail npm run check
./vendor/bin/sail npm run types:check
./vendor/bin/sail npm run build
git diff --check
```

The commands above were run as recorded under Artifacts and Notes. Run the Activity test path only once milestone 4 creates it. Run migrations and rollback only against a disposable development/test database; never reset shared or production data.

## Validation and Acceptance

The owning feature documents provide full acceptance criteria. Record test names, commands, database environment, and results proving: isolated and safe read-only resolution; one context and chat under concurrent explicit creates; rejection of sends before creation; successful no-chat/empty-chat linking; rejection of nonempty history reassignment; idempotent links/retries; safe concurrent link/send conflicts; owner/admin-only mutations; rejection of cross-organization/workspace, DM, and organization-chat targets; preserved history/provenance after unlink; safe web sends without invented source; and durable access after the last context is detached.

At milestone 4, prove one read marker and one result/count for the same shared chat across apps and both clients. Later notification/search plans must separately verify delivery and result deduplication rather than marking those features complete here.

At milestone 5, prove that repeated first-time visits and repeated same-URL tab events create no database records; events from other tabs and windows cause no request or state change; and no periodic extension timer requests page, Activity, or Chats data. Existing contexts still resolve with their chat. The composer is absent before creation. The prefilled form supports detected values and deliberate edits, retains failures, and clearly identifies the persistence action. Explicit create and first link each create exactly one context under retries and concurrency; create also produces one empty chat and no message. Unsafe or cross-organization descriptors fail before persistence; a later first message retains accurate source attribution; and Apps, Chats, Activity, search, and counts exclude ephemeral pages and follow their existing empty-chat rules. Prove that removing resolution keys does not weaken message retry behavior or association conflict handling.

Manually test detected and edited creation-form values, create failure recovery, two supported source pages leading to one chat, side-panel resizing, same-window tab changes, unrelated-window activity, explicit refresh, stale drafts, restart/reconnect, keyboard navigation, removed membership, and rejected unsafe source links. Inspect the extension manifest for exactly `sidePanel`, `tabs`, and `storage`, the narrow development API host permission, and no content script or broad website host access.

## Idempotence and Recovery

Make context resolution, explicit chat creation, sends, link commands, and unlink commands safe to repeat. Explicit creation and association changes must serialize or otherwise enforce one context and at most one current page chat for a normalized identity. A conflict returns authoritative recoverable state without copying, moving, or silently overwriting history or corrected form data.

Unlinking is not an undo of information exposure. Keep historical message ownership, original safe source attribution, and existing chat read state. Never repair a mistake by deleting a history-bearing chat or merging records automatically.

Prefer additive migrations. A rollback must not discard real messages; record a data-preserving recovery strategy before shared deployment. A vocabulary change is not a reason to rename tables, replace memberships, or remove the Workspace foundation.

The milestone 1 migration permits rollback only while the new organization-owned tables are empty. Once a context, chat, message, or audit event exists, `down()` refuses to drop the tables; recover from a failed shared deployment with a reviewed forward migration that preserves those records.

The milestone 4 migration follows the same recovery rule: it rolls back only while `conversation_reads` is empty. Once member read positions exist, recover with a reviewed forward migration rather than discarding personal unread state.

Milestone 5 removes `page_context_resolution_keys` in a forward migration because those rows are transport-level retry artifacts, not product records. The migration must not delete `page_contexts` automatically. If cleanup of legacy visit-only contexts is separately executed, limit candidates to contexts with no current chat, no historical sourced messages, and `association_version = 0`; report the candidate count before deletion and preserve any context with collaboration, source-attribution, or association history. Rollback may recreate the resolution-key table structure but cannot reconstruct discarded request keys and must not resume writing them.

## Artifacts and Notes

The documentation revision preserves existing feature filenames and introduces this plan. Keep sanitized fixture URLs, the final relationship diagram, migration/rollback evidence, concurrency results, source-attribution examples, permission checks, UI checks, and build/test evidence here during implementation. Never include live access/session links or credentials.

The original foundation plan remains the historical owner of its milestones. New product behavior lives in the revised feature specs, not in a second copy of the foundation plan.

2026-09-05 verification evidence:

- Milestone 5 host-compatible checks passed: focused Pint formatting, PHP syntax checks for the changed PHP/tests, web and extension TypeScript checks, focused Oxfmt and Oxlint checks, the foundation boundary check, and `git diff --check`.
- Milestone 5 supported-runtime PHP tests, Larastan, and production builds could not run in this environment: Sail reported that Docker or Podman was not running, while the host has PHP 8.3.6 and Node 18.19.1 rather than the repository-required PHP 8.4.1 and Node 22.18 or newer. The focused test files were updated but are not recorded as passing, and no manual Chrome behavior is claimed.
- `composer validate --strict --no-check-publish` passed after locking `spatie/laravel-activitylog` 4.12.3.
- `./vendor/bin/sail composer test` passed Pint and Larastan with zero errors, then passed 86 tests with 312 assertions; the PostgreSQL-only race test was the one expected skip under the default in-memory SQLite suite.
- Before milestone 5 superseded implicit first-message creation, the focused page-context and conversation suite passed against an isolated PostgreSQL database with 14 tests and 50 assertions; its then-current two-process race test proved two simultaneous first sends created one chat and persisted both messages. That test now covers concurrent explicit creation and has not yet been rerun in the supported runtime.
- All migrations, including `2026_09_05_120000_create_page_chat_tables`, applied to an isolated PostgreSQL database and rolled back cleanly while empty. All disposable databases were removed after verification; the local SideWire database was not reset.
- `./vendor/bin/sail npm run foundation:check`, `npm run check`, and `npm run types:check` passed. The check covered 113 formatted files and 76 linted files without warnings.
- `./vendor/bin/sail npm run build` built the web application and extension; Vite transformed 2,319 web modules and 25 extension modules.
- `vendor/bin/pint --test`, PHP syntax checks, Composer validation, and `git diff --check` also passed from the host-compatible toolchain.
- A direct normalization smoke check produced `https://example.com/work/42?view=full` from an uppercase URL containing an anchor and `utm_source`.
- No manual Chrome behavior is claimed.
- The approved permission correction passed extension TypeScript checking, `git diff --check`, and a direct source/built-manifest assertion proving exactly `sidePanel`, `tabs`, and `storage`, only the localhost API host permission, and no content scripts. The final supported-runtime build produced fresh web and extension bundles containing the corrected permission and recovery behavior.
- The `/chats` index is covered by `tests/Feature/Conversations/ChatIndexTest.php` for guest rejection, organization/workspace/type/retirement/history isolation, latest-message ordering and summary data, linked and unlinked histories, and the empty payload.
- `./vendor/bin/sail composer test` passed Pint, Larastan with zero errors, and 93 tests with 445 assertions; the PostgreSQL-only race test was the one expected skip under the default in-memory SQLite suite.
- `./vendor/bin/sail npm run check`, `types:check`, `build`, and `foundation:check` passed. Formatting covered 115 files, linting covered 78 files, TypeScript passed for web and extension, Vite transformed 2,326 web modules and 25 extension modules, and the foundation boundary check passed.
- Before milestone 5, all migrations applied to an isolated PostgreSQL database and the focused Activity/Conversation suite passed there with 16 tests and 170 assertions, including the former first-send concurrency behavior and direct-route default-Workspace isolation. The empty `conversation_reads` migration rolled back cleanly, and both disposable verification databases were removed.
- `tests/Feature/Activity/ConversationActivityTest.php` covers monotonic and scoped read positions, shared-chat/App deduplication, relevance, unlink preservation, all/unread filters, cross-client consistency, and cross-organization rejection.

## Interfaces and Dependencies

Reuse the authenticated active-membership resolver, default workspace, versioned extension API, durable message/realtime foundation, and approved queue/audit direction. Keep normalization separate from linking.

Implemented boundaries are the versioned read-only page-context resolver, explicit idempotent page-chat creation, idempotent message creation, link/unlink commands with expected association state, optional validated message source context, authorized page-chat picker, private conversation broadcast, `ConversationDiscovery`, `MarkConversationRead`, and shared extension/web history, discovery, and unread representations. Link commands can create a missing context atomically, sends require a persisted chat, the resolution-key dependency is removed by a forward migration, and extension loading is scoped to relevant events and user actions.

No new external-app integration, pricing policy, custom channel subsystem, or dependency is approved by this plan. The `tabs` metadata permission is the sole approved browser-permission revision and is constrained as described above.
