# Search

Status: proposed Phase 2 feature; not implemented.

This document owns authorized search across SideWire contexts and collaboration content.

## Purpose

Search lets a teammate recover communication and work spread across many external tools without remembering which application or page contained it.

## Searchable content

The proposed rollout is incremental:

1. page-context title, source host, and stored source URL;
2. page, team, and direct-message text;
3. task title and description;
4. people and additional metadata only when required.

Search results show destination type, recognizable title, safe excerpt, author or assignee when relevant, source site, timestamp, and navigation action. Page results offer both the SideWire destination and validated source-page link.

## Authorization

Search must apply current authorization before returning matches, counts, suggestions, excerpts, highlighting, or timing signals. Organization membership does not authorize direct messages unless the user is a participant. Removed and archived content follows its owning feature's visibility rules.

Never use a global search index that can return cross-organization data because filtering was forgotten. Index updates, deletions, and membership changes must be safe to retry and fail closed.

## Query behavior

Begin with plain text, deterministic recency/relevance ordering, pagination, and basic destination/source filters. Clearly distinguish no content from no matching authorized results.

Fuzzy ranking, semantic/vector search, saved searches, natural-language answers, AI summaries, advanced query syntax, and cross-service search of external page contents are later possibilities.

## Privacy

Do not send private URLs, titles, messages, or tasks to a third-party search or AI provider without explicit approval, appropriate agreements, and documented retention. Application logs should not routinely record complete search queries if they may contain sensitive customer data.

## Acceptance behavior

An authorized user can find a known SideWire context or message and open the correct destination. Unauthorized direct messages, other organizations, removed destinations, and unimplemented external page content never appear through results, suggestions, counts, or excerpts.
