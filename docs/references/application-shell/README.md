# September 26 application-shell reference

## Source and authority

User-provided source: `Pasted text(20260926-204305).txt` (495-line HTML) and `image(20260926-204248).png`, supplied on September 26, 2026. The original uploads remain conversation attachments; they are not runtime assets.

`reference-layout.html` is a dependency-free structural adaptation using the real shell stylesheet. Open it from this checkout to inspect region proportions. It is a visual fixture, not a functioning authenticated app. Application code lives under `resources/js/`.

The source is an application-shell reference, not the earlier marketing-site draft. Fictional Apex Operations/dispatch examples do not make SideWire a moving or dispatch product. Current product rules override incidental mockup labels and actions.

## Reference-to-implementation map

| Original region and source lines | Preserve                                                     | Adapt                                                                                            |
| -------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Global header, 38–78             | Compact charcoal header, identity, search, account           | Real read-only organization and SideWire search; no switching, fake presence, or inactive bells. |
| Navigation, 79–195               | Pale full-height column, grouped compact rows                | Activity, Chats, Overview, Apps; no per-domain Workspaces or dispatch queues.                    |
| Discovery, 196–295               | Dense rows, preview, selected warm border, segmented filters | Authorized data, All/Unread, creation, real totals/pagination; no simulated sync footer.         |
| Chat header, 296–340             | Compact chat identity                                        | Durable Chat title; omit unsupported actions rather than fake them.                              |
| Connected strip, 341–362         | Persistent external-page entry points                        | Label Linked pages and show actual hosts; do not imply native integration.                       |
| History, 363–449                 | Left-aligned author/time/content/source hierarchy            | Escaped server messages; no fabricated documents or permissions.                                 |
| Composer, 450–492                | Pinned writing area, destination, Send                       | Plain multiline text, keyboard send, real validation/idempotency and session draft recovery.     |

The source uses a 48px header, 240px navigation, 320px list, charcoal `#1c1e21`, pale `#f9f9fb`, `#e2e4e8` borders, and `#c85a32` accent. The implementation names semantic tokens and uses a darker `#b64d29` action fill for stronger white-text contrast. It does not copy Google font imports, Material Symbols, externally hosted avatars, global `select-none`, or the Tailwind runtime script.

Owning specification: `docs/features/application-shell.md`. Shared rules: `docs/UI.md`. Implementation record: `docs/plans/003-application-shell.md`.
