# Execution plan 008: remove Overview and land in Messages

Lifecycle: completed
Approval: October 9, 2026 explicit user request to remove the Overview page.
Verification: isolated backend/static/build/type/browser and documentation checks passed October 9, 2026.
Release: not deployed; deployment and live data changes are outside this task.
Closed: 2026-10-09
Closure: approved landing/navigation removal and invitation continuity verified; actual results and artifacts below.

## Purpose / Big Picture

Remove the starter Overview/Dashboard page and navigation item. Existing active members land in Messages; authenticated accounts without active Organization access retain profile/invitation handling. Preserve sign-in/verification and membership boundaries. No messaging, tenancy or invitation permission expansion. Owners: [Application shell](../../features/application-shell.md), [Accounts](../../features/accounts-and-organizations.md).

## Progress

- [x] Inspect `e4b7218`, current routes, auth defaults, navigation, Dashboard invitation UI and tests.
- [x] Remove Overview UI/controller and migrate its existing invitation controls into Profile.
- [x] Update root/auth/legacy navigation destinations and relevant tests.
- [x] Run isolated backend/static/build/type/browser checks and document evidence.

## Surprises & Discoveries

Dashboard is not only decorative: it lists eligible pending invitations for users without active membership. Simply deleting it would remove that account workflow. Legacy starter components and a passkey fallback also link to Dashboard.

## Decision Log

October 9: retain the named `/dashboard` route as a redirect to `/` for old bookmarks only. Fortify falls back to `/`; root resolves guests to login, unverified users to verification, verified active members to Messages, and verified users without an active Organization to Profile. Move only the existing invitation query/actions into Profile, with the original verified-email gate. Keep all messaging middleware and API authorization intact.

## Outcomes & Retrospective

Overview page/controller/navigation are removed. Root selects login, verification, Messages or Profile from authenticated verification/active membership. Default auth flows use root; old Dashboard links remain safe redirects. Profile preserves the existing eligible invitation query/actions. Verified scoped checks passed; no deployment or live data changes. The broader GPS pilot remains separately tracked and is not certified by this task.

## Context and Orientation

Relevant entry points: `routes/web.php`, `config/fortify.php`, `DashboardController`, `Settings/ProfileController`, application-shell navigation/topbar, passkey UI, legacy header/sidebar and Profile page. Existing Dashboard, home/auth, bootstrap and Organization tests establish affected behavior. Reuse CreateOrganization and membership relations; do not change them.

## Plan of Work

Delete Dashboard page/controller, transfer invitation presentation to Profile, update default navigation and old-link handling, and replace page assertions with redirect/member-access/invitation continuity assertions. Use the established isolated checkout and pinned browser test tools.

## Concrete Steps

Overlay source into `/private/tmp/sidewire-bootstrap-check` without application `.env`; use SQLite memory and an ephemeral app key. Run focused auth/home/Profile/Organization/bootstrap tests, full configured PHP static analysis, locked web build/types/format/lint, route cache, browser checks at 1440px/390px, documentation and diff checks. Browser fixtures are disposable and unrelated to the requested account.

## Validation and Acceptance

No Overview navigation/content remains. Verified members reach Messages after root/authentication; guests reach login and unverified users verification. Legacy `/dashboard` links redirect safely. Accounts without active membership cannot read messaging APIs but can view their own eligible invitations in Profile and accept/decline under existing authorization. Intended authorized deep links still use existing auth response behavior. All relevant checks must pass before closing the plan.

## Idempotence and Recovery

No migrations or record deletion. Removing UI does not alter users, read positions or organization history. The old named route remains a compatibility redirect; normal deployment rebuilds config/routes/assets. Do not reset shared databases or bootstrap a live account.

## Artifacts and Notes

October 9, 2026 evidence: `main` at `e4b721865f09e403fe836520b6851d67885bbbc8` plus this working-tree patch. Affected runtime/test source fingerprint (sorted path + NUL + contents, or `DELETED`, for modified app/config/resources/routes/tests paths plus `tests/Browser/no-overview.cjs`): SHA-256 `700e47199e9909350b6308556799fcdffb03f23cd831467912c5b8150ebc29fc`. Source comparison confirmed the isolated checkout matches these files. Prior plan 007's results remain historical.

Runtime: isolated `/private/tmp/sidewire-bootstrap-check`, locked Composer/npm dependencies, PHP 8.5.1, Laravel 13.30.1, PHPUnit 12.5.34, Node 24.14.1. No repository `.env`; ephemeral application key, SQLite memory for tests, new disposable SQLite browser databases, array cache, local file browser sessions, sync queue/null broadcasting. No real identity or credentials are in fixtures.

Passing checks:

- `APP_KEY=<ephemeral> vendor/bin/phpunit tests/Feature/Auth tests/Feature/ExampleTest.php tests/Feature/DashboardTest.php tests/Feature/Settings tests/Feature/Organizations tests/Feature/Console/BootstrapSidewireTest.php`: **58 tests, 243 assertions; no skips**. Covered authentication/verification defaults, old links, active/memberless landing and denied Messages access, own eligible invitation visibility, verified gate, intended Organization acceptance and decline continuity.
- `APP_ENV=testing APP_KEY=<ephemeral> CACHE_STORE=array vendor/bin/phpstan analyse --memory-limit=1G --no-progress --debug`: **0 errors** across configured scope. Debug runs in-process because the sandbox prohibits the normal worker's TCP listener.
- `APP_ENV=testing APP_KEY=<ephemeral> npm run build:web`: passed, 2,321 modules, generated Wayfinder and production assets; no Overview page chunk. `npm run types:check:web`: passed after the final navigation icon changes.
- `vendor/bin/pint --test` on the eleven modified PHP files: passed. Locked `vp fmt --check` and `vp lint` on the seven changed frontend files and `tests/Browser/no-overview.cjs`: passed.
- Isolated `php artisan route:cache` then `route:clear`: passed; root closure and legacy redirect cache correctly.
- Playwright **1.56.1**, Chromium **141.0.7390.37**, `tests/Browser/no-overview.cjs` against localhost:8017: passed at **1440px and 390px**. Owner login reaches Messages; old Dashboard links redirect; desktop rail/mobile Sheet omit Overview; a verified account without membership reaches Profile with Accept/Decline; mobile acceptance reaches Messages and exposes member navigation. Settled empty directory, no horizontal overflow or page errors; Escape closes mobile navigation. Disposable fixtures use a factory-created verified owner/Organization/Main and a direct verified invitee with a pending member invitation. Browser invocation: `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/sidewire-bootstrap-browser/browsers SIDEWIRE_PLAYWRIGHT_PACKAGE=/private/tmp/sidewire-bootstrap-browser/package.json SIDEWIRE_BROWSER_URL=http://127.0.0.1:8017 SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/008-remove-overview node tests/Browser/no-overview.cjs`. Both browser attempts passed; final artifacts wait for the loaded empty state. Screenshots visually inspected: [Messages desktop](../artifacts/008-remove-overview/messages-1440.png), [Messages mobile](../artifacts/008-remove-overview/messages-390.png), [Profile invitations desktop](../artifacts/008-remove-overview/invitations-1440.png), [Profile invitations mobile](../artifacts/008-remove-overview/invitations-390.png).
- `node --test scripts/check-docs.test.mjs`: **18 passed**; `node scripts/check-docs.mjs` and `git diff --check`: passed after closure and link updates.

Omissions: no hosted CI, Forge deployment, live bootstrap or broad pilot/extension/provider acceptance in this scoped change. No dependencies, database schema or permissions changed. Broader plan 005 keeps its own pending verification.

### October 9 bounded follow-up: combine Messages and Direct in the rail

Explicit user request: combine the Messages/Direct sidebar tabs and put Activity below Work chats. Removed the separate Direct rail link, so the order is **Messages, Work chats, Activity**. Messages already lists shared chats and DMs by default; preserve the in-directory Chats/Direct filters and existing direct-message deep links. Those direct-filter links now correctly select Messages in the rail. Large icons and the mobile Sheet continue to use the shared navigation; no API, permissions, history, extension or persistence changes.

Revision: the same `e4b7218` baseline plus the preceding Overview patch and this small follow-up. The sole newly changed runtime file is `resources/js/components/application-shell/app-navigation.tsx`, SHA-256 `5fe44091444c1e18dcb85d30bc83b92f4777f2b39ab9a5cf7dba1ae9294ca881`; compared byte-for-byte with the isolated checkout. Updated the navigation contract and UI vocabulary. The earlier source fingerprint remains evidence for the earlier checks, not this subsequent navigation state.

In the same locked PHP/Node/Playwright runtime, `APP_ENV=testing APP_KEY=<ephemeral> npm run build:web`, `npm run types:check:web`, and focused `vp fmt --check` / `vp lint resources/js/components/application-shell/app-navigation.tsx` passed. An ephemeral Playwright harness (`PLAYWRIGHT_BROWSERS_PATH=/private/tmp/sidewire-bootstrap-browser/browsers node /private/tmp/sidewire-bootstrap-browser/sidebar-check.cjs`) exercised the rebuilt app on the existing disposable browser database. At 1440px and 390px it verified the exact primary-link order, no separate Direct link, All selected on Messages, the existing Direct filter/deep link, Messages selected for that link, Messages returning to All, working Work chats/Activity links and their selected states, loaded empty Activity, mobile Sheet/Escape, no horizontal overflow or page errors. Visually inspected [desktop Messages](../artifacts/008-remove-overview/sidebar-follow-up/messages-1440.png) and [mobile navigation](../artifacts/008-remove-overview/sidebar-follow-up/navigation-390.png). `node scripts/check-docs.mjs` and `git diff --check` passed after recording the follow-up.

No backend tests rerun for this single navigation-file correction; the earlier backend evidence remains scoped to unchanged backend files. No deployment or hosted CI.

## Interfaces and Dependencies

Reuse Fortify defaults, active server-owned membership, existing invitation acceptance endpoints and Profile settings layout. No dependency, billing, permission or lockfile changes.
