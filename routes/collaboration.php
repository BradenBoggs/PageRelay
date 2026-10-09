<?php

use App\Http\Controllers\CollaborationController;
use App\Http\Controllers\MessageNotificationController;
use Illuminate\Support\Facades\Route;

// Included only inside an authenticated, verified organization route group.
Route::get('chats', [CollaborationController::class, 'index']);
Route::get('members', [CollaborationController::class, 'members']);
Route::post('direct', [CollaborationController::class, 'direct'])->middleware('throttle:30,1');
Route::get('chats/{conversation}/messages', [CollaborationController::class, 'messages']);
Route::post('chats/{conversation}/messages', [CollaborationController::class, 'send'])->middleware('throttle:60,1');
Route::post('chats/{conversation}/read', [CollaborationController::class, 'read']);
Route::get('notifications', [MessageNotificationController::class, 'index']);
Route::put('notifications/settings', [MessageNotificationController::class, 'settings']);
Route::post('notifications/{notification}/claim', [MessageNotificationController::class, 'claim']);
Route::post('notifications/{notification}/delivered', [MessageNotificationController::class, 'delivered']);
