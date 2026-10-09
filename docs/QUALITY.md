# Quality and verification evidence map

Reviewed: September 27, 2026, against the plan records at `2cbc88eb2ff5d974367de4794d1c68cfbed858c6`. This is an evidence map, not a fresh code/security audit or a numerical product score. It records what the repository says and what remains unverified.

| Area                                                | Evidence owner                                                                                | Recorded status and limitation                                                                                                                 |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts, membership, service foundation            | [Plan 000](plans/active/000-execplan.md)                                                      | Local checks recorded; the plan still requests a hosted CI result. Not closed.                                                                 |
| URL identity, page chats, explicit creation/linking | [Plan 001](plans/active/001-page-chats-and-linking.md)                                        | Earlier milestones have automated evidence; milestone 5's supported-runtime/manual Chrome evidence remains incomplete in the record.           |
| Durable web/extension Chats                         | [Plan 002](plans/active/002-durable-work-chats.md)                                            | September 26 Sail results recorded; manual Chrome and PostgreSQL race checks not established.                                                  |
| Authenticated web shell                             | [Plan 003](plans/active/003-application-shell.md)                                             | Implementation recorded, but verification checkboxes remain open. A workflow's existence is not evidence of its result.                        |
| Expanded Slack-style feature scope                  | [Feature review](features/README.md)                                                          | Draft behavior; no implementation or verification is established merely by the new specifications.                                             |
| Documentation harness                               | [Workflow](engineering/WORKFLOW.md)                                                           | Structural checker and tests define automated coverage. Actual run results belong to the documentation PR; do not infer that hosted CI passed. |
| Production release, store approval, operations      | [Extension](features/browser-extension.md), [billing](features/billing-and-product-access.md) | Not established by this review. Release/provider/store checks require their own evidence.                                                      |

## GPS pilot and UI follow-up

[Plan 005](plans/active/005-gps-communication-pilot.md) owns the pilot's revision-specific hosted evidence and the October 8 UI candidate. The new presentation-helper and synthetic-preview checks do not extend the prior backend/browser passes to the rewritten React UI. The candidate is published for review on the GPS pilot branch; locked formatting/lint, full type checks, builds and authenticated/native client acceptance remain pending for the redesigned UI. Nothing in this evidence map certifies a GPS rollout.

## Updating evidence

Replace a status only with a linked actual result tied to its revision, environment, date, and scope. Keep omissions visible. Never aggregate earlier checks across different code versions into a claim that today's complete app was tested. A newer CI result may resolve a gap only after its job/steps and applicable revision are inspected.

Security and usability require behavioral checks as well as static tools: tenant isolation, private audiences when implemented, session revocation, unsafe URLs, retry/concurrency behavior, full-history access, browser transitions, keyboard and assistive-technology behavior, and failed/offline states. The owning feature defines acceptance; do not turn this summary into a second checklist for each plan.

## Structural enforcement is bounded

The documentation checker protects navigation and lifecycle shape. It cannot establish true approval, feature completeness, truthful evidence, deployment, or compatibility with every browser. Those are review responsibilities. Where runtime or evidence is missing, use unverified/pending rather than a guessed quality grade.
