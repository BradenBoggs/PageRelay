# Accounts and organizations

Status: proposed; not implemented. Foundation decisions must be approved in `docs/plans/000-execplan.md` before implementation.

This document owns authentication, organization tenancy, membership, roles, invitations, and account lifecycle. Billing consequences belong to `billing-and-product-access.md`.

## Purpose

An organization is the private team boundary for every SideWire page context, conversation, task, message, notification, and integration. Users authenticate individually and collaborate only through an active organization membership.

## Proposed MVP behavior

- A user registers, verifies an email address, signs in, signs out, resets a password, and can revoke active extension sessions.
- The first user creating an organization becomes its owner.
- The MVP should prefer one organization per user unless a concrete pilot requires switching between organizations.
- An owner can invite members by email, view pending invitations, resend or revoke them, and remove members.
- An invited user joins the inviting organization rather than silently creating a second organization.
- Membership status is active, invited, or removed. Removed members immediately lose web, API, extension, realtime, and notification access.
- The initial roles are owner and member. Add an administrator role only when approved responsibilities exist.
- Ownership must be transferred before the only owner can leave or be removed.

## Authorization and isolation

The server derives organization context from authenticated membership. Client-provided organization identifiers are never proof of access. Enforce isolation in queries, policies, route binding, API endpoints, broadcasts, jobs, search, notifications, and provider events.

Users from another organization must not discover record existence, titles, URLs, people, counts, or timing information. Opaque public identifiers do not weaken this rule.

## Extension sessions

The extension uses the approved secure handoff and session mechanism from the foundation plan. A normal website must never receive SideWire credentials. Users must be able to see and revoke extension sessions. Expired, revoked, removed, or unverified accounts fail closed and present a recoverable sign-in state.

## Account lifecycle

The MVP needs safe sign-out and session revocation. Self-service organization deletion, personal data export, ownership transfer, account deletion, retention after removal, and recovery windows require explicit decisions before pilot launch.

Deletion must account for organization-owned collaboration history. Do not cascade-delete an organization or member's authored messages merely because an account is removed.

## Open decisions

- One organization per user versus organization switching.
- Whether an admin role is required for MVP.
- Invitation expiration and whether invited seats affect billing.
- Ownership transfer and member-removal history presentation.
- Account and organization deletion, export, and retention policy.
- Social login, passkeys, two-factor authentication, and enterprise identity providers.

## Out of scope

Guest users, external customer accounts, public workspaces, granular permissions, page-specific memberships, custom roles, SCIM, SSO, directory sync, and enterprise policy controls are not MVP requirements.

