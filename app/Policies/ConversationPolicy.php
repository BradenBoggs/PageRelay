<?php

namespace App\Policies;

use App\Domain\Conversations\ConversationAccess;
use App\Enums\ConversationType;
use App\Enums\OrganizationRole;
use App\Models\Conversation;
use App\Models\User;

/** @see docs/features/direct-messages.md */
class ConversationPolicy
{
    public function create(User $user): bool
    {
        return $user->organizationRole()?->isAtLeast(OrganizationRole::Administrator) ?? false;
    }

    public function update(User $user, Conversation $conversation): bool
    {
        return $conversation->type === ConversationType::Page
            && $conversation->retired_at === null
            && $this->create($user)
            && $this->view($user, $conversation);
    }

    public function view(User $user, Conversation $conversation): bool
    {
        return ConversationAccess::query($user)->whereKey($conversation->id)->exists();
    }
}
