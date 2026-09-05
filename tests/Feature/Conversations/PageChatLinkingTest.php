<?php

namespace Tests\Feature\Conversations;

use App\Domain\Conversations\CreatePageChat;
use App\Domain\Conversations\LinkPageContext;
use App\Domain\Conversations\SendPageMessage;
use App\Domain\Conversations\UnlinkPageContext;
use App\Domain\PageContexts\CreatePageContext;
use App\Enums\ApiTokenAbility;
use App\Enums\ConversationType;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Events\MessageCreated;
use App\Exceptions\PageChatConflict;
use App\Models\Conversation;
use App\Models\OrganizationActivity;
use App\Models\OrganizationMembership;
use App\Models\PageContext;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Tests\TestCase;

class PageChatLinkingTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_link_an_ephemeral_page_without_creating_an_extra_chat(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $destination = $this->createChat($owner, 'https://destination.example/work');
        $token = $owner->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDay(),
        );
        $payload = [
            'conversation_id' => $destination->conversation->public_id,
            'page_url' => 'https://source.example/work?utm_source=email',
            'page_title' => 'Edited source page',
        ];

        $first = $this->withToken($token->plainTextToken)
            ->putJson('/api/v1/extension/page-contexts/chat', $payload)
            ->assertOk()
            ->assertJsonPath('data.persisted', true)
            ->assertJsonPath('data.title', 'Edited source page')
            ->assertJsonPath('data.chat.id', $destination->conversation->public_id);
        $this->withToken($token->plainTextToken)
            ->putJson('/api/v1/extension/page-contexts/chat', $payload)
            ->assertOk()
            ->assertJsonPath('data.id', $first->json('data.id'));

        $this->assertDatabaseCount('page_contexts', 2);
        $this->assertDatabaseCount('conversations', 1);
        $this->assertSame(1, OrganizationActivity::where('event', 'linked')->count());
    }

    public function test_manager_can_reassign_an_empty_chat_context_idempotently(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $destinationContext = $this->createChat($owner, 'https://supermove.example/projects/42');
        $sent = app(SendPageMessage::class)->fromContext(
            $organization,
            $owner,
            $destinationContext,
            'Shared history',
            (string) Str::uuid(),
            1,
        );
        $source = $this->createChat($owner, 'https://docusign.example/agreements/7');
        $link = app(LinkPageContext::class);

        $linked = $link->handle($organization, $owner, $source, $sent->message->conversation, 1);
        $retry = $link->handle($organization, $owner, $linked, $sent->message->conversation, 1);

        $this->assertSame($sent->message->conversation_id, $linked->conversation_id);
        $this->assertSame($linked->id, $retry->id);
        $this->assertSame(1, OrganizationActivity::where('event', 'linked')->count());
    }

    public function test_linking_a_different_nonempty_chat_fails_without_moving_history(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $first = $this->createChat($owner, 'https://one.example/work/1');
        $second = $this->createChat($owner, 'https://two.example/work/2');
        $send = app(SendPageMessage::class);
        $firstMessage = $send->fromContext($organization, $owner, $first, 'First history', (string) Str::uuid(), 1)->message;
        $secondMessage = $send->fromContext($organization, $owner, $second, 'Second history', (string) Str::uuid(), 1)->message;

        try {
            app(LinkPageContext::class)->handle(
                $organization,
                $owner,
                $first->refresh(),
                $secondMessage->conversation,
                1,
            );
            $this->fail('Expected a nonempty source chat conflict.');
        } catch (PageChatConflict $exception) {
            $this->assertSame('source_chat_not_empty', $exception->reason);
        }

        $this->assertSame($firstMessage->conversation_id, $first->refresh()->conversation_id);
        $this->assertDatabaseCount('messages', 2);
    }

    public function test_unlink_preserves_history_and_historical_source_attribution(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $context = $this->createChat($owner, 'https://example.com/work/unlink');
        $message = app(SendPageMessage::class)->fromContext(
            $organization,
            $owner,
            $context,
            'Permanent history',
            (string) Str::uuid(),
            1,
        )->message;

        $unlinked = app(UnlinkPageContext::class)->handle($organization, $owner, $context->refresh(), 1);
        $retry = app(UnlinkPageContext::class)->handle($organization, $owner, $unlinked, 1);

        $this->assertNull($unlinked->conversation_id);
        $this->assertNull($retry->conversation_id);
        $this->assertSame($context->id, $message->refresh()->source_page_context_id);
        $this->assertNull($message->conversation->retired_at);
        $this->assertSame(1, OrganizationActivity::where('event', 'unlinked')->count());
    }

    public function test_ordinary_member_cannot_use_linking_endpoint(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $member = User::create([
            'name' => 'Member',
            'email' => 'member@example.com',
            'email_verified_at' => now(),
            'password' => 'password',
        ]);
        OrganizationMembership::create([
            'organization_id' => $organization->id,
            'user_id' => $member->id,
            'role' => OrganizationRole::Member,
            'status' => OrganizationMembershipStatus::Active,
            'is_billable' => true,
            'joined_at' => now(),
        ]);
        $source = $this->createContext($owner, 'https://source.example/work');
        $destination = $this->createChat($owner, 'https://destination.example/work');
        $chat = app(SendPageMessage::class)->fromContext(
            $organization,
            $owner,
            $destination,
            'Destination',
            (string) Str::uuid(),
            1,
        )->message->conversation;
        $token = $member->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDay(),
        );

        $this->withToken($token->plainTextToken)
            ->putJson('/api/v1/extension/page-contexts/'.$source->public_id.'/chat', [
                'conversation_id' => $chat->public_id,
                'expected_association_version' => 0,
            ])
            ->assertForbidden();
    }

    public function test_ineligible_destination_scopes_do_not_leak_or_change_the_context(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $workspace = $organization->defaultWorkspace()->firstOrFail();
        $source = $this->createContext($owner, 'https://source.example/scoped');
        $outsider = User::factory()->create();
        $outsideContext = $this->createChat($outsider, 'https://outside.example/work');
        $outsideChat = app(SendPageMessage::class)->fromContext(
            $outsider->organization()->firstOrFail(),
            $outsider,
            $outsideContext,
            'Outside',
            (string) Str::uuid(),
            1,
        )->message->conversation;
        $otherWorkspace = Workspace::factory()->create([
            'organization_id' => $organization->id,
        ]);
        $destinations = [
            $outsideChat,
            Conversation::create([
                'organization_id' => $organization->id,
                'workspace_id' => $otherWorkspace->id,
                'type' => ConversationType::Page,
                'title' => 'Other workspace',
                'created_by' => $owner->id,
            ]),
            Conversation::create([
                'organization_id' => $organization->id,
                'workspace_id' => $workspace->id,
                'type' => ConversationType::Organization,
                'title' => 'Organization chat',
                'created_by' => $owner->id,
            ]),
            Conversation::create([
                'organization_id' => $organization->id,
                'workspace_id' => $workspace->id,
                'type' => ConversationType::Direct,
                'title' => 'Direct chat',
                'created_by' => $owner->id,
            ]),
        ];
        $token = $owner->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDay(),
        );

        foreach ($destinations as $destination) {
            $this->withToken($token->plainTextToken)
                ->putJson('/api/v1/extension/page-contexts/'.$source->public_id.'/chat', [
                    'conversation_id' => $destination->public_id,
                    'expected_association_version' => 0,
                ])
                ->assertNotFound();
        }

        $this->assertNull($source->refresh()->conversation_id);
    }

    private function createChat(User $user, string $url): PageContext
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

    private function createContext(User $user, string $url): PageContext
    {
        return app(CreatePageContext::class)->handle(
            $user->organization()->firstOrFail(),
            $user,
            $url,
            'Work page',
            null,
        );
    }
}
