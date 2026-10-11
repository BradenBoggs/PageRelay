# Technical debt and unrelated findings

Purpose: capture a real finding without turning the current feature into an unrelated rewrite. This is a parking place, not implementation approval or a second list of the feature roadmap.

No new technical defect is asserted by the documentation reorganization. Existing unfinished verification remains in [the active plans](README.md); do not duplicate those checklists here.

## Open findings

For each concrete finding, add a stable `SW-DEBT-NNN` identifier, concise problem, source path/revision or reproduction, user/risk impact, owning feature or domain, proposed next action, and status. Distinguish an observed defect from an unverified suspicion. Do not include secrets, private message bodies, or live customer URLs as evidence.

### SW-DEBT-001 — Historical shell workflow still writes to its branch

Status: open. Observed October 9, 2026 at `e4b721865f09e403fe836520b6851d67885bbbc8`: `.github/workflows/shell-verification.yml` grants contents write, applies source repairs/formatting, commits and pushes to `work/application-shell-20260926`. It also waits for the removed dashboard landing route in its browser check. This conflicts with plan 005's statement that temporary authoring workflows were removed and risks unexpected source writes if the historical branch is pushed again. Owner: engineering verification. Proposed follow-up: deliberately retire the historical workflow or convert it to read-only checks against current routes; inspect hosted run history before asserting whether it has executed recently. Discovered during the [notification audit](active/005-gps-communication-pilot.md); no workflow changed or triggered.

Keep statuses simple: open, selected, resolved, or declined with rationale. Link the implementation plan or PR when selected; link actual resolution evidence when resolved. Product ideas belong in the owning feature's proposed scope unless they describe a real maintenance defect.

## Working rule

Record the finding, return to the current approved outcome, and select follow-up work deliberately. Fold a finding into the current plan only when it blocks that outcome or creates an immediate relevant safety risk, with the scope change made explicit. Do not launch a cleanup agent, edit neighboring features, or allocate new dependencies merely because an item is listed here.
