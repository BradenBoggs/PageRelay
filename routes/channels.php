<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function (User $user, int $id): bool {
    return $user->id === $id
        && $user->hasVerifiedEmail()
        && $user->organization()->exists();
});

Broadcast::channel('organizations.{organizationId}', function (User $user, int $organizationId): bool {
    return $user->hasVerifiedEmail()
        && $user->organization()->whereKey($organizationId)->exists();
});

Broadcast::channel(
    'organizations.{organizationId}.conversations.{conversationPublicId}',
    function (User $user, int $organizationId, string $conversationPublicId): bool {
        return $user->hasVerifiedEmail()
            && $user->organization()->whereKey($organizationId)->exists()
            && Conversation::query()
                ->where('organization_id', $organizationId)
                ->where('public_id', $conversationPublicId)
                ->exists();
    },
);
