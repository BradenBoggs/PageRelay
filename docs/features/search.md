# Search

Status: proposed Phase 2 feature; not implemented. Implementation requires a separately approved ExecPlan.

This document owns authorized search across SideWire contexts and collaboration content. The small authorized destination picker required for page linking does not authorize a full search platform.

## Purpose

Let a teammate recover communication and work spread across external tools without remembering which application or page contained it.

## Searchable content

Roll out incrementally: safe page-context labels, source host, and stored safe source URL; page, organization, and DM text; later task titles/descriptions; and people or additional metadata only when required.

Results show destination type, recognizable title, safe excerpt, relevant author or assignee, source information, timestamp, and navigation. Context results offer the authorized SideWire destination and a validated source link.

## Shared-chat result identity

Different page contexts remain separately identifiable search results when the user is searching contexts. They can intentionally lead to the same chat.

Chat and message results must deduplicate by their own stable identifiers, not by context associations. Joining two linked pages or matching several Apps must not repeat the same message or inflate counts. A result can display several authorized linked pages without becoming several copies of the result.

Show the message's actual recorded source when available. Do not attribute it to whichever linked page matched the query. A history-bearing chat remains searchable after its last context is unlinked, subject to its existing authorization and visibility rules.

App filters for chat discovery follow `inbox-and-unread.md`; they do not change the message's historical provenance or imply external content was indexed.

## Authorization

Apply current authorization before returning matches, counts, suggestions, excerpts, highlights, or timing signals. Organization membership alone does not authorize DMs; current participation is required. Removed and archived content follows its owning feature's rules.

Linking candidates are authorized page chats only and must apply the actor and target restrictions from `page-conversations.md`. An ordinary member or a cross-organization identifier must not reveal private candidates.

Do not use a global index that can leak tenant data when a caller forgets filtering. Index updates, deletions, relinks, and membership changes must be safe to retry and fail closed.

## Query behavior

Begin with plain text, deterministic recency/relevance ordering, pagination, and basic destination/App filters. Distinguish no content from no matching authorized results.

Fuzzy ranking, vector search, saved searches, natural-language answers, AI summaries, advanced query syntax, and searching external page contents remain later possibilities.

## Privacy

Do not send private URLs, titles, messages, or tasks to a third-party search or AI provider without explicit approval and documented retention. Routine logs should not contain complete potentially sensitive queries or rejected access/session URLs.

## Acceptance behavior

An authorized user can find a known context or message and open the correct chat and safe source. Shared-chat results and counts do not duplicate through multiple contexts. Unauthorized DMs, other organizations, inaccessible destinations, and unimplemented external page content never appear through results, suggestions, counts, or excerpts.
