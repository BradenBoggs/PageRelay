<?php

namespace Tests\Feature\Conversations;

use App\Enums\ConversationType;
use App\Events\MessageCreated;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ApplicationShellTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_detail_includes_scoped_discovery_without_marking_it_read(): void
    {
        $member = User::factory()->create();
        $selected = $this->chat($member, 'Selected work');
        $this->chat($member, 'Other work');
        $foreign = User::factory()->create();
        $this->chat($foreign, 'Private foreign work');

        $this->actingAs($member)->get('/chats/'.$selected->public_id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('chats/show')
                ->where('chat.id', $selected->public_id)
                ->where('surface', 'chats')
                ->where('chats.total', 2)
                ->has('chats.items', 2)
                ->where('filters.view', 'all')
                ->where('filters.query', '')
                ->where('filters.app', ''));

        $this->assertDatabaseCount('conversation_reads', 0);
    }

    public function test_filtering_does_not_silently_replace_the_selected_chat(): void
    {
        $member = User::factory()->create();
        $selected = $this->chat($member, 'Office move');
        $matching = $this->chat($member, 'Website review');

        $this->actingAs($member)->get('/chats/'.$selected->public_id.'?query=Website')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('chats/show')
                ->where('chat.id', $selected->public_id)
                ->where('filters.query', 'Website')
                ->where('chats.total', 1)
                ->where('chats.items.0.id', $matching->public_id));
    }

    public function test_selected_chat_can_keep_the_activity_surface_and_app_filter(): void
    {
        $member = User::factory()->create();
        $selected = $this->chat($member, 'Named empty work');

        $this->actingAs($member)->get('/chats/'.$selected->public_id.'?surface=activity&app=missing.example')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('chats/show')
                ->where('chat.id', $selected->public_id)
                ->where('surface', 'activity')
                ->where('filters.app', 'missing.example')
                ->where('chats.items', [])
                ->where('chats.total', 0));
    }

    public function test_pagination_keeps_the_selected_route_and_full_result_count(): void
    {
        $member = User::factory()->create();
        $selected = $this->chat($member, 'Work 0');
        for ($index = 1; $index <= 20; $index++) {
            $this->chat($member, 'Work '.$index);
        }

        $this->actingAs($member)->get('/chats/'.$selected->public_id.'?surface=chats&query=Work')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('chats/show')
                ->where('chats.total', 21)
                ->has('chats.items', 20)
                ->where('chats.nextPageUrl', fn ($url) => str_contains($url, '/chats/'.$selected->public_id)
                    && str_contains($url, 'page=2')
                    && str_contains($url, 'query=Work')));
    }

    public function test_detail_cannot_expose_another_organization(): void
    {
        $member = User::factory()->create();
        $foreign = User::factory()->create();
        $chat = $this->chat($foreign, 'Foreign secret');

        $this->actingAs($member)->get('/chats/'.$chat->public_id)->assertNotFound();
    }

    public function test_direct_sends_still_have_no_inferred_page_source(): void
    {
        Event::fake([MessageCreated::class]);
        $member = User::factory()->create();
        $chat = $this->chat($member, 'Direct chat');

        $this->actingAs($member)->post('/chats/'.$chat->public_id.'/messages', [
            'body' => 'Sent directly from the web shell.',
            'idempotency_key' => (string) Str::uuid(),
        ])->assertRedirect();

        $message = Message::query()->where('conversation_id', $chat->id)->firstOrFail();
        $this->assertNull($message->sourcePageContext);
    }

    private function chat(User $user, string $title): Conversation
    {
        $organization = $user->organization()->firstOrFail();

        return Conversation::query()->create([
            'organization_id' => $organization->id,
            'workspace_id' => $organization->defaultWorkspace()->firstOrFail()->id,
            'type' => ConversationType::Page,
            'title' => $title,
            'created_by' => $user->id,
        ]);
    }
}
