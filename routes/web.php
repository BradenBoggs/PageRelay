<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\CollaborationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExtensionConnectionController;
use App\Http\Controllers\Organizations\OrganizationInvitationController;
use App\Http\Middleware\EnsureOrganizationMembership;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::get('dashboard', DashboardController::class)->middleware(['auth', 'verified'])->name('dashboard');
Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [OrganizationInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [OrganizationInvitationController::class, 'decline'])->name('invitations.decline');
});
Route::middleware(['auth', 'verified', EnsureOrganizationMembership::class, 'throttle:20,1'])->group(function (): void {
    Route::get('extension/connect/{handoff}', [ExtensionConnectionController::class, 'show'])->name('extension.connect.show');
    Route::post('extension/connect/{handoff}', [ExtensionConnectionController::class, 'store'])->name('extension.connect.store');
});
Route::middleware(['auth', 'verified', EnsureOrganizationMembership::class])->group(function (): void {
    Route::get('messages', [CollaborationController::class, 'home'])->name('messages.index');
    Route::prefix('collaboration')->middleware('throttle:240,1')->group(function (): void {
        require __DIR__.'/collaboration.php';
    });
    Route::get('activity', [ChatController::class, 'activity'])->name('activity.index');
    Route::get('chats', [ChatController::class, 'index'])->name('chats.index');
    Route::post('chats', [ChatController::class, 'storeChat'])->name('chats.store');
    Route::get('chats/{conversation}', [ChatController::class, 'show'])->name('chats.show');
    Route::post('chats/{conversation}/messages', [ChatController::class, 'store'])->name('chats.messages.store');
    Route::post('chats/{conversation}/read', [ChatController::class, 'read'])->name('chats.read.store');
});
require __DIR__.'/settings.php';
