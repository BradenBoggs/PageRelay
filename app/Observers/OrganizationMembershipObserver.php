<?php

namespace App\Observers;

use App\Jobs\Billing\SyncOrganizationSeatQuantity;
use App\Models\OrganizationMembership;

class OrganizationMembershipObserver
{
    public function created(OrganizationMembership $membership): void
    {
        $this->dispatch($membership);
    }

    public function updated(OrganizationMembership $membership): void
    {
        if ($membership->wasChanged(['status', 'is_billable'])) {
            $this->dispatch($membership);
        }
    }

    public function deleted(OrganizationMembership $membership): void
    {
        $this->dispatch($membership);
    }

    private function dispatch(OrganizationMembership $membership): void
    {
        SyncOrganizationSeatQuantity::dispatch($membership->organization_id);
    }
}
