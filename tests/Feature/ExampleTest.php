<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_home_to_login(): void
    {
        $this->get(route('home'))->assertRedirect(route('login'));
    }

    public function test_authenticated_users_are_redirected_from_home_to_messages(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('home'))
            ->assertRedirect(route('messages.index'));
    }

    public function test_unverified_users_are_redirected_to_verification(): void
    {
        $this->actingAs(User::factory()->unverified()->create())
            ->get(route('home'))
            ->assertRedirect(route('verification.notice'));
    }

    public function test_users_without_an_active_organization_are_redirected_to_profile(): void
    {
        $user = User::factory()->create();
        $user->organizationMembership()->delete();
        $this->actingAs($user)->get(route('home'))->assertRedirect(route('profile.edit'));
        $this->get(route('messages.index'))->assertForbidden();
    }
}
