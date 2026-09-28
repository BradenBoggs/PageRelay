# Extension agent guidance

Root [AGENTS](../../AGENTS.md) applies. Read [the extension specification](../../docs/features/browser-extension.md), [page identity](../../docs/features/page-contexts.md), [linking/provenance](../../docs/features/page-conversations.md), [UI](../../docs/UI.md), and the relevant [active plan](../../docs/plans/README.md).

The native side panel is its own narrow surface, not a compressed desktop dashboard. This Page and directly opened Chats are different navigation/source states. A tab change, context change, and chat change are not interchangeable.

Preserve the least-privilege manifest and secure session handoff. Read only approved active-tab metadata while the user-invoked panel is open. Do not add content scripts, DOM/form access, screenshots, background-tab enumeration, passive history logging, network interception, or broader host access without explicit scope approval.

Resolution is read-only. Persist a page context only through explicit authorized collaboration actions. Unknown/unsafe/restricted pages and expired sessions need safe states, not invented identities or token leakage.

Keep drafts bound to their intended chat/thread/source. Direct panel Chats must not implicitly link the current page or attribute messages to it. The live-delivery target is proposed; do not claim it already exists or restore polling as an undocumented shortcut.

Verify the built manifest and actual Chrome side-panel behavior, including unrelated windows, same-chat/different-page transitions, resize, reconnect, and access removal. Follow [WORKFLOW](../../docs/engineering/WORKFLOW.md); web-only browser tests do not replace native panel verification.
