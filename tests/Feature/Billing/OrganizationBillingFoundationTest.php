<?php

namespace Tests\Feature\Billing;

use App\Contracts\Billing\UpdatesOrganizationSeatQuantity;
use App\Domain\Billing\SyncOrganizationSeatQuantity;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Jobs\Billing\SyncOrganizationSeatQuantity as SyncOrganizationSeatQuantityJob;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Subscription;
use Tests\TestCase;

class OrganizationBillingFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_organization_is_the_cashier_customer(): void
    {
        $organization = User::factory()->create()->organization()->firstOrFail();

        $this->assertSame(Organization::class, Cashier::$customerModel);
        $this->assertTrue(Schema::hasColumns('organizations', [
            'stripe_id',
            'pm_type',
            'pm_last_four',
            'trial_ends_at',
        ]));
        $this->assertFalse(Schema::hasColumn('users', 'stripe_id'));

        $subscription = $organization->subscriptions()->create([
            'type' => 'default',
            'stripe_id' => 'sub_foundation',
            'stripe_status' => 'active',
            'stripe_price' => 'price_foundation',
            'quantity' => 1,
        ]);

        $this->assertTrue($subscription->owner->is($organization));
    }

    public function test_only_active_billable_memberships_count_as_seats(): void
    {
        $organization = User::factory()->create()->organization()->firstOrFail();

        $this->addMembership($organization, OrganizationMembershipStatus::Active, true);
        $this->addMembership($organization, OrganizationMembershipStatus::Invited, true);
        $this->addMembership($organization, OrganizationMembershipStatus::Removed, true);
        $this->addMembership($organization, OrganizationMembershipStatus::Active, false);

        $this->assertSame(2, $organization->billableSeatCount());
    }

    public function test_membership_changes_enqueue_seat_reconciliation(): void
    {
        Queue::fake();

        $organization = User::factory()->create()->organization()->firstOrFail();
        Queue::fake();

        $membership = $this->addMembership(
            $organization,
            OrganizationMembershipStatus::Active,
            true,
        );

        Queue::assertPushed(
            SyncOrganizationSeatQuantityJob::class,
            fn (SyncOrganizationSeatQuantityJob $job): bool => $job->organizationId === $organization->id,
        );

        Queue::fake();
        $membership->update(['role' => OrganizationRole::Administrator]);
        Queue::assertNothingPushed();

        $membership->update(['is_billable' => false]);
        Queue::assertPushed(SyncOrganizationSeatQuantityJob::class);
    }

    public function test_seat_reconciliation_is_idempotent(): void
    {
        $organization = User::factory()->create()->organization()->firstOrFail();
        $this->addMembership($organization, OrganizationMembershipStatus::Active, true);

        $subscription = $organization->subscriptions()->create([
            'type' => 'default',
            'stripe_id' => 'sub_quantity',
            'stripe_status' => 'active',
            'stripe_price' => 'price_quantity',
            'quantity' => 1,
        ]);

        $updater = new class implements UpdatesOrganizationSeatQuantity
        {
            /** @var list<array{subscription: int, quantity: int}> */
            public array $calls = [];

            public function update(Subscription $subscription, int $quantity): void
            {
                $this->calls[] = [
                    'subscription' => $subscription->id,
                    'quantity' => $quantity,
                ];

                $subscription->forceFill(['quantity' => $quantity])->save();
            }
        };

        $synchronizer = new SyncOrganizationSeatQuantity($updater);

        $this->assertSame(2, $synchronizer->handle($organization->id));
        $this->assertSame(2, $synchronizer->handle($organization->id));
        $this->assertSame([
            ['subscription' => $subscription->id, 'quantity' => 2],
        ], $updater->calls);
    }

    private function addMembership(
        Organization $organization,
        OrganizationMembershipStatus $status,
        bool $isBillable,
    ): OrganizationMembership {
        $user = User::create([
            'name' => 'Billing Member',
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => 'password',
        ]);

        return OrganizationMembership::create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role' => OrganizationRole::Member,
            'status' => $status,
            'is_billable' => $isBillable,
            'joined_at' => $status === OrganizationMembershipStatus::Active ? now() : null,
            'removed_at' => $status === OrganizationMembershipStatus::Removed ? now() : null,
        ]);
    }
}
