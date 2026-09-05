<?php

namespace Tests\Feature\Api;

use App\Enums\ApiTokenAbility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExtensionSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_extension_session_comes_from_the_authenticated_membership(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization()->firstOrFail();
        $token = $user->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDays(30),
        );

        $this->withToken($token->plainTextToken)
            ->getJson(route('api.extension.session.show'))
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.organization.id', $organization->id)
            ->assertJsonMissingPath('data.organization.stripe_id');
    }

    public function test_general_sanctum_tokens_cannot_access_the_extension_api(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('Other client', ['profile:read']);

        $this->withToken($token->plainTextToken)
            ->getJson(route('api.extension.session.show'))
            ->assertForbidden();
    }

    public function test_browser_session_cookies_cannot_access_the_extension_api(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson(route('api.extension.session.show'))
            ->assertForbidden();
    }

    public function test_extension_can_revoke_its_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDays(30),
        );

        $this->withToken($token->plainTextToken)
            ->deleteJson(route('api.extension.session.destroy'))
            ->assertNoContent();

        $this->app['auth']->forgetGuards();

        $this->withToken($token->plainTextToken)
            ->getJson(route('api.extension.session.show'))
            ->assertUnauthorized();
    }
}
