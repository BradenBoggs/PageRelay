# Harness-engineering reference and SideWire adaptation

Source: [OpenAI, Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/), published February 11, 2026; consulted September 27, 2026.

The article describes a short agent entry point, repository-local knowledge, discoverable active/completed plans, technical-debt tracking, and feedback through executable checks. It also discusses making runtime behavior observable and maintaining documentation as the system evolves. These are process inputs, not proof that SideWire has the same tooling or results.

## Local decisions

Use SideWire's existing `docs/features/`, domain services, default Workspace, and Laravel/React structure rather than renaming them to match a sample tree. Keep the root agent guide short and route through [INDEX](../INDEX.md). Keep a root PLANS forwarding entry, with the actual standard/register under `docs/plans/`.

Move existing execution records to active without rewriting their evidence; do not call them complete while checks remain open. Keep historical links usable through tiny forwarding notes. Add a debt parking place, concise templates, scoped agent guides, a verification evidence map, and dependency-free documentation checks.

Separate authoring an intended feature, approval to implement it, writing code, verification, and release. Retain human control of product decisions, production changes, and merges. Do not adopt an autonomous merge policy, a new observability platform, or the article's sample architecture as an incidental documentation change.

## Capability boundary

The repository changes establish documentation navigation and structural validation. They do not create unattended workers, scheduled doc gardening, isolated per-worktree databases, browser-control infrastructure, or additional AI services. Add such capabilities only for a concrete approved need and verify them directly.
