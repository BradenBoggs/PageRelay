<?php

namespace Tests\Feature\Conversations;

use App\Enums\ApiTokenAbility;
use App\Enums\ConversationType;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Conversation;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WorkChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_create_and_use_a_durable_chat_without_a_page(): void
    {
        $owner = User::factory()->create();
        $member = User::query()->create([
            'name' => 'Member',
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password',
        ]);
        $member->forceFill(['email_verified_at' => now()])->save();
        OrganizationMembership::query()->create([
            'organization_id' => $owner->organization()->firstOrFail()->id,
            'user_id' => $member->id,
            'role' => OrganizationRole::Member,
            'status' => OrganizationMembershipStatus::Active,
            'is_billable' => true,
            'joined_at' => now(),
        ]);
        $token = $member->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDay(),
        );
        $key = (string) Str::uuid();

        $created = $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/work-chats', [
                'title' => 'Dana Lewis',
                'idempotency_key' => $key,
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Dana Lewis')
            ->assertJsonPath('data.type', 'page')
            ->assertJsonPath('data.linked_pages', [])
            ->assertJsonPath('data.messages', []);

        $chatId = $created->json('data.id');

        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/work-chats', [
                'title' => 'A retry cannot rename it',
                'idempotency_key' => $key,
            ])
            ->assertCreated()
            ->assertJsonPath('data.id', $chatId)
            ->assertJsonPath('data.title', 'Dana Lewis');

        $this->withToken($token->plainTextToken)
            ->getJson('/api/v1/extension/discovery?surface=chats')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $chatId)
            ->assertJsonPath('data.0.message_count', 0)
            ->assertJsonPath('data.0.latest_message', null);

        $this->withToken($token->plainTextToken)
            ->getJson('/api/v1/extension/discovery?surface=activity')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $messageKey = (string) Str::uuid();
        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/work-chats/'.$chatId.'/messages', [
                'body' => 'Direct from Chats',
                'idempotency_key' => $messageKey,
            ])
            ->assertCreated()
            ->assertJsonPath('data.body', 'Direct from Chats')
            ->assertJsonPath('data.source', null);

        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/work-chats/'.$chatId.'/messages', [
                'body' => 'Retry body is ignored',
                'idempotency_key' => $messageKey,
            ])
            ->assertOk()
            ->assertJsonPath('data.body', 'Direct from Chats');

        $this->withToken($token->plainTextToken)
            ->getJson('/api/v1/extension/work-chats/'.$chatId)
            ->assertOk()
            ->assertJsonCount(1, 'data.messages')
            ->assertJsonPath('data.messages.0.source', null);

        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('messages', 1);
    }

    public function test_empty_work_chat_is_a_page_link_destination(): void
    {
        $owner = User::factory()->create();
        $token = $owner->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDay(),
        );
        $chat = $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/work-chats', [
                'title' => 'Dana Lewis',
                'idempotency_key' => (string) Str::uuid(),
            ])
            ->assertCreated();
        $chatId = $chat->json('data.id');

        $this->withToken($token->plainTextToken)
            ->getJson('/api/v1/extension/page-chats')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $chatId);

        $linked = $this->withToken($token->plainTextToken)
            ->putJson('/api/v1/extension/page-contexts/chat', [
                'conversation_id' => $chatId,
                'page_url' => 'https://app.supermove.co/projects/dana/view?block=SURVEY',
                'page_title' => 'Dana Lewis survey',
            ])
            ->assertOk()
            ->assertJsonPath('data.chat.id', $chatId);

        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/page-contexts/resolve', [
                'url' => 'https://app.supermove.co/projects/dana/view?block=SURVEY',
                'title' => 'Dana Lewis survey',
            ])
            ->assertOk()
            ->assertJsonPath('data.id', $linked->json('data.id'))
            ->assertJsonPath('data.chat.id', $chatId);

        $this->withToken($token->plainTextToken)
            ->deleteJson('/api/v1/extension/page-contexts/'.$linked->json('data.id').'/chat', [
                'expected_association_version' => $linked->json('data.association_version'),
            ])
            ->assertOk()
            ->assertJsonPath('data.chat', null);

        $this->assertDatabaseHas('conversations', [
            'public_id' => $chatId,
            'retired_at' => null,
        ]);
        $this->withToken($token->plainTextToken)
            ->getJson('/api/v1/extension/discovery?surface=chats')
            ->assertOk()
            ->assertJsonPath('data.0.id', $chatId);
    }

    public function test_web_creation_redirects_to_the_new_chat_and_empty_chat_is_listed(): void
    {
        $owner = User::factory()->create();

        $response = $this->actingAs($owner)->post('/chats', [
            'title' => 'Dana Lewis',
            'idempotency_key' => (string) Str::uuid(),
        ]);
        $chat = Conversation::query()->sole();

        $response->assertRedirect('/chats/'.$chat->public_id);
        $this->actingAs($owner)
            ->get('/chats')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('chats/index')
                ->has('chats.items', 1)
                ->where('chats.items.0.id', $chat->public_id)
                ->where('chats.items.0.message_count', 0)
                ->where('chats.items.0.latest_message', null));
    }

    public function test_direct_chat_endpoints_do_not_leak_another_organization(): void
    {
        $owner = User::factory()->create();
        $outside = User::factory()->create();
        $chat = Conversation::query()->create([
            'organization_id' => $owner->organization()->firstOrFail()->id,
            'workspace_id' => $owner->organization()->firstOrFail()->defaultWorkspace()->firstOrFail()->id,
            'type' => ConversationType::Page,
            'title' => 'Private work Chat',
            'created_by' => $owner->id,
        ]);
        $token = $outside->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDay(),
        );

        $this->withToken($token->plainTextToken)
            ->getJson('/api/v1/extension/work-chats/'.$chat->public_id)
            ->assertNotFound();
        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/work-chats/'.$chat->public_id.'/messages', [
                'body' => 'Not allowed',
                'idempotency_key' => (string) Str::uuid(),
            ])
            ->assertNotFound();

        $this->assertDatabaseCount('messages', 0);
    }
}
