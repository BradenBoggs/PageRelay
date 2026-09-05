<?php

use App\Http\Controllers\Api\V1\ConversationDiscoveryController;
use App\Http\Controllers\Api\V1\ExtensionHandoffController;
use App\Http\Controllers\Api\V1\ExtensionSessionController;
use App\Http\Controllers\Api\V1\PageContextAssociationController;
use App\Http\Controllers\Api\V1\PageContextController;
use App\Http\Controllers\Api\V1\PageContextMessageController;
use App\Http\Controllers\Api\V1\PageConversationController;
use App\Http\Controllers\Api\V1\PageConversationReadController;
use Illuminate\Broadcasting\BroadcastController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/extension')
    ->middleware('throttle:extension-handoff')
    ->group(function (): void {
        Route::post('handoffs', [ExtensionHandoffController::class, 'store'])
            ->name('api.extension.handoffs.store');
        Route::put('handoffs/{handoff}', [ExtensionHandoffController::class, 'update'])
            ->name('api.extension.handoffs.update');
    });

Route::prefix('v1/extension')
    ->middleware([
        'auth:sanctum',
        'verified',
        'extension.token',
        'organization.member',
        'throttle:extension-api',
    ])
    ->group(function (): void {
        Route::get('session', [ExtensionSessionController::class, 'show'])
            ->name('api.extension.session.show');
        Route::delete('session', [ExtensionSessionController::class, 'destroy'])
            ->name('api.extension.session.destroy');
        Route::post('broadcasting/auth', [BroadcastController::class, 'authenticate'])
            ->name('api.extension.broadcasting.auth');
        Route::post('page-contexts/resolve', [PageContextController::class, 'store'])
            ->name('api.page-contexts.resolve');
        Route::get('page-contexts/{pageContext}', [PageContextController::class, 'show'])
            ->name('api.page-contexts.show');
        Route::post('page-contexts/{pageContext}/messages', [PageContextMessageController::class, 'store'])
            ->name('api.page-contexts.messages.store');
        Route::get('page-chats', [PageConversationController::class, 'index'])
            ->middleware('organization.member:admin')
            ->name('api.page-chats.index');
        Route::post('page-chats', [PageConversationController::class, 'store'])
            ->name('api.page-chats.store');
        Route::get('discovery', [ConversationDiscoveryController::class, 'index'])
            ->name('api.discovery.index');
        Route::post('page-chats/{conversation}/read', [PageConversationReadController::class, 'store'])
            ->name('api.page-chats.read.store');
        Route::put('page-contexts/chat', [PageContextAssociationController::class, 'store'])
            ->middleware('organization.member:admin')
            ->name('api.page-contexts.chat.store');
        Route::put('page-contexts/{pageContext}/chat', [PageContextAssociationController::class, 'update'])
            ->middleware('organization.member:admin')
            ->name('api.page-contexts.chat.update');
        Route::delete('page-contexts/{pageContext}/chat', [PageContextAssociationController::class, 'destroy'])
            ->middleware('organization.member:admin')
            ->name('api.page-contexts.chat.destroy');
    });
