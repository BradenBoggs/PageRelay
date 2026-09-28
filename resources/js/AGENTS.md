# Web-interface agent guidance

Root [AGENTS](../../AGENTS.md) applies. Read [UI](../../docs/UI.md), [the application shell](../../docs/features/application-shell.md), the owning feature, and the relevant [active plan](../../docs/plans/README.md).

Inspect the existing layout, shell components, UI primitives, types, and semantic tokens first. Reuse, compose, then extend before inventing a new pattern. Customer screens stay React; internal Filament administration is a separate surface.

The web app must be useful without the extension or a source page. Apps is an optional source filter, not a required tenant/domain hierarchy. A mockup or draft specification does not approve controls, data, integrations, or behavior that are not implemented.

Preserve explicit chat/thread/source binding, failure drafts, scroll and navigation intent, and current permission state. Direct web sends do not inherit a browser source. Rendering a list or hidden content is not reading it.

Use real accessible links/buttons, labels, focus handling, non-color status, keyboard/IME-safe composition, and responsive layout. Never invent unread counts, presence, latency, or synchronization claims.

Verify actual affected flows at wide and narrow widths with the supported runtime. Follow [WORKFLOW](../../docs/engineering/WORKFLOW.md); a build or static screenshot alone does not certify interactive behavior or accessibility.
