<?php

namespace Tests\Feature\Administration;

use App\Filament\Resources\FailedJobs\FailedJobResource;
use App\Filament\Resources\OrganizationMemberships\OrganizationMembershipResource;
use App\Filament\Resources\Organizations\OrganizationResource;
use App\Filament\Resources\Subscriptions\SubscriptionResource;
use App\Filament\Resources\Users\UserResource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_ordinary_organization_owners_cannot_access_filament(): void
    {
        $owner = User::factory()->create();

        $this->actingAs($owner)
            ->get('/admin')
            ->assertForbidden();
    }

    public function test_only_explicit_sidewire_admins_can_access_filament(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_sidewire_admin' => true])->save();

        $this->actingAs($admin)
            ->get('/admin')
            ->assertOk();
    }

    public function test_operator_access_is_only_granted_to_an_existing_user(): void
    {
        $user = User::factory()->create(['email' => 'operator@example.com']);

        $this->assertSame(0, Artisan::call('sidewire:admin', [
            'email' => $user->email,
        ]));
        $this->assertTrue($user->fresh()->is_sidewire_admin);

        $this->assertSame(0, Artisan::call('sidewire:admin', [
            'email' => $user->email,
            '--revoke' => true,
        ]));
        $this->assertFalse($user->fresh()->is_sidewire_admin);

        $this->assertSame(1, Artisan::call('sidewire:admin', [
            'email' => 'missing@example.com',
        ]));
        $this->assertSame(1, User::query()->count());
    }

    public function test_operator_resources_are_read_only(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization()->firstOrFail();
        $membership = $user->organizationMembership()->firstOrFail();
        $subscription = $organization->subscriptions()->create([
            'type' => 'default',
            'stripe_id' => 'sub_admin',
            'stripe_status' => 'active',
            'stripe_price' => 'price_admin',
            'quantity' => 1,
        ]);

        $this->assertSame(['index', 'view'], array_keys(UserResource::getPages()));
        $this->assertSame(['index', 'view'], array_keys(OrganizationResource::getPages()));
        $this->assertSame(['index', 'view'], array_keys(OrganizationMembershipResource::getPages()));
        $this->assertSame(['index', 'view'], array_keys(SubscriptionResource::getPages()));
        $this->assertSame(['index'], array_keys(FailedJobResource::getPages()));

        $this->assertFalse(UserResource::canCreate());
        $this->assertFalse(UserResource::canEdit($user));
        $this->assertFalse(OrganizationResource::canDelete($organization));
        $this->assertFalse(OrganizationMembershipResource::canDelete($membership));
        $this->assertFalse(SubscriptionResource::canEdit($subscription));
        $this->assertFalse(FailedJobResource::canCreate());
    }
}
