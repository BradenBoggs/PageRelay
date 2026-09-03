# Billing and product access

Status: per-seat billing architecture approved; exact price and commercial policy remain open. Implementation is tracked in `docs/plans/000-execplan.md` and a later billing-product plan.

This document owns subscriptions, trials, billable seats, product access, cancellation, complimentary access, and billing management.

## Approved ownership model

The organization is the Laravel Cashier customer and Stripe customer. Individual users, workspaces, and teams do not maintain separate subscriptions.

Use Laravel Cashier with `Organization` as the configured customer model. Cashier's customer columns belong on `organizations`, and the organization owns subscriptions, invoices, payment-method management, and access to Stripe's hosted billing portal.

Product authorization comes from server-owned membership and subscription state. The client, extension, Stripe redirect, price ID, workspace, team, and reported seat quantity are not trusted access claims.

## Approved seat definition

One active billable organization membership equals one seat.

- The organization owner counts as one seat.
- An active administrator or member counts as one seat.
- A pending invitation does not count.
- A removed, suspended, or inactive membership does not count.
- Belonging to several teams does not add seats.
- Accessing several workspaces does not add seats.
- A later multi-organization user would count once in each organization, but multi-organization membership is not part of the foundation.

Seat status must be explicit on the membership rather than inferred from team or workspace activity.

## Quantity synchronization

Stripe subscription quantity is a projection of the authoritative membership records. After a billable membership change commits, enqueue an idempotent synchronization operation that:

1. locks or otherwise safely reads the organization billing state;
2. recalculates the complete active billable seat count;
3. compares it with the current subscription quantity;
4. updates the Cashier subscription quantity only when necessary;
5. records failure for retry without rolling back a valid organization membership change.

Prefer recalculation and `updateQuantity()` over blind increments and decrements. Jobs, webhooks, and retries may execute more than once.

Membership activation must not silently grant indefinite unbilled paid access. The exact immediate-charge, proration, grace, and failure behavior is still a commercial decision and must be implemented in a dedicated billing plan before launch.

## Stripe surfaces

Use Stripe Checkout or another Cashier-supported hosted payment surface for starting subscriptions and Stripe's hosted billing portal for payment methods, invoices, and cancellation where approved. Verify all webhook signatures and make webhook processing idempotent.

Do not build a custom card-entry form or store raw payment details.

## Decisions still required before production billing

- exact per-seat price and currency;
- monthly-only versus monthly and annual prices;
- free trial length and whether a card is required;
- seat proration and effective timing for decreases;
- payment failure, grace period, and read-only behavior;
- cancellation timing and data-recovery window;
- complimentary, pilot, and internal organization access;
- taxes, receipts, refunds, and supported countries;
- whether a free tier exists.

Do not hard-code discussed examples into Stripe configuration or marketing copy before approval.

## Product behavior

Billing status must not corrupt collaboration history. An expired or canceled organization may become read-only or lose product access according to approved policy while retaining a documented recovery window. Never permanently delete organization data merely because a payment fails.

Membership changes and billing synchronization must coordinate well enough to avoid charging for unusable memberships or granting indefinite unbilled access. Billing reconciliation must be observable in the internal Filament panel.

## Out of scope

Usage-based AI credits, marketplace revenue sharing, custom enterprise contracts, multiple concurrent plans, add-on catalogs, coupons, and affiliate payouts are not MVP billing requirements unless separately approved.

## Implementation map

Add this section after stable billing code exists. It should identify the Organization Cashier model, membership seat-count method, quantity synchronization job/service, checkout and portal routes, webhook boundary, Filament billing resources, and billing tests.
