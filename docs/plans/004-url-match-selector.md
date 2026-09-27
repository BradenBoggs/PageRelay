# Execution plan 004: segmented URL matching

## Purpose / Big Picture

Implement the user-approved URL selector: hovering/focusing a path section previews the entire path up to that section, clicking selects it, and an explicit save links the selected scope to a Chat. Query parameters are selected independently, not treated as a hierarchy. A Supermove project can retain one Chat across `/view`, `block`, and `jobUuid` changes when the user selects its project-ID path segment. Keep the standalone web app and extension as two entry points into the same server-owned mapping.

Approval: the user explicitly requested planning, documentation, and implementation on September 26, 2026. This does not approve CRM scraping, new browser permissions, universal automatic recognition, history merging, or organization-wide route templates.

## Progress

- [x] Inspect main at `f7c7212ae12f1453daea5df7b26d11f0e503b02b`, contributor rules, specifications, resolver, transactional create/link/send boundaries, and extension client.
- [x] Record the approved scope and safety boundaries before application changes.
- [x] Implement and document versioned per-context URL matching and conflict checks.
- [x] Integrate the shared segmented selector with extension create/link and web Link Page.
- [x] Preserve a message's precise safe view URL and freeze draft attribution.
- [x] Run supported-runtime tests, type checks, builds, and browser interaction checks; record actual results below.
- [x] Review the implementation diff and generated browser screenshots on the working branch.
- [ ] Merge after review and perform installed-extension checks against representative live CRM URLs before deployment.

## Surprises & Discoveries

Main already contains the application shell. The existing universal normalizer preserves unknown query parameters and rejects credential-bearing/signing-session URLs and fragment routes. The resolver is read-only. Existing message source links came from the context's representative URL, which was insufficient once multiple views could resolve to one context. Extension drafts now freeze per-view source attribution instead of deriving it from whichever view is current at send time.

The local container could not resolve GitHub for a git clone. Repository changes used the authorized GitHub connection, and supported-runtime integration checks ran in GitHub Actions against disposable databases. Local PHP syntax and Node helper checks were supplementary, not substitutes for the application test suite.

Browser verification exposed unstable pointer targets when conditional preview text changed the height of a centered dialog. Preview instructions now occupy stable space. Tests await committed rendered state rather than assuming a click has synchronously completed React updates. The verified-member fixture was corrected to persist its verification timestamp without weakening production middleware. A regression also verifies that restoring exact matching cannot silently replace the original representative link with a different view.

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
- Keep verification read-only: the retained workflow has `contents: read`, does not persist checkout credentials, does not rewrite source, and never uploads test tokens or session files.

## Outcomes & Retrospective

The implementation is present on `work/url-match-selector-20260926`. Implementation commit `e0365ef8afbf33bcf0bb920be99658e47d5a59bf` passed both regular CI (run `36282016356`) and the URL selector verification workflow (run `36282016340`). No merge or production deployment is claimed by this record.

Verified on PHP 8.4 and the repository's Node 24 runtime:

- Foundation boundaries, PHP lint/static analysis, frontend formatting/lint, and both web/extension TypeScript checks passed.
- Both web and extension production builds passed.
- SQLite application suite: **120 passed, 2 skipped, 717 assertions**. The two skipped cases require PostgreSQL row locks; they are not SQLite passes.
- New PostgreSQL URL-matching concurrency regression: **1 passed, 3 assertions**, exercising two actors creating different views of one scope. This workflow does not separately run the older PostgreSQL page-chat concurrency test.
- URL selector helper tests: **3 passed**.
- Authenticated Chromium regression passed: web review/link, preview-only hover, keyboard selection, independent query toggles, broad-scope confirmation, 390px web layout, actual built extension at 360px with mocked Chrome tab/storage metadata, frozen source across view navigation, persisted message source, matching-dialog dismissal, and zero page errors.

Actual screenshots and text reports are in the `selector-review` artifact of run `36282016340` (artifact `10919585299`, seven-day retention). Desktop and narrow layouts were inspected. Long dialogs scroll internally; the extension's reused matching/link dialog initially focuses its chat search. Making that dialog's heading initially visible is a remaining presentation improvement, not a change to matching semantics.

Limitations: the browser test uses synthetic record URLs and mocked Chrome metadata, not a loaded extension browsing an authenticated live Supermove account. Installed Chrome navigation, actual CRM examples, touch-only interaction, and additional browsers remain manual release checks. Fragment-routed records, records sharing exactly one URL, organization-wide templates, and automatic CRM recognition remain outside this implementation.

## Context and Orientation

Behavior owners: `docs/features/page-contexts.md` (identity, safe URL handling, selector/matching rules), `docs/features/page-conversations.md` (linking, sources, drafts). Shared interface rules live in `docs/UI.md`; the web shell lives in `resources/js/layouts/app-layout.tsx` and `resources/js/components/chats/chat-header.tsx`.

Core entry points: `app/Domain/PageContexts/{NormalizePageUrl,ResolvePageContext,CreatePageContext}.php`, `app/Domain/Conversations/{CreatePageChat,LinkPageContext,SendPageMessage}.php`, `app/Models/{PageContext,Message}.php`, API controllers/resources under `app/Http/`, `routes/{web,api}.php`, `apps/extension/src/page-chat/api.ts`, and `apps/extension/src/sidepanel/main.tsx`.

Existing tests cover read-only resolution, tenant isolation, unsafe URLs, nonempty-history reassignment, idempotency, and PostgreSQL concurrency. Their existing invariants remain in place.

## Plan of Work

1. Add a nullable versioned match definition to page contexts and an optional historical source URL to messages. Implement a pure URL-match boundary plus an atomic create/link command using existing Chat services. Extend read-only resolution to saved matches, detect overlap, and retain legacy exact identities.
2. Build one reusable React selector and minimal web/extension adapters. Show original-order sections, cumulative path preview, independent query controls, broad-scope warning/confirmation, matching summary, explicit save/cancel, and actionable conflicts. No hover or draft-entry persistence.
3. Validate and snapshot the precise safe view URL on new This Page messages. Preserve that source and the intended association in in-memory drafts; direct web/Chats sends remain unattributed.
4. Add focused domain, API, concurrency, and browser coverage; update the owning specs and implementation maps; record verification in this plan.

Implemented additions: `PageUrlMatch.php`, `SavePageLink.php`, `PageLinkController.php`, `SavePageLinkRequest.php`, migration `2026_09_26_160000_add_page_url_matching.php`, shared `packages/page-contexts/`, web `link-page-dialog.tsx`, `UrlMatchingTest.php`, `UrlMatchingScopeEditTest.php`, `PostgresUrlMatchingConcurrencyTest.php`, `tests/frontend/url-selection.test.mjs`, `tests/browser/url-selector.cjs`, and `.github/workflows/url-selector.yml`. Existing resolver/create/source resources and both interface adapters consume these boundaries. The feature docs, UI guide, and architecture guide were updated without introducing another competing behavior specification.

## Concrete Steps

Run in the repository's supported PHP 8.4 / Node 24 environment: `composer install`, `npm ci`, `php artisan wayfinder:generate --with-form`, `composer lint:check`, `composer types:check`, `npm run foundation:check`, `npm run check`, `npm run types:check`, `npm run build`, and `php artisan test`. Focused checks: `php artisan test --filter=UrlMatching`, `node --experimental-strip-types --test tests/frontend/url-selection.test.mjs`, and `NODE_PATH=/tmp/url-selector-browser/node_modules node tests/browser/url-selector.cjs` after preparing a disposable authenticated fixture as shown in the workflow. PostgreSQL concurrency tests require a PostgreSQL test database and migrated schema. Never use production data for these tests.

After review/merge, apply the additive migration with `php artisan migrate --force` through the normal deployment process, rebuild the web/extension assets, and reload the unpacked extension when testing locally. Deploy server support before relying on the new extension endpoints. Existing contexts require no backfill: null matching definitions retain exact behavior. Test a project URL, another view of that same project, and a different project in an installed Chrome extension before a live release.

## Validation and Acceptance

Selecting the Supermove-style project path matches changed views but not a different project, partial-ID prefix, different origin/port, or organization. Query-based IDs, reordered parameters, duplicate values, percent encoding, missing selected keys, case sensitivity, broad confirmation, rejected unsafe/fragment URLs, and legacy exact fallback have regression coverage. Preview and lookup do not write records. Conflicting mappings and stale submissions fail without data changes. Retried saves/sends converge. Nonempty histories cannot be reassigned or merged. New message sources retain their view URL after navigation, unlinking, and retries.

Browser automation and the remaining manual release checks are distinguished in Outcomes above. Do not turn successful synthetic fixtures into a claim of universal live CRM compatibility.

## Idempotence and Recovery

Migrations are additive. Do not rewrite legacy normalized identities or message history. Failed link/rule operations roll back atomically. Keep a source representative separate from matching scope and offer explicit exact-page reset from the original representative URL. Association revisions reject stale routing changes and drafts. On conflict, reload the current mapping and require a deliberate retry. A destructive migration rollback removes newly recorded match/source fields; prefer an application rollback with the additive columns retained when preserving new data matters.

## Artifacts and Notes

The original application-shell reference places Link Page in the chat header and a linked-page strip below it. Those regions are reused rather than reproducing supplied HTML. The new selector is application React code, not a static demo. Verification screenshots are named `selector-web-1360.png`, `selector-web-390.png`, `selector-extension-360.png`, and `extension-source-360.png`; reports include backend tests, type checks, helper tests, PostgreSQL concurrency, and browser interactions.

## Interfaces and Dependencies

Use the existing Laravel, Inertia, React, TypeScript, and Chrome `tabs` capabilities. No new runtime package, content script, page-body access, or host permission was added. The browser URL API provides display segmentation; server normalization and matching remain authoritative. References: MDN URL API and URLSearchParams; actual locked repository code controls integration details.
