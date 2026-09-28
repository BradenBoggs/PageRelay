# SideWire documentation standard

This file owns document responsibilities, status/evidence language, selective code comments, implementation maps, references, and maintenance. [INDEX](INDEX.md) routes readers; [the plan standard](plans/README.md) owns the execution lifecycle.

## One authoritative owner

Keep permanent product behavior in its feature document, cross-cutting system boundaries in Architecture, shared interaction rules in UI, and execution history/evidence in the relevant plan. Link rather than duplicate. README owns setup, not feature requirements. Reference mockups and external articles are inputs, not authority to ship their sample features.

The expanded feature review remains proposed until its particular behavior is accepted. Documentation structure approval does not approve every feature. Label current baseline, proposed target, open decisions, implementation evidence, and release status separately. Never describe a draft, checked box, installed package, or passed build as a released product.

## Repository-local context

Write so a contributor can resume without previous chats. Record approved decisions, relevant constraints, source provenance, stable entry points, and observable acceptance in the repository. Do not rely on an inaccessible screenshot, linked conversation, remembered approval, or hidden personal context as the sole specification. Do not fabricate a missing reference; name the limitation.

Start from [the feature template](templates/feature.md) when a new owner is needed. Keep it concise but complete enough to define permissions, states, lifecycle, and failure behavior. Do not split one feature into overlapping specification/decision/phase files to increase the document count. Use existing architecture sections for cross-cutting decisions; introduce a dedicated decision record only when a substantial approved decision needs durable rationale beyond its plan and owning doc.

## Class and module comments

Do not require a header docblock on every class. Document a non-obvious responsibility, invariant, authorization/privacy boundary, normalization rule, external contract, state transition, or idempotency guarantee. Explain why something must remain true, not what an obvious line of code does.

Useful boundaries include context resolution, URL safety, authorization, session handoff, billing access, retryable provider callbacks, search scoping, notification deduplication, and realtime recovery. Ordinary controllers, getters, migrations, jobs, UI wrappers, and models do not need prose just for existing.

Use native PHP/TypeScript types first. Add PHPDoc, generics, array shapes, or runtime validation only when they improve enforceable contracts or actual tooling. Keep contracts synchronized with implementation and tests. Prefer clearer names and smaller functions over narrating every branch.

Use `@see docs/features/<feature>.md` selectively at the primary domain boundary. Do not copy the specification into class comments or add identical links throughout every participating file. Temporary workarounds identify the reason, safe removal condition, and owner/issue when known.

## Feature implementation maps

Add a concise map once implementation exists. Do not add an empty map for an unimplemented proposal or invent planned paths as though they already exist. Existing baseline maps do not imply proposed target behavior has shipped.

List stable entry directories, primary routes/domain services, models/tables, authorization boundary, important async/provider/extension edges, and representative tests. Use predictable names and repository search to find individual helpers. The active plan owns the detailed expected/actual changed-file inventory and verification history.

Update a map when its entry point moves, a feature is split, or responsibility changes. A functional change is not complete with stale navigation. Documentation should make the next search easier, not replace search with a giant manifest.

## Plans, indexes, and moves

Use [the plan lifecycle](plans/README.md), not a second planning convention. Keep one living initiative through approval, implementation, verification, and closure. Templates are not initiatives. Completed plans are historical evidence, not instructions to repeat a past migration or override current product behavior.

When moving a document, update the canonical index and relative links. For the existing four migrated plans, small legacy forwarding notes preserve earlier references; they contain no duplicate progress or decisions. Prefer the canonical active/completed path in new references. Update its forwarding target if a migrated plan later moves again.

Use real relative Markdown links for navigation. Backticked routes, symbols, historical paths, and example commands are descriptive references rather than claims that every named file exists. Local Markdown links must resolve; external URLs require a source/access date when used for research. Keep raw credentials, live customer URLs, tokens, private messages, and sensitive screenshots out of docs and evidence.

## Evidence and freshness

When claiming verification, record the source revision, date, environment/database/client, exact command or procedure, result, skipped checks, and any evidence location. Attribute older results to their original change. A declared test command is not a test run; a workflow definition is not a passing workflow.

Quality tracking uses observed coverage and explicit unknowns, not invented grades or aggregate confidence numbers. Update [QUALITY](QUALITY.md) when evidence or a meaningful verification gap changes. Do not create generated schema snapshots, audit folders, or browser artifacts until a real reproducible source exists.

During each relevant change, check the touched owner's freshness, feature/plan indexes, approval language, source pointers, and implementation map. Run the structural checks in [WORKFLOW](engineering/WORKFLOW.md). Structural checks cannot certify semantic truth, current external sources, accessibility, security, or release readiness; inspect those directly.

## Completion review

Before finishing a change, confirm that the right owner was updated, proposals were not silently promoted, code/spec boundaries agree, actual results and omissions are recorded, links and maps resolve, and unrelated findings were parked rather than opportunistically implemented. Keep historical records intact and close a plan only under its real completion gate.
