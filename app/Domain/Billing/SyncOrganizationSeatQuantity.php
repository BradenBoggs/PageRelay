<?php

namespace App\Domain\Billing;

use App\Contracts\Billing\UpdatesOrganizationSeatQuantity;
use App\Models\Organization;
use Illuminate\Support\Facades\DB;

/**
 * Reconciles Stripe quantity from authoritative active billable memberships.
 *
 * Repeated executions recalculate the full quantity and avoid blind changes.
 * Organizations without a subscription remain untouched until commercial
 * activation behavior is approved.
 *
 * @see docs/features/billing-and-product-access.md
 */
class SyncOrganizationSeatQuantity
{
    public function __construct(
        private UpdatesOrganizationSeatQuantity $updater,
    ) {
        //
    }

    public function handle(int $organizationId): int
    {
        return DB::transaction(function () use ($organizationId): int {
            $organization = Organization::query()
                ->whereKey($organizationId)
                ->lockForUpdate()
                ->firstOrFail();

            $quantity = $organization->billableSeatCount();
            $subscription = $organization->subscription();

            if (! $subscription || (int) $subscription->quantity === $quantity) {
                return $quantity;
            }

            $this->updater->update($subscription, $quantity);

            return $quantity;
        });
    }
}
