# External service integrations

Status: future direction; the universal URL-based product must work without native integrations.

This document owns application-specific adapters, partner integrations, and synchronization with third-party services. Marketing partnerships belong to `referrals-and-partnerships.md`.

## Purpose

Native integrations may improve identity, display, and workflow for popular services while SideWire's baseline remains compatible with almost any browser-based application. Integrations should deepen high-value use cases, not turn every service into a launch dependency.

## Integration levels

Prefer the smallest level that solves a proven problem:

1. **URL adapter:** Recognizes stable record identity from approved URLs and removes documented volatile parameters.
2. **Display adapter:** Adds safe record type, label, or icon using URL information or a user-authorized API.
3. **Deep link/action:** Opens an approved native page or action.
4. **Import or event sync:** Receives selected records or events through an authorized API/webhook.
5. **Bidirectional sync:** Writes data back to the provider only when conflict, permission, audit, and retry behavior are fully defined.

Do not jump to bidirectional synchronization when a URL adapter delivers most of the value.

## Candidate services and use cases

Industry/use-case pages may target collaboration in CRMs, service-business software, design tools such as Canva, project portals, and other workplace applications. Naming a service in marketing research does not mean an integration exists or is approved.

Prioritize an integration only when users demonstrate repeated identity or workflow pain, the provider permits it, and maintenance cost is justified.

## Security and provider behavior

Use OAuth or provider-approved credentials, minimum scopes, encrypted server-side storage, explicit connection ownership, signature-verified webhooks, idempotent callbacks, disconnect/revocation, and clear failure states. Never scrape credentials or bypass provider restrictions.

Record which organization connected an integration and who authorized it. Provider data inherits SideWire organization isolation and provider-specific deletion obligations.

## Claims and fallback

The UI and marketing site must distinguish:

- works through SideWire's universal page-context behavior;
- enhanced by an approved native adapter;
- planned or requested but unavailable.

When an integration fails, the universal page context should remain usable where possible. Never advertise synchronization that has not been implemented and verified.

## Out of scope

A public developer platform, arbitrary automation builder, unofficial scraping, credential sharing, and maintaining one-off customer integrations without a product decision are not approved.

