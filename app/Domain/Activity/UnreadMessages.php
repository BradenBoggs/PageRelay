<?php

namespace App\Domain\Activity;

use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/** Exact seen messages share one count across all linked pages. */
class UnreadMessages
{
    /** @return Builder<Message> */
    public function query(User $user): Builder
    {
        return Message::query()->from('messages as unread_messages')
            ->whereColumn('unread_messages.conversation_id', 'conversations.id')
            ->whereNull('unread_messages.deleted_at')
            ->where('unread_messages.author_id', '!=', $user->id)
            ->whereNotExists(function ($seen) use ($user): void {
                $seen->selectRaw('1')->from('message_reads')
                    ->whereColumn('message_reads.message_id', 'unread_messages.id')
                    ->where('message_reads.user_id', $user->id);
            });
    }
}
