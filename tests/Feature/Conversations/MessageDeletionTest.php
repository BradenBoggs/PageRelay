<?php

namespace Tests\Feature\Conversations;

use App\Enums\ApiTokenAbility;
use App\Enums\ConversationType;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class MessageDeletionTest extends TestCase
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

    public function test_authors_delete_roots_without_losing_replies_or_restoring_text_on_retry(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $chat = $this->workChat($owner)->public_id;
        $payload = $this->payload(['mentions' => [$owner->id]]);
        $root = $this->actingAs($member)->postJson('/collaboration/chats/'.$chat.'/messages', $payload)->assertCreated()->json('data.id');
        $reply = $this->actingAs($owner)->postJson('/collaboration/chats/'.$chat.'/messages', $this->payload(['thread_root_id' => $root]))->assertCreated()->json('data.id');
        $this->actingAs($member)->deleteJson('/collaboration/chats/'.$chat.'/messages/'.$root)->assertOk()->assertJsonPath('data.deleted', true)->assertJsonPath('data.can_delete', false);
        $this->deleteJson('/collaboration/chats/'.$chat.'/messages/'.$root)->assertOk();
        $this->postJson('/collaboration/chats/'.$chat.'/messages', $payload)->assertOk()->assertJsonPath('data.body', 'Message deleted');
        $this->getJson('/collaboration/chats/'.$chat.'/messages?thread='.$root)->assertOk()->assertJsonPath('root.body', 'Message deleted')->assertJsonPath('data.0.id', $reply);
        $model = Message::query()->where('public_id', $root)->sole();
        $this->assertNotNull($model->deleted_at);
        $this->assertSame('Message deleted', $model->body);
        $this->assertSame(0, $model->mentionedUsers()->count());
        $this->assertDatabaseMissing('message_notifications', ['message_id' => $model->id]);
        $this->assertDatabaseCount('messages', 2);
    }

    public function test_members_cannot_delete_coworker_messages_but_admins_can_moderate_work_chats(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $admin = $this->coworker($owner, OrganizationRole::Administrator);
        $chat = $this->workChat($owner)->public_id;
        $message = $this->actingAs($owner)->postJson('/collaboration/chats/'.$chat.'/messages', $this->payload())->assertCreated()->json('data.id');
        $this->actingAs($member)->getJson('/collaboration/chats/'.$chat.'/messages')->assertJsonPath('data.0.can_delete', false);
        $this->deleteJson('/collaboration/chats/'.$chat.'/messages/'.$message)->assertForbidden();
        $this->actingAs($admin)->getJson('/collaboration/chats/'.$chat.'/messages')->assertJsonPath('data.0.can_delete', true);
        $this->deleteJson('/collaboration/chats/'.$chat.'/messages/'.$message)->assertOk();
    }

    public function test_deletion_checks_chat_relationship_tenant_and_dm_participation(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $admin = $this->coworker($owner, OrganizationRole::Administrator);
        $outside = User::factory()->create();
        $chat = $this->direct($owner, $member);
        $message = $this->actingAs($member)->postJson('/collaboration/chats/'.$chat.'/messages', $this->payload())->assertCreated()->json('data.id');
        $this->actingAs($admin)->deleteJson('/collaboration/chats/'.$chat.'/messages/'.$message)->assertNotFound();
        $this->actingAs($outside)->deleteJson('/collaboration/chats/'.$chat.'/messages/'.$message)->assertNotFound();
        $this->actingAs($owner)->deleteJson('/collaboration/chats/'.$chat.'/messages/'.$message)->assertForbidden();
        $other = $this->workChat($owner)->public_id;
        $this->actingAs($member)->deleteJson('/collaboration/chats/'.$other.'/messages/'.$message)->assertNotFound();
        $this->deleteJson('/collaboration/chats/'.$chat.'/messages/'.$message)->assertOk();
    }

    public function test_loaded_history_reports_deleted_ids_and_extension_deletion_uses_same_rules(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $chat = $this->workChat($owner)->public_id;
        $message = $this->actingAs($member)->postJson('/collaboration/chats/'.$chat.'/messages', $this->payload())->assertCreated()->json('data.id');
        $this->app['auth']->forgetGuards();
        $token = $member->createToken('Chrome extension', [ApiTokenAbility::ExtensionAccess->value], now()->addDay());
        $this->withToken($token->plainTextToken)->deleteJson('/api/v1/extension/collaboration/chats/'.$chat.'/messages/'.$message)->assertOk()->assertJsonPath('data.deleted', true);
        $this->getJson('/api/v1/extension/collaboration/chats/'.$chat.'/messages?loaded_since='.$message)->assertOk()->assertJsonPath('deleted_ids.0', $message);
        $this->getJson('/api/v1/extension/collaboration/chats/'.$chat.'/messages?loaded_since='.(string) Str::uuid())->assertNotFound();
    }

    public function test_access_removal_preserves_authorship_and_blocks_reads_sends_and_deletion(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $chat = $this->workChat($owner)->public_id;
        $message = $this->actingAs($member)->postJson('/collaboration/chats/'.$chat.'/messages', $this->payload())->assertCreated()->json('data.id');
        $this->actingAs($owner)->delete('/settings/organization/members/'.$member->id)->assertRedirect();
        $this->getJson('/collaboration/chats/'.$chat.'/messages')->assertOk()->assertJsonPath('data.0.body', 'Please check the quoted price.')->assertJsonPath('data.0.author.id', $member->id);
        $this->assertDatabaseHas('users', ['id' => $member->id]);
        $this->assertDatabaseHas('organization_memberships', ['user_id' => $member->id, 'status' => 'removed', 'is_billable' => false]);
        $this->actingAs($member)->getJson('/collaboration/chats/'.$chat.'/messages')->assertForbidden();
        $this->postJson('/collaboration/chats/'.$chat.'/messages', $this->payload())->assertForbidden();
        $this->deleteJson('/collaboration/chats/'.$chat.'/messages/'.$message)->assertForbidden();
    }
}
