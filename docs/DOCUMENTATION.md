# SideWire documentation standard

This document owns code-documentation, implementation-map, and code-to-specification reference rules. Product behavior belongs in `docs/PRODUCT.md` and `docs/features/`. Implementation history belongs in `docs/plans/`.

## Purpose

Documentation should help a contributor or AI agent locate the correct code, understand non-obvious decisions, and preserve important contracts. More documentation is not automatically better. Inaccurate, repetitive, or exhaustive documentation creates context noise and can be more harmful than no documentation.

Document responsibilities, invariants, boundaries, and reasons that are not already obvious from names, types, framework conventions, or tests. Do not narrate straightforward code.

## Class and module documentation

Do not require a header docblock on every class or module.

Add a class-level docblock when a class owns a non-obvious domain responsibility, security boundary, privacy boundary, integration contract, state transition, normalization rule, idempotency guarantee, or other invariant that a future contributor could accidentally violate.

Strong candidates include:

- page-context resolvers and URL normalizers;
- platform adapters and organization-created URL rules;
- authorization policies and tenant-scoping services;
- extension authentication and session-handoff services;
- billing-access decisions;
- realtime event authorization and recovery services;
- search indexing and authorization filters;
- notification deduplication;
- idempotent commands, jobs, webhooks, and provider callbacks.

Straightforward controllers, requests, migrations, models, jobs, events, and UI components do not need prose merely because they are classes. Their names, types, relationships, and tests should explain ordinary behavior.

A useful class docblock is concise and records what must remain true:

```php
/**
 * Resolves an organization-scoped page context from untrusted browser metadata.
 *
 * Invariants:
 * - Organization context comes from authenticated membership.
 * - URL normalization is versioned.
 * - Unknown query parameters are preserved by default.
 * - Repeated client request IDs do not create duplicate contexts.
 *
 * @see docs/features/page-contexts.md
 */
final class ResolvePageContext
{
}
```

Do not write docblocks that only restate a class name, method name, signature, or framework role.

## PHPDoc, types, and enforceable contracts

Use native types first. Add PHPDoc when it materially improves Larastan, IDE inference, generic relationships, array shapes, template types, or another enforceable contract that native syntax cannot express.

Examples include typed Eloquent relationships and structured provider or extension payloads. Keep those declarations synchronized with validation and tests.

TypeScript interfaces and runtime validation schemas should serve the same purpose for web and extension code. Do not add prose comments that merely repeat a well-named type.

## Comments inside code

Comments should explain why a choice exists, which invariant is protected, why an apparently simpler approach is unsafe, or what external behavior constrains the code.

Do not comment every branch or translate implementation line by line. Prefer clearer names, smaller functions, explicit types, and tests over explanatory comments when restructuring makes the code self-evident.

Temporary workarounds must name the reason, safe removal condition, and related issue or plan when one exists. Do not leave ownerless `TODO` comments.

## References from code to feature specifications

Reference an owning feature specification selectively from the primary domain boundary, not from every participating file.

Appropriate references include the primary domain service, aggregate or model when it owns meaningful behavior, authorization policy, platform adapter, and extension feature entry point. Use `@see docs/features/<feature>.md` or the language's normal documentation link format.

Do not copy feature behavior into class comments. The feature document remains authoritative; the code reference is only a navigation aid.

## Feature implementation maps

When implementation of a feature begins, add an `Implementation map` section to its feature document. Do not add an empty map before code exists.

The map should list stable architectural entry points rather than every related file:

- primary backend and frontend directories;
- routes or API endpoints;
- primary domain services;
- models and database tables;
- authorization policies;
- important events, jobs, listeners, or provider boundaries;
- extension entry points when relevant;
- test directories or principal test files;
- directly related feature specifications.

Example:

```markdown
## Implementation map

Primary entry points:

- API route: `POST /api/v1/page-contexts/resolve`
- Extension client: `apps/extension/src/features/page-contexts/`
- Domain service: `app/Domain/PageContexts/ResolvePageContext.php`
- URL normalizer: `app/Domain/PageContexts/NormalizePageUrl.php`
- Model: `app/Models/PageContext.php`
- Authorization: `app/Policies/PageContextPolicy.php`
- Tests: `tests/Feature/PageContexts/`

Important tables:

- `page_contexts`
- `page_context_aliases`

Related specifications:

- `docs/features/browser-extension.md`
- `docs/features/page-conversations.md`
```

Keep the map short enough to scan. Prefer a stable directory or primary entry point over a list of every component, request, migration, test, and helper. Contributors should use `rg` and repository naming conventions to discover the rest.

Update the map when an architectural entry point moves, is renamed, or is removed. A feature implementation is not complete if its map points to stale paths.

## ExecPlan file orientation

Every substantial ExecPlan must use `Context and Orientation` to identify current relevant code, existing behavior, primary entry points, neighboring features, and existing tests. It must be sufficient for someone with no prior conversation to begin work safely.

Use `Plan of Work` to name files and directories expected to be created or changed when they are known. Update those references when implementation differs from the original plan.

The ExecPlan is the detailed and historical record of a particular initiative. After implementation, the feature document retains only the concise current implementation map. Do not copy the complete changed-file list or implementation history into the permanent feature specification.

## Discovery and searchability

Use predictable domain vocabulary and directory structure. Prefer names such as `ResolvePageContext`, `PageContextPolicy`, and `PageContextResolved` over generic names such as `Manager`, `Helper`, or `Processor`.

Agents and contributors should begin from the owning feature document and its implementation map, then use `rg` to find symbols, routes, tables, events, and tests. A documented map is an entry point, not an exhaustive inventory.

## Documentation completion check

Before completing an implementation plan or feature change, verify:

- permanent behavior is updated in the owning feature document;
- the implementation map exists once code exists and points to current entry points;
- the active ExecPlan records actual changed paths, decisions, and verification;
- complex boundary classes document only meaningful responsibilities and invariants;
- PHPDoc or TypeScript contracts improve real type information;
- comments do not restate obvious code;
- code-to-specification references are selective and valid;
- renamed or removed paths are not left in documentation;
- no verification result is claimed without being run.

