<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\CollaborationController;
use App\Http\Controllers\ExtensionConnectionController;
use App\Http\Controllers\Organizations\InvitationRegistrationController;
use App\Http\Controllers\Organizations\OrganizationInvitationController;
use App\Http\Controllers\TodoController;
use App\Http\Middleware\EnsureOrganizationMembership;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;

Route::get('/', function (Request $request): RedirectResponse {
    $user = $request->user();
    if (! $user) {
        return to_route('login');
    }
    if (! $user->hasVerifiedEmail()) {
        return to_route('verification.notice');
    }

    return to_route($user->organization()->exists() ? 'messages.index' : 'profile.edit');
})->name('home');
Route::redirect('dashboard', '/')->name('dashboard');
Route::middleware(['guest', 'throttle:5,1'])->group(function (): void {
    Route::get('register', [InvitationRegistrationController::class, 'show'])->middleware('cache.headers:no_store;private')->name('register');
    Route::post('register', [RegisteredUserController::class, 'store'])->name('register.store');
});
Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [OrganizationInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [OrganizationInvitationController::class, 'decline'])->name('invitations.decline');
});
Route::middleware(['auth', 'verified', EnsureOrganizationMembership::class, 'throttle:20,1'])->group(function (): void {
    Route::get('extension/connect/{handoff}', [ExtensionConnectionController::class, 'show'])->name('extension.connect.show');
    Route::post('extension/connect/{handoff}', [ExtensionConnectionController::class, 'store'])->name('extension.connect.store');
});
Route::middleware(['auth', 'verified', EnsureOrganizationMembership::class])->group(function (): void {
    Route::get('todos', [TodoController::class, 'home'])->name('todos.index');
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
