<?php

use App\Http\Controllers\Api\V1\ExtensionHandoffController;
use App\Http\Controllers\Api\V1\ExtensionSessionController;
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
    });
