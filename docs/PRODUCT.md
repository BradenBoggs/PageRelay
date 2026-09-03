# SideWire product overview

SideWire adds a shared collaboration layer to the web applications and websites a team already uses. It runs primarily in a Chrome side panel. When a teammate opens SideWire while viewing a supported page, the company can see the conversation and work associated with that page without requiring the underlying website to build or expose collaboration features.

The larger product promise is one source of truth for communication across a company's tools. Instead of communication being fragmented among a CRM, design tool, project manager, shared document, and private messages, SideWire gives the company a consistent place to discuss the current page and later review communication across every page and tool.

## Intended users

The initial users are small and midsize companies and teams that coordinate work in several browser-based tools, especially when one or more tools has weak, fragmented, or expensive team communication.

Examples include office and operations teams working in CRMs, service-business platforms, project portals, design tools, internal dashboards, vendor sites, and other browser applications. Industry-specific landing pages may explain these uses, but the product remains horizontal.

The approved foundation account model is one organization per user. The organization is the company/customer account and billing tenant. It may contain workspaces and teams, which remain separate concepts.

## Core product loop

1. A user creates or joins the company's SideWire organization and signs in.
2. A default workspace gives the company a collaboration environment without pretending the workspace is the company account.
3. The user installs SideWire, opens a work page in Chrome, and opens the side panel.
4. SideWire resolves the current page to an organization-private and workspace-owned page context.
5. The user reads or adds messages associated with that context.
6. Teammates can return to the same page context, follow a link back to the source page, or find the conversation from SideWire's cross-tool inbox.
7. In a later milestone, the team can create and complete lightweight page-related tasks.

The first useful release needs to make this loop dependable. It does not need to mirror every feature of Slack, Microsoft Teams, or a full project-management platform.

## Product vocabulary

- **Organization:** the private tenant, customer account, and billing boundary. It normally represents a company.
- **Workspace:** a collaboration environment owned by an organization. A workspace is not the company account.
- **Team:** a named group of organization members such as Sales or Operations. A team is not the tenant and does not own the Stripe subscription.
- **Member:** an authenticated user with an active organization membership.
- **Seat:** one active billable organization membership, regardless of how many teams or workspaces that member uses.
- **Page context:** SideWire's organization-private, workspace-owned identity for a web page or stable application record.
- **Conversation:** the message history attached to a page context or another approved communication scope.
- **Inbox:** a cross-tool view of relevant activity, unread conversations, and mentions.
- **Task:** a lightweight action item tied to a page context. Tasks are planned after the core conversation workflow.
- **Source page:** the external website or web-application page represented by a page context.

Use these terms consistently. Do not call an organization or team a workspace. Do not call a page context a project, channel, ticket, deal, job, or customer because the underlying website may represent any of those things.

## Approved MVP direction

The MVP direction includes:

- a Chrome Manifest V3 extension using the native side-panel experience;
- a companion React web application for sign-in, onboarding, organization settings, inbox/search, billing, and other full-page workflows;
- one private organization per user with no organization switching;
- one default workspace while preserving the Organization, Workspace, and Team distinction;
- organization members and optional organization-owned teams;
- conservative page-context identification based on the current page URL and limited display metadata;
- page-scoped team messages;
- clear links back to the source page;
- near-real-time updates or a deliberately documented MVP fallback;
- basic unread state and a simple cross-tool inbox after page-scoped discussion works;
- responsive, accessible behavior at narrow side-panel widths;
- organization-owned per-seat Stripe billing using active organization memberships.

## Product boundaries

SideWire augments existing services; it does not replace their business data or become a universal CRM. The MVP is not a Slack replacement, project-management suite, document store, workflow automation platform, screen-recording product, customer portal, or browser surveillance system.

The extension must not silently read or copy page bodies, form values, private messages, customer data, images, or application state. It must not change the host page. Any future content extraction, screenshots, annotations, or provider integrations require explicit feature approval, a clear user benefit, and a permissions/privacy review.

The MVP does not promise native synchronization with every external tool. Its universal baseline is page context plus a return link. Tool-specific connectors may come later where they materially improve page identity or workflow.

## Open product decisions

The following remain intentionally open:

- final domain and any future product rename;
- exact price, trial, proration, cancellation, and complimentary-access rules;
- whether organization administrators may manage billing;
- URL normalization rules for specific applications and user-controlled context merging;
- message editing/deletion and retention policy;
- attachments, screenshots, reactions, threads, and rich formatting;
- notification channels and preferences;
- task behavior beyond the later lightweight-task direction;
- supported Chrome versions and extension-store distribution timing;
- future multi-organization membership and switching;
- workspace access restrictions and team-driven access;
- analytics, referrals, partner commissions, and native integrations.

Do not convert an idea in this list into an approved requirement without updating the owning feature document.

## Feature specifications

Permanent behavior is divided by feature so implementation agents can work from one clear source of truth:

- Accounts, organizations, roles, and invitations: `docs/features/accounts-and-organizations.md`
- Workspaces and organization-owned teams: `docs/features/workspaces-and-teams.md`
- Chrome extension and side-panel shell: `docs/features/browser-extension.md`
- Universal URL and page identity: `docs/features/page-contexts.md`
- Conversations tied to source pages: `docs/features/page-conversations.md`
- General organization chat: `docs/features/team-conversations.md`
- Private member communication: `docs/features/direct-messages.md`
- Cross-tool activity and read state: `docs/features/inbox-and-unread.md`
- Mentions and notification delivery: `docs/features/mentions-and-notifications.md`
- Lightweight actions tied to work pages: `docs/features/tasks.md`
- Search across authorized SideWire content: `docs/features/search.md`
- Native adapters and third-party services: `docs/features/integrations.md`
- Pricing, subscriptions, and paid access: `docs/features/billing-and-product-access.md`
- Customer referrals and software partnerships: `docs/features/referrals-and-partnerships.md`
- Public positioning and use-case pages: `docs/features/marketing-site.md`

These documents may include proposed behavior and open decisions. A documented idea is not automatically authorized for implementation. Approval is recorded in the relevant living ExecPlan.
