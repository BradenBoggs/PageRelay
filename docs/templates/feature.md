# Feature template: replace with a single responsibility

This is an authoring template, not approved behavior. See [DOCUMENTATION](../DOCUMENTATION.md) and [the feature index](../features/README.md).

Status: proposed for owner review.

## Ownership and purpose

Name the behavior this document owns, the user outcome, neighboring owners, and explicit boundaries. Avoid a second specification for an already-owned feature.

## Documented baseline

Describe inspected current behavior and its revision/evidence, or say implementation has not been established. A code path existing is not proof of release.

## Proposed target

Define the user flow and meaningful rules. Mark proposed defaults and unsettled choices. Do not embed milestones, migration steps, large file inventories, or execution commands here.

## Access, data, and lifecycle

Define audience, roles, ownership, state changes, history/retention boundaries, and interactions with page context when applicable. Do not infer access from a URL or another tool.

## Failure and recovery

Describe empty, loading, offline, conflict, access-lost, validation, and retry behavior as applicable. Preserve user intent and avoid silent data loss or reassignment.

## Acceptance behavior

Describe observable success and the important negative/security cases. These are requirements, not claims that tests ran.

## Open decisions and exclusions

List only decisions that materially affect behavior and explicitly excluded scope. Do not invent prices, limits, provider commitments, or permissions.

Add a concise Implementation map only after real code exists, then keep stable entry points current. Link any later execution plan through the plan register. Add attributed external sources only where they support actual claims.
