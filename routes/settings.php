<?php

use App\Http\Controllers\Organizations\OrganizationController;
use App\Http\Controllers\Organizations\OrganizationInvitationController;
use App\Http\Controllers\Organizations\OrganizationMemberController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Middleware\EnsureOrganizationMembership;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    Route::middleware(EnsureOrganizationMembership::class)->group(function () {
        Route::get('settings/organization', [OrganizationController::class, 'edit'])
            ->name('organization.edit');
        Route::patch('settings/organization', [OrganizationController::class, 'update'])
            ->name('organization.update');

        Route::patch('settings/organization/members/{user}', [OrganizationMemberController::class, 'update'])
            ->name('organization.members.update');
        Route::delete('settings/organization/members/{user}', [OrganizationMemberController::class, 'destroy'])
            ->name('organization.members.destroy');

        Route::post('settings/organization/invitations', [OrganizationInvitationController::class, 'store'])
            ->name('organization.invitations.store');
        Route::delete('settings/organization/invitations/{invitation}', [OrganizationInvitationController::class, 'destroy'])
            ->name('organization.invitations.destroy');
    });
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');
