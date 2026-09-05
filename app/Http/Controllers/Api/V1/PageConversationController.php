<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Conversations\CreatePageChat;
use App\Enums\ConversationType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CreatePageChatRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\PageContextResource;
use App\Models\Conversation;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PageConversationController extends Controller
{
    public function store(
        CreatePageChatRequest $request,
        CreatePageChat $create,
    ): JsonResponse {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $context = $create->handle(
            $organization,
            $request->user(),
            $request->validated('page_url'),
            $request->validated('page_title'),
            $request->validated('chat_name'),
            $request->validated('favicon_url'),
        );

        $context->load([
            'conversation.pageContexts' => fn ($query) => $query->orderBy('id'),
            'conversation.messages' => fn ($query) => $query
                ->with(['author', 'sourcePageContext'])
                ->latest('id')
                ->limit(100),
        ]);

        return (new PageContextResource($context))->response()->setStatusCode(201);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate(['query' => ['nullable', 'string', 'max:100']]);
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $workspace = $organization->defaultWorkspace()->firstOrFail();

        $conversations = Conversation::query()
            ->with(['pageContexts' => fn ($query) => $query->orderBy('id')])
            ->where('organization_id', $organization->id)
            ->where('workspace_id', $workspace->id)
            ->where('type', ConversationType::Page)
            ->whereNull('retired_at')
            ->whereHas('messages')
            ->when($request->string('query')->isNotEmpty(), function ($query) use ($request): void {
                $search = '%'.addcslashes($request->string('query')->toString(), '%_').'%';
                $query->where('title', 'like', $search);
            })
            ->latest('updated_at')
            ->limit(25)
            ->get();

        return ConversationResource::collection($conversations);
    }
}
