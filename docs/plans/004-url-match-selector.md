# Execution plan 004: segmented URL matching

## Purpose / Big Picture

Implement the user-approved URL selector: hovering/focusing a path section previews the entire path up to that section, clicking selects it, and an explicit save links the selected scope to a Chat. Query parameters are selected independently, not treated as a hierarchy. A Supermove project can retain one Chat across `/view`, `block`, and `jobUuid` changes when the user selects its project-ID path segment. Keep the standalone web app and extension as two entry points into the same server-owned mapping.

Approval: the user explicitly requested planning, documentation, and implementation on September 26, 2026. This does not approve CRM scraping, new browser permissions, universal automatic recognition, history merging, or organization-wide route templates.

## Progress

- [x] Inspect current main at `f7c7212ae12f1453daea5df7b26d11f0e503b02b`, contributor rules, specifications, resolver, transactional create/link/send boundaries, and extension client.
- [x] Record the approved scope and safety boundaries before application changes.
- [ ] Implement and document versioned per-context URL matching and conflict checks.
- [ ] Integrate the shared segmented selector with extension create/link and web Link Page.
- [ ] Preserve a message's precise safe view URL and freeze draft attribution.
- [ ] Run supported-runtime tests, type checks, builds, and browser interaction checks; record actual results.
- [ ] Review the final diff and publish the implementation for review.

## Surprises & Discoveries

Main now contains the previously built application shell. The existing universal normalizer preserves unknown query parameters and rejects credential-bearing/signing-session URLs and fragment routes. The resolver is read-only. Existing message source links come from the context's stored representative URL, which is insufficient once multiple views resolve to one context. The extension currently keys drafts only by context ID, so per-view source attribution must be frozen when a draft starts.

The local container cannot resolve GitHub for a git clone. Use the authorized GitHub connection for repository reads/writes and supported-runtime CI for verification. Do not claim local full-application tests without a working runtime.

## Decision Log

- Exact safe page matching remains the conservative default; prefix matching is an explicit user selection, not an inferred template.
- Rules belong to existing organization/default-workspace page contexts. Do not create a duplicate CRM-record or App entity.
- Match exact origins, complete path boundaries, and selected query names with all their decoded values. Parameter order is immaterial; duplicate values and key case remain significant.
- Validate the complete source URL before building a rule, including query parameters ignored for matching. The selector cannot bypass URL safety.
- Reject overlapping rules or collisions with other existing contexts rather than choosing an arbitrary winner, silently migrating contexts, or merging messages.
- Serialize context creation and matching changes using the default Workspace row; retain context/association locks and idempotent message sends.
- Preserve owner/admin permission for linking and modifying existing routing. Members may still explicitly create a new page Chat.
- Source-page URL and matching scope are separate: existing identities/history stay unchanged, while new page messages can record their validated safe view URL.
- Keep drafts tied to their original Chat, association revision, and view source. Navigation and async completion must not relabel or retarget them.
- Retain the current unsupported-fragment behavior with a clear explanation. No universal support claim or permissions expansion.

## Outcomes & Retrospective

Implementation and verification are in progress. No deployment or completed test result is claimed here.

## Context and Orientation

Behavior owners: `docs/features/page-contexts.md` (identity, safe URL handling, selector/matching rules), `docs/features/page-conversations.md` (linking, sources, drafts). Shared interface rules live in `docs/UI.md`; the web shell lives in `resources/js/layouts/app-layout.tsx` and `resources/js/components/chats/chat-header.tsx`.

Core entry points: `app/Domain/PageContexts/{NormalizePageUrl,ResolvePageContext,CreatePageContext}.php`, `app/Domain/Conversations/{CreatePageChat,LinkPageContext,SendPageMessage}.php`, `app/Models/{PageContext,Message}.php`, API controllers/resources under `app/Http/`, `routes/{web,api}.php`, `apps/extension/src/page-chat/api.ts`, and `apps/extension/src/sidepanel/main.tsx`.

Existing tests cover read-only resolution, tenant isolation, unsafe URLs, nonempty-history reassignment, idempotency, and PostgreSQL concurrency. Preserve them rather than replacing their assertions with new expectations.

## Plan of Work

1. Add a nullable versioned match definition to page contexts and an optional historical source URL to messages. Implement a pure URL-match boundary plus an atomic create/link command using existing Chat services. Extend read-only resolution to saved matches, detect overlap, and retain legacy exact identities.
2. Build one reusable React selector and minimal web/extension adapters. Show original-order sections, cumulative path preview, independent query controls, broad-scope warning/confirmation, matching summary, explicit save/cancel, and actionable conflicts. No hover or draft-entry persistence.
3. Validate and snapshot the precise safe view URL on new This Page messages. Preserve that source and the intended association in in-memory drafts; direct web/Chats sends remain unattributed.
4. Add focused domain, API, concurrency, and browser coverage; update the owning specs and implementation maps; record verification in this plan.

Expected changed directories: `app/Domain/PageContexts/`, `app/Domain/Conversations/`, `app/Http/`, `app/Models/`, `database/migrations/`, shared React selector code, `resources/js/components/chats/`, `apps/extension/src/`, `routes/`, and focused tests. Actual paths will be recorded as implemented.

## Concrete Steps

Run in the repository's supported PHP 8.4 / Node 24 environment: `composer install`, `npm ci`, `php artisan wayfinder:generate --with-form`, `composer lint:check`, `composer types:check`, `npm run foundation:check`, `npm run check`, `npm run types:check`, `npm run build`, and `php artisan test`. Add focused test commands and browser evidence when their files exist. Use a disposable test database, never production data.

## Validation and Acceptance

Prove that selecting the Supermove project path matches changed views but not a different project, partial-ID prefix, different origin/port, or organization. Prove query-based IDs, reordered parameters, duplicate values, percent encoding, missing selected keys, case sensitivity, root scope confirmation, rejected unsafe/fragment URLs, and legacy exact fallback. Preview and lookup must not write records. Conflicting mappings and stale submissions fail without data changes. Retried saves/sends converge. Existing nonempty histories cannot be reassigned or merged. New message sources retain the view URL after navigation, unlinking, and retries.

Browser checks must exercise hover/focus versus committed selection, independent query toggles, keyboard/touch operability, explicit confirmation, errors, and narrow widths. Live Chrome CRM verification is distinct from an automated browser fixture.

## Idempotence and Recovery

Migrations are additive. Do not rewrite legacy normalized identities or message history. Roll back failed link/rule operations atomically. Keep a source representative separate from matching scope and provide an explicit exact-page choice for removing a custom scope where safe. Use association revisions to reject stale routing changes and drafts. On conflict, reload the current mapping and require a deliberate retry.

## Artifacts and Notes

The original application-shell reference places Link Page in the chat header and a linked-page strip below it. Reuse those regions rather than reproducing the supplied HTML. The new selector is application React code, not a static demo.

## Interfaces and Dependencies

Use the existing Laravel, Inertia, React, TypeScript, and Chrome `tabs` capabilities. No new runtime package, content script, page-body access, or host permission is planned. The browser URL API provides display segmentation; server normalization and matching remain authoritative. References: MDN URL API and URLSearchParams; actual locked repository code controls integration details.
