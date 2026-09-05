<?php

namespace Tests\Feature\PageContexts;

use App\Domain\Conversations\CreatePageChat;
use App\Domain\PageContexts\NormalizePageUrl;
use App\Domain\PageContexts\ResolvePageContext;
use App\Enums\ApiTokenAbility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PageContextResolutionTest extends TestCase
{
    use RefreshDatabase;

    public function test_resolution_is_read_only_until_a_chat_is_explicitly_created(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $resolve = app(ResolvePageContext::class);

        $first = $resolve->handle(
            $organization,
            $owner,
            'HTTPS://Example.com/work/42?utm_source=email&view=full#details',
            'Work 42',
            null,
        );
        $sameIdentity = $resolve->handle(
            $organization,
            $owner,
            'https://example.com/work/42?view=full',
            'Changed display title',
            null,
        );

        $this->assertNull($first->context);
        $this->assertNull($sameIdentity->context);
        $this->assertSame('example.com', $first->host);
        $this->assertSame('https://example.com/work/42?view=full', $first->normalizedUrl);
        $this->assertDatabaseCount('page_contexts', 0);
        $this->assertDatabaseCount('conversations', 0);
        $this->assertFalse(Schema::hasTable('page_context_resolution_keys'));

        $created = app(CreatePageChat::class)->handle(
            $organization,
            $owner,
            $first->url,
            $first->title,
            'Work 42 chat',
            null,
        );
        $resolved = $resolve->handle(
            $organization,
            $owner,
            'https://example.com/work/42?view=full',
            'Changed again',
            null,
        );

        $this->assertTrue($created->is($resolved->context));
        $this->assertNotNull($created->conversation_id);
        $this->assertDatabaseCount('page_contexts', 1);
        $this->assertDatabaseCount('conversations', 1);
    }

    public function test_same_url_in_another_organization_does_not_resolve_the_existing_context(): void
    {
        $firstUser = User::factory()->create();
        $secondUser = User::factory()->create();
        $firstOrganization = $firstUser->organization()->firstOrFail();

        app(CreatePageChat::class)->handle(
            $firstOrganization,
            $firstUser,
            'https://example.com/records/7',
            'Record 7',
            'Record 7',
            null,
        );
        $second = app(ResolvePageContext::class)->handle(
            $secondUser->organization()->firstOrFail(),
            $secondUser,
            'https://example.com/records/7',
            'Record 7',
            null,
        );

        $this->assertNull($second->context);
        $this->assertDatabaseCount('page_contexts', 1);
    }

    public function test_extension_resolution_returns_an_ephemeral_descriptor_without_writes(): void
    {
        $owner = User::factory()->create();
        $token = $owner->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDay(),
        );

        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/page-contexts/resolve', [
                'url' => 'https://example.com/private/42?utm_source=email',
                'title' => 'Private record',
            ])
            ->assertOk()
            ->assertJsonPath('data.persisted', false)
            ->assertJsonPath('data.id', null)
            ->assertJsonPath('data.url', 'https://example.com/private/42?utm_source=email')
            ->assertJsonPath('data.chat', null);

        $this->assertDatabaseCount('page_contexts', 0);
        $this->assertDatabaseCount('conversations', 0);

        $created = $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/page-chats', [
                'page_url' => 'https://example.com/private/42?utm_source=email',
                'page_title' => 'Edited page title',
                'chat_name' => 'Private record chat',
            ])
            ->assertCreated()
            ->assertJsonPath('data.persisted', true)
            ->assertJsonPath('data.title', 'Edited page title')
            ->assertJsonPath('data.chat.title', 'Private record chat')
            ->assertJsonCount(0, 'data.chat.messages');
        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/page-chats', [
                'page_url' => 'https://example.com/private/42?utm_source=email',
                'page_title' => 'Retry title',
                'chat_name' => 'Retry chat name',
            ])
            ->assertCreated()
            ->assertJsonPath('data.id', $created->json('data.id'))
            ->assertJsonPath('data.chat.id', $created->json('data.chat.id'));

        $this->assertDatabaseCount('page_contexts', 1);
        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_unsafe_and_fragment_routed_urls_are_rejected_before_persistence(): void
    {
        $normalizer = app(NormalizePageUrl::class);

        foreach ([
            'javascript:alert(1)',
            'https://user:secret@example.com/work',
            'https://example.com/signing/session-1',
            'https://example.com/work?access_token=secret',
            'https://example.com/#/records/42',
        ] as $url) {
            try {
                $normalizer->handle($url);
                $this->fail("Expected [{$url}] to be rejected.");
            } catch (ValidationException) {
                $this->assertTrue(true);
            }
        }

        $this->assertDatabaseCount('page_contexts', 0);
    }

    public function test_extension_api_does_not_leak_another_organizations_context(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $context = app(CreatePageChat::class)->handle(
            $owner->organization()->firstOrFail(),
            $owner,
            'https://example.com/private/42',
            'Private record',
            'Private record',
            null,
        );
        $token = $outsider->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDay(),
        );

        $this->withToken($token->plainTextToken)
            ->getJson('/api/v1/extension/page-contexts/'.$context->public_id)
            ->assertNotFound();
    }
}
