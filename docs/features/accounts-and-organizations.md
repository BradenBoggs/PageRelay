# Accounts, organizations, and membership lifecycle

Status: **Draft for owner review. Existing foundation retained; collaboration/lifecycle additions are proposed Core scope.** Foundation implementation is tracked in `docs/plans/000-execplan.md`; this review is not a fresh code audit. See [review scope](README.md).

This document owns authentication, tenant membership, roles, invitations, and account lifecycle. Teams/Workspace belong to [Workspaces and teams](workspaces-and-teams.md), billing consequences to [Billing](billing-and-product-access.md), and data retention/security administration to [Administration](administration-and-data-lifecycle.md).

## Retained foundation

An Organization is the private tenant, customer account, and billing owner. People authenticate individually and receive access through active organization membership. It is not a Workspace, Team, App, or channel. The first organization creator becomes its owner.

Keep the approved one-Organization-per-user foundation. There is no organization switcher, personal/fallback organization, stored current-organization preference, switch endpoint, or hidden alternative tenant mode. Multi-organization membership and external shared channels require explicit account-model approval, not dormant switching functionality.

Retain `organizations`, `organization_memberships`, `organization_invitations`, and `users`. Membership is authoritative for role, lifecycle, and billable status; do not add `users.organization_id` as a second synchronized authority. Existing invited, active, and removed concepts remain compatibility names; this review does not prescribe a status/schema rename. Constraints must enforce the approved membership relationship and prevent duplicate activation.

The historical starter-kit rule remains: remove generated tenant switching/personal-team behavior before renaming that tenant concept to Organization. Do not reintroduce `current_team_id`, equivalent current-tenant columns/helpers, switch routes, fallback teams, or tenant-selected URL defaults. SideWire's actual Team model is a separate group of people.

## Authentication and roles

Retain registration, verified email, sign-in/out, password reset, and secure web/extension session revocation. The target includes accessible session management, optional two-factor enrollment and recovery, and explicit confirmation for sensitive account/ownership changes. These additions are not assertions that every security screen already exists.

Organization roles remain owner, administrator, and member. Owners manage eligible roles and ownership. Administrators manage ordinary members/invitations but cannot transfer ownership, delete the Organization, or take owner-only billing actions. Ordinary members do not gain administrative authority by creating a channel or managing a Team.

Organization authority does not automatically grant private-channel or DM content access. Every content request, search, preview, file download, broadcast, job, export, and AI operation still checks its feature's audience. Internal SideWire operators use a distinct disclosed audited boundary, not an ordinary customer role.

## Invitations and onboarding

Authorized managers can invite by email, view pending invitations, resend, and revoke. Invitations have bounded expiry, an intended Organization/role, and safe one-time acceptance. Resending or concurrent acceptance must not create duplicate users, memberships, seats, or notifications. Pending invites are not active product access.

Show the inviting Organization, inviter, intended role, and explicit channel invitations before acceptance. Verify recipient identity; possession of an invitation URL alone must not activate a different account. Joining an existing Organization must not silently create another one. An account already attached to a different Organization receives a clear unsupported-account-model outcome, not an automatic transfer.

Onboarding can begin completely in the web app. Introduce General and optional invited channels without requiring the extension, an external website, or a domain workspace. An invitation to a private channel discloses retained-history access through the channel feature. Guest invitations remain separately gated.

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

## Implementation map — existing foundation only

`app/Models/Organization.php`, `OrganizationMembership.php`, `OrganizationInvitation.php`, `app/Concerns/HasOrganization.php`, `app/Policies/OrganizationPolicy.php`, `app/Http/Middleware/EnsureOrganizationMembership.php`, `app/Http/Controllers/Organizations/`, and `tests/Feature/Organizations/OrganizationFoundationTest.php`.

These are existing documented entry points, not evidence that proposed lifecycle additions or private audiences are implemented. Reference coverage: [Slack administration and security catalog](https://slack.com/enterprise).
