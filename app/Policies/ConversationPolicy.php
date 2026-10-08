<?php

namespace App\Policies;

use App\Domain\Conversations\ConversationAccess;
use App\Models\Conversation;
use App\Models\User;

/** @see docs/features/direct-messages.md */
class ConversationPolicy
{
    public function view(User $user, Conversation $conversation): bool
    {
        return ConversationAccess::query($user)->whereKey($conversation->id)->exists();
    }
}
