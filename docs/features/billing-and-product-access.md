# Billing and product access

Status: discussed direction; exact offer is not approved and billing is not implemented.

This document owns subscriptions, trials, billable seats, product access, cancellation, complimentary access, and billing management.

## Pricing direction

SideWire should be positioned closer to affordable per-user team software than a high flat monthly fee. Slack's approximate per-user market framing was discussed as a more realistic comparison than a $50-per-month small-team minimum. No exact price is approved.

Do not hard-code discussed examples into product behavior, Stripe configuration, or marketing copy before approval.

## Proposed ownership model

The organization is the billing customer. Individual employees do not maintain separate subscriptions. The owner or approved billing administrator manages payment methods, invoices, seats, and cancellation.

Product authorization must come from server-owned subscription state. The client, extension, Stripe redirect, price ID, and seat quantity are not trusted access claims.

## Trial and access decisions

Before implementation, approve:

- per-seat versus flat organization pricing;
- monthly and annual offers;
- free trial length and whether a card is required;
- which membership statuses count as billable seats;
- seat increases, decreases, proration, and failed-payment behavior;
- cancellation timing and data-retention window;
- complimentary/internal accounts and pilot pricing;
- whether a free tier exists;
- taxes, receipts, refunds, and supported currency.

## Product behavior

Billing status should not corrupt collaboration history. An expired or canceled organization may become read-only or lose product access according to approved policy while retaining a documented recovery window. Never permanently delete organization data merely because a payment fails.

Membership changes and invitations must coordinate with billing atomically enough to avoid granting unbilled access or charging for members who cannot use the product.

Use a maintained billing package and hosted payment/billing-management surfaces where practical. Verify provider webhooks, make retries idempotent, and store provider identifiers safely.

## Out of scope

Usage-based AI credits, marketplace revenue sharing, custom enterprise contracts, multiple concurrent plans, add-on catalogs, coupons, and affiliate payouts are not MVP billing requirements unless separately approved.

