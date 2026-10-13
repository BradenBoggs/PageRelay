<?php

namespace Tests\Feature\Conversations;

use App\Domain\Images\ImagePreview;
use App\Enums\ApiTokenAbility;
use App\Enums\ConversationType;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Conversation;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class MessageImagePreviewTest extends TestCase
{
    use RefreshDatabase;

    private function coworker(User $owner, OrganizationRole $role = OrganizationRole::Member): User
    {
        $user = User::query()->create(['name' => fake()->name(), 'email' => fake()->unique()->safeEmail(), 'password' => 'password']);
        $user->forceFill(['email_verified_at' => now()])->save();
        OrganizationMembership::query()->create([
            'organization_id' => $owner->organization()->firstOrFail()->id, 'user_id' => $user->id,
            'role' => $role, 'status' => OrganizationMembershipStatus::Active, 'is_billable' => true, 'joined_at' => now(),
        ]);

        return $user;
    }

    private function direct(User $actor, User $recipient): string
    {
        return $this->actingAs($actor)->postJson('/collaboration/direct', ['recipient_id' => $recipient->id])
            ->assertCreated()->json('data.id');
    }

    private function workChat(User $owner): Conversation
    {
        $organization = $owner->organization()->firstOrFail();

        return Conversation::query()->create([
            'organization_id' => $organization->id, 'workspace_id' => $organization->defaultWorkspace()->firstOrFail()->id,
            'type' => ConversationType::Page, 'title' => 'Quote review', 'created_by' => $owner->id,
        ]);
    }

    private function payload(array $extra = []): array
    {
        return [...['body' => 'Please check the quoted price.', 'idempotency_key' => (string) Str::uuid()], ...$extra];
    }

    private function message(User $actor, string $chat, array $extra = []): string
    {
        return $this->actingAs($actor)->postJson('/collaboration/chats/'.$chat.'/messages', $this->payload($extra))->assertCreated()->json('data.id');
    }

    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=';

    private function previewPath(string $chat, string $message, string $url = 'https://images.example.test/photo.png'): string
    {
        return '/collaboration/chats/'.$chat.'/messages/'.$message.'/images/'.hash('sha256', $url);
    }

    private function publicHost(): void
    {
        $this->partialMock(ImagePreview::class, fn ($mock) => $mock->shouldReceive('resolve')->andReturn(['8.8.8.8']));
    }

    public function test_direct_images_are_bounded_deduplicated_and_labels_and_credentials_are_not_candidates(): void
    {
        $preview = app(ImagePreview::class);
        $urls = $preview->candidates('https://example.test/a.JPG?v=1 https://example.test/a.JPG?v=1 [https://example.test/b.png] [nested [label] https://example.test/z.png?v=1] https://example.test/c.svg https://example.test/d.png?token=secret');
        $this->assertCount(1, $urls);
        $this->assertSame('https://example.test/a.JPG?v=1', $urls[0]['url']);
        $this->assertCount(4, $preview->candidates(implode(' ', array_map(fn ($i) => 'https://example.test/'.$i.'.png', range(1, 9)))));
    }

    public function test_authorized_previews_pin_public_dns_and_return_only_valid_private_image_bytes(): void
    {
        $this->publicHost();
        Http::fake(function ($request, $options) {
            $this->assertFalse($request->hasHeader('Cookie'));
            $this->assertFalse($request->hasHeader('Authorization'));
            $this->assertFalse($request->hasHeader('Referer'));
            $this->assertFalse($options['allow_redirects']);
            $this->assertFalse($options['stream']);
            $this->assertFalse($options['decode_content']);
            $this->assertSame(CURL_IPRESOLVE_V4, $options['curl'][CURLOPT_IPRESOLVE]);
            $this->assertFalse($options['cookies']);
            $this->assertSame('', $options['proxy']);
            $this->assertTrue($options['verify']);
            $this->assertSame(8, $options['timeout']);
            $this->assertSame(['images.example.test:443:8.8.8.8'], $options['curl'][CURLOPT_RESOLVE]);

            return Http::response(base64_decode(self::PNG), 200, ['Content-Type' => 'image/png']);
        });
        $owner = User::factory()->create();
        $chat = $this->workChat($owner)->public_id;
        $message = $this->message($owner, $chat, ['body' => 'See https://images.example.test/photo.png']);
        $this->getJson('/collaboration/chats/'.$chat.'/messages')->assertJsonCount(1, 'data.0.image_previews');
        $response = $this->get($this->previewPath($chat, $message))->assertOk()->assertHeader('Content-Type', 'image/png')->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertSame(base64_decode(self::PNG), $response->getContent());
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->app['auth']->forgetGuards();
        $token = $owner->createToken('Chrome extension', [ApiTokenAbility::ExtensionAccess->value], now()->addDay());
        $this->withToken($token->plainTextToken)->get('/api/v1/extension'.substr($this->previewPath($chat, $message), 0))->assertOk();
    }

    public function test_chat_tenant_dm_removal_deletion_and_unknown_keys_are_denied_before_fetch(): void
    {
        Http::fake();
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $admin = $this->coworker($owner, OrganizationRole::Administrator);
        $outside = User::factory()->create();
        $dm = $this->direct($owner, $member);
        $message = $this->message($owner, $dm, ['body' => 'https://images.example.test/photo.png']);
        $path = $this->previewPath($dm, $message);
        $this->actingAs($admin)->get($path)->assertNotFound();
        $this->actingAs($outside)->get($path)->assertNotFound();
        $other = $this->workChat($owner)->public_id;
        $this->actingAs($owner)->get($this->previewPath($other, $message))->assertNotFound();
        $this->get($this->previewPath($dm, $message, 'https://other.example.test/no.png'))->assertNotFound();
        $this->deleteJson('/collaboration/chats/'.$dm.'/messages/'.$message)->assertOk();
        $this->get($path)->assertNotFound();
        $this->delete('/settings/organization/members/'.$member->id)->assertRedirect();
        $this->actingAs($member)->get($path)->assertForbidden();
        Http::assertNothingSent();
    }

    public static function blockedAddresses(): array
    {
        return [[['127.0.0.1']], [['10.0.0.1']], [['169.254.169.254']], [['192.168.1.1']], [['0.0.0.0']], [['8.8.8.8', '127.0.0.1']], [[]]];
    }

    #[DataProvider('blockedAddresses')]
    public function test_private_reserved_mixed_and_unresolved_hosts_are_never_fetched(array $addresses): void
    {
        $this->partialMock(ImagePreview::class, fn ($mock) => $mock->shouldReceive('resolve')->andReturn($addresses));
        Http::fake();
        $owner = User::factory()->create();
        $chat = $this->workChat($owner)->public_id;
        $message = $this->message($owner, $chat, ['body' => 'https://images.example.test/photo.png']);
        $this->get($this->previewPath($chat, $message))->assertStatus(422);
        Http::assertNothingSent();
    }

    public static function invalidImages(): array
    {
        return [['<svg onload="alert(1)"></svg>', 200, []], ['not an image', 200, []], ['', 302, ['Location' => 'http://127.0.0.1/a.png']], ['', 200, ['Content-Length' => ImagePreview::MAX_BYTES + 1]], [str_repeat('x', ImagePreview::MAX_BYTES + 1), 200, []]];
    }

    #[DataProvider('invalidImages')]
    public function test_redirects_nonimages_and_oversized_responses_fall_back(string $body, int $status, array $headers): void
    {
        $this->publicHost();
        Http::fake(['*' => Http::response($body, $status, $headers)]);
        $owner = User::factory()->create();
        $chat = $this->workChat($owner)->public_id;
        $message = $this->message($owner, $chat, ['body' => 'https://images.example.test/photo.png']);
        $this->get($this->previewPath($chat, $message))->assertStatus(422);
    }

    public function test_transfer_progress_aborts_before_unbounded_downloads(): void
    {
        $this->publicHost();
        Http::fake(function ($request, $options) {
            $options['progress'](0, ImagePreview::MAX_BYTES + 1, 0, 0);

            return Http::response(base64_decode(self::PNG));
        });
        $owner = User::factory()->create();
        $chat = $this->workChat($owner)->public_id;
        $message = $this->message($owner, $chat, ['body' => 'https://images.example.test/photo.png']);
        $this->get($this->previewPath($chat, $message))->assertStatus(422);
    }

    public function test_preview_delivery_rechecks_access_after_fetch(): void
    {
        $this->publicHost();
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $chat = $this->workChat($owner)->public_id;
        $message = $this->message($member, $chat, ['body' => 'https://images.example.test/photo.png']);
        Http::fake(function () use ($member) {
            OrganizationMembership::where('user_id', $member->id)->update(['status' => OrganizationMembershipStatus::Removed]);

            return Http::response(base64_decode(self::PNG));
        });
        $this->get($this->previewPath($chat, $message))->assertForbidden();
    }
}
