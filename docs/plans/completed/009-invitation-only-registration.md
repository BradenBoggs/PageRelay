# 009 — Invitation-only account registration

Lifecycle: completed
Approval: User explicitly requested October 9, 2026 that invited users can create accounts while public company registration remains closed.
Verification: 40 focused backend tests/220 assertions, PHP static analysis, web/extension types, web build, scoped format/lint, route caching, boundaries and desktop/mobile browser flows passed locally; see [retained evidence](../artifacts/009-invitation-only-registration/verification.md).
Release: not released; deployment out of scope.
Closed: 2026-10-09
Closure: Invitation-only signup and existing-account invitation continuity work under the recorded local checks; public company creation remains unavailable. Environment/provider limits are recorded in the retained evidence.

## Purpose / Big Picture

Restore account creation from valid organization invitations, including previously sent login links, without permitting public company creation. Existing accounts sign in and use the existing acceptance flow. Email verification and one-Organization membership remain required. See [Accounts](../../features/accounts-and-organizations.md).

## Progress

- [x] Inspect current registration shutdown, invitation mail, Fortify actions, auth UI and tests.
- [x] Implement invitation-only view and account creation with transactional consumption.
- [x] Verify denied public signup, invitation lifecycle, existing-user login and real desktop/narrow browser flow.
- [x] Record evidence and update owning documentation.

## Surprises & Discoveries

The shutdown disables all Fortify registration routes and emails instruct invited people without accounts to contact an administrator. The dormant CreateNewUser action still creates a new company without an invitation; it must lose that fallback before exposing signup.

## Decision Log

Keep global Fortify registration disabled. Expose explicit invitation-only register routes using the existing Fortify registration controller/action contracts. Signup requires a pending invitation to an existing organization and its matching email. Do not auto-verify email or change password policy. Register without an invitation remains unavailable. Old login invitation links redirect new recipients to the invitation signup view.

## Outcomes & Retrospective

New recipients create an account only with a valid matching invitation and join its existing Organization. Existing recipients log in and accept from Profile. Old invitation login links route correctly. Invalid/replayed signup creates no new company or duplicate membership. Desktop/mobile browser verification passed; production mail and hosted/PostgreSQL verification remain unestablished limitations, not a production release claim.

## Context and Orientation

Local main at e4b721865f09e403fe836520b6851d67885bbbc8 with pre-existing registration/bootstrap and landing-page changes. Relevant paths: routes/web.php, CreateNewUser, FortifyServiceProvider, OrganizationInvitationNotification, auth pages and RegistrationTest. Initial bootstrap stays separate.

## Plan of Work

Add guarded signup display, reuse Fortify's Registered event/session handling, require and consume invitations transactionally, restore mail instructions, and test authentication/tenant boundaries. Update the account specification and README to reflect this scope correction.

## Concrete Steps

Use an isolated disposable copy with locked dependencies for focused PHP tests, static analysis, web types/build and authenticated browser checks. Run documentation guardrails and inspect the scoped diff. No shared database reset.

## Validation and Acceptance

Valid new invite recipients see create account, join exactly the inviting Organization with its role, and verify email before protected access. Existing recipients see login. Missing, forged, expired, revoked, accepted, wrong-email and deleted-organization invitations cannot create accounts; repeated signup cannot duplicate users/membership/organizations. Browser verification covers desktop/narrow forms and submission. Runtime and provider limits must be explicit.

## Idempotence and Recovery

Lock invitation before consuming it; user/membership creation and accepted timestamp share a transaction. Failed validation rolls back. Do not reset passwords for existing accounts or create a fallback company. No migration or destructive recovery.

## Artifacts and Notes

October 9 checks and inspected screenshots are retained in [verification evidence](../artifacts/009-invitation-only-registration/verification.md). All fixtures are disposable.

## Interfaces and Dependencies

Reuse Laravel Fortify, Inertia, existing validation traits and auth UI components. No new dependencies.
