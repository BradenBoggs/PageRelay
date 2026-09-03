<?php

namespace Tests\Feature\Auth;

use App\Enums\OrganizationRole;
use App\Models\OrganizationInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->get(route('register'))->assertOk();
    }

    public function test_registration_screen_includes_organization_invitation_context(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $invitation = OrganizationInvitation::create([
            'organization_id' => $organization->id,
            'email' => 'invited@example.com',
            'role' => OrganizationRole::Member,
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(3),
        ]);

        $this->get(route('register', ['invitation' => $invitation->code]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/register')
                ->where('organizationInvitation.code', $invitation->code)
                ->where('organizationInvitation.organizationName', $organization->name));
    }

    public function test_new_users_register_with_one_owned_organization(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard'));

        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertSame(OrganizationRole::Owner, $user->organizationRole());
        $this->assertNotNull($user->organization()->first());
    }

    public function test_invited_user_joins_the_inviting_organization_without_creating_another(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $invitation = OrganizationInvitation::create([
            'organization_id' => $organization->id,
            'email' => 'invited@example.com',
            'role' => OrganizationRole::Member,
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(3),
        ]);

        $this->post(route('register.store'), [
            'name' => 'Invited User',
            'email' => 'invited@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'invitation' => $invitation->code,
        ])->assertRedirect(route('dashboard'));

        $user = User::where('email', 'invited@example.com')->firstOrFail();
        $this->assertTrue($user->belongsToOrganization($organization));
        $this->assertSame(OrganizationRole::Member, $user->organizationRole());
        $this->assertDatabaseCount('organizations', 1);
        $this->assertNotNull($invitation->fresh()->accepted_at);
    }
}
