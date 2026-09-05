<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Activity\MarkConversationRead;
use App\Enums\ConversationType;
use App\Http\Controllers\Controller;
use App\Http\Requests\MarkConversationReadRequest;
use App\Models\Conversation;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;

class PageConversationReadController extends Controller
{
    public function store(
        MarkConversationReadRequest $request,
        string $conversation,
        MarkConversationRead $markRead,
    ): JsonResponse {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $workspace = $organization->defaultWorkspace()->firstOrFail();
        $chat = Conversation::query()
            ->where('organization_id', $organization->id)
            ->where('workspace_id', $workspace->id)
            ->where('type', ConversationType::Page)
            ->where('public_id', $conversation)
            ->firstOrFail();
        $read = $markRead->handle(
            $organization,
            $request->user(),
            $chat,
            $request->validated('message_id'),
        );
        $read->load('lastReadMessage');

        return response()->json([
            'data' => [
                'chat_id' => $chat->public_id,
                'message_id' => $read->lastReadMessage->public_id,
            ],
        ]);
    }
}
