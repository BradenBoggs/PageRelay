<?php

namespace App\Domain\Conversations;

use App\Enums\ConversationType;
use App\Enums\OrganizationRole;
use App\Events\MessageCreated;
use App\Models\Message;
use App\Models\MessageNotification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DeleteMessage
{
    public function allowed(?User $actor, Message $message): bool
    {
        if (! $actor || ! ConversationAccess::query($actor)->whereKey($message->conversation_id)->exists()) {
            return false;
        }

        return $message->author_id === $actor->id
            || ($message->conversation->type === ConversationType::Page
                && ($actor->organizationRole()?->isAtLeast(OrganizationRole::Administrator) ?? false));
    }

    public function handle(User $actor, Message $message): void
    {
        DB::transaction(function () use ($actor, $message): void {
            $membership = $actor->organizationMembership()->lockForUpdate()->first();
            abort_unless($membership && $membership->organization_id === $message->organization_id, 403);
            abort_unless($this->allowed($actor, $message), 403);
            $locked = Message::query()->whereKey($message->id)->lockForUpdate()->firstOrFail();
            if ($locked->deleted_at !== null) {
                return;
            }

            // Keep identity and thread anchors; send retries must not restore content.
            $locked->forceFill(['body' => 'Message deleted', 'deleted_at' => now()])->save();
            $locked->mentionedUsers()->detach();
            MessageNotification::query()->where('message_id', $locked->id)->delete();
            MessageCreated::dispatch($locked);
        }, 3);
    }
}
