# Technical debt and unrelated findings

Purpose: capture a real finding without turning the current feature into an unrelated rewrite. This is a parking place, not implementation approval or a second list of the feature roadmap.

No new technical defect is asserted by the documentation reorganization. Existing unfinished verification remains in [the active plans](README.md); do not duplicate those checklists here.

## Open findings

No new entries yet. For each concrete finding, add a stable `SW-DEBT-NNN` identifier, concise problem, source path/revision or reproduction, user/risk impact, owning feature or domain, proposed next action, and status. Distinguish an observed defect from an unverified suspicion. Do not include secrets, private message bodies, or live customer URLs as evidence.

Keep statuses simple: open, selected, resolved, or declined with rationale. Link the implementation plan or PR when selected; link actual resolution evidence when resolved. Product ideas belong in the owning feature's proposed scope unless they describe a real maintenance defect.

## Working rule

Record the finding, return to the current approved outcome, and select follow-up work deliberately. Fold a finding into the current plan only when it blocks that outcome or creates an immediate relevant safety risk, with the scope change made explicit. Do not launch a cleanup agent, edit neighboring features, or allocate new dependencies merely because an item is listed here.
