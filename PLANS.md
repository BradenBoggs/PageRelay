# SideWire delivery roadmap and execution plans

Use one living execution plan, called an ExecPlan, for a substantial feature, sensitive migration, extension-permission change, security change, or significant refactor. Save it as `docs/plans/<number>-<feature>.md`. The number identifies the initiative. Update that same document as the work progresses instead of creating a new plan for every revision.

Before writing code, inspect the repository and read the relevant feature specification. Present the plan for approval. A request to create or revise documentation does not authorize implementation. After implementation is approved, complete and verify one milestone at a time. Stop when a new product decision, sensitive browser permission, unsafe data operation, or out-of-scope action requires user input.

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

The plan may repeat enough feature behavior to be self-contained. Permanent behavior belongs in the relevant feature document. Implementation details, progress, and evidence belong in the plan.

## Roadmap

**Phase 0: Trusted foundation.** Scaffold the application, Chrome Manifest V3 extension, local development workflow, authentication, single-organization tenancy, continuous integration, and minimum observability. Plan: `docs/plans/000-execplan.md`.

**Phase 1: Page-aware discussion.** Open SideWire in the Chrome side panel, identify the active page using a conservative normalized URL, and allow organization members to exchange page-scoped messages in near real time.

**Phase 2: Cross-tool source of truth.** Add a global inbox, unread state, mentions, search, and links back to the originating web page so users can follow communication across all of their tools.

**Phase 3: Lightweight tasks.** Create, assign, complete, and discuss tasks tied to a page context without attempting to replace full project-management systems.

**Phase 4: Team onboarding and billing.** Add invitations, roles, production billing, trials, and seat rules only after pricing and access behavior are approved.

**Phase 5: Pilot readiness.** Validate privacy, organization isolation, extension-store requirements, onboarding, browser compatibility, operations, retention, support, and product analytics before paid acquisition.

Native integrations, page annotations, screenshots, content extraction, mobile applications, Firefox/Safari support, AI summaries, public sharing, referrals, and partner commissions are possible future initiatives, not MVP requirements.

