<?php

namespace App\Domain\Billing;

use App\Contracts\Billing\UpdatesOrganizationSeatQuantity;
use Laravel\Cashier\Subscription;

class CashierOrganizationSeatQuantityUpdater implements UpdatesOrganizationSeatQuantity
{
    public function update(Subscription $subscription, int $quantity): void
    {
        $subscription->updateQuantity($quantity);
    }
}
