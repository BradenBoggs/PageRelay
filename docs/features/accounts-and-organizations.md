# Accounts and organizations

Status: approved for the foundation; implementation is tracked in `docs/plans/000-execplan.md`.

This document owns authentication, organization tenancy, organization membership, roles, invitations, and account lifecycle. Workspace and team behavior is defined in `workspaces-and-teams.md`. Billing consequences belong to `billing-and-product-access.md`.

## Purpose

An organization is the private tenant, customer account, and security boundary for SideWire. It normally represents a company. Users authenticate individually and collaborate only through an active organization membership.

An organization is not a workspace and is not a team. It may own workspaces and teams without changing which customer owns the data or subscription.

## Approved foundation behavior

- A user registers, verifies an email address, signs in, signs out, resets a password, and can revoke active web and extension sessions.
- The first user creating an organization becomes its owner.
- A foundation user belongs to exactly one organization.
- There is no organization-switching interface, route, service, stored current-organization preference, personal organization, or fallback organization.
- The initial organization roles are owner, administrator, and member.
- An owner can invite members by email, view pending invitations, resend or revoke them, update eligible roles, and remove members.
- An administrator can manage ordinary memberships and invitations but cannot transfer ownership, delete the organization, or take owner-only billing actions.
- An invited user joins the inviting organization rather than silently creating another organization.
- Membership status is invited, active, or removed. Only active membership authorizes product access.
- Ownership must be transferred before the only owner can leave or be removed.

Supporting multiple organizations per user is a future migration, not dormant switching functionality. It requires separately approved product behavior, database changes, UI, billing rules, extension-session behavior, and cross-organization security tests.

## Removal-before-rename rule

The official Laravel React starter's Teams scaffold may be used as source material, but its tenant-switching behavior must be removed before the generated tenant concept is renamed to Organization.

Removal includes:

- `current_team_id` and all equivalent current-tenant columns or properties;
- switch routes, controller actions, methods, menus, selectors, and keyboard commands;
- `switchTeam`, `currentTeam`, `isCurrentTeam`, `fallbackTeam`, and equivalent state helpers;
- personal-team creation and `is_personal` behavior;
- URL defaults or route prefixes that derive from a selected current team;
- frontend data structures that exist only to present alternative tenant choices.

After those removals, the remaining membership, invitation, role, policy, and tenant-scoping concepts may be renamed from Team to Organization. Only after that rename is complete may SideWire's actual `Team` model be introduced.

## Data model

The foundation uses these concepts:

```text
organizations
organization_memberships
organization_invitations
users
```

`organization_memberships` is the authoritative connection between a user and the tenant. It records organization role, status, invitation or activation timestamps, removal state, and whether the active membership is billable.

Database constraints must prevent duplicate active membership and enforce the approved one-organization-per-user foundation. Do not use a nullable `current_organization_id` on `users` as a substitute for authorization.

## Authorization and isolation

The server derives organization context from authenticated active membership. Client-provided organization identifiers are never proof of access. Enforce isolation in queries, policies, route binding, API endpoints, broadcasts, jobs, search, notifications, Filament actions, and provider events.

Users from another organization must not discover record existence, titles, URLs, people, counts, billing state, or timing information. Opaque public identifiers do not weaken this rule.

A request may contain a workspace, team, conversation, or page-context identifier, but the server must resolve it through the authenticated user's organization. Do not first retrieve a global record and authorize it later when an organization-scoped relationship can perform both operations.

## Extension sessions

The extension uses the approved secure handoff and Sanctum-backed session mechanism from the foundation plan. A normal website must never receive SideWire credentials. Users must be able to see and revoke extension sessions. Expired, revoked, removed, or unverified accounts fail closed and present a recoverable sign-in state.

## Account lifecycle

The foundation includes safe sign-out and session revocation. Self-service organization deletion, personal data export, ownership transfer UI, account deletion, retention after removal, and recovery windows require explicit decisions before pilot launch.

Deletion must account for organization-owned collaboration history. Do not cascade-delete an organization's history or a member's authored messages merely because an account is removed.

## Implementation map

Add this section when implementation creates stable entry points. It must identify the organization model, membership model, policies, tenant middleware or resolver, routes, invitation workflow, billing seat synchronization boundary, and isolation tests without listing every generated file.
