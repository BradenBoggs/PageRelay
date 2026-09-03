<?php

namespace Tests\Feature\Organizations;

use App\Actions\Organizations\CreateOrganization;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class OrganizationFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_has_one_owned_organization_without_selector_state(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization()->firstOrFail();

        $this->assertSame(OrganizationRole::Owner, $user->organizationRole());
        $this->assertTrue($organization->isOwnedBy($user));
        $this->assertSame(1, $organization->billableSeatCount());
        $this->assertNotContains('current_'.'organization_id', Schema::getColumnListing('users'));
    }

    public function test_the_database_prevents_a_second_organization_membership(): void
    {
        $user = User::factory()->create();
        $other = Organization::factory()->create();

        $this->expectException(QueryException::class);

        OrganizationMembership::create([
            'organization_id' => $other->id,
            'user_id' => $user->id,
            'role' => OrganizationRole::Member,
            'status' => OrganizationMembershipStatus::Active,
            'is_billable' => true,
            'joined_at' => now(),
        ]);
    }

    public function test_the_create_action_rejects_a_second_organization(): void
    {
        $user = User::factory()->create();

        $this->expectException(\Illuminate\Validation\ValidationException::class);

        app(CreateOrganization::class)->handle($user, 'Another Organization');
    }

    public function test_organization_settings_are_not_public(): void
    {
        $this->get(route('organization.edit'))->assertRedirect(route('login'));
    }
}
