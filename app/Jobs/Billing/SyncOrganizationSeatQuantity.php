<?php

namespace App\Jobs\Billing;

use App\Domain\Billing\SyncOrganizationSeatQuantity as Synchronizer;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncOrganizationSeatQuantity implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public function __construct(public int $organizationId)
    {
        $this->afterCommit();
    }

    public function handle(Synchronizer $synchronizer): void
    {
        $synchronizer->handle($this->organizationId);
    }

    public function uniqueId(): string
    {
        return (string) $this->organizationId;
    }

    /** @return list<int> */
    public function backoff(): array
    {
        return [30, 120, 600];
    }
}
