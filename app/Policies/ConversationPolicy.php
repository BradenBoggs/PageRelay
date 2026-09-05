<?php

namespace App\Policies;

use App\Enums\ConversationType;
use App\Models\Conversation;
use App\Models\User;

/** @see docs/features/page-conversations.md */
class ConversationPolicy
{
    public function view(User $user, Conversation $conversation): bool
    {
        return $conversation->type === ConversationType::Page
            && $user->organization()->whereKey($conversation->organization_id)->exists();
    }
}
