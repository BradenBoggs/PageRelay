<?php

use App\Http\Controllers\CollaborationController;
use App\Http\Controllers\MessageNotificationController;
use App\Http\Controllers\TodoController;
use Illuminate\Support\Facades\Route;

// Included only inside an authenticated, verified organization route group.
Route::get('chats', [CollaborationController::class, 'index']);
Route::get('members', [CollaborationController::class, 'members']);
Route::post('direct', [CollaborationController::class, 'direct'])->middleware('throttle:30,1');
Route::get('chats/{conversation}/messages', [CollaborationController::class, 'messages']);
Route::post('chats/{conversation}/messages', [CollaborationController::class, 'send'])->middleware('throttle:60,1');
Route::patch('chats/{conversation}/messages/{message}', [CollaborationController::class, 'updateMessage'])->middleware('throttle:60,1');
Route::delete('chats/{conversation}/messages/{message}', [CollaborationController::class, 'destroyMessage']);
Route::post('chats/{conversation}/read', [CollaborationController::class, 'read']);
Route::get('notifications', [MessageNotificationController::class, 'index']);
Route::get('notifications/history', [MessageNotificationController::class, 'history']);
Route::put('notifications/settings', [MessageNotificationController::class, 'settings']);
Route::post('notifications/{notification}/claim', [MessageNotificationController::class, 'claim']);
Route::post('notifications/{notification}/delivered', [MessageNotificationController::class, 'delivered']);

Route::get('todos', [TodoController::class, 'index']);
Route::get('todos/{todo}', [TodoController::class, 'show']);
Route::post('chats/{conversation}/messages/{message}/todo', [TodoController::class, 'store'])->middleware('throttle:60,1');
Route::patch('todos/{todo}', [TodoController::class, 'update'])->middleware('throttle:60,1');
