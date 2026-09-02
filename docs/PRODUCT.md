# SideWire product overview

SideWire adds a shared collaboration layer to the web applications and websites a team already uses. It runs primarily in a Chrome side panel. When a teammate opens SideWire while viewing a supported page, the team can see the conversation and work associated with that page without requiring the underlying website to build or expose collaboration features.

The larger product promise is one source of truth for communication across a team's tools. Instead of communication being fragmented among a CRM, design tool, project manager, shared document, and private messages, SideWire gives the team a consistent place to discuss the current page and later review communication across every page and tool.

## Intended users

The initial users are small and midsize teams that coordinate work in several browser-based tools, especially when one or more of those tools has weak, fragmented, or expensive team communication.

Examples include office and operations teams working in CRMs, service-business platforms, project portals, design tools, internal dashboards, vendor sites, and other browser applications. Industry-specific landing pages may explain these uses, but the product remains horizontal.

The initial account model is one organization containing an owner and members. Exact administrative roles, invitation behavior, billable-seat rules, and multi-organization membership are not yet approved.

## Core product loop

1. A user installs SideWire and signs in.
2. The user opens a work page in Chrome and opens the SideWire panel.
3. SideWire resolves the current page to an organization-private page context.
4. The user reads or adds messages associated with that context.
5. Teammates can return to the same page context, follow a link back to the source page, or find the conversation from SideWire's cross-tool inbox.
6. In a later milestone, the team can create and complete lightweight page-related tasks.

The first useful release needs to make this loop dependable. It does not need to mirror every feature of Slack, Microsoft Teams, or a full project-management platform.

## Product vocabulary

- **Organization:** The private team boundary that owns SideWire data.
- **Member:** An authenticated user belonging to an organization.
- **Page context:** SideWire's organization-private identity for a web page or stable application record.
- **Conversation:** The message history attached to a page context.
- **Inbox:** A cross-tool view of relevant activity, unread conversations, and mentions.
- **Task:** A lightweight action item tied to a page context. Tasks are planned after the core conversation workflow.
- **Source page:** The external website or web-application page represented by a page context.

Use these terms consistently. Do not call a page context a project, channel, ticket, deal, job, or customer because the underlying website may represent any of those things.

## Approved MVP direction

The MVP direction includes:

- a Chrome Manifest V3 extension using the native side-panel experience;
- a companion web application for sign-in, onboarding, account settings, and cross-tool views that do not fit the panel;
- one private organization boundary;
- conservative page-context identification based on the current page URL and limited display metadata;
- page-scoped team messages;
- clear links back to the source page;
- near-real-time updates or a deliberately documented MVP fallback;
- basic unread state and a simple cross-tool inbox after page-scoped discussion works;
- responsive, accessible behavior at narrow side-panel widths.

This is product direction, not approval of unreviewed technical implementation details.

## Product boundaries

SideWire augments existing services; it does not replace their business data or become a universal CRM. The MVP is not a Slack replacement, project-management suite, document store, workflow automation platform, screen-recording product, customer portal, or browser surveillance system.

The extension must not silently read or copy page bodies, form values, private messages, customer data, images, or application state. It must not change the host page. Any future content extraction, screenshots, annotations, or provider integrations require explicit feature approval, a clear user benefit, and a permissions/privacy review.

The MVP does not promise native synchronization with every external tool. Its universal baseline is page context plus a return link. Tool-specific connectors may come later where they materially improve page identity or workflow.

## Open product decisions

The following remain intentionally open:

- final product name and domain;
- exact pricing, trial, seat, cancellation, and complimentary-access rules;
- invitation and organization-role behavior;
- URL normalization rules for specific applications and user-controlled context merging;
- message editing/deletion and retention policy;
- attachments, screenshots, reactions, threads, and rich formatting;
- notification channels and preferences;
- task behavior beyond the later lightweight-task direction;
- supported Chrome versions and extension-store distribution timing;
- whether a user may belong to multiple organizations;
- analytics, referrals, partner commissions, and native integrations.

Do not convert an idea in this list into an approved requirement without updating the owning feature document.

Detailed core collaboration behavior is defined in `docs/features/core-collaboration.md`.

