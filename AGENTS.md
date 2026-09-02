# SideWire contributor guide

Read `README.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, the relevant `docs/features/<feature>.md`, and the active execution plan before making changes. For browser-extension or web-interface work, also read `docs/UI.md`. Do not read or update unrelated documents.

## Product identity

SideWire is a standalone product. The GitHub repository is named `PageRelay`, which is a legacy codename. Use SideWire in user-facing copy unless the product is explicitly renamed.

Do not reference, import assumptions from, integrate with, or couple SideWire to any of the owner's other products. SideWire must remain useful to teams regardless of which CRM, project-management tool, design tool, or website they use.

## Sources of truth

`README.md` owns local setup and repository entry points. `docs/PRODUCT.md` owns the product purpose, audience, boundaries, vocabulary, and approved MVP. `docs/ARCHITECTURE.md` owns the technology choices and application-wide engineering, privacy, and security rules. `docs/UI.md` owns shared user-interface and extension interaction rules. Each file under `docs/features/` owns the complete approved behavior of one feature. `PLANS.md` owns the roadmap and execution-plan standard. Each file under `docs/plans/` owns one initiative's implementation sequence, decisions, progress, and verification.

Update the one document that owns changed behavior. Do not duplicate a feature specification across product, architecture, UI, and plan documents. The user's latest explicit direction overrides repository guidance.

## How to work

For a substantial feature, security-sensitive change, data migration, extension-permission change, or significant refactor, create or update one living ExecPlan under `docs/plans/` using `PLANS.md`. Obtain explicit implementation approval before changing application code. Update the same plan throughout implementation and record real verification results.

Keep changes scoped to the approved milestone. Do not add speculative integrations, AI features, billing rules, referral systems, browser permissions, data collection, or enterprise controls.

SideWire's defining constraint is that it augments existing websites without interfering with them. Never alter the host page, inject content scripts, read page contents, capture screenshots, or request broader Chrome permissions unless an approved feature requires it. A URL, page title, and favicon are still potentially sensitive workplace data and must be handled as private organization data.

Every organization-owned record must be isolated and authorized on the server. Never trust a client-supplied organization identifier, role, page-context identifier, URL, or extension state. Normalize page identities consistently on the server and make retries safe to repeat.

For UI work, reuse shared components and layouts before introducing a new pattern. The extension side panel is narrow and persistent; test it at realistic panel widths as well as in the full web application. Do not make the extension a cramped copy of a desktop dashboard.

Do not claim that a command, provider, browser behavior, migration, or test was verified unless it was actually run. If the repository has not yet established a command, update the active plan when the command is chosen rather than inventing a result.

