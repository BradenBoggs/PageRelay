# Accounts, organizations, and membership lifecycle

Status: **Environment-controlled public registration, invitation signup and initial owner bootstrap approved October 9, 2026; other collaboration/lifecycle additions remain proposed Core scope.** Foundation implementation is tracked in `docs/plans/000-execplan.md`; this review is not a fresh code audit. See [review scope](README.md).

This document owns authentication, tenant membership, roles, invitations, and account lifecycle. Teams/Workspace belong to [Workspaces and teams](workspaces-and-teams.md), billing consequences to [Billing](billing-and-product-access.md), and data retention/security administration to [Administration](administration-and-data-lifecycle.md).

## Retained foundation

An Organization is the private tenant, customer account, and billing owner. People authenticate individually and receive access through active organization membership. It is not a Workspace, Team, App, or channel. The first organization creator becomes its owner.

Keep the approved one-Organization-per-user foundation. There is no organization switcher, personal/fallback organization, stored current-organization preference, switch endpoint, or hidden alternative tenant mode. Multi-organization membership and external shared channels require explicit account-model approval, not dormant switching functionality.

Retain `organizations`, `organization_memberships`, `organization_invitations`, and `users`. Membership is authoritative for role, lifecycle, and billable status; do not add `users.organization_id` as a second synchronized authority. Existing invited, active, and removed concepts remain compatibility names; this review does not prescribe a status/schema rename. Constraints must enforce the approved membership relationship and prevent duplicate activation.

The historical starter-kit rule remains: remove generated tenant switching/personal-team behavior before renaming that tenant concept to Organization. Do not reintroduce `current_team_id`, equivalent current-tenant columns/helpers, switch routes, fallback teams, or tenant-selected URL defaults. SideWire's actual Team model is a separate group of people.

## Authentication and roles

Public company/account registration is controlled by cached `fortify.registration_enabled`, sourced from `REGISTRATION_ENABLED` and defaulting to false. False/unset preserves invitation-only signup; true allows public signup, which creates an unverified user, active billable owner membership, one Organization named `<user name> Company` and its Main default Workspace. Both web flows require email verification and a minimum eight-character password in every environment, with confirmation and no character-composition or compromised-password requirement (approved October 13). Login shows a public signup link only when enabled. Operators rebuild configuration cache after changing the flag; routes and frontend assets are identical in both modes. The subsequent environment-flag decision is tracked in [plan 011](../plans/completed/011-registration-environment-flag.md). The earlier October 9 clarification approved valid Organization invitation signup; see [plan 009](../plans/completed/009-invitation-only-registration.md). The starter welcome and Overview pages are removed: `/` sends guests to login, unverified users to email verification, verified active members to Messages, and verified accounts without active membership to Profile. Authentication defaults use `/`; authorized intended destinations still take precedence. The named `/dashboard` route redirects to `/` for old links. Retain verified email, sign-in/out, password reset, and secure web/extension session revocation. A trusted server operator can initialize an empty installation through `sidewire:bootstrap`: one verified user, active billable owner membership, Organization and the existing default Workspace are created transactionally. This bootstrap never grants internal SideWire operator access and refuses initialized installations rather than changing existing accounts. Password input and confirmation use hidden console prompts; bootstrap and web registration/reset/security changes share an eight-character minimum. The target includes accessible session management, optional two-factor enrollment and recovery, and explicit confirmation for sensitive account/ownership changes. These additions are not assertions that every security screen already exists.

Organization roles remain owner, administrator, and member. Owners manage eligible roles and ownership. Administrators manage ordinary members/invitations but cannot transfer ownership, delete the Organization, or take owner-only billing actions. Ordinary members do not gain administrative authority by creating a channel or managing a Team.

Organization authority does not automatically grant private-channel or DM content access. Every content request, search, preview, file download, broadcast, job, export, and AI operation still checks its feature's audience. Internal SideWire operators use a distinct disclosed audited boundary, not an ordinary customer role.

## Invitations and onboarding

Authorized managers can invite by email, view pending invitations, resend, and revoke. Invitations have bounded expiry, an intended Organization/role, and safe one-time acceptance. Resending or concurrent acceptance must not create duplicate users, memberships, seats, or notifications. Pending invites are not active product access.

Show the inviting Organization, inviter, intended role, and explicit channel invitations before acceptance. Verify recipient identity; possession of an invitation URL alone must not activate a different account. Joining an existing Organization must not silently create another one. An account already attached to a different Organization receives a clear unsupported-account-model outcome, not an automatic transfer. Invitation mail opens an invitation-only create-account screen for new recipients and login for existing accounts. Previously sent login invitation links must also route new recipients to signup. Invitation signup requires a pending, unexpired invitation for the exact email and an existing Organization; it atomically creates the user and membership and consumes the invitation. Email verification remains required before protected access. Supplied malformed, revoked, expired, accepted or mismatched invitations cannot create accounts or fall back to public company creation, even with public signup enabled. Missing invitations are rejected when public signup is disabled. Invitation signup never creates another company. Creating additional accounts is outside the initial bootstrap command scope. Verified accounts without active Organization membership review their own pending, unexpired invitations in Profile; acceptance lands in Messages, while decline returns to Profile. Unverified accounts receive no invitation details there. A previously removed account may accept a new invitation to the same or another Organization (approved October 28, 2026): its single membership record is reactivated with the invited Organization and role, becomes billable, clears its removal time and starts without team memberships from the earlier membership. Authored history is unchanged; the record of the earlier removal is not retained. An account with active membership still receives a conflict. See [plan 018](../plans/active/018-removed-member-reinvitation.md).

Onboarding can begin completely in the web app. Introduce General and optional invited channels without requiring the extension, an external website, or a domain workspace. An invitation to a private channel discloses retained-history access through the channel feature. Guest invitations remain separately gated.

## Approved access removal — October 9, 2026

Owners and administrators use **Remove access** in Organization settings to remove a non-owner member. Confirmation explains that authored messages and historical identity remain. The existing removal endpoint marks membership removed/nonbillable, removes team memberships and leaves users, message bodies and conversation participation/history intact. All protected requests derive access from active membership, so removed users cannot read, send or delete messages. Remaining DM participants retain read-only history. This removes organization access, not the person's account. The owner cannot be removed through this action.

Current entry points: `OrganizationMemberController::destroy`, `OrganizationPolicy::removeMember`, `EnsureOrganizationMembership`, `organizations/edit.tsx`, and `MessageDeletionTest`. Validation is tracked in [plan 010](../plans/active/010-message-deletion-and-access-removal.md).

## Deactivation, reactivation, and ownership

Removing/deactivating a membership revokes product access, sessions, private broadcasts, calls, and pending protected deliveries. Preserve historical author identity and organization-owned content; do not cascade-delete messages because employment ends. Billing timing and proration are governed only by Billing, not invented here.

Reactivation is an explicit authorized action with reviewed role/channel access. It must not restore revoked sessions or every old private-group membership automatically. Outstanding task ownership and workflow sponsorship must have visible reassignment/review states. Ordinary member management does not delete a person's authored history.

The sole owner cannot leave, deactivate themselves, or be removed without a valid ownership handoff. A transfer identifies an eligible active recipient, requires current-owner confirmation and recipient acceptance, and preserves an owner throughout. Admins cannot silently promote themselves through a recovery route.

Personal account deletion, Organization deletion, export, and recovery are distinct actions requiring the approved data-lifecycle policy. They must explain effects on shared content and retained authorship. Exact recovery periods are intentionally undecided; no automatic destructive cleanup is approved by this feature review.

## Extension and tenancy boundaries

Preserve the scoped expiring Sanctum session and explicit PKCE-bound handoff. A source website never receives SideWire credentials. Revoked, unverified, expired, and removed sessions fail closed. Organization context comes from authenticated membership, never a submitted organization/workspace/chat identifier.

Use organization-scoped relationships and current feature authorization before exposing existence, titles, people, counts, URLs, or billing state. Apps, Teams, and page links neither add seats nor authorize another tenant.

## Acceptance behavior and decisions

An invited verified person joins exactly the intended Organization without duplicate membership or hidden switching. Role boundaries hold across web/extension and asynchronous delivery. Deactivation revokes future access while preserving others' history. Ownership cannot become absent or be seized through ordinary admin actions. Reactivation reviews access instead of reviving old sessions.

Owner decisions: two-factor/recovery requirements, invitation expiry, private-channel reactivation policy, ownership transfer UX, and account/organization deletion recovery. Commercial policy remains in Billing.

## Implementation map — existing foundation and controlled registration

`app/Models/Organization.php`, `OrganizationMembership.php`, `OrganizationInvitation.php`, `app/Concerns/HasOrganization.php`, `app/Policies/OrganizationPolicy.php`, `app/Http/Middleware/EnsureOrganizationMembership.php`, `app/Http/Controllers/Organizations/`, and `tests/Feature/Organizations/OrganizationFoundationTest.php`.

Entry/legacy redirects: `routes/web.php` (`home`, `dashboard`), tested in `tests/Feature/ExampleTest.php` and `DashboardTest.php`. Pending invitation presentation: `app/Http/Controllers/Settings/ProfileController.php`, `resources/js/pages/settings/profile.tsx`, and `tests/Feature/Settings/ProfileUpdateTest.php`. Landing/invitation browser coverage: `tests/Browser/no-overview.cjs`; scoped removal evidence: [plan 008](../plans/completed/008-remove-overview.md). Registration configuration: `config/fortify.php`; initial provisioning: `app/Console/Commands/BootstrapSidewire.php`, reusing `app/Actions/Organizations/CreateOrganization.php`. Verification: `tests/Feature/Auth/RegistrationTest.php`, `tests/Feature/Console/BootstrapSidewireTest.php`, `tests/Browser/closed-registration.cjs`; execution evidence belongs to [plan 007](../plans/completed/007-closed-registration-and-owner-bootstrap.md).

These are existing documented entry points, not evidence that proposed lifecycle additions or private audiences are implemented. Reference coverage: [Slack administration and security catalog](https://slack.com/enterprise).

Invitation-only signup: `InvitationRegistrationController`, `CreateNewUser`, `FortifyServiceProvider`, `OrganizationInvitationNotification`, `resources/js/pages/auth/register.tsx`, and guarded GET/POST `/register` routes. Environment/default and enabled/disabled coverage: `RegistrationTest`, `tests/Browser/registration-flag.cjs` and [plan 011](../plans/completed/011-registration-environment-flag.md). Automatic Fortify registration routes stay disabled to avoid duplicating these guarded routes; `fortify.registration_enabled` controls invitation-free display/creation through them. `RegistrationTest` and `tests/Browser/invitation-registration.cjs` cover the corrected scope; [plan 009](../plans/completed/009-invitation-only-registration.md) owns its verification and limitations.

Password policy entry point: `AppServiceProvider::configureDefaults`, consumed through `PasswordValidationRules` by Fortify actions and security settings. [Plan 014](../plans/active/014-password-minimum.md) records the scoped policy decision and checks.
