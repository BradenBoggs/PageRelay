<?php

use App\Models\ExtensionHandoff;
use App\Models\OrganizationInvitation;
use Illuminate\Support\Facades\Schedule;
use Laravel\Sanctum\PersonalAccessToken;

Schedule::call(function () {
    OrganizationInvitation::query()
        ->whereNotNull('expires_at')
        ->where('expires_at', '<', now())
        ->delete();
})->daily()->description('Delete expired organization invitations');

Schedule::call(function (): void {
    ExtensionHandoff::query()
        ->where('expires_at', '<', now()->subDay())
        ->delete();
})->daily()->description('Delete expired extension authentication handoffs');

Schedule::call(function (): void {
    PersonalAccessToken::query()
        ->whereNotNull('expires_at')
        ->where('expires_at', '<', now())
        ->delete();
})->daily()->description('Delete expired extension API tokens');

Schedule::command('horizon:snapshot')->everyFiveMinutes();
