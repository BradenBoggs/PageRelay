<?php

namespace App\Contracts\Billing;

use Laravel\Cashier\Subscription;

interface UpdatesOrganizationSeatQuantity
{
    public function update(Subscription $subscription, int $quantity): void;
}
