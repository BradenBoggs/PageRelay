<?php

namespace App\Http\Controllers;

use App\Domain\Activity\ConversationDiscovery;
use App\Domain\Activity\MarkConversationRead;
use App\Domain\Conversations\SendPageMessage;
use App\Enums\ConversationType;
use App\Http\Requests\MarkConversationReadRequest;
use App\Http\Requests\SendConversationMessageRequest;
use App\Http\Resources\ConversationActivityResource;
use App\Models\Conversation;
use App\Models\Organization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request, ConversationDiscovery $discovery): Response
    {
        return $this->discovery($request, $discovery, 'chats');
    }

    public function activity(Request $request, ConversationDiscovery $discovery): Response
    {
        return $this->discovery($request, $discovery, 'activity');
    }

    public function show(Request $request, string $conversation): Response
    {
        $chat = $this->scopedChat($request, $conversation)->load([
            'pageContexts' => fn ($query) => $query->orderBy('id'),
            'messages' => fn ($query) => $query
                ->with(['author', 'sourcePageContext'])
                ->latest('id')
                ->limit(100),
        ]);
        $this->authorize('view', $chat);
        $chat->setRelation('messages', $chat->messages->sortBy('id')->values());

        return Inertia::render('chats/show', [
            'chat' => [
                'id' => $chat->public_id,
                'title' => $chat->title,
                'linkedPages' => $chat->pageContexts->map(fn ($context) => [
                    'id' => $context->public_id,
                    'title' => $context->title,
                    'host' => $context->source_host,
                    'url' => $context->source_url,
                ]),
                'messages' => $chat->messages->map(fn ($message) => [
                    'id' => $message->public_id,
                    'body' => $message->body,
                    'createdAt' => $message->created_at->toISOString(),
                    'author' => ['id' => $message->author->id, 'name' => $message->author->name],
                    'source' => $message->sourcePageContext ? [
                        'title' => $message->sourcePageContext->title,
                        'host' => $message->sourcePageContext->source_host,
                        'url' => $message->sourcePageContext->source_url,
                    ] : null,
                ]),
            ],
            'idempotencyKey' => (string) Str::uuid(),
            'organizationId' => $chat->organization_id,
            'lastMessageId' => $chat->messages->last()?->public_id,
        ]);
    }

    public function read(
        MarkConversationReadRequest $request,
        string $conversation,
        MarkConversationRead $markRead,
    ): RedirectResponse {
        $chat = $this->scopedChat($request, $conversation);
        $this->authorize('view', $chat);
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');

        $markRead->handle(
            $organization,
            $request->user(),
            $chat,
            $request->validated('message_id'),
        );

        return back();
    }

    public function store(
        SendConversationMessageRequest $request,
        string $conversation,
        SendPageMessage $send,
    ): RedirectResponse {
        $chat = $this->scopedChat($request, $conversation);
        $this->authorize('view', $chat);
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');

        $send->toConversation(
            $organization,
            $request->user(),
            $chat,
            $request->validated('body'),
            $request->validated('idempotency_key'),
        );

        return back();
    }

    private function scopedChat(Request $request, string $publicId): Conversation
    {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $workspace = $organization->defaultWorkspace()->firstOrFail();

        return Conversation::query()
            ->where('organization_id', $organization->id)
            ->where('workspace_id', $workspace->id)
            ->where('type', ConversationType::Page)
            ->where('public_id', $publicId)
            ->firstOrFail();
    }

    private function discovery(
        Request $request,
        ConversationDiscovery $discovery,
        string $surface,
    ): Response {
        $validated = $request->validate([
            'view' => ['nullable', Rule::in(['all', 'unread'])],
            'query' => ['nullable', 'string', 'max:100'],
            'app' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $view = $validated['view'] ?? 'all';
        $search = isset($validated['query']) ? trim($validated['query']) : null;
        $app = isset($validated['app']) ? trim($validated['app']) : null;
        $chats = $discovery->paginate(
            $organization,
            $request->user(),
            $surface,
            $view,
            $search,
            $app,
            20,
        );

        return Inertia::render($surface === 'activity' ? 'activity/index' : 'chats/index', [
            'surface' => $surface,
            'filters' => [
                'view' => $view,
                'query' => $search ?? '',
                'app' => $app ?? '',
            ],
            'apps' => $discovery->apps($organization, $request->user(), $surface),
            'chats' => [
                'items' => $chats->getCollection()->map(
                    fn ($chat) => (new ConversationActivityResource($chat))->resolve($request),
                )->values(),
                'previousPageUrl' => $chats->previousPageUrl(),
                'nextPageUrl' => $chats->nextPageUrl(),
            ],
        ]);
    }
}
