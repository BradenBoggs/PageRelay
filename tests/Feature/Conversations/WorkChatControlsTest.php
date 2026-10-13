<?php

namespace Tests\Feature\Conversations;

use App\Domain\Activity\MarkConversationRead;
use App\Domain\Conversations\CreatePageChat;
use App\Domain\Conversations\CreateWorkChat;
use App\Domain\Conversations\RenameWorkChat;
use App\Enums\ApiTokenAbility;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageNotification;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class WorkChatControlsTest extends TestCase
{
    use RefreshDatabase;

    private function coworker(User $owner, OrganizationRole $role): User
    {
        $user = User::query()->create(['name' => 'Coworker', 'email' => fake()->unique()->safeEmail(), 'password' => 'password']);
        $user->forceFill(['email_verified_at' => now()])->save();
        OrganizationMembership::create([
            'organization_id' => $owner->organization()->firstOrFail()->id, 'user_id' => $user->id,
            'role' => $role, 'status' => OrganizationMembershipStatus::Active, 'is_billable' => true, 'joined_at' => now(),
        ]);

        return $user;
    }

    private function chat(User $owner): Conversation
    {
        $organization = $owner->organization()->firstOrFail();

        return app(CreateWorkChat::class)->handle($organization, $owner, 'Original chat', (string) Str::uuid());
    }

    public function test_members_cannot_create_or_rename_but_can_read_and_send(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner, OrganizationRole::Member);
        $chat = $this->chat($owner);
        $input = ['title' => 'Forbidden', 'idempotency_key' => (string) Str::uuid()];
        $this->actingAs($member)->post('/chats', $input)->assertForbidden();
        $this->get('/chats')->assertInertia(fn (Assert $page) => $page->where('canCreateWorkChats', false));
        $this->patchJson('/collaboration/chats/'.$chat->public_id, ['title' => 'Forbidden'])->assertForbidden();
        $this->getJson('/collaboration/chats')->assertOk()->assertJsonPath('data.0.can_edit', false);
        $this->postJson('/collaboration/chats/'.$chat->public_id.'/messages', [
            'body' => 'Members still communicate', 'idempotency_key' => (string) Str::uuid(), 'mentioned_user_ids' => [],
        ])->assertCreated();
        $token = $member->createToken('test extension', [ApiTokenAbility::ExtensionAccess->value]);
        $this->app['auth']->forgetGuards();
        $this->withToken($token->plainTextToken)->postJson('/api/v1/extension/work-chats', $input)->assertForbidden();
        $this->postJson('/api/v1/extension/page-chats', [
            'page_url' => 'https://example.test/record', 'page_title' => 'Record', 'chat_name' => 'Forbidden',
        ])->assertForbidden();
        $this->patchJson('/api/v1/extension/collaboration/chats/'.$chat->public_id, ['title' => 'Forbidden'])->assertForbidden();
        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('page_contexts', 0);
        $this->assertSame('Original chat', $chat->fresh()->title);
    }

    public function test_owners_and_admins_can_create_and_rename_without_changing_history(): void
    {
        $owner = User::factory()->create();
        $admin = $this->coworker($owner, OrganizationRole::Administrator);
        $chat = $this->chat($owner);
        foreach ([$owner, $admin] as $actor) {
            $this->flushHeaders();
            $this->app['auth']->forgetGuards();
            $this->actingAs($actor)->get('/chats')->assertInertia(fn (Assert $page) => $page->where('canCreateWorkChats', true));
            $this->post('/chats', ['title' => 'Admin-created', 'idempotency_key' => (string) Str::uuid()])->assertRedirect();
            $this->patchJson('/collaboration/chats/'.$chat->public_id, ['title' => 'Renamed '.$actor->id])
                ->assertOk()->assertJsonPath('data.title', 'Renamed '.$actor->id)->assertJsonPath('data.can_edit', true);
            $token = $actor->createToken('test extension', [ApiTokenAbility::ExtensionAccess->value]);
            $this->app['auth']->forgetGuards();
            $this->withToken($token->plainTextToken)->patchJson('/api/v1/extension/collaboration/chats/'.$chat->public_id, ['title' => 'Panel name'])
                ->assertOk()->assertJsonPath('data.id', $chat->public_id);
        }
        $this->assertDatabaseCount('messages', 0);
        $this->assertSame($owner->id, $chat->fresh()->created_by);
    }

    public function test_rename_rejects_empty_names_other_tenants_retired_chats_and_dms(): void
    {
        $owner = User::factory()->create();
        $otherOwner = User::factory()->create();
        $chat = $this->chat($owner);
        $this->actingAs($owner)->patchJson('/collaboration/chats/'.$chat->public_id, ['title' => '   '])->assertUnprocessable();
        $this->patchJson('/collaboration/chats/'.$chat->public_id, ['title' => str_repeat('a', 256)])->assertUnprocessable();
        $this->actingAs($otherOwner)->patchJson('/collaboration/chats/'.$chat->public_id, ['title' => 'Stolen'])->assertNotFound();
        $chat->update(['retired_at' => now()]);
        $this->actingAs($owner)->patchJson('/collaboration/chats/'.$chat->public_id, ['title' => 'Retired'])->assertForbidden();
        $peer = $this->coworker($owner, OrganizationRole::Member);
        $dm = $this->postJson('/collaboration/direct', ['recipient_id' => $peer->id])->assertCreated()->json('data.id');
        $this->patchJson('/collaboration/chats/'.$dm, ['title' => 'DM'])->assertForbidden();
    }

    public function test_transactional_commands_recheck_member_roles_including_demoted_creators(): void
    {
        $owner = User::factory()->create();
        $admin = $this->coworker($owner, OrganizationRole::Administrator);
        $org = $owner->organization()->firstOrFail();
        $key = (string) Str::uuid();
        $chat = app(CreateWorkChat::class)->handle($org, $admin, 'Before demotion', $key);
        $admin->organizationMembership()->update(['role' => OrganizationRole::Member]);
        foreach ([
            fn () => app(CreateWorkChat::class)->handle($org, $admin, 'Retry', $key),
            fn () => app(CreatePageChat::class)->handle($org, $admin, 'https://example.test/no-write', 'Page', 'Chat', null),
            fn () => app(RenameWorkChat::class)->handle($admin, $chat, 'Renamed'),
        ] as $command) {
            try {
                $command();
                $this->fail('A demoted admin must be denied.');
            } catch (HttpException $failure) {
                $this->assertSame(403, $failure->getStatusCode());
            }
        }
        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('page_contexts', 0);
        $admin->organizationMembership()->update(['status' => OrganizationMembershipStatus::Removed]);
        $this->actingAs($admin)->patchJson('/collaboration/chats/'.$chat->public_id, ['title' => 'Removed'])->assertForbidden();
    }

    public function test_unread_counts_and_incoming_cursor_ignore_own_deleted_and_seen_messages(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner, OrganizationRole::Member);
        $outside = User::factory()->create();
        $chat = $this->chat($owner);
        $foreign = $this->chat($outside);
        $root = $this->message($chat, $owner);
        $own = $this->message($chat, $member);
        $deleted = $this->message($chat, $owner);
        $deleted->forceFill(['deleted_at' => now()])->save();
        $reply = $this->message($chat, $owner, $root);
        $this->message($foreign, $outside);
        $this->actingAs($member)->getJson('/collaboration/chats')->assertJsonPath('data.0.unread_count', 2);
        $initial = $this->getJson('/collaboration/updates')->assertOk()->assertJsonPath('incoming', false)
            ->assertJsonPath('unread_counts.'.$chat->public_id, 2)->json();
        $this->assertCount(1, $initial['unread_counts']);
        $this->getJson('/collaboration/updates?after='.$initial['cursor'])->assertJsonPath('incoming', false);
        $this->postJson('/collaboration/chats/'.$chat->public_id.'/read', ['messages' => [$own->public_id]])->assertOk();
        $this->getJson('/collaboration/updates')->assertJsonPath('unread_counts.'.$chat->public_id, 2);
        $this->postJson('/collaboration/chats/'.$chat->public_id.'/read', ['messages' => [$root->public_id]])->assertOk();
        $this->getJson('/collaboration/updates')->assertJsonPath('unread_counts.'.$chat->public_id, 1);
        $this->postJson('/collaboration/chats/'.$chat->public_id.'/read', ['messages' => [$reply->public_id]])->assertOk();
        $this->postJson('/collaboration/chats/'.$chat->public_id.'/read', ['messages' => [$reply->public_id]])->assertOk();
        $this->assertDatabaseCount('message_reads', 3);
        $this->getJson('/collaboration/updates')->assertJsonPath('unread_counts.'.$chat->public_id, 0);
        $this->message($chat, $member);
        $this->getJson('/collaboration/updates?after='.$initial['cursor'])->assertJsonPath('incoming', false);
        $incoming = $this->message($chat, $owner);
        $next = $this->getJson('/collaboration/updates?after='.$initial['cursor'])->assertJsonPath('incoming', true)->json('cursor');
        $incoming->update(['body' => 'Edited']);
        $this->getJson('/collaboration/updates?after='.$next)->assertJsonPath('incoming', false);
        $incoming->forceFill(['deleted_at' => now()])->save();
        $this->getJson('/collaboration/updates?after='.$next)->assertJsonPath('incoming', false)->assertJsonPath('unread_counts.'.$chat->public_id, 0);
        $this->get('/chats?view=unread')->assertInertia(fn (Assert $page) => $page->has('chats.items', 0));
        $this->postJson('/collaboration/chats/'.$chat->public_id.'/read', ['messages' => [$foreign->public_id]])->assertNotFound();
    }

    public function test_read_migration_preserves_existing_root_positions_and_seen_replies(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner, OrganizationRole::Member);
        $chat = $this->chat($owner);
        $root = $this->message($chat, $owner);
        $reply = $this->message($chat, $owner, $root);
        $unseen = $this->message($chat, $owner, $root);
        app(MarkConversationRead::class)->handle($owner->organization()->firstOrFail(), $member, $chat, $root->public_id);
        MessageNotification::create([
            'public_id' => (string) Str::uuid(), 'organization_id' => $chat->organization_id,
            'conversation_id' => $chat->id, 'message_id' => $reply->id, 'user_id' => $member->id, 'reason' => 'thread',
        ])->forceFill(['read_at' => now()])->save();
        $migration = require database_path('migrations/2026_10_13_160000_create_message_reads_table.php');
        $migration->down();
        $migration->up();
        $this->assertDatabaseCount('message_reads', 2);
        $this->assertDatabaseMissing('message_reads', ['message_id' => $unseen->id]);
        $this->actingAs($member)->getJson('/collaboration/updates')->assertJsonPath('unread_counts.'.$chat->public_id, 1);
    }

    private function message(Conversation $chat, User $author, ?Message $root = null): Message
    {
        return Message::create([
            'organization_id' => $chat->organization_id, 'workspace_id' => $chat->workspace_id,
            'conversation_id' => $chat->id, 'author_id' => $author->id, 'thread_root_id' => $root?->id,
            'idempotency_key' => (string) Str::uuid(), 'body' => 'Message',
        ]);
    }
}
