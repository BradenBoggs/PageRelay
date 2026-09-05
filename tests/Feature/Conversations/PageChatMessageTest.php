<?php

namespace Tests\Feature\Conversations;

use App\Domain\Conversations\CreatePageChat;
use App\Domain\Conversations\SendPageMessage;
use App\Domain\PageContexts\CreatePageContext;
use App\Enums\ApiTokenAbility;
use App\Events\MessageCreated;
use App\Exceptions\PageChatConflict;
use App\Models\Message;
use App\Models\PageContext;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Tests\TestCase;

class PageChatMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_requires_an_explicitly_created_or_linked_chat(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $context = app(CreatePageContext::class)->handle(
            $organization,
            $owner,
            'https://example.com/work/no-chat',
            'No chat',
            null,
        );

        try {
            app(SendPageMessage::class)->fromContext(
                $organization,
                $owner,
                $context,
                'Must not create a chat',
                (string) Str::uuid(),
                0,
            );
            $this->fail('Expected sending without a chat to fail.');
        } catch (PageChatConflict $exception) {
            $this->assertSame('chat_required', $exception->reason);
        }

        $this->assertNull($context->refresh()->conversation_id);
        $this->assertDatabaseCount('conversations', 0);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_send_to_an_explicitly_created_chat_is_idempotent(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $context = $this->resolve($owner, 'https://example.com/work/first');
        $key = (string) Str::uuid();
        $send = app(SendPageMessage::class);

        $first = $send->fromContext($organization, $owner, $context, ' First message ', $key, 1);
        $retry = $send->fromContext($organization, $owner, $context, 'Changed retry body', $key, 1);

        $context->refresh();
        $this->assertTrue($first->created);
        $this->assertFalse($retry->created);
        $this->assertTrue($first->message->is($retry->message));
        $this->assertSame('First message', $first->message->body);
        $this->assertSame($context->id, $first->message->source_page_context_id);
        $this->assertNotNull($context->conversation_id);
        $this->assertSame(1, $context->association_version);
        $this->assertSame(1, Message::count());
    }

    public function test_extension_send_rejects_a_stale_draft_and_keeps_the_body_client_side(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $context = $this->resolve($owner, 'https://example.com/work/stale');
        $token = $owner->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDay(),
        );
        $context->forceFill(['association_version' => 2])->save();

        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/page-contexts/'.$context->public_id.'/messages', [
                'body' => 'Keep this draft',
                'idempotency_key' => (string) Str::uuid(),
                'expected_association_version' => 1,
            ])
            ->assertConflict()
            ->assertJsonPath('reason', 'stale_association');

        $this->assertDatabaseCount('messages', 0);
    }

    public function test_two_drafts_join_the_same_explicitly_created_page_chat(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $context = $this->resolve($owner, 'https://example.com/work/concurrent');
        $send = app(SendPageMessage::class);

        $first = $send->fromContext(
            $organization,
            $owner,
            $context,
            'First draft',
            (string) Str::uuid(),
            1,
        );
        $second = $send->fromContext(
            $organization,
            $owner,
            $context,
            'Concurrent draft',
            (string) Str::uuid(),
            1,
        );

        $this->assertSame($first->message->conversation_id, $second->message->conversation_id);
        $this->assertSame(1, $organization->conversations()->count());
        $this->assertSame(2, $organization->conversations()->firstOrFail()->messages()->count());
    }

    public function test_web_send_has_no_inferred_page_source(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $context = $this->resolve($owner, 'https://example.com/work/web');
        $first = app(SendPageMessage::class)->fromContext(
            $organization,
            $owner,
            $context,
            'From the panel',
            (string) Str::uuid(),
            1,
        );

        $this->actingAs($owner)
            ->post('/chats/'.$first->message->conversation->public_id.'/messages', [
                'body' => 'From the web',
                'idempotency_key' => (string) Str::uuid(),
            ])
            ->assertRedirect();

        $this->assertNull(Message::query()->latest('id')->firstOrFail()->source_page_context_id);
    }

    private function resolve(User $user, string $url): PageContext
    {
        return app(CreatePageChat::class)->handle(
            $user->organization()->firstOrFail(),
            $user,
            $url,
            'Work page',
            'Work page',
            null,
        );
    }
}
