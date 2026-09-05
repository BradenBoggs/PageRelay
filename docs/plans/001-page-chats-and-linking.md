# Execution plan 001: page chats and cross-app linking

Status: product behavior approved for documentation on September 4, 2026; implementation proposal only. Do not change application code until implementation is explicitly approved. This plan follows the foundation in `000-execplan.md` and does not replace it.

## Purpose / Big Picture

Deliver SideWire's page-first communication loop without a channel per external project. A recognized page opens its chat; an organization owner or administrator can attach another context with no chat or an empty chat to that same history. Both pages remain distinct identities. Messages record an explicitly selected safe source context when present.

Retain authoritative organization memberships and the existing default Workspace. Apps is browsing metadata, not another tenant or workspace. Use Chat and Activity in the interface while preserving existing internal Conversation names. One context has at most one current primary chat; a chat may have several contexts.

The last milestone adds minimal Activity, chat-level read state, and discovery for this workflow. Organization-wide chat, DMs, notification delivery, and broader search are separate initiatives; their specs must consume the same chat/message identities without duplicates.

## Progress

- [x] 2026-09-04: Record the product vocabulary, membership-retention decision, Apps grouping, manual linking boundary, provenance, and deferred channel/history-merge scope.
- [x] 2026-09-04: Align the owning specifications, interface guidance, agent instructions, and roadmap.
- [ ] Obtain explicit implementation approval for the intended milestone.
- [ ] Confirm foundation authentication, default-workspace isolation, extension handoff, and service readiness against actual code/tests.
- [ ] Implement safe context resolution, page chats, and first-message creation.
- [ ] Implement linking/unlinking, source attribution, conflict handling, and audit events.
- [ ] Implement and verify the extension/web page-chat workflow.
- [ ] Separately approve and implement minimal Activity, chat-level unread state, and Apps discovery.
- [ ] Record real migration, automated-test, build, and manual-browser verification evidence.

## Surprises & Discoveries

Repository inspection used `feature/sidewire-foundation` at commit `f52045abcf75c503a5a786e4b1600d7645264b2e`, ahead of documentation-only `main`. OrganizationMembership, Workspace, Team, and their foundation paths already exist. Do not rebuild or remove them simply to adopt the new interface vocabulary.

The previous page-message specification attached message ownership directly to a page context. This revision makes the chat the history aggregate and source context optional historical attribution. The previous general-chat and DM specs also left their MVP inclusion open; the product direction now retains one organization chat and one-to-one DMs while deferring custom channels.

Implementation status recorded in earlier plans is not proof of a passing test. Inspect the current branch and record actual results before proceeding.

## Decision Log

- 2026-09-04: Keep `organization_memberships` as the sole organization relationship; do not move it onto users or add switching.
- 2026-09-04: Retain the default Workspace; group contexts by App without creating per-domain workspaces or requiring an App table.
- 2026-09-04: Use Chat and Activity as interface terms; preserve internal Conversation names and existing feature filenames. Threaded replies remain deferred.
- 2026-09-04: Link different contexts to one chat manually. Only an unassociated context or a context whose different chat has no message history can move. An already-identical link is idempotent.
- 2026-09-04: Restrict link changes to organization owners/administrators and to page chats in the same organization/default workspace. No DM or organization-chat targets.
- 2026-09-04: Preserve history and provenance on unlink; never split or move messages. Keep one read position per member/chat and deduplicate downstream activity by chat/message.
- 2026-09-04: Defer nonempty-history merges, automatic matching, custom channels, multi-chat pages, and administrator-selectable operating modes.

## Outcomes & Retrospective

This revision is documentation only. No application implementation, migration, runtime behavior, test pass, deployment, or extension-store approval is claimed. Update this section with actual outcomes after each approved implementation milestone.

## Context and Orientation

Read `AGENTS.md`, `PLANS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/UI.md`, and `docs/DOCUMENTATION.md` first.

Behavior owners are `docs/features/page-contexts.md` for identity and Apps, `docs/features/page-conversations.md` for chats/linking/provenance, `docs/features/browser-extension.md` for panel lifecycle, and `docs/features/inbox-and-unread.md` for Activity/read state. Read `search.md` and `mentions-and-notifications.md` for downstream identity contracts. Organization chat and DMs remain in their own feature documents.

Existing foundation entry points include `app/Models/Organization.php`, `app/Models/OrganizationMembership.php`, `app/Models/Workspace.php`, `app/Concerns/HasOrganization.php`, `app/Http/Middleware/EnsureOrganizationMembership.php`, `app/Domain/Workspaces/EnsureDefaultWorkspace.php`, `resources/js/`, and `routes/`. Existing tests include `tests/Feature/Organizations/OrganizationFoundationTest.php` and `tests/Feature/WorkspacesAndTeams/WorkspacesAndTeamsFoundationTest.php`.

The page-context, chat, and linking services below are prospective paths, not an implementation map or evidence they exist. Reinspect the actual branch before creating or renaming anything.

## Plan of Work

### Milestone 1: Confirm boundaries and implement the page-chat core

Verify foundation prerequisites, then define organization/workspace-scoped contexts, chats, messages, and current associations. Choose the smallest database representation that enforces zero-or-one primary chat per context and supports many contexts per chat; do not add dormant many-chat selection.

Expected changed paths are `app/Models/`, `app/Domain/PageContexts/`, `app/Domain/Conversations/`, `app/Policies/`, `app/Http/Requests/`, `routes/`, `database/migrations/`, and `tests/Feature/PageContexts/` and `tests/Feature/Conversations/`. Reuse existing Conversation symbols where present. Implement safe URL validation, versioned identity, isolated resolution, and idempotent concurrent first-message creation. Resolution alone does not create a visible chat.

### Milestone 2: Implement linking and source attribution

Add explicit link/unlink boundary services under the existing conversation domain, owner/admin authorization, an authorized page-chat destination picker, association-change auditing, and stale-mapping conflicts. Check empty-history eligibility transactionally against concurrent sends. Preserve every historical message and source when unlinking, including the last linked page.

Use the already approved auditing direction only where needed; do not turn this into an analytics or generalized workflow initiative. Add focused tests in `tests/Feature/Conversations/` and transaction/concurrency tests against the configured PostgreSQL environment. SQLite-only tests are not evidence for production concurrency behavior.

### Milestone 3: Connect the page-first interfaces

Use existing React layouts/components in `resources/js/` and the foundation's actual extension location, expected under `apps/extension/` when present. Implement This Page, chat history, explicit source attribution, linking confirmation, safe source links, and draft/conflict recovery. Reuse the approved extension handoff and permissions; do not add content scripts or host-page access.

Add concise implementation maps to the owning feature documents once code exists. Record actual paths if they differ from this proposal.

### Milestone 4: Minimal cross-tool Activity handoff

Obtain separate milestone approval. Implement chat discovery, recent activity, all/unread views, Apps filtering, and a durable monotonic read position per member/chat. Shared chats and messages must appear/count once across linked apps; unlinking cannot erase history or reset read state.

Expected changes are the existing conversation/query layer, read-state migrations, React web/extension views, and `tests/Feature/Activity/`. Do not implement custom channels, a full external search index, notification providers, or DMs inside this milestone. Their later plans must honor the same identity and authorization contracts.

## Concrete Steps

Before coding, inspect current manifests and scripts, confirm approved milestone scope, and record the resolved commands here. Planned verification after the relevant tests exist includes:

```bash
php artisan test tests/Feature/PageContexts
php artisan test tests/Feature/Conversations
php artisan test tests/Feature/Activity
php artisan test
composer types:check
composer lint:check
pnpm check
pnpm types:check
pnpm build
git diff --check
```

These are planned commands, not verified results. Run the Activity path only once that milestone creates it. Confirm package-manager scripts and the extension build command from current manifests before use. Run migrations and rollback only against a disposable development/test database; never reset shared or production data.

## Validation and Acceptance

The owning feature documents provide full acceptance criteria. Record test names, commands, database environment, and results proving: isolated and safe resolution; one chat under concurrent first sends; successful no-chat/empty-chat linking; rejection of nonempty history reassignment; idempotent links/retries; safe concurrent link/send conflicts; owner/admin-only mutations; rejection of cross-organization/workspace, DM, and organization-chat targets; preserved history/provenance after unlink; safe web sends without invented source; and durable access after the last context is detached.

At milestone 4, prove one read marker and one result/count for the same shared chat across apps and both clients. Later notification/search plans must separately verify delivery and result deduplication rather than marking those features complete here.

Manually test two supported source pages leading to one chat, side-panel resizing, tab changes between linked pages, stale drafts, restart/reconnect, keyboard navigation, removed membership, and rejected unsafe source links. Inspect the extension manifest for unchanged approved permissions.

## Idempotence and Recovery

Make context resolution, first sends, link commands, and unlink commands safe to repeat. Association checks and first-message creation must serialize or otherwise enforce the empty-history invariant. A conflict returns a recoverable error without copying or moving history.

Unlinking is not an undo of information exposure. Keep historical message ownership, original safe source attribution, and existing chat read state. Never repair a mistake by deleting a history-bearing chat or merging records automatically.

Prefer additive migrations. A rollback must not discard real messages; record a data-preserving recovery strategy before shared deployment. A vocabulary change is not a reason to rename tables, replace memberships, or remove the Workspace foundation.

## Artifacts and Notes

The documentation revision preserves existing feature filenames and introduces this plan. Keep sanitized fixture URLs, the final relationship diagram, migration/rollback evidence, concurrency results, source-attribution examples, permission checks, UI checks, and build/test evidence here during implementation. Never include live access/session links or credentials.

The original foundation plan remains the historical owner of its milestones. New product behavior lives in the revised feature specs, not in a second copy of the foundation plan.

## Interfaces and Dependencies

Reuse the authenticated active-membership resolver, default workspace, versioned extension API, durable message/realtime foundation, and approved queue/audit direction. Keep normalization separate from linking.

Proposed boundaries are a page-context resolver, idempotent page-chat/message creation, link/unlink commands with expected association state, optional validated message source context, authorized chat discovery, and one read-state service per member/chat. Exact class, table, and route names must be recorded after inspection and implementation approval, not invented as existing interfaces.

No new external-app integration, browser permission, pricing policy, custom channel subsystem, or dependency is approved by this plan.
