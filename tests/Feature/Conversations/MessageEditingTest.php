<?php

namespace Tests\Feature\Conversations;

use App\Enums\ApiTokenAbility;
use App\Enums\ConversationType;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageNotification;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class MessageEditingTest extends TestCase
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

    public function test_author_edits_preserve_history_mentions_and_retry_identity(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $chat = $this->workChat($owner)->public_id;
        $payload = $this->payload(['mentions' => [$owner->id]]);
        $message = $this->actingAs($member)->postJson('/collaboration/chats/'.$chat.'/messages', $payload)->assertCreated()->json('data.id');
        $reply = $this->postJson('/collaboration/chats/'.$chat.'/messages', $this->payload(['thread_root_id' => $message]))->assertCreated()->json('data.id');
        $original = Message::where('public_id', $message)->sole();
        $attention = MessageNotification::count();
        $path = '/collaboration/chats/'.$chat.'/messages/'.$message;
        $edit = ['body' => 'Corrected price', 'edit_version' => 0];
        $this->patchJson($path, $edit)->assertOk()->assertJsonPath('data.body', 'Corrected price')->assertJsonPath('data.edit_version', 1)->assertJsonPath('data.can_edit', true);
        $this->patchJson($path, $edit)->assertOk()->assertJsonPath('data.edit_version', 1);
        $this->patchJson($path, ['body' => 'Stale edit', 'edit_version' => 0])->assertConflict();
        $this->patchJson($path, ['body' => '   ', 'edit_version' => 1])->assertUnprocessable();
        $this->postJson('/collaboration/chats/'.$chat.'/messages', $payload)->assertOk()->assertJsonPath('data.body', 'Corrected price');
        $this->getJson('/collaboration/chats/'.$chat.'/messages?loaded_since='.$message)->assertOk()->assertJsonPath('updated_messages.0.body', 'Corrected price');
        $this->getJson('/collaboration/chats/'.$chat.'/messages?thread='.$message)->assertOk()->assertJsonPath('root.body', 'Corrected price')->assertJsonPath('data.0.id', $reply);
        $updated = $original->fresh();
        $this->assertTrue($original->created_at->equalTo($updated->created_at));
        $this->assertSame($original->request_fingerprint, $updated->request_fingerprint);
        $this->assertNotNull($updated->edited_at);
        $this->assertSame(1, $updated->mentionedUsers()->count());
        $this->assertSame($attention, MessageNotification::count());
        $this->patchJson('/collaboration/chats/'.$chat.'/messages/'.$reply, $edit)->assertOk();
        $this->deleteJson($path)->assertOk()->assertJsonPath('data.can_edit', false);
        $this->patchJson($path, ['body' => 'Restore', 'edit_version' => 1])->assertForbidden();
    }

    public function test_editing_is_author_only_and_checks_access_and_chat_relationship(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $admin = $this->coworker($owner, OrganizationRole::Administrator);
        $outside = User::factory()->create();
        $chat = $this->workChat($owner)->public_id;
        $message = $this->actingAs($member)->postJson('/collaboration/chats/'.$chat.'/messages', $this->payload())->assertCreated()->json('data.id');
        $path = '/collaboration/chats/'.$chat.'/messages/'.$message;
        $edit = ['body' => 'Updated', 'edit_version' => 0];
        $this->actingAs($owner)->patchJson($path, $edit)->assertForbidden();
        $this->actingAs($admin)->getJson('/collaboration/chats/'.$chat.'/messages')->assertJsonPath('data.0.can_edit', false);
        $this->patchJson($path, $edit)->assertForbidden();
        $this->actingAs($outside)->patchJson($path, $edit)->assertNotFound();
        $other = $this->workChat($owner)->public_id;
        $this->actingAs($member)->patchJson('/collaboration/chats/'.$other.'/messages/'.$message, $edit)->assertNotFound();
        $dm = $this->direct($member, $owner);
        $private = $this->postJson('/collaboration/chats/'.$dm.'/messages', $this->payload())->assertCreated()->json('data.id');
        $this->actingAs($admin)->patchJson('/collaboration/chats/'.$dm.'/messages/'.$private, $edit)->assertNotFound();
        $this->actingAs($member)->patchJson('/collaboration/chats/'.$dm.'/messages/'.$private, $edit)->assertOk();
        $this->actingAs($owner)->delete('/settings/organization/members/'.$member->id)->assertRedirect();
        $this->actingAs($member)->patchJson($path, $edit)->assertForbidden();
    }

    public function test_extension_uses_the_same_edit_contract(): void
    {
        $owner = User::factory()->create();
        $chat = $this->workChat($owner)->public_id;
        $message = $this->actingAs($owner)->postJson('/collaboration/chats/'.$chat.'/messages', $this->payload())->assertCreated()->json('data.id');
        $this->app['auth']->forgetGuards();
        $token = $owner->createToken('Chrome extension', [ApiTokenAbility::ExtensionAccess->value], now()->addDay());
        $this->withToken($token->plainTextToken)->patchJson('/api/v1/extension/collaboration/chats/'.$chat.'/messages/'.$message, ['body' => 'Extension edit', 'edit_version' => 0])->assertOk()->assertJsonPath('data.body', 'Extension edit');
    }
}
