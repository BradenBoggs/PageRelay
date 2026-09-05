# Workspaces and teams

Status: approved data foundation; complete customer management behavior is implemented in later milestones. The September 4, 2026 product clarification retains the existing foundation rather than replacing it with per-app workspaces.

This document owns the Organization, Workspace, and Team distinctions. Organization tenancy and membership belong to `accounts-and-organizations.md`. Apps grouping belongs to `page-contexts.md`; chats and linking belong to `page-conversations.md`.

## Vocabulary

- **Organization:** the company/customer account, tenant, billing owner, and security boundary.
- **Workspace:** the existing organization-owned collaboration container. The MVP uses one default workspace.
- **Team:** a named group of organization members, such as Sales, Operations, or Design.

These terms are not interchangeable. An App is a browsing group, not a Workspace. A Channel is a later named discussion space, not a Team. Never rename the paying tenant to Workspace or use the `teams` table for it.

## Approved relationships

```text
Organization
├── Organization memberships
├── Default workspace
│   ├── Page contexts, grouped by App for browsing
│   └── Page chats, each with zero or more linked contexts
└── Teams
    └── Team memberships
```

The existing schema may represent multiple organization-owned workspaces and teams, but the MVP provisions one default workspace. Do not add customer workspace creation, workspace switching, or page/channel/hybrid operating modes because the schema can represent them.

A user must have an active organization membership before joining one of its teams or accessing its default workspace. A team cannot contain a user from another organization.

## Workspaces versus Apps

Retain the existing Workspace model and default-workspace provisioning. This documentation update is not a migration to remove or rename that foundation.

Do not create a Supermove Workspace and a Docusign Workspace just to group source domains. Both apps' contexts can live in the same default workspace, and their contexts can lead to the same chat under `page-conversations.md`.

Workspace public identifiers are not authorization credentials. Resolve the default workspace through the authenticated organization. Restricted workspace membership, guest access, elaborate workspace settings, and cross-workspace linking require separate approval.

Apps does not require a new Workspace record, extra seat, external-app login, or independent permission model. App grouping is defined only in `page-contexts.md`.

## Teams

A team is a reusable group of organization members. It may later be used for mentions, task assignment, notification routing, or access controls, but those behaviors are not implied by its tables.

The foundation contains the `teams` and `team_memberships` concepts. Each team has exactly one `organization_id`. Each team membership references a user with an active membership in that same organization. Team membership does not create an additional Stripe seat.

The initial team roles remain manager and member where a role is needed. A team manager does not automatically receive organization-administrator authority or page-linking rights. No custom permission builder is part of the foundation.

An organization-wide chat is not restricted to a similarly named Team. Future Sales or Announcements channels require their own approved access and posting rules; creating a Team must not silently create those channels or their permissions.

## Billing consequence

Stripe seats are counted from active billable organization memberships only. A person in multiple teams, workspaces, apps, or chats still consumes one seat in the organization. Invitations occur at the organization level.

## Out of scope for the foundation

- organization or workspace switching;
- per-domain workspaces or administrator-selectable product modes;
- separate workspace, app, team, or chat billing;
- workspace guests or external collaborators;
- custom roles or granular permission builders;
- cross-organization teams;
- automatic access restrictions based on team membership.

## Implementation map

The current foundation includes `app/Models/Workspace.php`, `app/Models/Team.php`, `app/Models/TeamMembership.php`, `app/Domain/Workspaces/EnsureDefaultWorkspace.php`, `app/Domain/Teams/AddMemberToTeam.php`, and `tests/Feature/WorkspacesAndTeams/WorkspacesAndTeamsFoundationTest.php`.

These are foundation entry points, not evidence that page contexts, shared chats, or customer management UI have shipped. Update the map when those features introduce stable boundaries; the implementation history remains in `docs/plans/000-execplan.md`.
