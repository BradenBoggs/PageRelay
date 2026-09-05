# SideWire product overview

SideWire adds a shared collaboration layer to the web applications and websites a team already uses. It runs primarily in a Chrome side panel. When a teammate opens SideWire while viewing a supported page, they can see the chat associated with that work without requiring the underlying website to build collaboration features.

The larger product promise is one source of truth for communication across a company's tools. Start talking where the work already is; link other pages when that same work spans multiple tools. SideWire does not require customers to recreate their CRM's projects as channels.

## Intended users

The initial users are small and midsize companies and teams that coordinate work in several browser-based tools, especially when one or more tools has weak, fragmented, or expensive team communication.

Examples include office and operations teams working in CRMs, service-business platforms, project portals, design tools, internal dashboards, vendor sites, and other browser applications. Industry-specific landing pages may explain these uses, but the product remains horizontal.

The foundation account model is one organization per user. The organization is the company/customer account and billing tenant. Retain the existing organization-membership, default-workspace, and team foundations; this product revision does not authorize replacing those models.

## Core product loop

1. A user creates or joins the company's SideWire organization and signs in. The default workspace is provisioned without asking the company to choose an operating mode.
2. The user installs SideWire, opens a work page in Chrome, and opens the side panel.
3. SideWire resolves the page to an organization-private page context and opens its existing chat, when one exists. Merely resolving a page does not create a visible chat or subscribe the company to it.
4. The user starts or continues the chat beside that page.
5. An authorized owner or administrator can explicitly link another page context to that chat when the other context has no chat or its chat has no message history.
6. Teammates reach the same shared history from either linked page, or catch up through Activity and find discussions through Chats and search.
7. In a later milestone, the team can create and complete lightweight page-related tasks.

The first useful release needs to make this loop dependable. It does not need to mirror every feature of Slack, Microsoft Teams, or a full project-management platform.

## Product vocabulary

- **Organization:** the private tenant, customer account, and billing boundary. It normally represents a company.
- **Workspace:** the existing organization-owned collaboration container. The MVP uses one default workspace; it is not a domain, app group, or selectable product mode.
- **App:** a browsing group of page contexts from an external app or website. The interface calls the collection Apps. App grouping is not tenancy, chat ownership, an integration claim, or a permission boundary.
- **Team:** a named group of organization members such as Sales or Operations. A team is not a tenant or a channel.
- **Member:** an authenticated user with an active organization membership.
- **Seat:** one active billable organization membership, regardless of team, workspace, app, or chat usage.
- **Page context:** SideWire's organization-private identity for a web page or stable external record, scoped to the default workspace in the MVP.
- **Chat:** a persistent message history within an approved communication scope. A page chat can have multiple linked page contexts; each page context has at most one current primary chat.
- **Thread:** a message and its associated replies within a chat. This reserves the term; threaded replies are not approved for the MVP merely by defining it.
- **Channel:** a named shared chat for an ongoing topic, such as Sales or Announcements. Custom channels are a later expansion, not a required parent for page chats.
- **Activity:** a cross-tool view of relevant updates, unread chats, and mentions as those features ship. Replies appear only after replies are separately approved.
- **Chats:** the browsable and searchable collection of discussions. Activity answers what changed; Chats helps locate a discussion.
- **Task:** a lightweight action item tied to a page context. Tasks follow the core chat workflow.
- **Source page:** the external page represented by a page context. A message may record the page context selected when it was sent.

Use Chat and Activity in user-facing copy instead of Conversation and Inbox. Existing `Conversation` models, storage names, and specification filenames may remain; they refer to the same chat concept, not a second product entity. In particular, `page-conversations.md` owns page chats and linking, and `inbox-and-unread.md` owns Activity and read state. Do not perform a rename-only code or schema migration.

Do not call a page context a project, channel, ticket, deal, job, or customer: the underlying website may represent any of those. Workspace, App, Team, and Channel are not interchangeable.

## Approved MVP direction

The MVP product direction includes:

- a Chrome Manifest V3 extension using the native side panel and a companion React web application;
- one private organization per user, authoritative organization memberships, no organization switching, and the existing single default workspace;
- organization members and the existing optional organization-owned team foundation;
- conservative page-context identification using approved URL rules and limited display metadata;
- page-first chats, source-page return links, and optional manual cross-app linking into one shared page chat;
- Apps as a browsing/filtering aid, not separate workspaces per domain;
- near-real-time durable messaging with clear failure recovery;
- Activity, chat discovery, and one read position per member and chat across all linked pages;
- one organization-wide chat and one-to-one DMs after the core page workflow, through their own implementation milestones;
- responsive, accessible behavior at narrow side-panel widths;
- organization-owned per-seat Stripe billing using active organization memberships.

This is approved product direction, not blanket approval to implement every item. Implementation requires the relevant ExecPlan approval. Page chats and linking are planned in `docs/plans/001-page-chats-and-linking.md`; foundation work remains in `docs/plans/000-execplan.md`.

## Product boundaries

SideWire augments existing services; it does not replace their business data or become a universal CRM. The MVP is not a project-management suite, document store, workflow automation platform, screen-recording product, customer portal, or browser surveillance system.

The extension must not silently read or copy page bodies, form values, private messages, customer data, images, or application state. It must not change the host page. Content extraction, screenshots, annotations, and provider integrations require explicit feature approval and a permissions/privacy review.

The universal baseline is a safe page identity and return link, not native synchronization. A source label means a SideWire message was posted while viewing or selecting that page context; it does not mean a message was imported from the external app. SideWire permissions do not automatically mirror external-app permissions.

Linking distinct contexts to one chat is not URL normalization, a context merge, or a chat-history merge. A related reference can simply be posted as a link without sharing all discussion. Do not introduce automatic matching by customer name or page title, mandatory channels per project, a SideWire Project model, page-to-many-chat selection, or administrator-selectable page/channel/hybrid modes.

Custom channels, merging nonempty chats, history splitting, and automatic cross-app matching are outside the MVP.

## Open product decisions

The following remain intentionally open:

- final domain and any future product rename;
- exact price, trial, proration, cancellation, and complimentary-access rules;
- whether organization administrators may manage billing;
- additional application-specific URL rules, context aliases, context merges, and splits;
- message editing/deletion, moderation, and retention policy;
- attachments, screenshots, reactions, threaded replies, and rich formatting;
- notification channels and preferences;
- task behavior beyond the later lightweight-task direction;
- supported Chrome versions and extension-store distribution timing;
- future multi-organization membership and switching;
- workspace access restrictions and team-driven access;
- channel creation, access, archive, and announcements-only posting rules for a later expansion;
- analytics, referrals, partner commissions, and native integrations.

Manual page-to-chat linking is no longer an open product question; its approved boundaries live in `docs/features/page-conversations.md`. Do not convert other ideas into implementation requirements without updating the owning feature document and obtaining implementation approval.

## Feature specifications

- Accounts, organizations, roles, and invitations: `docs/features/accounts-and-organizations.md`
- Existing workspace and team foundations: `docs/features/workspaces-and-teams.md`
- Chrome extension and side-panel shell: `docs/features/browser-extension.md`
- URL identity, page contexts, and Apps grouping: `docs/features/page-contexts.md`
- Page chats, shared histories, provenance, and manual linking: `docs/features/page-conversations.md`
- Organization-wide chat and deferred custom channels: `docs/features/team-conversations.md`
- Private member communication: `docs/features/direct-messages.md`
- Activity and read state: `docs/features/inbox-and-unread.md`
- Mentions and notification delivery: `docs/features/mentions-and-notifications.md`
- Lightweight actions tied to work pages: `docs/features/tasks.md`
- Search across authorized SideWire content: `docs/features/search.md`
- Native adapters and third-party services: `docs/features/integrations.md`
- Pricing, subscriptions, and paid access: `docs/features/billing-and-product-access.md`
- Customer referrals and software partnerships: `docs/features/referrals-and-partnerships.md`
- Public positioning and use-case pages: `docs/features/marketing-site.md`
