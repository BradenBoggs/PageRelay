<?php

namespace App\Domain\Todos;

use App\Domain\Conversations\ConversationAccess;
use App\Enums\OrganizationMembershipStatus;
use App\Events\MessageCreated;
use App\Models\Message;
use App\Models\OrganizationMembership;
use App\Models\Todo;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Message ownership is the task audience; assignment never expands it. */
class ManageTodo
{
    /** @return Builder<Todo> */
    public function visible(User $actor): Builder
    {
        return Todo::query()->whereHas('message', fn (Builder $query) => $query
            ->whereIn('conversation_id', ConversationAccess::query($actor)->select('id')));
    }

    public function canManage(User $actor, Message $message): bool
    {
        return ConversationAccess::query($actor)->whereKey($message->conversation_id)->whereNull('retired_at')->exists();
    }

    public function eligible(User $assignee, Message $message): bool
    {
        return OrganizationMembership::query()->active()->where('organization_id', $message->organization_id)
            ->where('user_id', $assignee->id)->exists()
            && ConversationAccess::query($assignee)->whereKey($message->conversation_id)->exists();
    }

    private function authorizeLocked(User $actor, Message $message): void
    {
        $membership = $actor->organizationMembership()->lockForUpdate()->first();
        abort_unless($membership && $membership->status === OrganizationMembershipStatus::Active
            && $membership->organization_id === $message->organization_id, 403);
        abort_unless($this->canManage($actor, $message), 403);
    }

    private function validateAssignee(?int $id, Message $message): void
    {
        if ($id === null) {
            return;
        }
        $membership = OrganizationMembership::query()->active()->where('organization_id', $message->organization_id)
            ->where('user_id', $id)->lockForUpdate()->first();
        $user = $membership?->user;
        if (! $user || ! $this->eligible($user, $message)) {
            throw ValidationException::withMessages(['assignee_id' => 'Choose an active coworker who can access this chat.']);
        }
    }

    public function create(User $actor, Message $message, string $title, ?int $assigneeId): Todo
    {
        return DB::transaction(function () use ($actor, $message, $title, $assigneeId): Todo {
            $this->authorizeLocked($actor, $message);
            $locked = Message::query()->whereKey($message->id)->lockForUpdate()->firstOrFail();
            $existing = Todo::query()->where('message_id', $locked->id)->first();
            if ($existing) {
                return $existing;
            }
            abort_if($locked->deleted_at !== null, 409, 'Deleted messages cannot be converted into todos.');
            $this->validateAssignee($assigneeId, $locked);
            $todo = Todo::query()->create(['message_id' => $locked->id, 'created_by' => $actor->id,
                'title' => $title, 'assignee_id' => $assigneeId]);
            MessageCreated::dispatch($locked);

            return $todo;
        }, 3);
    }

    public function update(User $actor, Todo $todo, string $title, ?int $assigneeId, bool $completed, int $version): Todo
    {
        return DB::transaction(function () use ($actor, $todo, $title, $assigneeId, $completed, $version): Todo {
            $this->authorizeLocked($actor, $todo->message);
            $locked = Todo::query()->whereKey($todo->id)->lockForUpdate()->firstOrFail();
            $same = $locked->title === $title && $locked->assignee_id === $assigneeId
                && ($locked->completed_at !== null) === $completed;
            if ($same && ($locked->version === $version || $locked->version === $version + 1)) {
                return $locked;
            }
            abort_unless($locked->version === $version, 409, 'This todo has changed. Refresh and review it before saving.');
            // A former assignee may remain while completing an item; reassignment requires current access.
            if ($locked->assignee_id !== $assigneeId) {
                $this->validateAssignee($assigneeId, $locked->message);
            }
            $changes = ['title' => $title, 'assignee_id' => $assigneeId, 'version' => $version + 1];
            if (($locked->completed_at !== null) !== $completed) {
                $changes['completed_at'] = $completed ? now() : null;
                $changes['completed_by'] = $completed ? $actor->id : null;
            }
            $locked->forceFill($changes)->save();
            MessageCreated::dispatch($locked->message);

            return $locked;
        }, 3);
    }
}
