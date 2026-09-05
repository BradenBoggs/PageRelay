<?php

namespace Tests\Feature\Api;

use App\Domain\Extension\AuthorizeExtensionHandoff;
use App\Domain\Extension\ExchangeExtensionHandoff;
use App\Domain\Extension\StartExtensionHandoff;
use App\Enums\ApiTokenAbility;
use App\Models\ExtensionHandoff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpKernel\Exception\GoneHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Tests\TestCase;

class ExtensionHandoffTest extends TestCase
{
    use RefreshDatabase;

    public function test_handoff_secret_is_hashed_and_pkce_is_required(): void
    {
        [$verifier, $challenge] = $this->pkcePair();
        $credentials = app(StartExtensionHandoff::class)->handle($challenge);

        $this->assertNotSame(
            $credentials->secret,
            $credentials->handoff->secret_hash,
        );
        $this->assertSame(
            hash('sha256', $credentials->secret),
            $credentials->handoff->secret_hash,
        );

        $this->expectException(NotFoundHttpException::class);

        app(ExchangeExtensionHandoff::class)->handle(
            $credentials->handoff,
            $credentials->secret,
            $verifier.'wrong',
        );
    }

    public function test_exchange_waits_for_explicit_browser_authorization(): void
    {
        [$verifier, $challenge] = $this->pkcePair();
        $credentials = app(StartExtensionHandoff::class)->handle($challenge);

        $token = app(ExchangeExtensionHandoff::class)->handle(
            $credentials->handoff,
            $credentials->secret,
            $verifier,
        );

        $this->assertNull($token);
        $this->assertNull($credentials->handoff->fresh()->consumed_at);
    }

    public function test_authorized_handoff_issues_one_scoped_expiring_token(): void
    {
        $user = User::factory()->create();
        [$verifier, $challenge] = $this->pkcePair();
        $credentials = app(StartExtensionHandoff::class)->handle($challenge);

        app(AuthorizeExtensionHandoff::class)->handle($credentials->handoff, $user);

        $token = app(ExchangeExtensionHandoff::class)->handle(
            $credentials->handoff,
            $credentials->secret,
            $verifier,
        );

        $this->assertNotNull($token);
        $this->assertTrue($token->accessToken->can(ApiTokenAbility::ExtensionAccess->value));
        $this->assertNotNull($token->accessToken->expires_at);
        $this->assertNotNull($credentials->handoff->fresh()->consumed_at);

        $this->expectException(GoneHttpException::class);

        app(ExchangeExtensionHandoff::class)->handle(
            $credentials->handoff,
            $credentials->secret,
            $verifier,
        );
    }

    public function test_expired_handoff_cannot_be_authorized(): void
    {
        $user = User::factory()->create();
        [, $challenge] = $this->pkcePair();
        $credentials = app(StartExtensionHandoff::class)->handle($challenge);
        $credentials->handoff->forceFill(['expires_at' => now()->subMinute()])->save();

        $this->expectException(GoneHttpException::class);

        app(AuthorizeExtensionHandoff::class)->handle($credentials->handoff, $user);
    }

    public function test_api_never_places_the_handoff_secret_in_the_browser_url(): void
    {
        [, $challenge] = $this->pkcePair();

        $response = $this->postJson(route('api.extension.handoffs.store'), [
            'code_challenge' => $challenge,
        ])->assertCreated();

        $secret = $response->json('data.secret');

        $this->assertIsString($secret);
        $this->assertStringNotContainsString(
            $secret,
            $response->json('data.authorize_url'),
        );
    }

    public function test_api_accepts_the_chrome_extension_cors_preflight(): void
    {
        $this->withHeaders([
            'Origin' => 'chrome-extension://sidewire-development',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'content-type',
        ])->options(route('api.extension.handoffs.store'))
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', '*')
            ->assertHeader('Access-Control-Allow-Methods', 'POST');
    }

    public function test_api_exchange_returns_pending_then_the_one_time_token(): void
    {
        $user = User::factory()->create();
        [$verifier, $challenge] = $this->pkcePair();
        $response = $this->postJson(route('api.extension.handoffs.store'), [
            'code_challenge' => $challenge,
        ])->assertCreated();

        $payload = [
            'secret' => $response->json('data.secret'),
            'code_verifier' => $verifier,
        ];

        $this->putJson(
            route('api.extension.handoffs.update', $response->json('data.id')),
            $payload,
        )
            ->assertStatus(202)
            ->assertJsonPath('data.status', 'pending');

        $handoff = ExtensionHandoff::query()->firstOrFail();
        app(AuthorizeExtensionHandoff::class)->handle($handoff, $user);

        $this->putJson(
            route('api.extension.handoffs.update', $handoff),
            $payload,
        )
            ->assertOk()
            ->assertJsonPath('data.status', 'connected')
            ->assertJsonPath('data.organization.id', $user->organization()->firstOrFail()->id)
            ->assertJsonStructure(['data' => ['token', 'expires_at']]);

        $this->putJson(
            route('api.extension.handoffs.update', $handoff),
            $payload,
        )->assertGone();
    }

    /** @return array{string, string} */
    private function pkcePair(): array
    {
        $verifier = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $challenge = rtrim(strtr(
            base64_encode(hash('sha256', $verifier, true)),
            '+/',
            '-_',
        ), '=');

        return [$verifier, $challenge];
    }
}
