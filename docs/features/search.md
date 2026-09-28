# Search, message retrieval, and quick navigation

Status: **Draft for owner review. Core target.** The baseline Activity/Chats feature already documents private database-backed matching of chat titles, linked page titles/hosts, and message text. The prior statement that all search was unimplemented was too broad: full message-result search, advanced filters, and other content types remain proposed. See [review scope](README.md).

This document owns authorized search, results, filtering, snippets, and jump-to-result behavior. Destination pickers use their feature's eligibility rules and do not bypass this authorization contract.

## Search scope

Search all retained authorized SideWire messages, replies, channel names/topics, people, file names, and persisted safe page-context labels/hosts. Include task/list and canvas content only when their features are implemented. Search must work without an extension or current page.

Do not imply searching the external application's page body, customer record, files, email, or native messages. A stored source URL and selected title are not a connection to that provider's data. File-text extraction and external enterprise search are separately approved expansions.

## Queries and filters

Provide plain text, quoted phrases, and visible filters for conversation, sender, date range, content type, files, and replies. A small discoverable modifier set may mirror these controls, for example `in:`, `from:`, `before:`, `after:`, and `has:file`; define semantics consistently rather than implementing an unexplained partial query language. Invalid dates/modifiers yield helpful errors or explicit literal-text treatment, not silently broadened results.

Offer deterministic relevance and newest/oldest sorting with stable pagination. Show current scope and removable filter chips. Search within a chat is a shortcut into the same authorized system. Keyboard quick navigation can find channels/people by name without making it a separate global data source.

Differentiate **Linked app** (current chat associations) from **Message source** (recorded historical origin). A chat can match a currently linked app even when a particular message was sent directly in SideWire. Never relabel the result's source to fit the selected filter.

## Results and history

A message result identifies its chat, author/time, safe excerpt, thread relationship, and actual source when present. Opening it fetches the exact message and surrounding context, including older retained history, without depending on the latest-100-message batch. Preserve query/filter/back position when returning.

Message and chat results deduplicate by their identities even when many linked pages match. Context results may remain distinct and open the same chat. Counts and pagination cannot inflate through association joins. A chat with no remaining pages stays searchable under its own audience.

Files and snippets reveal metadata only through current access. Archived history may be searched with a visible archive filter/status. Deleted/purged text must not remain in snippets, autocomplete, caches, or an index. A stale result becomes unavailable safely rather than showing a cached private body.

## Authorization and privacy

Apply current audience before returning results, counts, ranking signals, suggestions, highlights, file previews, or AI inputs. Organization membership does not authorize private channels or DMs. For access changes, indexing delay cannot be an excuse to disclose revoked content: result delivery must enforce current permissions.

Follow context/link-picker eligibility separately from discovery access. A member who can search a channel cannot necessarily link pages to it. Search visibility does not join the user, subscribe them, grant download access, or reveal another person's drafts/saved items. Personal search history, when offered, is private and clearable.

Prefer the existing private database approach until scale demonstrates a need for another system. No external search/AI provider is approved by this specification. Queries, rejected URLs, and content are potentially sensitive and should not be copied into routine logs or cross-tenant analytics.

## Expansion boundary

Saved searches, fuzzy matching, typo tolerance, language-specific stemming, file-body extraction, and approved-provider enterprise search can be added independently. External sources require their own consent, permission synchronization, freshness/deletion handling, and data-retention review. A page link is never sufficient authorization to index an external system. AI answers are owned by [AI assistance](ai-assistance.md) and cannot substitute for inspectable original results.

## Acceptance behavior

A user finds an old known message/reply, opens exact context, and returns to their filters. Results remain correct after page unlinking, member rename, message edit/delete, channel archive, and private-membership removal. Shared-page matches do not duplicate messages/counts. No other tenant, private audience, personal draft, or uncollected external content appears in any derivative result surface.

## Implementation map — existing discovery search only

- `app/Domain/Activity/ConversationDiscovery.php` and `app/Http/Controllers/ChatController.php`.
- `resources/js/pages/chats/` and `resources/js/pages/activity/index.tsx`.
- `tests/Feature/Activity/` and `tests/Feature/Conversations/ChatIndexTest.php`.

These are documented baseline entry points, not evidence that full search is built. Reference coverage: [Slack search and modifiers](https://slack.com/help/articles/202528808-Search-in-Slack).
