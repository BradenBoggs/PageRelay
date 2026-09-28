# Backend agent guidance

Root [AGENTS](../AGENTS.md) applies. Read [Architecture](../docs/ARCHITECTURE.md), the owning feature from [the index](../docs/features/README.md), and the relevant [active plan](../docs/plans/README.md).

Inspect the existing `app/Domain/`, policies, membership resolver, routes, and representative tests before introducing another service layer. Reuse conventional Laravel and already-approved packages; this structure update does not mandate a new modular framework or rename-only migration.

Derive Organization access from active membership and authorize the full relationship at requests, jobs, broadcasts, notifications, search, and provider callbacks. Client IDs, page URLs, or external-app access are not proof of authorization. Preserve default Workspace and authoritative memberships.

Keep persistence and retries safe. Do not split or merge chat history through a page association change. Source attribution records explicit validated context, not imported external messages. Preserve data on membership removal and use only approved lifecycle policies.

Current work Chats and future private channels have different scope maturity: read the feature status and inspect actual policies. Do not implement draft channel, notification, billing, or retention rules simply because they are documented.

Document only meaningful invariants at primary boundaries; no blanket class header requirement. Follow [the workflow](../docs/engineering/WORKFLOW.md) for focused tests, supported-runtime checks, concurrency evidence, and safe migration recovery.
