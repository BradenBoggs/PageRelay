# SideWire delivery roadmap and execution plans

Use one living execution plan, called an ExecPlan, for a substantial feature, sensitive migration, extension-permission change, security change, or significant refactor. Save it as `docs/plans/<number>-<feature>.md`. The number identifies the initiative. Update that same document as the work progresses instead of creating a new plan for every revision.

Before writing code, inspect the repository and read the relevant feature specification and `docs/DOCUMENTATION.md`. Present the plan for approval. A request to create or revise documentation does not authorize implementation. After implementation is approved, complete and verify one milestone at a time. Stop when a new product decision, sensitive browser permission, unsafe data operation, or out-of-scope action requires user input.

An ExecPlan must be understandable without prior conversation. Include behavior, affected paths, implementation order, exact commands, observable acceptance criteria, security and extension-permission checks, and recovery strategy. Use checkboxes only in `Progress`. Keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` current.

## Required sections

Every new ExecPlan uses these headings in this order:

1. `Purpose / Big Picture`
2. `Progress`
3. `Surprises & Discoveries`
4. `Decision Log`
5. `Outcomes & Retrospective`
6. `Context and Orientation`
7. `Plan of Work`
8. `Concrete Steps`
9. `Validation and Acceptance`
10. `Idempotence and Recovery`
11. `Artifacts and Notes`
12. `Interfaces and Dependencies`

The plan may repeat enough feature behavior to be self-contained. Permanent behavior belongs in the relevant feature document. Implementation details, progress, exact affected paths, and evidence belong in the plan. `Context and Orientation` must identify current relevant files, entry points, neighboring features, and tests. `Plan of Work` must name expected changed paths when known.

When implementation begins, add a concise `Implementation map` to the owning feature document following `docs/DOCUMENTATION.md`. The permanent map lists stable current entry points, not every changed file. The ExecPlan retains the detailed and historical file-level record.

## Roadmap

**Phase 0: Trusted foundation.** Scaffold the application, Chrome Manifest V3 extension, local development workflow, authentication, single-organization tenancy, default workspace and team foundations, continuous integration, and minimum observability. Retain `organization_memberships`; Apps does not replace Workspace. Owning specifications: `accounts-and-organizations.md`, `workspaces-and-teams.md`, and `browser-extension.md`. Plan: `docs/plans/000-execplan.md`.

**Phase 1: Page-aware discussion.** Resolve safe page identities, open page-first chats, exchange durable messages, group contexts by App for browsing, and manually link eligible contexts into an existing page chat. A context must have no chat or an empty chat to move to a different chat. Context identities remain distinct; nonempty-history merges are deferred. Owning specifications: `page-contexts.md` and `page-conversations.md`. Proposed implementation plan: `docs/plans/001-page-chats-and-linking.md`.

**Phase 2: Cross-tool source of truth.** Add Activity, chat-level unread state, chat discovery, one organization-wide chat, one-to-one DMs, mentions, search, and source-page navigation. The minimal Activity/read-state handoff for shared chats is included as a separately approved milestone of plan 001; organization chat, DMs, notification delivery, and broader search use their own approved ExecPlans. Owning specifications: `team-conversations.md`, `direct-messages.md`, `inbox-and-unread.md`, `mentions-and-notifications.md`, and `search.md`. Do not implement all of Phase 2 as one unbounded change.

**Phase 3: Lightweight tasks.** Create, assign, complete, and recover tasks tied to a page context without replacing full project-management systems. Chat linking does not move or merge tasks. Owning specification: `tasks.md`.

**Phase 4: Team onboarding and billing.** Complete invitations and roles, then add production billing, trials, and seat rules only after pricing and access behavior are approved. Owning specifications: `accounts-and-organizations.md` and `billing-and-product-access.md`.

**Phase 5: Pilot readiness and acquisition.** Validate privacy, organization isolation, extension-store requirements, onboarding, browser compatibility, operations, retention, support, and product analytics. Publish truthful horizontal and use-case marketing pages. Owning specification: `marketing-site.md`.

**Phase 6: Proven growth extensions.** Add prioritized native integrations, customer referrals, or software-service partnerships after core activation and retention are demonstrated. Owning specifications: `integrations.md` and `referrals-and-partnerships.md`.

Custom named channels, nonempty-chat merges, history splitting, automatic cross-app matching, multiple primary chats per page, and administrator-selectable page/channel/hybrid modes are not MVP requirements. Channels can be considered after page chats and linking work well; their behavior remains governed by `team-conversations.md`.

Page annotations, screenshots, content extraction, mobile applications, Firefox/Safari support, AI summaries, public sharing, workflow automation, and enterprise controls remain possible future initiatives, not MVP requirements.
