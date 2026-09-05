<?php

namespace Tests\Feature\Api;

use App\Domain\Extension\StartExtensionHandoff;
use App\Models\ExtensionHandoff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExtensionConnectionPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_connection_page_requires_a_verified_organization_member(): void
    {
        $handoff = $this->handoff();

        $this->get(route('extension.connect.show', $handoff))
            ->assertRedirect(route('login'));
    }

    public function test_unverified_member_cannot_authorize_an_extension_handoff(): void
    {
        $user = User::factory()->unverified()->create();
        $handoff = $this->handoff();

        $this->actingAs($user)
            ->get(route('extension.connect.show', $handoff))
            ->assertRedirect(route('verification.notice'));

        $this->actingAs($user)
            ->post(route('extension.connect.store', $handoff))
            ->assertRedirect(route('verification.notice'));

        $this->assertNull($handoff->fresh()->authorized_at);
    }

    public function test_member_explicitly_authorizes_the_handoff_for_their_organization(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization()->firstOrFail();
        $handoff = $this->handoff();

        $this->actingAs($user)
            ->get(route('extension.connect.show', $handoff))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('extension/connect')
                ->where('handoff.id', $handoff->public_id)
                ->where('handoff.status', 'ready')
                ->where('organization.name', $organization->name));

        $this->actingAs($user)
            ->post(route('extension.connect.store', $handoff))
            ->assertRedirect(route('extension.connect.show', $handoff));

        $this->assertSame($user->id, $handoff->fresh()->user_id);
        $this->assertNotNull($handoff->fresh()->authorized_at);
    }

    public function test_authorized_handoff_is_not_revealed_to_another_organization(): void
    {
        $user = User::factory()->create();
        $outsider = User::factory()->create();
        $handoff = $this->handoff();

        $this->actingAs($user)
            ->post(route('extension.connect.store', $handoff))
            ->assertRedirect();

        $this->actingAs($outsider)
            ->get(route('extension.connect.show', $handoff))
            ->assertNotFound();
    }

    private function handoff(): ExtensionHandoff
    {
        return app(StartExtensionHandoff::class)
            ->handle(str_repeat('a', 43))
            ->handoff;
    }
}
