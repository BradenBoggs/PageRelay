# Quality and verification evidence map

Reviewed: September 27, 2026, against the plan records at `2cbc88eb2ff5d974367de4794d1c68cfbed858c6`. This is an evidence map, not a fresh code/security audit or a numerical product score. It records what the repository says and what remains unverified.

| Area                                                | Evidence owner                                                                                | Recorded status and limitation                                                                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts, membership, service foundation            | [Plan 000](plans/active/000-execplan.md)                                                      | Local checks recorded; the plan still requests a hosted CI result. Not closed.                                                                 |
| URL identity, page chats, explicit creation/linking | [Plan 001](plans/active/001-page-chats-and-linking.md)                                        | Earlier milestones have automated evidence; milestone 5's supported-runtime/manual Chrome evidence remains incomplete in the record.           |
| Durable web/extension Chats                         | [Plan 002](plans/active/002-durable-work-chats.md)                                            | September 26 Sail results recorded; manual Chrome and PostgreSQL race checks not established.                                                  |
| Authenticated web shell                             | [Plan 003](plans/active/003-application-shell.md)                                             | Implementation recorded, but verification checkboxes remain open. A workflow's existence is not evidence of its result.                        |
| Expanded Slack-style feature scope                  | [Feature review](features/README.md)                                                          | Draft behavior; no implementation or verification is established merely by the new specifications.                                             |
| Documentation harness                               | [Workflow](engineering/WORKFLOW.md)                                                           | Structural checker and tests define automated coverage. Actual run results belong to the documentation PR; do not infer that hosted CI passed. |
| Production release, store approval, operations      | [Extension](features/browser-extension.md), [billing](features/billing-and-product-access.md) | Not established by this review. Release/provider/store checks require their own evidence.                                                      |

## GPS pilot and UI follow-up

[Plan 005](plans/active/005-gps-communication-pilot.md) owns the pilot's revision-specific hosted evidence and the October 8 UI candidate. The new presentation-helper and synthetic-preview checks do not extend the prior backend/browser passes to the rewritten React UI. The candidate is published for review on the GPS pilot branch; locked formatting/lint, full type checks, builds and authenticated/native client acceptance remain pending for the redesigned UI. Nothing in this evidence map certifies a GPS rollout.

Its October 9 bounded mention-search follow-up reproduced PostgreSQL's case-sensitive matching and then passed 20 collaboration tests/151 assertions on PHP 8.4/PostgreSQL 18 and PHP 8.5.1/SQLite. Scoped static/format/lint checks and authenticated Chrome tests at 1440px/390px verify partial mixed-case matching, full-name selection/send and membership/DM restrictions. This does not certify native extension or desktop notification delivery, or close broader pilot acceptance.

Its subsequent thread-highlight follow-up passed actual workspace web/extension builds/types, scoped format/lint, 9 helper tests and authenticated Chrome split-view/responsive checks. Current roots remain highlighted on hover/focus; switching, closing and narrowing clear or move the highlight while preserving drafts and muted anonymous deleted placeholders. Native side-panel and forced-color visual acceptance remain unverified.

## October 9 scoped landing-page removal

[Plan 008](plans/completed/008-remove-overview.md) records the isolated checks for removing Overview: 58 focused backend tests, full configured PHP static analysis, web build/types, formatting/lint, route caching, and authenticated Chromium checks at 1440px/390px. Its subsequent bounded sidebar follow-up records web build/types/format/lint and 1440px/390px browser checks for combined Messages/Direct navigation and Activity below Work chats. These validate the scoped navigation, landing redirects and Profile invitation continuity only. They do not close broader pilot verification or certify a production deployment.

## October 9 invitation-only signup correction

[Plan 009](plans/completed/009-invitation-only-registration.md) records 40 focused backend tests/220 assertions, PHP static analysis, web/extension types, web build, scoped format/lint, route caching, boundaries and real Chromium signup/login/acceptance checks at 1440px/390px. Valid invitation signup is restored while public company signup remains closed. Local PHP 8.5.1/SQLite checks do not certify PHP 8.4/PostgreSQL races, production mail delivery or deployment.

## October 9 message deletion and access removal

[Plan 010](plans/active/010-message-deletion-and-access-removal.md) records 33 focused PHP 8.4/SQLite tests (198 assertions), the full suite (161 passed, one PostgreSQL-only skip), PHP static analysis, web/extension types/builds, scoped lint/format and authenticated Chrome acceptance at 1440px/390px. Own-message deletion, shared work-Chat moderation, retry tombstones and membership removal preserving body/author history are covered. The browser check also verifies cancellation, failure recovery and keyboard focus. Full formatting still reports unrelated existing issues; native side-panel interaction, live Reverb propagation and PostgreSQL simultaneous races remain unverified. Nothing was deployed.

Its subsequent visual follow-up rebuilt the actual workspace web/extension assets and passed shared types, scoped format/lint, 9 presentation-helper tests, 5 focused deletion regressions (44 assertions, PHP 8.5.1/SQLite), and browser checks at 1440px/390px. Deleted stream/thread roots display only a muted outlined label, retained replies remain reachable and undeleted neighbors retain attribution. This follow-up does not close the native extension or PostgreSQL gaps.

## October 9 registration environment flag

[Plan 011](plans/completed/011-registration-environment-flag.md) records 72 focused backend tests/370 assertions, full configured PHP static analysis, web build/types, scoped formatting/lint, cached configuration/routes and Chromium checks at 1440px/390px in both flag states. Public signup defaults off and becomes available through `REGISTRATION_ENABLED=true`; invitation signup remains available when false. A subsequent scoped follow-up rebuilt the actual local workspace assets after an old invitation-only bundle was found; desktop/mobile checks of those exact assets confirmed plain public signup has no invitation text and an editable email. Real SMTP, hosted CI and production deployment were not exercised.

## October 13 owned message editing and mobile actions

[Plan 012](plans/active/012-owned-message-editing.md) records 8 focused PHP 8.5.1/SQLite tests (85 assertions), PHP static analysis, web/extension types/builds and Chrome editing/mobile-dropdown acceptance at 1440px/390px. Full suite: 176 passed, 1 unrelated registration assertion failed and 1 PostgreSQL-only skip. Native side-panel interaction, live Reverb, PHP 8.4 and PostgreSQL races remain unverified; no deployment.

## October 13 message-linked todos and assignment

[Plan 013](plans/active/013-message-todos.md) records 12 focused PHP 8.5.1/SQLite tests (156 assertions), PHP analysis, web/extension types/builds, scoped lint/format and Chrome 1440px/390px conversion/assignment/completion/reference checks. Full suite: 180 passed, existing registration assertion failed, one PostgreSQL-only skip. Private task visibility/assignee eligibility, removed membership, retry/conflict behavior and live message references are covered. PHP 8.4/PostgreSQL concurrency, live Reverb and native side-panel interactions remain unverified; no deployment.

The concept-2 follow-up in plan 013 records 4 focused task regressions/74 assertions, shared types/builds, PHP analysis and Chrome 1440px/390px minimal-message/deep-linked task-details acceptance. Wider runtime gaps remain unchanged.

Task-description follow-up in plan 013 records 5 focused regressions/91 assertions, PHP analysis, shared types/builds and Chrome 1440px/390px description entry/editing. Existing runtime gaps remain.

## October 13 password minimum

[Plan 014](plans/active/014-password-minimum.md) records 18 focused policy/reset/settings tests (99 assertions) and PHP analysis on PHP 8.5.1/SQLite. Production and local validation accept simple eight-character passwords while rejecting shorter values and mismatched confirmation. PHP 8.4 and browser acceptance were not rerun; no deployment.

## October 13 bracket badges

[Plan 015](plans/active/015-message-reference-badges.md) records 30 parser/documentation tests, shared web/extension types/builds and Chrome 1440px/390px generic bracket formatting/insertion/edit checks. Original message syntax remains plain text and arbitrary labels are inert; native extension interaction remains pending. No backend migration or deployment.

Plan 015 also records 33 parser/documentation tests and Chrome 1440px/390px clickable-URL checks, including navigation to mocked external destinations, safe new-tab attributes and preserved source text. Shared types/builds passed; native side-panel acceptance remains pending.

## October 13 image-link thumbnails

[Plan 017](plans/active/017-message-image-thumbnails.md) records 25 focused backend tests/168 assertions, PHP analysis, shared types/builds and Chrome 1440px/390px mocked-thumbnail success/fallback/hide/deletion acceptance. Public-DNS pinning and restricted fetch options, access rechecks, redirects/private addresses and image/size limits are covered with fake transport responses. Full suite: 208 passed, existing registration failure, one PostgreSQL skip. Public cURL/TLS smoke fetch passed against httpbin’s test PNG (8090 bytes). PHP 8.4 and native side panel remain unverified; no release or persistent image storage.

## Updating evidence

Replace a status only with a linked actual result tied to its revision, environment, date, and scope. Keep omissions visible. Never aggregate earlier checks across different code versions into a claim that today's complete app was tested. A newer CI result may resolve a gap only after its job/steps and applicable revision are inspected.

Security and usability require behavioral checks as well as static tools: tenant isolation, private audiences when implemented, session revocation, unsafe URLs, retry/concurrency behavior, full-history access, browser transitions, keyboard and assistive-technology behavior, and failed/offline states. The owning feature defines acceptance; do not turn this summary into a second checklist for each plan.

## Structural enforcement is bounded

The documentation checker protects navigation and lifecycle shape. It cannot establish true approval, feature completeness, truthful evidence, deployment, or compatibility with every browser. Those are review responsibilities. Where runtime or evidence is missing, use unverified/pending rather than a guessed quality grade.

## Work-Chat controls, unread counts and incoming sound

[Plan 016](plans/active/016-work-chat-controls.md) records October 13 admin-only creation/name editing, exact unseen-message counts, authorized incoming audio synthesis and desktop/mobile browser results. Host PHP/SQLite and supported Sail PHP 8.4.23 focused tests, TypeScript, web/extension builds and focused static checks passed. Ordinary opens at the newest messages and preserved deep links/background reader position also passed desktop/mobile Chrome checks. Native panel/Reverb/PostgreSQL checks remain pending; full-suite registration and whole-tree formatting failures are recorded without being represented as passes. The additive read migration has not been applied to shared databases; no release claimed.

## October 13 notification bell and settings gear

[Plan 005](plans/active/005-gps-communication-pilot.md) records real read/unread notification history in the shared bell dropdown, older pages and a settings gear for desktop controls. Focused host/Sail PHP tests passed (22 tests, 183 assertions each), along with shared types/builds, scoped lint/format and authenticated Chrome checks at 1440px/390px for pagination, no-read behavior, exact thread links, keyboard focus, desktop settings and loading/error/empty states. Notification API calls are instrumented; native side-panel/OS toast delivery, live Reverb and the broader pilot are not certified by this scoped pass. No deployment.

The subsequent bounded sidebar follow-up in plan 005 passed types, web/extension builds, focused lint and authenticated 1440px/390px Chrome navigation checks. Messages lists only DMs; Work chats retains its work-only server query. Activity, DM opening and exact work-thread links remain usable. Backend behavior was unchanged and its suite was not rerun for this UI correction; no deployment.

## Main-sidebar unseen-message badges

[Plan 016](plans/active/016-work-chat-controls.md) records authorized aggregate DM/work-message totals and shared desktop/mobile navigation badges. Host and Sail focused tests passed (7 tests, 104 assertions each), alongside PHP analysis, shared types/builds, focused format/lint and Chrome 1440px/390px count/read/reply/incoming/access-loss checks. Directory previews do not clear counts; badges hide at zero and expose exact totals when visually capped at 99+. Live Reverb/native-panel/PostgreSQL acceptance remains separate; no deployment was performed by this task.

## Fixed mobile bottom navigation

[Plan 005](plans/active/005-gps-communication-pilot.md) records the shared four-destination bottom bar below 768px, with current states, unseen badges and reserved composer/content space. Shared types/builds, scoped lint/format and actual Chrome checks passed at 320/390/767px and 500/900px heights; 768/1440px checks retain the desktop rail. Navigation, drafts, scrolling and secondary drawer access passed. Physical mobile keyboard/native safe-area-device acceptance was not performed; no backend behavior or deployment change.
