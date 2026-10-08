<?php

namespace Tests\Feature\Conversations;

use App\Enums\ApiTokenAbility;
use App\Enums\ConversationType;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Events\MessageCreated;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageNotification;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PilotCollaborationTest extends TestCase
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

    public function test_one_to_one_chat_reopens_the_same_pair_from_either_client(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $id = $this->direct($owner, $member);
        $this->assertSame($id, $this->direct($member, $owner));
        $this->assertDatabaseCount('conversation_participants', 2);
        $this->assertSame(1, Conversation::query()->where('type', ConversationType::Direct)->count());
        $this->actingAs($member)->getJson('/collaboration/chats?kind=direct')->assertOk()->assertJsonPath('data.0.id', $id);
    }

    public function test_self_and_other_organization_cannot_be_dm_recipients(): void
    {
        $owner = User::factory()->create();
        $outside = User::factory()->create();
        foreach ([$owner, $outside] as $recipient) {
            $this->actingAs($owner)->postJson('/collaboration/direct', ['recipient_id' => $recipient->id])->assertUnprocessable();
        }
        $this->assertDatabaseCount('conversation_participants', 0);
    }

    public function test_nonparticipant_administrator_cannot_discover_read_write_or_subscribe_to_dm(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $admin = $this->coworker($owner, OrganizationRole::Administrator);
        $id = $this->direct($owner, $member);
        $this->actingAs($admin)->getJson('/collaboration/chats?kind=direct')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs($admin)->getJson('/collaboration/chats/'.$id.'/messages')->assertNotFound();
        $this->actingAs($admin)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload())->assertNotFound();
        $this->actingAs($admin)->getJson('/collaboration/members?chat='.$id)->assertNotFound();
        $this->actingAs($admin)->postJson('/broadcasting/auth', [
            'socket_id' => '123.456', 'channel_name' => 'private-organizations.'.$owner->organization()->firstOrFail()->id.'.conversations.'.$id,
        ])->assertForbidden();
    }

    public function test_cross_organization_history_and_notification_reads_are_blocked(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $outside = User::factory()->create();
        $id = $this->direct($owner, $member);
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload())->assertCreated();
        $notice = MessageNotification::query()->sole();
        $this->actingAs($outside)->getJson('/collaboration/chats/'.$id.'/messages')->assertNotFound();
        $this->actingAs($outside)->postJson('/collaboration/notifications/'.$notice->public_id.'/claim', [])->assertNotFound();
        $this->actingAs($outside)->getJson('/collaboration/notifications')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_direct_message_cannot_carry_an_inferred_page_source(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $id = $this->direct($owner, $member);
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload(['source_context_id' => (string) Str::uuid()]))->assertUnprocessable();
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_mentions_replies_and_dm_reason_overlap_create_one_event_not_three(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $id = $this->direct($owner, $member);
        $root = $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload())->assertCreated()->json('data.id');
        $reply = $this->actingAs($member)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload([
            'body' => 'Please confirm @Owner', 'thread_root_id' => $root, 'mentions' => [$owner->id],
        ]))->assertCreated()->assertJsonPath('data.thread_root_id', $root)->json('data.id');
        $replyModel = Message::query()->where('public_id', $reply)->firstOrFail();
        $this->assertSame(1, MessageNotification::query()->where('message_id', $replyModel->id)->count());
        $this->assertDatabaseHas('message_notifications', ['user_id' => $owner->id, 'message_id' => $replyModel->id, 'reason' => 'mention']);
        $this->actingAs($owner)->getJson('/collaboration/chats/'.$id.'/messages')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.reply_count', 1);
        $this->actingAs($owner)->getJson('/collaboration/chats/'.$id.'/messages?thread='.$root)->assertOk()->assertJsonPath('data.0.id', $reply)->assertJsonPath('root.id', $root);
    }

    public function test_message_retry_is_idempotent_and_changed_payload_does_not_reuse_a_send(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $id = $this->direct($owner, $member);
        $payload = $this->payload(['mentions' => [$member->id]]);
        $sent = $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $payload)->assertCreated()->json('data.id');
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $payload)->assertOk()->assertJsonPath('data.id', $sent);
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', [...$payload, 'body' => 'Different draft'])->assertUnprocessable();
        $this->assertDatabaseCount('messages', 1);
        $this->assertDatabaseCount('message_notifications', 1);
    }

    public function test_plain_at_text_does_not_notify_and_resolved_mentions_do(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $chat = $this->workChat($owner);
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$chat->public_id.'/messages', $this->payload(['body' => '@Someone please check']))->assertCreated();
        $this->assertDatabaseCount('message_notifications', 0);
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$chat->public_id.'/messages', $this->payload(['mentions' => [$member->id]]))->assertCreated();
        $this->assertDatabaseHas('message_notifications', ['user_id' => $member->id, 'reason' => 'mention']);
    }

    public function test_mention_cannot_grant_access_to_dm_or_cross_an_organization(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $nonparticipant = $this->coworker($owner);
        $outside = User::factory()->create();
        $id = $this->direct($owner, $member);
        foreach ([$nonparticipant, $outside] as $person) {
            $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload(['mentions' => [$person->id]]))->assertUnprocessable();
        }
        $this->assertDatabaseCount('messages', 0);
        $this->assertDatabaseCount('message_notifications', 0);
    }

    public function test_reply_cannot_target_another_chat_or_another_reply(): void
    {
        $owner = User::factory()->create();
        $first = $this->workChat($owner);
        $second = $this->workChat($owner);
        $root = $this->actingAs($owner)->postJson('/collaboration/chats/'.$first->public_id.'/messages', $this->payload())->assertCreated()->json('data.id');
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$second->public_id.'/messages', $this->payload(['thread_root_id' => $root]))->assertNotFound();
        $reply = $this->actingAs($owner)->postJson('/collaboration/chats/'.$first->public_id.'/messages', $this->payload(['thread_root_id' => $root]))->assertCreated()->json('data.id');
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$first->public_id.'/messages', $this->payload(['thread_root_id' => $reply]))->assertNotFound();
    }

    public function test_viewing_main_message_does_not_read_unseen_thread_reply(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $chat = $this->workChat($owner);
        $root = $this->actingAs($owner)->postJson('/collaboration/chats/'.$chat->public_id.'/messages', $this->payload())->assertCreated()->json('data.id');
        $reply = $this->actingAs($member)->postJson('/collaboration/chats/'.$chat->public_id.'/messages', $this->payload(['thread_root_id' => $root]))->assertCreated()->json('data.id');
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$chat->public_id.'/read', ['messages' => [$root]])->assertOk();
        $this->actingAs($owner)->getJson('/collaboration/notifications')->assertOk()->assertJsonPath('unread_count', 1);
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$chat->public_id.'/read', ['messages' => [$reply]])->assertOk();
        $this->actingAs($owner)->getJson('/collaboration/notifications')->assertOk()->assertJsonPath('unread_count', 0);
    }

    public function test_removed_dm_participant_cannot_read_and_remaining_member_has_read_only_history(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $id = $this->direct($owner, $member);
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload())->assertCreated();
        OrganizationMembership::query()->where('user_id', $member->id)->update(['status' => OrganizationMembershipStatus::Removed->value, 'removed_at' => now()]);
        $this->actingAs($member)->getJson('/collaboration/chats/'.$id.'/messages')->assertForbidden();
        $this->actingAs($owner)->getJson('/collaboration/chats/'.$id.'/messages')->assertOk()->assertJsonPath('chat.can_send', false)->assertJsonCount(1, 'data');
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload())->assertUnprocessable();
    }

    public function test_extension_and_web_share_dm_history_and_attention(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $id = $this->direct($owner, $member);
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload())->assertCreated();
        $this->app['auth']->forgetGuards();
        $token = $member->createToken('Chrome extension', [ApiTokenAbility::ExtensionAccess->value], now()->addDay());
        $this->withToken($token->plainTextToken)->getJson('/api/v1/extension/collaboration/chats/'.$id.'/messages')->assertOk()->assertJsonCount(1, 'data');
        $this->withToken($token->plainTextToken)->getJson('/api/v1/extension/collaboration/notifications')->assertOk()->assertJsonPath('unread_count', 1);
    }

    public function test_notification_requires_opt_in_and_does_not_replay_old_backlog(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $id = $this->direct($owner, $member);
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload())->assertCreated();
        $this->actingAs($member)->getJson('/collaboration/notifications')->assertOk()->assertJsonPath('enabled', false)->assertJsonPath('desktop_candidates', []);
        $this->travel(2)->minutes();
        $this->actingAs($member)->putJson('/collaboration/notifications/settings', ['enabled' => true])->assertOk();
        $this->actingAs($member)->getJson('/collaboration/notifications')->assertOk()->assertJsonPath('unread_count', 1)->assertJsonPath('desktop_candidates', []);
    }

    public function test_desktop_claim_deduplicates_open_clients_and_uses_private_preview(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $id = $this->direct($owner, $member);
        $this->actingAs($member)->putJson('/collaboration/notifications/settings', ['enabled' => true])->assertOk();
        $this->travel(1)->seconds();
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload(['body' => 'Secret quote 482: customer balance $125,000']))->assertCreated();
        $notice = MessageNotification::query()->sole();
        $claim = $this->actingAs($member)->postJson('/collaboration/notifications/'.$notice->public_id.'/claim', [])->assertOk()->json('data');
        $this->assertNotNull($claim);
        $this->assertSame('SideWire', $claim['title']);
        $this->assertStringNotContainsString('482', $claim['body']);
        $this->assertStringNotContainsString($owner->name, $claim['body']);
        $this->actingAs($member)->postJson('/collaboration/notifications/'.$notice->public_id.'/claim', [])->assertOk()->assertJsonPath('data', null);
        $this->actingAs($member)->postJson('/collaboration/notifications/'.$notice->public_id.'/delivered', ['claim' => (string) Str::uuid()])->assertConflict();
        $this->actingAs($member)->postJson('/collaboration/notifications/'.$notice->public_id.'/delivered', ['claim' => $claim['claim']])->assertOk();
        $this->assertNotNull($notice->fresh()->delivered_at);
        $this->assertNull($notice->fresh()->read_at);
    }

    public function test_failed_desktop_delivery_can_retry_after_lease_and_pause_stops_claims(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $id = $this->direct($owner, $member);
        $this->actingAs($member)->putJson('/collaboration/notifications/settings', ['enabled' => true]);
        $this->travel(1)->seconds();
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload())->assertCreated();
        $notice = MessageNotification::query()->sole();
        $first = $this->actingAs($member)->postJson('/collaboration/notifications/'.$notice->public_id.'/claim', [])->assertOk()->json('data.claim');
        $this->travel(46)->seconds();
        $second = $this->actingAs($member)->postJson('/collaboration/notifications/'.$notice->public_id.'/claim', [])->assertOk()->json('data.claim');
        $this->assertNotSame($first, $second);
        $this->actingAs($member)->putJson('/collaboration/notifications/settings', ['enabled' => false])->assertOk();
        $this->travel(46)->seconds();
        $this->actingAs($member)->postJson('/collaboration/notifications/'.$notice->public_id.'/claim', [])->assertOk()->assertJsonPath('data', null);
    }

    public function test_history_pagination_can_reach_messages_beyond_latest_hundred(): void
    {
        $owner = User::factory()->create();
        $chat = $this->workChat($owner);
        for ($i = 0; $i < 125; $i++) {
            Message::query()->create(['organization_id' => $chat->organization_id, 'workspace_id' => $chat->workspace_id, 'conversation_id' => $chat->id, 'author_id' => $owner->id, 'body' => 'Message '.$i, 'idempotency_key' => (string) Str::uuid()]);
        }
        $first = $this->actingAs($owner)->getJson('/collaboration/chats/'.$chat->public_id.'/messages')->assertOk()->assertJsonCount(50, 'data')->json();
        $second = $this->actingAs($owner)->getJson('/collaboration/chats/'.$chat->public_id.'/messages?before='.$first['older_cursor'])->assertOk()->assertJsonCount(50, 'data')->json();
        $this->actingAs($owner)->getJson('/collaboration/chats/'.$chat->public_id.'/messages?before='.$second['older_cursor'])->assertOk()->assertJsonCount(25, 'data')->assertJsonPath('data.0.body', 'Message 0')->assertJsonPath('older_cursor', null);
    }

    public function test_broadcasts_never_include_dm_content_or_an_organization_wide_dm_event(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $id = $this->direct($owner, $member);
        $this->actingAs($owner)->postJson('/collaboration/chats/'.$id.'/messages', $this->payload())->assertCreated();
        $event = new MessageCreated(Message::query()->sole());
        $this->assertSame(['changed' => true], $event->broadcastWith());
        $channels = array_map(fn ($channel) => $channel->name, $event->broadcastOn());
        $this->assertNotContains('private-organizations.'.$owner->organization()->firstOrFail()->id, $channels);
        $this->assertContains('private-App.Models.User.'.$member->id, $channels);
    }
}
