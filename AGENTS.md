# SideWire contributor guide

Read `README.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, the relevant `docs/features/<feature>.md`, and the active execution plan before making changes. Read `docs/DOCUMENTATION.md` before adding documentation, class or module comments, implementation maps, or code-to-specification references. For browser-extension or web-interface work, also read `docs/UI.md`. Do not read or update unrelated documents.

## Product identity

SideWire is a standalone product. The GitHub repository is named `PageRelay`, which is a legacy codename. Use SideWire in user-facing copy unless the product is explicitly renamed.

Do not reference, import assumptions from, integrate with, or couple SideWire to any of the owner's other products. SideWire must remain useful to teams regardless of which CRM, project-management tool, design tool, or website they use.

## Sources of truth

`README.md` owns local setup and repository entry points. `docs/PRODUCT.md` owns the product purpose, audience, boundaries, vocabulary, and approved MVP. `docs/ARCHITECTURE.md` owns the technology choices and application-wide engineering, privacy, and security rules. `docs/UI.md` owns shared user-interface and extension interaction rules. `docs/DOCUMENTATION.md` owns code-documentation, implementation-map, and code-to-specification reference rules. Each file under `docs/features/` owns the complete approved behavior of one feature. `PLANS.md` owns the roadmap and execution-plan standard. Each file under `docs/plans/` owns one initiative's implementation sequence, decisions, progress, and verification.

Update the one document that owns changed behavior. Do not duplicate a feature specification across product, architecture, UI, and plan documents. When work spans features, read only the directly affected feature files and name which document owns each resulting behavior. The user's latest explicit direction overrides repository guidance.

## Communication vocabulary and scope

Use the interface terms Chat, Activity, and Apps from `docs/PRODUCT.md`. Existing `Conversation` symbols and the `page-conversations.md` and `inbox-and-unread.md` filenames are internal names for those same concepts, not competing entities. Do not undertake a rename-only schema or code migration. Thread is reserved for message-level replies, which remain deferred.

Read `docs/features/page-contexts.md` for URL identity and Apps grouping, `docs/features/page-conversations.md` for shared chats and linking, and `docs/features/inbox-and-unread.md` for Activity and chat-level read state. Linking distinct contexts is not identity normalization or history merging. Say a context has no chat or an empty chat, not that the external page is unused.

Retain authoritative `organization_memberships` and the existing default Workspace foundation. Apps are not per-domain workspaces, Teams are not Channels, and flexible tables do not approve switching, custom channels, automatic matching, or alternative product modes. The current communication implementation proposal is `docs/plans/001-page-chats-and-linking.md`; documentation approval alone is not implementation approval.

## How to work

For a substantial feature, security-sensitive change, data migration, extension-permission change, or significant refactor, create or update one living ExecPlan under `docs/plans/` using `PLANS.md`. Obtain explicit implementation approval before changing application code. Update the same plan throughout implementation and record real verification results.

Keep changes scoped to the approved milestone. Do not add speculative integrations, AI features, billing rules, referral systems, browser permissions, data collection, or enterprise controls.

SideWire's defining constraint is that it augments existing websites without interfering with them. Never alter the host page, inject content scripts, read page contents, capture screenshots, or request broader Chrome permissions unless an approved feature requires it. A URL, page title, and favicon are still potentially sensitive workplace data and must be handled as private organization data.

Every organization-owned record must be isolated and authorized on the server. Never trust a client-supplied organization identifier, role, page-context identifier, URL, or extension state. Normalize page identities consistently on the server and make retries safe to repeat.

For UI work, reuse shared components and layouts before introducing a new pattern. The extension side panel is narrow and persistent; test it at realistic panel widths as well as in the full web application. Do not make the extension a cramped copy of a desktop dashboard.

Do not claim that a command, provider, browser behavior, migration, or test was verified unless it was actually run. If the repository has not yet established a command, update the active plan when the command is chosen rather than inventing a result.

## Documentation rules

Do not add a header docblock to every class. Document a class or module only when it owns a non-obvious responsibility, invariant, security or privacy boundary, external contract, normalization rule, state transition, or idempotency guarantee. Comments explain why or what must remain true; they do not narrate obvious code.

Use native types first. Add PHPDoc, TypeScript types, or runtime schemas when they provide meaningful type information or enforceable contracts that the language cannot otherwise express.

When feature implementation begins, add a concise `Implementation map` to the owning feature document. List stable entry points, directories, routes, domain services, models/tables, policies, important async or provider boundaries, and tests. Do not attempt to list every related file. Use `rg` and predictable names to discover the rest.

An active ExecPlan must identify current relevant files in `Context and Orientation` and expected changed paths in `Plan of Work`. Update both the plan and the feature implementation map when paths change. Reference the owning feature document selectively from primary domain boundary classes with `@see`; do not repeat the same reference throughout the codebase.

Before completing implementation, follow the documentation completion check in `docs/DOCUMENTATION.md`.
