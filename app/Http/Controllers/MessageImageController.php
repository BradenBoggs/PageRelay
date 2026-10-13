<?php

namespace App\Http\Controllers;

use App\Domain\Conversations\ConversationAccess;
use App\Domain\Images\ImagePreview;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MessageImageController extends Controller
{
    public function show(Request $request, string $conversation, string $message, string $image, ImagePreview $preview): Response
    {
        $chat = ConversationAccess::query($request->user())->where('public_id', $conversation)->firstOrFail();
        $item = $chat->messages()->where('public_id', $message)->whereNull('deleted_at')->firstOrFail();
        $candidate = collect($preview->candidates($item->body))->firstWhere('key', $image);
        abort_unless($candidate !== null, 404);
        $result = $preview->fetch($candidate['url']);

        abort_unless(ConversationAccess::query($request->user())->whereKey($chat->id)->exists(), 403);
        $current = $chat->messages()->whereKey($item->id)->whereNull('deleted_at')->firstOrFail();
        abort_unless(collect($preview->candidates($current->body))->contains('key', $image), 404);

        return response($result['body'])->header('Content-Type', $result['mime'])
            ->header('Cache-Control', 'no-store, private')->header('X-Content-Type-Options', 'nosniff');
    }
}
