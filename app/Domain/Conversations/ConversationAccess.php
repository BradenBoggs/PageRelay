<?php

namespace App\Domain\Conversations;

use App\Enums\ConversationType;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/** Shared read boundary for lists, messages, notifications and broadcasts. */
class ConversationAccess
{
    /** @return Builder<Conversation> */
    public static function query(User $user): Builder
    {
        $organization = $user->organization()->first();
        $workspace = $organization?->defaultWorkspace()->first();

        return Conversation::query()
            ->where('organization_id', $organization?->id)
            ->where('workspace_id', $workspace?->id)
            ->where(function (Builder $query) use ($user): void {
                $query->where('type', ConversationType::Page)
                    ->orWhere(function (Builder $direct) use ($user): void {
                        $direct->where('type', ConversationType::Direct)
                            ->whereIn('id', DB::table('conversation_participants')
                                ->select('conversation_id')->where('user_id', $user->id));
                    });
            });
    }
}
