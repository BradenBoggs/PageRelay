<?php

namespace App\Domain\Conversations;

use App\Events\MessageCreated;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class EditMessage
{
    public function allowed(?User $actor, Message $message): bool
    {
        return $actor !== null && $message->author_id === $actor->id
            && $message->deleted_at === null
            && ConversationAccess::query($actor)->whereKey($message->conversation_id)->exists();
    }

    public function handle(User $actor, Message $message, string $body, int $version): void
    {
        DB::transaction(function () use ($actor, $message, $body, $version): void {
            $membership = $actor->organizationMembership()->lockForUpdate()->first();
            abort_unless($membership && $membership->organization_id === $message->organization_id, 403);
            $locked = Message::query()->whereKey($message->id)->lockForUpdate()->firstOrFail();
            abort_unless($this->allowed($actor, $locked), 403);
            // An uncertain save may retry, but cannot overwrite any intervening edit.
            if ($locked->edit_version === $version + 1 && $locked->body === $body) {
                return;
            }
            abort_unless($locked->edit_version === $version, 409, 'This message has changed. Reopen the editor to review the latest text.');
            if ($locked->body === $body) {
                return;
            }
            $locked->forceFill(['body' => $body, 'edited_at' => now(), 'edit_version' => $version + 1])->save();
            MessageCreated::dispatch($locked);
        }, 3);
    }
}
