# Engineering workflow and feedback loop

This document owns the working loop, scope control, verification, review, and maintenance. It does not authorize a feature, select a new architecture, or configure unattended agents. Start with [INDEX](../INDEX.md), then the owning feature and relevant [active plan](../plans/README.md).

## Understand, bound, change, verify

Identify the user outcome, current branch/revision, nearest AGENTS guidance, approved behavior, actual code/tests, and a way to observe success. Inspect existing abstractions and UI components before creating new ones. Keep the architecture's trust boundaries; do not import a generic layered framework merely because an article uses one.

For a substantial change, use one approved living plan. For a small correction, state the bounded outcome and checks in the change summary. Work through one coherent slice at a time. Reproduce a bug before changing it when possible; otherwise say which evidence supports it and what remains unconfirmed.

Make the smallest correct change, add or update relevant tests, inspect the diff, and verify the user's visible outcome. A successful compiler does not establish usable UI or correct permissions. Treat a failure as evidence to inspect the code, environment, test, or missing tool capability rather than repeatedly asking the agent to try harder.

## Scope and review

Do not combine an unrelated UI fix, feature addition, billing change, and architecture refactor in one task. Put a concrete unrelated finding in [the debt tracker](../plans/tech-debt-tracker.md) and continue the approved outcome. Expand the plan only for a necessary dependency or relevant safety problem, with the change explicit.

Self-review for authorization, source/destination identity, idempotence, access removal, privacy, failure recovery, and unintentional data collection. Use a separate review pass for high-risk work when available, providing the actual diff, intended invariants, and test evidence. Do not claim another agent reviewed the work unless it did. Human approval remains required for new product scope and the repository's sensitive operations.

Do not auto-merge, deploy, or edit production records because a check passes. Do not weaken assertions, suppress errors, broaden permissions, or rewrite test expectations merely to make a failing result green; verify the intended contract first.

## Supported checks

The application runtime/setup is owned by [README](../../README.md). Use its Sail commands or the equivalent supported CI runtime. Select focused tests for the affected domain before the full established checks. Commands below are required actions where relevant, not claims that they ran in the current task.

```bash
./vendor/bin/sail composer validate --strict
./vendor/bin/sail composer test
./vendor/bin/sail npm run foundation:check
./vendor/bin/sail npm run check
./vendor/bin/sail npm run types:check
./vendor/bin/sail npm run build
```

Documentation guardrails use only Node's standard library and do not require Composer, npm installation, databases, or credentials:

```bash
node --test scripts/check-docs.test.mjs
node scripts/check-docs.mjs
git diff --check
```

The documentation workflow runs the same structural checks in GitHub Actions. It checks local Markdown file links, index coverage, short root agent guidance, canonical plan placement, legacy forwarding notes, and plan status/closure shape. It does not check external URLs, Markdown heading anchors, every backticked source symbol, prose accuracy, or product correctness.

## Browser and concurrency evidence

For UI work, exercise the real authenticated application at desktop and narrow/mobile widths, keyboard/focus, loading/empty/error states, long content, and the relevant action. For extension work, use a real supported Chrome side panel to verify tab/window transitions, restricted pages, draft source binding, and the actual manifest. A web screenshot does not verify native side-panel behavior.

For race-sensitive work, test the approved database and concurrency behavior; an SQLite suite cannot certify a skipped PostgreSQL race test. For integration/billing changes, verify the relevant approved sandbox/provider callbacks without production credentials or real charges. Report unavailable environments as pending, with the specific missing check.

Use isolated disposable data. Never reset shared databases, run destructive production migrations, or expose customer data for convenience. A worktree is code isolation, not database/queue isolation; independent ports, storage, databases, and credentials must be confirmed before claiming per-worktree runtime isolation.

## Evidence and closure

Record revision/date, environment, exact commands/procedures, outcomes, skips, and sanitized artifacts in the active plan or bounded change summary. Persist durable useful evidence locally or through a known retained artifact; CI links may expire. Do not create fake screenshots, generated schemas, traces, or grades.

Update the feature's current implementation map and status, the plan register, and [QUALITY](../QUALITY.md) where evidence changes. Close under [the completion gate](../plans/README.md), not merely when code is pushed. State release separately. If a provider/browser check is pending, do not promise a completed feature.

## Documentation maintenance

As part of each relevant change, inspect touched specs for drift, broken references, duplicated rules, and stale implementation maps. Record a bounded correction or debt item. Repeated failures can justify a small test/lint rule with actionable errors; add a guardrail for a real invariant, not a sprawling enforcement framework.

No recurring doc-gardening task, new agent service, observability stack, autonomous reviewer, or automatic merge has been enabled by these documents. Those capabilities require their own setup and authorization. Existing application and branch-specific verification workflows remain separate from the new documentation checks.
