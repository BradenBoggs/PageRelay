<?php

namespace Tests\Feature\Broadcasting;

use App\Enums\ApiTokenAbility;
use App\Models\User;
use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationChannelAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_extension_token_can_only_authorize_its_organization_channel(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization()->firstOrFail();
        $otherOrganization = User::factory()->create()->organization()->firstOrFail();
        $token = $user->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDays(30),
        );

        $this->configureTestBroadcaster();

        $this->withToken($token->plainTextToken)
            ->postJson(route('api.extension.broadcasting.auth'), [
                'channel_name' => 'private-organizations.'.$organization->id,
                'socket_id' => '1234.5678',
            ])
            ->assertOk();

        $this->app['auth']->forgetGuards();

        $this->withToken($token->plainTextToken)
            ->postJson(route('api.extension.broadcasting.auth'), [
                'channel_name' => 'private-organizations.'.$otherOrganization->id,
                'socket_id' => '1234.5678',
            ])
            ->assertForbidden();
    }

    private function configureTestBroadcaster(): void
    {
        config()->set('broadcasting.default', 'reverb');
        config()->set('broadcasting.connections.reverb.key', 'test-key');
        config()->set('broadcasting.connections.reverb.secret', 'test-secret');
        config()->set('broadcasting.connections.reverb.app_id', 'test-app');
        config()->set('broadcasting.connections.reverb.options', [
            'host' => 'localhost',
            'port' => 8080,
            'scheme' => 'http',
            'useTLS' => false,
        ]);

        app(BroadcastManager::class)->forgetDrivers();
        require base_path('routes/channels.php');
    }
}
