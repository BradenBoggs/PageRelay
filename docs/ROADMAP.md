# SideWire scope and delivery direction

Status: approved baseline plus a separate feature-review proposal. This is a scope map, not an execution plan, schedule, estimate, or implementation authorization.

The approved product baseline remains in [PRODUCT](PRODUCT.md). The proposed broader communication product is indexed in [the feature review](features/README.md). Active implementation and verification status is recorded in [the plan register](plans/README.md), not inferred from this roadmap.

## Existing work to finish verifying

The foundation, page-context/chat workflow, durable standalone Chats, and web application shell have existing plans 000-003. Their records still contain verification gaps. Close those gaps against the appropriate revision before presenting those flows as verified or using earlier results as proof of later changes.

## Proposed communication target

The web application must be useful independently; the extension brings the same conversations beside linked work pages. The review proposes everyday channels and DMs, complete messaging/history, threads, files, attention controls, search, and reliable clients. Core/Expansion/Strategic labels describe review scope, not a mandate to build every item or create one huge plan.

Select one coherent, approved user outcome at a time. Settle its audience, lifecycle, failure behavior, acceptance criteria, and dependencies in the feature owner first. Then create or amend one appropriately scoped execution plan. Do not create speculative plans for the whole feature catalog while the owner is still reviewing it.

Calls, canvases, richer tasks, external collaboration, automation, AI, and enterprise controls remain separately reviewed expansions. Production billing, exact commercial terms, retention, store distribution, and public availability claims require their own decisions and evidence. This process update does not choose them.

## Scope discipline

A discovered unrelated bug, enhancement, refactor, or tool limitation goes into [the debt tracker](plans/tech-debt-tracker.md) with evidence and a proposed next action. It joins the current change only if it is necessary for the approved outcome and the plan's scope is explicitly updated. A dependency is not permission for a neighboring-feature rewrite.
