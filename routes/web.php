<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExtensionConnectionController;
use App\Http\Controllers\Organizations\OrganizationInvitationController;
use App\Http\Middleware\EnsureOrganizationMembership;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [OrganizationInvitationController::class, 'accept'])
        ->name('invitations.accept');
    Route::delete('invitations/{invitation}', [OrganizationInvitationController::class, 'decline'])
        ->name('invitations.decline');
});

Route::middleware(['auth', 'verified', EnsureOrganizationMembership::class, 'throttle:20,1'])
    ->group(function (): void {
        Route::get('extension/connect/{handoff}', [ExtensionConnectionController::class, 'show'])
            ->name('extension.connect.show');
        Route::post('extension/connect/{handoff}', [ExtensionConnectionController::class, 'store'])
            ->name('extension.connect.store');
    });

require __DIR__.'/settings.php';
