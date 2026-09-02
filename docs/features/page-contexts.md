# Page contexts

Status: proposed; not implemented.

This document owns how SideWire represents, resolves, displays, revisits, and later adapts an external web page. Conversations and tasks refer to contexts but do not define their identity.

## Purpose

A page context is SideWire's organization-private identity for the external page where work is happening. It lets a team return to the same collaboration history without requiring a native integration with the underlying service.

Do not call a context a project, customer, deal, channel, job, or ticket. It may represent any of those depending on the source application.

## Universal resolution

After an intentional SideWire interaction, the extension may send the current `http` or `https` URL, browser-provided title, optional favicon URL, and an idempotency key. The server validates the values, computes a versioned normalized identity, and finds or creates a context within the active organization.

Repeated resolution of the same organization and normalized identity must return the same active context. Two organizations viewing the same URL receive separate private contexts.

## Conservative normalization

The universal normalizer should:

- normalize scheme and host consistently;
- remove fragments;
- remove only explicitly recognized tracking parameters;
- preserve path and unknown query parameters;
- reject unsafe or unsupported URL schemes;
- version its behavior and cover rules with regression tests.

Titles and favicons are display metadata, never identity or authorization inputs. Do not merge pages because their titles resemble one another.

## Context information

A context includes an opaque public identifier, organization, original source URL, normalized identity, normalization version, source host, latest safe display title, optional favicon reference, creator, and timestamps. Track recent activity without turning ordinary browsing into surveillance.

The source URL can be opened or copied only after validating its scheme. Long URLs should not be the primary visible label.

## Later identity improvements

Application-specific adapters may recognize stable record IDs or discard volatile routing parameters for approved services. Adapters enhance the universal URL path; they must not make SideWire unusable on unsupported tools.

Manual merge/split, aliases, organization-defined normalization, canonical-link reading, site-wide contexts, and route templates require separate approval. Any merge must preserve history, links, unread state, and an auditable recovery path.

## Privacy and isolation

URLs and titles may contain customer or workplace information. Treat them as private organization data, exclude sensitive values from routine logs and analytics, and never reveal cross-organization existence. Do not persist unsupported pages or resolve background tabs merely because the browser navigated.

## Acceptance behavior

Two members of one organization resolving the same supported page reach the same context. Different pages remain distinct unless an approved normalization rule proves equivalence. Another organization can neither discover nor access that context, even with the URL or opaque identifier.

