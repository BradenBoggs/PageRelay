<?php

namespace Tests\Feature\Conversations;

use App\Domain\Conversations\CreatePageChat;
use App\Domain\Conversations\SendPageMessage;
use App\Enums\ConversationType;
use App\Events\MessageCreated;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ChatIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_the_chats_index(): void
    {
        $this->get('/chats')->assertRedirect('/login');
    }

    public function test_member_sees_recent_authorized_page_chats_with_history(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();

        $historical = $this->createChat($owner, 'Historical chat', 'Earlier message');

        $context = app(CreatePageChat::class)->handle(
            $organization,
            $owner,
            'https://example.com/work/current',
            'Current work page',
            'Current work page',
            null,
        );
        $current = app(SendPageMessage::class)->fromContext(
            $organization,
            $owner,
            $context,
            'Most recent message',
            (string) Str::uuid(),
            1,
        )->message->conversation;

        Conversation::query()->create([
            'organization_id' => $organization->id,
            'workspace_id' => $organization->defaultWorkspace()->firstOrFail()->id,
            'type' => ConversationType::Page,
            'title' => 'Empty chat',
            'created_by' => $owner->id,
        ]);

        $retired = $this->createChat($owner, 'Retired chat', 'Retired message');
        $retired->forceFill(['retired_at' => now()])->save();

        $organizationChat = $this->createChat($owner, 'Organization chat', 'General message');
        $organizationChat->forceFill(['type' => ConversationType::Organization])->save();

        $otherMember = User::factory()->create();
        $this->createChat($otherMember, 'Another organization', 'Private message');

        $this->actingAs($owner)
            ->get('/chats')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('chats/index')
                ->where('surface', 'chats')
                ->has('chats.items', 2)
                ->where('chats.items.0.id', $current->public_id)
                ->where('chats.items.0.title', 'Current work page')
                ->where('chats.items.0.message_count', 1)
                ->where('chats.items.0.latest_message.body', 'Most recent message')
                ->where('chats.items.0.latest_message.author.name', $owner->name)
                ->has('chats.items.0.linked_pages', 1)
                ->where('chats.items.0.linked_pages.0.host', 'example.com')
                ->where('chats.items.1.id', $historical->public_id)
                ->where('chats.items.1.title', 'Historical chat')
                ->where('chats.items.1.linked_pages', [])
                ->where('chats.previousPageUrl', null)
                ->where('chats.nextPageUrl', null));
    }

    public function test_index_has_an_explicit_empty_state_payload(): void
    {
        $owner = User::factory()->create();

        $this->actingAs($owner)
            ->get('/chats')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('chats/index')
                ->where('chats.items', [])
                ->where('chats.previousPageUrl', null)
                ->where('chats.nextPageUrl', null));
    }

    private function createChat(
        User $user,
        string $title,
        string $body,
    ): Conversation {
        /** @var Organization $organization */
        $organization = $user->organization()->firstOrFail();
        $workspace = $organization->defaultWorkspace()->firstOrFail();
        $chat = Conversation::query()->create([
            'organization_id' => $organization->id,
            'workspace_id' => $workspace->id,
            'type' => ConversationType::Page,
            'title' => $title,
            'created_by' => $user->id,
        ]);

        Message::query()->create([
            'organization_id' => $organization->id,
            'workspace_id' => $workspace->id,
            'conversation_id' => $chat->id,
            'author_id' => $user->id,
            'idempotency_key' => (string) Str::uuid(),
            'body' => $body,
        ]);

        return $chat;
    }
}
