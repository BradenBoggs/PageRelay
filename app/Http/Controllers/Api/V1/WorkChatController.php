<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Conversations\CreateWorkChat;
use App\Domain\Conversations\SendPageMessage;
use App\Enums\ConversationType;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateWorkChatRequest;
use App\Http\Requests\SendConversationMessageRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkChatController extends Controller
{
    public function store(CreateWorkChatRequest $request, CreateWorkChat $create): JsonResponse
    {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $chat = $create->handle(
            $organization,
            $request->user(),
            $request->validated('title'),
            $request->validated('idempotency_key'),
        );

        return (new ConversationResource($this->load($chat)))->response()->setStatusCode(201);
    }

    public function show(Request $request, string $conversation): ConversationResource
    {
        return new ConversationResource($this->load($this->scope($request, $conversation)));
    }

    public function message(
        SendConversationMessageRequest $request,
        string $conversation,
        SendPageMessage $send,
    ): JsonResponse {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $sent = $send->toConversation(
            $organization,
            $request->user(),
            $this->scope($request, $conversation),
            $request->validated('body'),
            $request->validated('idempotency_key'),
        );

        return (new MessageResource($sent->message))->response()->setStatusCode($sent->created ? 201 : 200);
    }

    private function scope(Request $request, string $publicId): Conversation
    {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $workspace = $organization->defaultWorkspace()->firstOrFail();

        return Conversation::query()
            ->where('organization_id', $organization->id)
            ->where('workspace_id', $workspace->id)
            ->where('type', ConversationType::Page)
            ->whereNull('retired_at')
            ->where('public_id', $publicId)
            ->firstOrFail();
    }

    private function load(Conversation $chat): Conversation
    {
        return $chat->load([
            'pageContexts' => fn ($query) => $query->orderBy('id'),
            'messages' => fn ($query) => $query
                ->with(['author', 'sourcePageContext'])
                ->latest('id')
                ->limit(100),
        ]);
    }
}
