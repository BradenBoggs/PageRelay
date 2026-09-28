# Workspaces, Teams, and reusable member groups

Status: **Draft for owner review. Existing data foundation retained; optional group-management behavior is proposed Core scope.** See [review scope](README.md).

This document owns the default Workspace and Teams as member groups. Organization membership belongs to [Accounts](accounts-and-organizations.md), channel audiences to [Channels](team-conversations.md), and Apps grouping to [Page contexts](page-contexts.md).

## Distinct concepts

Organization is the tenant/customer/billing boundary. Workspace is the existing organization-owned collaboration container; the product uses one default Workspace. Team is a reusable group of members, such as Sales or Operations. Channel is a shared Chat. App is an optional grouping of safe external source contexts. These are not interchangeable names.

Retain the existing Workspace model and provisioning. Do not create a Workspace for every domain, remove the default container, or introduce user-selected page/channel/hybrid modes. A schema capable of multiple Workspaces does not approve customer workspace creation/switching or new billing boundaries.

The default Workspace contains communication and page-context records. Multiple Apps can link distinct contexts into the same authorized chat. A Chat works with no page context at all; the web application is not organized around mandatory external domains.

## Team membership

A Team has one Organization and contains only people with active memberships there. Keep the existing `teams` and `team_memberships` foundation. Team manager/member roles are local responsibilities and do not grant organization-admin power, private-channel access, or page-linking rights.

Proposed management includes naming/renaming a Team, managing its active membership, an optional recognizable mention handle, and archiving an unused group. Authorized organization managers may create/manage groups; delegated Team managers may update only groups they manage. Archiving stops new group mentions without deleting people's chat messages or memberships elsewhere.

The people directory may show discoverable Team membership under the approved profile policy. A Team name is not evidence that a same-named private channel exists. Deactivated organization members cannot remain effective recipients of group mentions or future invites.

## Mentions versus access

A Team/user-group mention expands to current active members who already have access to the destination. It does not add anyone to a private channel or expose private previews to excluded recipients. Deduplicate people who also receive an individual mention or match another group. Broad mention warnings and permissions follow Notifications.

A deliberate **Invite Team to channel** convenience may create a reviewed snapshot of individual invitations. Show the actual people and history disclosure before confirmation. Later changes to Team membership must not silently add/remove channel access unless a separate dynamic-access policy is approved. Team creation does not automatically create a channel, and channel creation does not create a Team.

Task assignment remains the task feature's explicit person/audience rule. A group is not automatically an assignable queue, workflow identity, or permission role.

## Authorization and billing

Resolve all Team and Workspace IDs through the authenticated Organization. Default-Workspace identity is not a permission credential. Restricted workspace audiences, cross-workspace linking, guests, and organization switching remain separate proposals requiring account/security review.

One active billable organization membership counts once under Billing, regardless of Teams, channels, Apps, page links, or source sites. Group changes do not directly alter subscription quantities or create separately billed containers.

## Acceptance behavior and decisions

A manager can maintain a reusable group without changing tenant or channel boundaries. Group mentions reach only authorized active people once. Team-based invitation previews its participants and does not become an undisclosed ongoing access rule. Deactivation, archive, rename, and concurrent membership changes cannot grant cross-organization access.

Owner decisions: group creation/delegation roles, mention handles, directory visibility, and whether snapshot channel invitations are useful initially. Custom permission builders, automatic department access policies, and multiple selectable Workspaces are excluded.

## Implementation map — existing foundation only

`app/Models/Workspace.php`, `Team.php`, `TeamMembership.php`, `app/Domain/Workspaces/EnsureDefaultWorkspace.php`, `app/Domain/Teams/AddMemberToTeam.php`, and `tests/Feature/WorkspacesAndTeams/WorkspacesAndTeamsFoundationTest.php`.

The map does not establish implementation of customer group-management screens or mentions. Reference coverage: [Slack user-group and collaboration help catalog](https://slack.com/help/categories/200111606-Using-Slack).
