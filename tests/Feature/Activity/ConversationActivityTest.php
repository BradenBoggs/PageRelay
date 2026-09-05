<?php

namespace Tests\Feature\Activity;

use App\Domain\Activity\MarkConversationRead;
use App\Domain\Conversations\CreatePageChat;
use App\Domain\Conversations\LinkPageContext;
use App\Domain\Conversations\SendPageMessage;
use App\Domain\Conversations\UnlinkPageContext;
use App\Enums\ApiTokenAbility;
use App\Enums\ConversationType;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Events\MessageCreated;
use App\Models\Conversation;
use App\Models\ConversationRead;
use App\Models\Message;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\PageContext;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ConversationActivityTest extends TestCase
{
    use RefreshDatabase;

    public function test_read_position_is_monotonic_and_scoped_to_the_chat(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $member = $this->member($organization);
        $context = $this->resolve($owner, 'https://one.example/work/1');
        $first = $this->send($organization, $owner, $context, 'First');
        $second = $this->send($organization, $owner, $context, 'Second');

        $this->actingAs($member)
            ->post('/chats/'.$second->conversation->public_id.'/read', [
                'message_id' => $second->public_id,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();
        $this->actingAs($member)
            ->post('/chats/'.$first->conversation->public_id.'/read', [
                'message_id' => $first->public_id,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $read = ConversationRead::query()->sole();
        $this->assertSame($second->id, $read->last_read_message_id);

        $otherWorkspace = Workspace::factory()->create([
            'organization_id' => $organization->id,
            'is_default' => false,
        ]);
        $otherWorkspaceChat = Conversation::create([
            'organization_id' => $organization->id,
            'workspace_id' => $otherWorkspace->id,
            'type' => ConversationType::Page,
            'title' => 'Other workspace',
            'created_by' => $owner->id,
        ]);
        $otherWorkspaceMessage = Message::factory()->create([
            'organization_id' => $organization->id,
            'workspace_id' => $otherWorkspace->id,
            'conversation_id' => $otherWorkspaceChat->id,
            'author_id' => $owner->id,
        ]);

        $this->actingAs($member)
            ->get('/chats/'.$otherWorkspaceChat->public_id)
            ->assertNotFound();
        $this->actingAs($member)
            ->post('/chats/'.$otherWorkspaceChat->public_id.'/read', [
                'message_id' => $otherWorkspaceMessage->public_id,
            ])
            ->assertNotFound();

        $outside = User::factory()->create();
        $outsideOrganization = $outside->organization()->firstOrFail();
        $outsideContext = $this->resolve($outside, 'https://outside.example/work');
        $outsideMessage = $this->send($outsideOrganization, $outside, $outsideContext, 'Outside');
        $token = $member->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDay(),
        );
        auth()->logout();

        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/page-chats/'.$otherWorkspaceChat->public_id.'/read', [
                'message_id' => $otherWorkspaceMessage->public_id,
            ])
            ->assertNotFound();

        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/page-chats/'.$outsideMessage->conversation->public_id.'/read', [
                'message_id' => $outsideMessage->public_id,
            ])
            ->assertNotFound();
        $this->assertDatabaseCount('conversation_reads', 1);
    }

    public function test_activity_is_relevant_and_unread_state_is_shared_across_linked_apps(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $member = $this->member($organization);
        $firstContext = $this->resolve($owner, 'https://one.example/work/1');
        $firstMessage = $this->send($organization, $owner, $firstContext, 'Initial update');
        $secondContext = $this->resolve($owner, 'https://two.example/work/2');
        app(LinkPageContext::class)->handle(
            $organization,
            $owner,
            $secondContext,
            $firstMessage->conversation,
            1,
        );

        $this->actingAs($member)
            ->get('/activity')
            ->assertInertia(fn (Assert $page) => $page
                ->component('activity/index')
                ->where('chats.items', []));

        app(MarkConversationRead::class)->handle(
            $organization,
            $member,
            $firstMessage->conversation,
            $firstMessage->public_id,
        );
        $latest = $this->send(
            $organization,
            $owner,
            $firstContext->refresh(),
            'Unread update',
        );

        foreach (['one.example', 'two.example'] as $app) {
            $this->actingAs($member)
                ->get('/activity?view=unread&app='.$app)
                ->assertInertia(fn (Assert $page) => $page
                    ->component('activity/index')
                    ->has('chats.items', 1)
                    ->where('chats.items.0.id', $latest->conversation->public_id)
                    ->where('chats.items.0.unread_count', 1)
                    ->has('chats.items.0.linked_pages', 2));
        }

        app(UnlinkPageContext::class)->handle(
            $organization,
            $owner,
            $secondContext->refresh(),
            2,
        );
        app(UnlinkPageContext::class)->handle(
            $organization,
            $owner,
            $firstContext->refresh(),
            1,
        );

        $this->actingAs($member)
            ->get('/activity?view=unread')
            ->assertInertia(fn (Assert $page) => $page
                ->has('chats.items', 1)
                ->where('chats.items.0.unread_count', 1)
                ->where('chats.items.0.linked_pages', []));
        $this->assertDatabaseHas('conversation_reads', [
            'organization_id' => $organization->id,
            'user_id' => $member->id,
            'conversation_id' => $latest->conversation_id,
            'last_read_message_id' => $firstMessage->id,
        ]);
    }

    public function test_extension_and_web_use_the_same_read_state_and_discovery_filters(): void
    {
        Event::fake([MessageCreated::class]);
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $member = $this->member($organization);
        $context = $this->resolve($owner, 'https://work.example/records/1');
        $message = $this->send($organization, $owner, $context, 'Known milestone update');
        $token = $member->createToken(
            'Chrome extension',
            [ApiTokenAbility::ExtensionAccess->value],
            now()->addDay(),
        );

        $this->withToken($token->plainTextToken)
            ->getJson('/api/v1/extension/discovery?surface=chats&query=milestone&app=work.example')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $message->conversation->public_id)
            ->assertJsonPath('data.0.unread_count', 1)
            ->assertJsonPath('meta.apps.0.id', 'work.example');

        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/extension/page-chats/'.$message->conversation->public_id.'/read', [
                'message_id' => $message->public_id,
            ])
            ->assertOk()
            ->assertJsonPath('data.message_id', $message->public_id);

        $this->withToken($token->plainTextToken)
            ->getJson('/api/v1/extension/discovery?surface=activity&view=all')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.unread_count', 0);

        $this->actingAs($member)
            ->get('/chats?view=unread')
            ->assertInertia(fn (Assert $page) => $page
                ->component('chats/index')
                ->where('chats.items', []));
    }

    private function member(Organization $organization): User
    {
        $member = User::create([
            'name' => 'Member',
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password',
        ]);
        $member->forceFill(['email_verified_at' => now()])->save();
        OrganizationMembership::create([
            'organization_id' => $organization->id,
            'user_id' => $member->id,
            'role' => OrganizationRole::Member,
            'status' => OrganizationMembershipStatus::Active,
            'is_billable' => true,
            'joined_at' => now(),
        ]);

        return $member;
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

    private function send(
        Organization $organization,
        User $author,
        PageContext $context,
        string $body,
    ): Message {
        return app(SendPageMessage::class)->fromContext(
            $organization,
            $author,
            $context,
            $body,
            (string) Str::uuid(),
            (int) ($context->association_version ?? 0),
        )->message;
    }
}
