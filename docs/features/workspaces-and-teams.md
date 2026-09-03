# Workspaces and teams

Status: approved data foundation; complete customer management behavior is implemented in later milestones.

This document owns the distinction between organizations, workspaces, and teams. Organization tenancy and membership belong to `accounts-and-organizations.md`. Conversations, page contexts, and tasks remain governed by their own feature documents.

## Vocabulary

- **Organization:** the company/customer account, tenant, billing owner, and security boundary.
- **Workspace:** a collaboration environment inside one organization.
- **Team:** a named group of organization members, such as Sales, Operations, or Design.

These terms are not interchangeable. Never rename an organization to workspace or use the `teams` table for the paying tenant.

## Approved relationships

```text
Organization
├── Organization memberships
├── Workspaces
└── Teams
    └── Team memberships
```

An organization can own multiple workspaces and multiple teams. The initial product may create one default workspace during onboarding while preserving a schema that does not confuse that workspace with the organization itself.

A user must have an active organization membership before the user can be placed in one of that organization's teams or authorized for one of its workspaces. A team cannot contain a user from another organization.

## Workspaces

A workspace is the container in which SideWire collaboration is organized. Page contexts, channels, conversations, and tasks may belong to a workspace as their feature implementations are approved.

The foundation creates the `workspaces` model and organization relationship but does not prematurely add workspace switching, restricted workspace membership, guest access, or elaborate workspace settings. Initial organization members may use the default workspace according to the approved feature plan.

Workspace public identifiers are not authorization credentials. The server resolves a workspace through the authenticated organization.

## Teams

A team is a reusable group of organization members. Team examples include Sales, Operations, Estimating, or Design. Teams may later be used for mentions, channel access, task assignment, notification routing, or workspace access, but those behaviors are not implied merely by creating the team tables.

The foundation creates:

```text
teams
team_memberships
```

Each team has exactly one `organization_id`. Each team membership references a user who already has an active membership in the same organization. Team membership does not create an additional Stripe seat.

Team roles should remain minimal. The initial data model supports manager and member where a role is needed, but no custom permission builder is part of the foundation.

## Billing consequence

Stripe seats are counted from active organization memberships only. A person in five teams or several workspaces still consumes one seat in that organization. Pending team invitations are not a billing concept; invitations occur at the organization level.

## Out of scope for the foundation

- organization switching;
- workspace switching as a tenant selector;
- separate workspace billing;
- per-team billing;
- workspace guests or external collaborators;
- team-specific subscription plans;
- custom roles or granular permission builders;
- cross-organization teams;
- automatic access restrictions based on team membership.

## Implementation map

Add this section when stable code entry points exist. It should identify the Workspace and Team models, relationships, policies, management routes, and cross-organization membership tests.
