<?php

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
