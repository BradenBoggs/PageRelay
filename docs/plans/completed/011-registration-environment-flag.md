# 011 — Environment-controlled public registration

Lifecycle: completed
Approval: October 9, 2026 user request for an environment flag controlling registration, default false.
Verification: scoped backend/static/build/type/cache/browser/documentation checks passed October 9, 2026.
Release: not deployed; deployment outside scope.
Closed: 2026-10-09
Closure: false-by-default public registration flag and invitation continuity verified; actual checks and limits below.

## Purpose / Big Picture

Make public signup opt-in via `REGISTRATION_ENABLED=false` by default. Preserve the current invitation-only signup when public registration is closed and existing email verification, membership, bootstrap and password rules. [Accounts](../../features/accounts-and-organizations.md) owns behavior.

## Progress

- [x] Inspect current main/working tree and invitation-only implementation.
- [x] Gate public display/account creation, expose the correct login link, and add environment/default and boundary checks.
- [x] Validate both flag states, update owners/evidence and close the scoped change.

## Surprises & Discoveries

The current working tree contains plan 009's approved invitation-only signup and separate message-deletion work. Preserve both. Fortify's automatic public routes are intentionally disabled; custom guarded registration routes already reuse Fortify's controller/action contracts.

## Decision Log

October 9: requested clarification on public-only versus all signup. In the absence of a different answer after a reasonable opportunity, preserve the approved invitation path and make only public signup opt-in. Use cached `fortify.registration_enabled`, read from env only in configuration. Keep the custom routes to avoid duplicate Fortify routes and to permit config-only toggling with cached routes. A supplied invalid invitation must fail even when public signup is enabled; never fall back to public company creation for it. Public signup reuses the former explicit signup behavior (new user, owned Organization named from the user's name, Main default Workspace), with email verification required.

## Outcomes & Retrospective

Public registration is disabled when unset/false and can be enabled without changing code or rebuilding the frontend. Server display/creation and login link use cached configuration. Valid invitations remain usable and supplied invalid invitations cannot create a fallback company. Required scoped checks passed. No deployment, live data changes or dependencies.

## Context and Orientation

Main at `e4b721865f09e403fe836520b6851d67885bbbc8` plus pre-existing work for plans 008–010. Relevant configuration, action/controller/view, login provider/page and RegistrationTest are in `config/fortify.php`, `CreateNewUser`, `InvitationRegistrationController`, `FortifyServiceProvider`, `resources/js/pages/auth/`, and `tests/Feature/Auth/RegistrationTest.php`.

## Plan of Work

Add false-by-default flag and example env entry. Gate invitation-free signup view/action; retain the locked invitation branch. Show public signup link only when enabled. Document deployment configuration-cache rebuild and test both states/default/env parsing and invitation integrity.

## Concrete Steps

Overlay current source into a separate disposable checkout with copied locked dependencies and no `.env`. Run focused auth/Organization/bootstrap tests, PHP static analysis, scoped format/lint, web types/build, config/route cache and desktop/mobile browser checks in both modes. Run documentation guardrails and inspect the scoped diff.

## Validation and Acceptance

Unset/false blocks public signup and hides its link; true displays and creates an unverified owner with one Organization/default Workspace. Valid invitations join only their existing Organization in both modes; malformed/expired/wrong-email invitations do not create a fallback company. Web verification/password policy and bootstrap remain intact. Cached configuration controls behavior and frontend build is independent of the flag.

## Idempotence and Recovery

No migration or shared database mutation. Account/Organization creation is transactional; invitation consumption retains its lock. Operators can disable public signup and rebuild configuration cache. Existing accounts/history remain intact.

## Artifacts and Notes

Source: main `e4b721865f09e403fe836520b6851d67885bbbc8` plus prior working-tree plans 008–010 and this scoped patch. Scoped source SHA-256 `342dabfdcfe725ae4208a61d8c09b9186f71b9199d5e8865052c531725818a40`, computed from sorted path + NUL + contents for `config/fortify.php`, `CreateNewUser.php`, `InvitationRegistrationController.php`, `FortifyServiceProvider.php`, login/register TSX pages, `RegistrationTest.php` and `tests/Browser/registration-flag.cjs`. These files were compared byte-for-byte with the isolated source. Prior plans' evidence remains historical.

Environment: new `/private/tmp/sidewire-registration-flag-check` source copy without `.env`, copied locked Composer dependencies and existing locked npm installation, PHP 8.5.1/Laravel 13.30.1, PHPUnit 12.5.34, Node 24.14.1. Ephemeral app key, SQLite memory for backend tests, fresh disposable `sidewire-invitation-registration-flag.sqlite` for browser checks, array cache/mail, sync queue, null broadcasting, file browser sessions. Existing invitation fixture seeder refuses non-testing/non-disposable environments.

Passing checks:

- `APP_KEY=<ephemeral> vendor/bin/phpunit tests/Feature/Auth tests/Feature/Organizations tests/Feature/Console/BootstrapSidewireTest.php tests/Feature/Settings/ProfileUpdateTest.php tests/Feature/ExampleTest.php tests/Feature/DashboardTest.php`: **72 tests, 370 assertions, no skips**. Includes unset/false/true env parsing, configured signup display/link, unverified hashed non-operator public owner/default Workspace, invitation membership preservation, malformed/forged/wrong-email rejection, and expired/accepted/revoked/deleted-Organization checks in both modes.
- `APP_ENV=testing APP_KEY=<ephemeral> CACHE_STORE=array vendor/bin/phpstan analyse --debug --memory-limit=1G --no-progress`: **zero errors** across configured application scope. Debug avoids sandbox-blocked parallel worker sockets.
- `APP_ENV=testing APP_KEY=<ephemeral> npm run build:web`: passed, **2,322 modules** after final frontend changes. `npm run types:check:web`: passed. Scoped `vendor/bin/pint --test` on the five changed PHP files and `vp fmt --check` / `vp lint` on login/register pages and `tests/Browser/registration-flag.cjs`: passed.
- Cached unset/default registration with `php artisan config:cache`, then cached routes once with `php artisan route:cache`. With those caches, `tests/Browser/registration-flag.cjs` (`REGISTRATION_TEST_ENABLED=false`) on port 8031 passed at 1440px/390px: no public signup link, GET 404 and valid-CSRF public POST rejected with invitation validation. `tests/Browser/invitation-registration.cjs` also passed: valid invitation forms/submission reach verification, fixed email/focus/validation retry, existing user login/Profile acceptance reach Messages and public signup stays unavailable.
- Rebuilt only configuration cache with `REGISTRATION_ENABLED=true` and port 8032, retaining the same route cache and built assets. Started the server with process env `REGISTRATION_ENABLED=false` to verify cached configuration remains authoritative. `tests/Browser/registration-flag.cjs` (`REGISTRATION_TEST_ENABLED=true`) passed at both widths: public signup link/page, editable email and initial keyboard focus, validation/retry, account creation reaches verification and Messages remains gated until verification. No page errors or horizontal overflow. Playwright 1.56.1/Chromium 141.0.7390.37; `SIDEWIRE_PLAYWRIGHT_PACKAGE=/private/tmp/sidewire-bootstrap-browser/package.json`, `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/sidewire-bootstrap-browser/browsers`, `SIDEWIRE_BROWSER_URL` selects port, `SIDEWIRE_BROWSER_EVIDENCE_DIR=docs/plans/artifacts/011-registration-environment-flag`. Invitation harness uses equivalent origin/fixture/evidence variables and the same pinned package through `NODE_PATH`.
- Visually inspected retained [public desktop](../artifacts/011-registration-environment-flag/enabled-1440.png) and [public mobile](../artifacts/011-registration-environment-flag/enabled-390.png) validation/retry screenshots. Disabled/login and invitation evidence remain in the same artifact directory. Initial raw POST browser assertion hit CSRF 419; the harness now sends the actual session XSRF token, testing the registration gate without weakening protection. The corrected run passed.
- `node --test scripts/check-docs.test.mjs`: **18 passed**; `node scripts/check-docs.mjs` and `git diff --check`: passed after closure/owner updates. Isolated route/config caches cleared and server stopped after verification.

Limits: no hosted CI, PostgreSQL invitation race run, real SMTP or production deployment; no shared data changes, live account provisioning, external email, commit or push. Unrelated message-deletion work was preserved, not certified by these scoped tests.

### October 9 bounded follow-up: refresh the locally served registration assets

User reported plain `/register` always showed an invitation and fixed email. Inspected the actual workspace manifest: `assets/register-DZhqW0U7.js` still contained the older unconditional invitation view and `readOnly:!0`, while current source already gates both on `invitation`. Prior checks had built the isolated checkout, not refreshed the workspace's served assets. No application-source fix was necessary.

Rebuilt the real workspace's ignored `public/build` assets using `APP_CONFIG_CACHE=/private/tmp/sidewire-registration-flag-check/bootstrap/cache/root-build-config.php APP_ENV=testing APP_KEY=<ephemeral> CACHE_STORE=array SESSION_DRIVER=array QUEUE_CONNECTION=sync DB_CONNECTION=sqlite DB_DATABASE=:memory: DB_URL= npm run build:web`: passed, 2,322 modules. The first build using the local cached configuration failed at Wayfinder generation; the final command uses a disposable, absent config-cache path and testing configuration while preserving the user's real `.env` and existing cache. New manifest points to `assets/register-i06qEx5t.js`, whose email uses conditional `readOnly:!!p`. Registration source SHA-256 remains `90f882b0f57a8528c6c7266329fc8c841c48710713000961c37cf1dafbfd7ecb`; no source behavior or registration policy changed.

Copied those exact built assets into the disposable application, enabled public signup and seeded one disposable pending invitation. Pinned Playwright harness `/private/tmp/sidewire-bootstrap-browser/register-ui-check.cjs` passed at 1440px/390px against localhost:8033: direct `/register` has no invitation copy, starts with a blank enabled/editable email that can be filled; a valid invitation URL alone fixes its intended email and shows invitation text; returning to public signup clears that state; no page errors or horizontal overflow. Visually inspected [mobile public signup](../artifacts/011-registration-environment-flag/rebuilt-local-assets/public-390.png); [desktop capture](../artifacts/011-registration-environment-flag/rebuilt-local-assets/public-1440.png) retained. No form submission or shared data mutation in this follow-up. Updated setup wording to distinguish the initial release build from later flag-only changes. Documentation and diff checks passed; temporary server stopped. No remote deployment or backend test rerun for unchanged backend source.

## Interfaces and Dependencies

Reuse existing Fortify action contracts, validation traits, CreateOrganization/default Workspace, Inertia auth components. No new dependency or tenancy/billing decision.
