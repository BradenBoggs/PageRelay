<?php

namespace Tests\Feature\Conversations;

use App\Enums\ApiTokenAbility;
use App\Enums\ConversationType;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\OrganizationMembership;
use App\Models\Todo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class MessageTodoTest extends TestCase
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

    private function message(User $actor, string $chat, array $extra = []): string
    {
        return $this->actingAs($actor)->postJson('/collaboration/chats/'.$chat.'/messages', $this->payload($extra))->assertCreated()->json('data.id');
    }

    private function convert(string $chat, string $message, ?int $assignee = null): array
    {
        return $this->postJson('/collaboration/chats/'.$chat.'/messages/'.$message.'/todo', ['title' => 'Review the quote', 'assignee_id' => $assignee])->assertOk()->json('data');
    }

    private function updatePayload(array $todo, array $extra = []): array
    {
        return [...['title' => $todo['title'], 'assignee_id' => $todo['assignee']['id'] ?? null,
            'completed' => $todo['completed'], 'version' => $todo['version']], ...$extra];
    }

    public function test_conversion_assignment_completion_reopen_and_message_reference_share_one_record(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $chat = $this->workChat($owner)->public_id;
        $message = $this->message($owner, $chat);
        $this->actingAs($member);
        $todo = $this->convert($chat, $message, $member->id);
        $this->assertSame($member->id, $todo['assignee']['id']);
        $this->assertSame($message, $todo['message']['id']);
        $this->assertSame($todo['id'], $this->convert($chat, $message, $owner->id)['id']);
        $this->assertDatabaseCount('todos', 1);
        $this->getJson('/collaboration/chats/'.$chat.'/messages')->assertOk()->assertJsonPath('data.0.todo.id', $todo['id'])->assertJsonPath('data.0.can_create_todo', false);
        $this->getJson('/collaboration/todos?mine=1')->assertOk()->assertJsonPath('data.0.id', $todo['id']);
        $path = '/collaboration/todos/'.$todo['id'];
        $payload = $this->updatePayload($todo, ['completed' => true]);
        $completed = $this->patchJson($path, $payload)->assertOk()->assertJsonPath('data.completed', true)->assertJsonPath('data.completed_by.id', $member->id)->json('data');
        $this->patchJson($path, $payload)->assertOk()->assertJsonPath('data.version', 1);
        $this->patchJson($path, $this->updatePayload($todo, ['title' => 'Stale title']))->assertConflict();
        $this->getJson('/collaboration/todos?status=open')->assertJsonCount(0, 'data');
        $this->getJson('/collaboration/todos?status=completed')->assertJsonCount(1, 'data');
        $reopened = $this->patchJson($path, $this->updatePayload($completed, ['completed' => false, 'assignee_id' => $owner->id]))->assertOk()->assertJsonPath('data.completed_at', null)->assertJsonPath('data.completed_by', null)->assertJsonPath('data.assignee.id', $owner->id)->json('data');
        $this->getJson('/collaboration/todos?mine=1')->assertJsonCount(0, 'data');
        $this->patchJson($path, $this->updatePayload($reopened, ['assignee_id' => null]))->assertOk()->assertJsonPath('data.assignee', null);
        $this->actingAs($owner)->patchJson('/collaboration/chats/'.$chat.'/messages/'.$message, ['body' => 'Edited original', 'edit_version' => 0])->assertOk();
        $this->getJson('/collaboration/todos')->assertJsonPath('data.0.title', 'Review the quote')->assertJsonPath('data.0.message.body', 'Edited original');
        $this->deleteJson('/collaboration/chats/'.$chat.'/messages/'.$message)->assertOk();
        $this->getJson('/collaboration/todos')->assertJsonPath('data.0.message.body', 'Message deleted');
        $this->assertDatabaseCount('todos', 1);
    }

    public function test_tenant_chat_relationship_and_dm_assignee_access_are_enforced(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $admin = $this->coworker($owner, OrganizationRole::Administrator);
        $outside = User::factory()->create();
        $dm = $this->direct($owner, $member);
        $message = $this->message($owner, $dm);
        $base = '/collaboration/chats/'.$dm.'/messages/'.$message.'/todo';
        $this->postJson($base, ['title' => 'Private action', 'assignee_id' => $admin->id])->assertUnprocessable()->assertJsonValidationErrors('assignee_id');
        $this->postJson($base, ['title' => 'Private action', 'assignee_id' => $outside->id])->assertUnprocessable();
        $todo = $this->convert($dm, $message, $member->id);
        $this->actingAs($admin)->getJson('/collaboration/todos?status=all')->assertJsonCount(0, 'data');
        $this->postJson($base, ['title' => 'Try to create'])->assertNotFound();
        $this->patchJson('/collaboration/todos/'.$todo['id'], $this->updatePayload($todo))->assertNotFound();
        $this->actingAs($outside)->getJson('/collaboration/todos?status=all')->assertJsonCount(0, 'data');
        $this->patchJson('/collaboration/todos/'.$todo['id'], $this->updatePayload($todo))->assertNotFound();
        $other = $this->workChat($owner)->public_id;
        $this->actingAs($member)->postJson('/collaboration/chats/'.$other.'/messages/'.$message.'/todo', ['title' => 'Wrong chat'])->assertNotFound();
        $this->getJson('/collaboration/todos')->assertJsonCount(1, 'data');
        $this->patchJson('/collaboration/todos/'.$todo['id'], $this->updatePayload($todo, ['assignee_id' => $admin->id]))->assertUnprocessable();
        $reply = $this->message($member, $dm, ['thread_root_id' => $message]);
        $threadTodo = $this->convert($dm, $reply);
        $this->assertSame($message, $threadTodo['message']['thread_id']);
    }

    public function test_removed_members_retired_chats_and_deleted_messages_have_safe_lifecycles(): void
    {
        $owner = User::factory()->create();
        $member = $this->coworker($owner);
        $chat = $this->workChat($owner);
        $message = $this->message($owner, $chat->public_id);
        $todo = $this->convert($chat->public_id, $message, $member->id);
        $deleted = $this->message($owner, $chat->public_id);
        $this->deleteJson('/collaboration/chats/'.$chat->public_id.'/messages/'.$deleted)->assertOk();
        $this->postJson('/collaboration/chats/'.$chat->public_id.'/messages/'.$deleted.'/todo', ['title' => 'Deleted'])->assertConflict();
        $this->delete('/settings/organization/members/'.$member->id)->assertRedirect();
        $this->getJson('/collaboration/todos')->assertJsonPath('data.0.needs_reassignment', true)->assertJsonPath('data.0.assignee.id', $member->id);
        $this->patchJson('/collaboration/todos/'.$todo['id'], $this->updatePayload($todo, ['completed' => true]))->assertOk();
        $this->actingAs($member)->getJson('/collaboration/todos')->assertForbidden();
        $this->patchJson('/collaboration/todos/'.$todo['id'], $this->updatePayload($todo))->assertForbidden();
        $chat->forceFill(['retired_at' => now()])->save();
        $this->actingAs($owner)->getJson('/collaboration/todos?status=all')->assertJsonPath('data.0.can_manage', false);
        $current = Todo::where('public_id', $todo['id'])->sole();
        $this->patchJson('/collaboration/todos/'.$todo['id'], $this->updatePayload($todo, ['version' => $current->version, 'completed' => false]))->assertForbidden();
    }

    public function test_loaded_older_history_refreshes_todos_and_extension_uses_shared_contract(): void
    {
        $owner = User::factory()->create();
        $chat = $this->workChat($owner)->public_id;
        $message = $this->message($owner, $chat);
        $original = Message::where('public_id', $message)->sole();
        for ($i = 0; $i < 52; $i++) {
            $original->replicate(['public_id', 'idempotency_key'])->forceFill(['idempotency_key' => (string) Str::uuid()])->save();
        }
        $todo = $this->convert($chat, $message, $owner->id);
        $this->getJson('/collaboration/chats/'.$chat.'/messages?loaded_since='.$message)->assertOk()->assertJsonPath('updated_messages.0.todo.id', $todo['id']);
        $this->app['auth']->forgetGuards();
        $token = $owner->createToken('Chrome extension', [ApiTokenAbility::ExtensionAccess->value], now()->addDay());
        $this->withToken($token->plainTextToken)->getJson('/api/v1/extension/collaboration/todos')->assertJsonPath('data.0.id', $todo['id']);
        $this->patchJson('/api/v1/extension/collaboration/todos/'.$todo['id'], $this->updatePayload($todo, ['completed' => true]))->assertOk()->assertJsonPath('data.completed', true);
    }
}
