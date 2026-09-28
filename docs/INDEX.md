# SideWire documentation map

Owner: repository documentation. Reviewed: September 27, 2026. This map governs where knowledge lives; it does not approve the expanded feature-review proposals or certify release readiness.

## Read the smallest relevant set

Start at [AGENTS.md](../AGENTS.md), use this map to find the owner, then inspect its current implementation and tests. Do not load the whole documentation tree for an unrelated change. Repository-local specifications and evidence must be sufficient to resume work without past chats or private attachments.

| Need                                                                | Authoritative entry point                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Local setup and supported commands                                  | [README](../README.md)                                                                |
| Purpose, vocabulary, approved baseline                              | [PRODUCT](PRODUCT.md)                                                                 |
| Stack, system shape, security/privacy and tenant boundaries         | [ARCHITECTURE](ARCHITECTURE.md)                                                       |
| Shared visual and interaction rules                                 | [UI](UI.md)                                                                           |
| Feature behavior, proposed targets, acceptance, implementation maps | [Feature index](features/README.md), then the owning feature                          |
| Product sequence and review scope                                   | [ROADMAP](ROADMAP.md)                                                                 |
| Plan lifecycle, approvals, open work, closure                       | [Plan register and standard](plans/README.md)                                         |
| Known unrelated findings                                            | [Technical-debt tracker](plans/tech-debt-tracker.md)                                  |
| Engineering feedback loop and verification                          | [WORKFLOW](engineering/WORKFLOW.md)                                                   |
| Evidence coverage and remaining verification gaps                   | [QUALITY](QUALITY.md)                                                                 |
| Writing, comments, maps, statuses, maintenance                      | [DOCUMENTATION](DOCUMENTATION.md)                                                     |
| Reusable document shapes                                            | [Feature template](templates/feature.md), [ExecPlan template](templates/exec-plan.md) |
| External process reference and local adaptations                    | [Harness-engineering reference](references/harness-engineering.md)                    |
| Existing visual reference                                           | [Application-shell reference](references/application-shell/README.md)                 |

## Directory responsibilities

`docs/features/` owns product behavior. `docs/plans/active/` owns open execution and verification. `docs/plans/completed/` owns verified historical execution. `docs/plans/artifacts/` retains existing evidence at stable paths. `docs/references/` holds attributed source material, not unapproved product requirements. `docs/templates/` holds examples, not live plans.

The four old numbered files immediately under `docs/plans/` are forwarding notes only. They preserve earlier references while the actual plans live in `active/`. Create no new plans at those legacy paths. No feature requirements or progress may be maintained twice.

Scoped agent guidance exists in [docs](AGENTS.md), [backend](../app/AGENTS.md), [web UI](../resources/js/AGENTS.md), and [extension](../apps/extension/AGENTS.md). These files add local routing and constraints; they do not override the root's authorization or security requirements.

## Status and authority

**Proposed** describes a reviewable target, not permission to implement. **Approved** records a scoped product decision, not a claim that code exists. **Implemented** describes inspected code at a revision; verification may still be pending. **Verified** requires linked actual evidence for named checks. **Released** requires a deployment/version and environment record. A completed implementation plan need not imply production release when release was explicitly outside its scope.

The Slack-style feature review remains draft. The existing Product/UI/Architecture documents describe the earlier approved baseline. Their narrower feature exclusions are not permission to ignore the review, and the review is not permission to implement all expansions. After a specific target is accepted, align its owning feature and the affected overview statements before implementation; retain historical decisions as history.

Latest explicit user instructions govern intended changes. Code/tests establish what currently runs; tests can still be incomplete. Conflicts are recorded and resolved in the owning document, not by choosing whichever source authorizes more work.

## Maintenance

Update this map when adding a new documentation responsibility, not for every file. Keep feature and plan indexes complete, references resolvable, and implementation maps short. [Documentation checks](engineering/WORKFLOW.md) catch structural mistakes; a human or agent still needs to compare prose with code and actual evidence. No recurring cleanup agent or automatic deployment is enabled merely by documenting this workflow.
