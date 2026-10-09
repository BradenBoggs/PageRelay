<?php

namespace App\Domain\Activity;

use App\Domain\Conversations\ConversationAccess;
use App\Enums\ConversationType;
use App\Models\Message;
use App\Models\MessageNotification;
use App\Models\OrganizationMembership;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** One durable attention item per recipient/message; mentions take precedence. */
class RecordMessageAttention
{
    public function handle(Message $message): void
    {
        /** @var array<int, string> $reasons */
        $reasons = [];
        if ($message->thread_root_id !== null) {
            $root = $message->threadRoot()->firstOrFail();
            $reasons[$root->author_id] = 'thread';
            foreach ($root->replies()->pluck('author_id') as $id) {
                $reasons[(int) $id] = 'thread';
            }
        }
        if ($message->conversation->type === ConversationType::Direct) {
            foreach (DB::table('conversation_participants')->where('conversation_id', $message->conversation_id)->pluck('user_id') as $id) {
                $reasons[(int) $id] = 'direct';
            }
        }
        foreach ($message->mentionedUsers()->pluck('users.id') as $id) {
            $reasons[(int) $id] = 'mention';
        }
        unset($reasons[$message->author_id]);
        $members = OrganizationMembership::query()->active()
            ->where('organization_id', $message->organization_id)
            ->whereIn('user_id', array_keys($reasons))->with('user')->get();
        foreach ($members as $member) {
            if (! ConversationAccess::query($member->user)->whereKey($message->conversation_id)->exists()) {
                continue;
            }
            MessageNotification::firstOrCreate([
                'user_id' => $member->user_id, 'message_id' => $message->id,
            ], [
                'public_id' => (string) Str::uuid(),
                'organization_id' => $message->organization_id,
                'conversation_id' => $message->conversation_id,
                'reason' => $reasons[$member->user_id],
            ]);
        }
    }
}
