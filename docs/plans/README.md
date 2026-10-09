# Execution-plan lifecycle and register

This file owns plan creation, approval, status, completion, and discovery. [ROADMAP](../ROADMAP.md) owns product sequencing; [DOCUMENTATION](../DOCUMENTATION.md) owns documentation rules. The root [PLANS.md](../../PLANS.md) is only an entry point.

## Locations and identity

Use `active/<number>-<initiative>.md` for proposed, approved, in-progress, blocked, or verification-pending work. Use one monotonically assigned initiative number across active and completed plans; never reuse a number or create a separate plan for every milestone or review revision.

Move that same file to `completed/` only after the completion gate below. Preserve its decisions and evidence. Update the register, feature references, scoped guidance, and any forwarding note in the same change. Existing artifacts remain under `artifacts/` so moving the plan need not move evidence.

The four legacy root-level numbered files are short forwarding notes for existing references, not canonical plans. New plans must not use that old layout. Read and edit the linked canonical plan. Historical plan prose can name earlier paths and superseded behavior; it is not current implementation authority.

## Current register

The September 27 migration classified the four legacy plans against revision `2cbc88eb2ff5d974367de4794d1c68cfbed858c6`, preserving their bodies byte-for-byte. Those classifications remain evidence-based rather than a new application audit.

- [000 — Trusted foundation](active/000-execplan.md): verification pending; recorded first hosted CI evidence remains to be reconciled with the plan.
- [001 — Page chats and linking](active/001-page-chats-and-linking.md): verification pending; milestone 5 runtime and manual Chrome acceptance remain open.
- [002 — Durable work Chats](active/002-durable-work-chats.md): verification pending; manual Chrome and PostgreSQL race acceptance remain open.
- [003 — Application shell](active/003-application-shell.md): verification pending; authenticated-browser, accessibility and failure acceptance remain open.
- [005 — GPS communication pilot](active/005-gps-communication-pilot.md): in progress following Braden's October 8 implementation request. Candidate one-to-one DMs, mentions, threads and desktop alerts are in draft PR 3. See its actual verification record before use.

- [006 — Conversation-read migration recovery](completed/006-conversation-read-migration-recovery.md): scoped recovery verified October 9 on SQLite/MySQL; not deployed.

Initiative 004 belongs to the separate unmerged URL-selector branch; it is not imported or renumbered by this pilot. No earlier plan is marked complete by the new work. See [completed plans](completed/README.md). A later general test run does not silently close every earlier plan.

## When a plan is required

Use a living ExecPlan for a substantial feature, multi-session change, data migration, security/permission change, integration, or significant refactor. For a small isolated correction or documentation-only change, a bounded request/PR summary and actual checks are sufficient.

Use the [template](../templates/exec-plan.md). Before application implementation, obtain explicit scope approval. A feature-specification draft, roadmap entry, tool access, or request to edit docs is not implementation approval. A direct user request to implement a clearly bounded change may supply approval; record what it authorized rather than inventing a separate approval.

## Status header for new or substantively updated plans

Record `Lifecycle`, `Approval`, `Verification`, and `Release` near the top. Lifecycle values are `proposed`, `approved`, `in-progress`, `blocked`, `verification-pending`, and `completed`. Approval identifies the scoped authorization and date/reference, or says not granted. Verification names actual evidence and pending checks. Release says not released, out of scope, unknown, or links a verified environment/version.

The four byte-preserved legacy active plans may initially retain their older headings/status text; the register supplies their migration classification. On their next substantive update, add the new header. They cannot move to completed under the legacy exception.

## Plan contents

Keep these headings in order, with concise content proportional to risk:

1. Purpose / Big Picture
2. Progress
3. Surprises & Discoveries
4. Decision Log
5. Outcomes & Retrospective
6. Context and Orientation
7. Plan of Work
8. Concrete Steps
9. Validation and Acceptance
10. Idempotence and Recovery
11. Artifacts and Notes
12. Interfaces and Dependencies

Use progress checkboxes only in Progress. Record actual dates and results. Orient a new contributor to current entry points, neighboring owners, tests, non-goals, and relevant baseline revision. Name expected changed paths, milestones, exact supported commands, observable acceptance, and safe recovery. Link to the feature rather than copying its full specification. Mark unknowns explicitly; do not fill sections with invented certainty or boilerplate.

## Completion gate

Before moving to completed, the approved outcome must work, required checks must have actual passing evidence at a named revision, blocking defects must be resolved, and feature status/implementation maps must be current. Record outcomes, remaining nonblocking limitations, and release disposition. Add `Closed: YYYY-MM-DD` and a concise `Closure:` statement pointing to evidence in the plan.

Unchecked acceptance work, required browser checks, missing provider verification, or an unavailable supported runtime keeps the plan active. Do not erase pending tasks or redefine required checks as optional merely to close it. An explicitly approved scope change must be logged with its reason and linked follow-up before it can alter the gate. A skipped test is not a pass.

A plan may be completed but unreleased only when release was outside its approved scope; say so explicitly. Cancelled or superseded work retains its actual disposition and rationale, not a completed label. Introduce an archive location only when such a case exists.

## Resuming and maintenance

Read Progress, Outcomes, current approval, and pending validation before continuing. Recheck the branch and changed code; earlier test output is evidence for its earlier revision. Use [WORKFLOW](../engineering/WORKFLOW.md) to run targeted checks, review the diff, and report limitations.

Park unrelated findings in [the debt tracker](tech-debt-tracker.md). Keep the register and linked plan consistent. Structural checks detect misplaced plans and missing links; they cannot decide whether evidence is truthful or sufficient.
