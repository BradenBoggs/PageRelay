# SideWire agent entry point

SideWire is an independent product; PageRelay is its repository codename. Do not import another product's models, billing decisions, or assumptions.

## Start here

Read [the documentation map](docs/INDEX.md), then only the documents needed for the task. Read the nearest scoped `AGENTS.md` before editing its directory.

| Task                               | Read next                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| Setup, runtime, commands           | [README](README.md)                                                                                 |
| Product scope and feature approval | [Product](docs/PRODUCT.md), [feature index](docs/features/README.md)                                |
| Trust boundaries or backend work   | [Architecture](docs/ARCHITECTURE.md), owning feature, `app/AGENTS.md`                               |
| Web interface                      | [UI](docs/UI.md), [application shell](docs/features/application-shell.md), `resources/js/AGENTS.md` |
| Extension                          | [extension specification](docs/features/browser-extension.md), `apps/extension/AGENTS.md`           |
| Planning or resuming work          | [plan lifecycle and register](docs/plans/README.md)                                                 |
| Documentation                      | [documentation standard](docs/DOCUMENTATION.md), `docs/AGENTS.md`                                   |
| Verification or finishing a change | [engineering workflow](docs/engineering/WORKFLOW.md), [quality evidence map](docs/QUALITY.md)       |

## Working agreement

1. Inspect the branch, current code/tests, owning specification, and relevant active plan. Do not treat a prior conversation or historical plan as the current implementation.
2. Identify the approved outcome and non-goals. Feature-review drafts are proposals, not implementation authorization. A request for documentation does not authorize building its features.
3. For substantial behavior, migration, security, permission, or refactor work, maintain one approved living plan in `docs/plans/active/`. Small documentation fixes need a bounded change summary, not ceremonial plans.
4. Work on one coherent outcome. Record unrelated findings in [the debt tracker](docs/plans/tech-debt-tracker.md), then return to the task. Do not opportunistically refactor neighboring features.
5. Reuse existing components, domain boundaries, and locked dependencies. Add an abstraction or dependency only when an actual requirement justifies it.
6. Validate with real checks and inspect the diff. Record the revision, environment, commands, results, and omissions. Never convert skipped or unavailable verification into a pass.
7. Update the owning feature and its concise implementation map when behavior or entry points change. Keep decisions and progress in the same active plan.
8. Move a plan to `completed/` only after its completion gate is satisfied. Code written, CI passing, browser verified, and released are separate states.

## Non-negotiable boundaries

Derive Organization access from active server-owned membership. Validate the full chat/context relationship, not just individual IDs. A page link never grants conversation access. Preserve one durable history, explicit source attribution, safe retries, and the existing default Workspace; Apps is not tenancy.

The extension must not modify or read host-page contents, capture screens, enumerate background tabs, retain passive browsing history, or broaden permissions without an explicitly approved feature. Treat URLs and titles as private data. The complete web experience does not require page context or extension installation.

Use disposable data for destructive tests. Never reset shared databases, publish credentials/customer data, force-push over another contributor, deploy, or merge without the relevant authorization. Do not weaken tests or permissions to obtain a green result.

## When instructions or evidence disagree

The latest explicit user direction controls intended scope. Approved specifications own intended behavior; code/tests and dated evidence establish actual behavior. Proposed features and old plans cannot override that distinction. Surface material conflicts, fix the owning document, and request a decision only where genuinely needed.

Keep this file a map, not a product encyclopedia. Detailed documentation and verification rules belong in their linked owners. There is no requirement to add a header docblock to every class, create an agent roster, or load every feature document.
