# Invitation registration verification — October 9, 2026

Source: local main e4b721865f09e403fe836520b6851d67885bbbc8 plus invitation-only registration patch and pre-existing working-tree changes. Disposable runtime /private/tmp/sidewire-mention-audit, copied locked vendor/node dependencies from /private/tmp/sidewire-bootstrap-check. PHP 8.5.1, Node 24.14.1, SQLite; no project .env or live records used. Other message-deletion work appeared concurrently; its required DeleteMessage class was copied to the disposable runtime for whole-application static analysis, without editing that work.

## Passed checks

- Explicit APP_ENV=testing, test APP_KEY, DB_CONNECTION=sqlite, DB_DATABASE=:memory:, DB_URL empty, CACHE_STORE=array, SESSION_DRIVER=array, QUEUE_CONNECTION=sync, BROADCAST_CONNECTION=null, MAIL_MAILER=array: `php artisan test --filter='RegistrationTest|AuthenticationTest|ProfileUpdateTest|OrganizationFoundationTest|BootstrapSidewireTest'` — 40 tests, 220 assertions, no failures/skips.
- `vendor/bin/phpstan analyse --debug --memory-limit=512M --no-progress` — all configured application files, zero errors. Debug mode avoids sandbox-denied parallel sockets.
- `npm run types:check` — web and extension passed.
- `npm run build:web` — passed; actual build log retained.
- `vendor/bin/pint --test` on CreateNewUser, InvitationRegistrationController, FortifyServiceProvider, OrganizationInvitationNotification, routes/web.php, RegistrationTest and AuthenticationTest — passed.
- `node_modules/.bin/vp check resources/js/pages/auth/register.tsx` — formatting/lint passed.
- `php artisan route:cache` followed by `php artisan route:clear` — passed in isolated runtime.
- `npm run foundation:check` — passed.
- Repository `node --test scripts/check-docs.test.mjs` (18 tests), `node scripts/check-docs.mjs`, `git diff --check` — passed.

## Real browser procedure

Use a disposable SQLite database whose filename contains sidewire-invitation with APP_ENV=testing, local-only APP_URL, test key, array mail, file sessions, sync queue and null broadcast. Migrate it; run `php tests/Browser/seed-invitation-registration.php`; start `php artisan serve --host=127.0.0.1 --port=8029`. The seed refuses non-testing or other database configurations. Run `node tests/Browser/invitation-registration.cjs` with Playwright available; optional INVITATION_TEST_ORIGIN, INVITATION_TEST_FIXTURES and INVITATION_TEST_EVIDENCE override the default isolated paths. Never seed a shared database.

Observed Chromium pass at 1440px and 390px: old login invitation link redirects to signup, invited email is fixed, name gets keyboard focus, no horizontal overflow, mismatched password confirmation produces validation and retry succeeds, new account reaches email verification. Existing account invitation signup link routes to login; login/Profile acceptance reaches Messages. Public signup without invitation returns 404. No browser page errors. Inspected retained signup screenshots visually.

Initial tests failed because the isolated copy lacked a built Vite manifest; building the real assets resolved those view failures. One test then needed its cached authenticated user refreshed after marking email verified. Initial browser run used the wrong Accept button label; corrected to the actual accessible label before passing. PHPStan first hit socket/memory environment limits and then a concurrently introduced missing class in the copy; final debug run with appropriate memory and the actual class passed. These initial failures are not reported as passing runs.

## Limits

No hosted CI, PHP 8.4/PostgreSQL or simultaneous invitation-consumption race run; SQLite tests establish sequential replay/rollback and tenant boundaries only. Production SMTP/verification-link delivery was not exercised (array/fake mail); backend checks assert verification notification dispatch and the invitation email destination. No deployment, migration on shared data, external emails, commit or push.
