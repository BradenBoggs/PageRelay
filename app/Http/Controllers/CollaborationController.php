<?php

namespace App\Http\Controllers;

use App\Domain\Activity\MarkConversationRead;
use App\Domain\Conversations\ConversationAccess;
use App\Domain\Conversations\CreateDirectChat;
use App\Domain\Conversations\SendCollaborationMessage;
use App\Enums\ConversationType;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageNotification;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** Shared collaboration HTTP contract; the web uses session/CSRF, the panel Sanctum. */
class CollaborationController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('collaboration/index');
    }

    public function index(Request $request): JsonResponse
    {
        $input = $request->validate([
            'kind' => ['nullable', Rule::in(['page', 'direct'])],
            'query' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $chats = ConversationAccess::query($request->user())->whereNull('retired_at')
            ->when($input['kind'] ?? null, fn ($q, $kind) => $q->where('type', $kind))
            ->when($input['query'] ?? null, fn ($q, $term) => $q->where('title', 'like', '%'.$term.'%'))
            ->with(['latestMessage.author', 'pageContexts'])
            ->orderByDesc('updated_at')->orderByDesc('id')->paginate(30);

        return response()->json([
            'data' => $chats->getCollection()->map(fn (Conversation $chat): array => $this->describe($chat, $request->user())),
            'next_page' => $chats->hasMorePages() ? $chats->currentPage() + 1 : null,
        ])->header('Cache-Control', 'no-store, private');
    }

    public function members(Request $request): JsonResponse
    {
        $input = $request->validate(['query' => ['nullable', 'string', 'max:100'], 'chat' => ['nullable', 'uuid']]);
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $chat = isset($input['chat']) ? $this->chat($request, $input['chat']) : null;
        $users = User::query()->whereIn('id', OrganizationMembership::query()->active()
            ->where('organization_id', $organization->id)->select('user_id'))
            ->when($chat === null, fn ($q) => $q->where('id', '!=', $request->user()->id))
            ->when($chat?->type === ConversationType::Direct, fn ($q) => $q->whereIn('id',
                DB::table('conversation_participants')->where('conversation_id', $chat->id)->select('user_id')))
            ->when($input['query'] ?? null, fn ($q, $term) => $q->where('name', 'like', '%'.$term.'%'))
            ->orderBy('name')->limit(30)->get(['id', 'name']);

        return response()->json(['data' => $users])->header('Cache-Control', 'no-store, private');
    }

    public function direct(Request $request, CreateDirectChat $create): JsonResponse
    {
        $input = $request->validate(['recipient_id' => ['required', 'integer', 'min:1']]);
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $chat = $create->handle($organization, $request->user(), $input['recipient_id']);

        return response()->json(['data' => $this->describe($chat, $request->user())], 201);
    }

    public function messages(Request $request, string $conversation): JsonResponse
    {
        $chat = $this->chat($request, $conversation);
        $input = $request->validate([
            'thread' => ['nullable', 'uuid'], 'before' => ['nullable', 'uuid'],
            'around' => ['nullable', 'uuid'],
        ]);
        $root = isset($input['thread']) ? $chat->messages()->whereNull('thread_root_id')
            ->where('public_id', $input['thread'])->firstOrFail() : null;
        $query = $chat->messages()->where('thread_root_id', $root?->id)
            ->with(['author', 'sourcePageContext', 'threadRoot', 'mentionedUsers'])->withCount('replies');
        if (isset($input['before'])) {
            $before = (clone $query)->where('public_id', $input['before'])->firstOrFail();
            $query->where('id', '<', $before->id);
        }
        if (isset($input['around'])) {
            $target = (clone $query)->where('public_id', $input['around'])->firstOrFail();
            $older = (clone $query)->where('id', '<=', $target->id)->latest('id')->limit(26)->get();
            $newer = (clone $query)->where('id', '>', $target->id)->orderBy('id')->limit(25)->get();
            $messages = $older->concat($newer)->sortBy('id')->values();
        } else {
            $messages = $query->latest('id')->limit(51)->get()->sortBy('id')->values();
        }
        if ($messages->count() > 50) {
            $messages = $messages->slice(1)->values();
        }
        $first = $messages->first();
        $more = $first !== null && $chat->messages()->where('thread_root_id', $root?->id)->where('id', '<', $first->id)->exists();

        return response()->json([
            'chat' => $this->describe($chat, $request->user()),
            'root' => $root ? (new MessageResource($root->load(['author', 'sourcePageContext', 'mentionedUsers'])))->resolve($request) : null,
            'data' => $messages->map(fn (Message $message): array => (new MessageResource($message))->resolve($request)),
            'older_cursor' => $more ? $messages->first()?->public_id : null,
        ])->header('Cache-Control', 'no-store, private');
    }

    public function send(Request $request, string $conversation, SendCollaborationMessage $send): JsonResponse
    {
        $chat = $this->chat($request, $conversation);
        $input = $request->validate([
            'body' => ['required', 'string', 'max:10000'],
            'idempotency_key' => ['required', 'uuid'],
            'thread_root_id' => ['nullable', 'uuid'],
            'mentions' => ['sometimes', 'array', 'max:20'],
            'mentions.*' => ['integer', 'min:1', 'distinct'],
            'source_context_id' => ['nullable', 'uuid'],
            'source_version' => ['nullable', 'integer', 'min:0'],
        ]);
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $sent = $send->handle($organization, $request->user(), $chat,
            $input['body'], $input['idempotency_key'], $input['thread_root_id'] ?? null,
            $input['mentions'] ?? [], $input['source_context_id'] ?? null, $input['source_version'] ?? null);

        return response()->json(['data' => (new MessageResource($sent->message->fresh([
            'author', 'sourcePageContext', 'mentionedUsers', 'threadRoot',
        ])))->resolve($request)], $sent->created ? 201 : 200);
    }

    public function read(Request $request, string $conversation): JsonResponse
    {
        $chat = $this->chat($request, $conversation);
        $input = $request->validate([
            'messages' => ['required', 'array', 'min:1', 'max:100'], 'messages.*' => ['uuid', 'distinct'],
        ]);
        $messages = $chat->messages()->whereIn('public_id', $input['messages'])->get();
        abort_unless($messages->count() === count($input['messages']), 404);
        MessageNotification::query()->where('user_id', $request->user()->id)
            ->where('organization_id', $chat->organization_id)->where('conversation_id', $chat->id)
            ->whereIn('message_id', $messages->modelKeys())->whereNull('read_at')->update(['read_at' => now()]);
        $latestRoot = $messages->whereNull('thread_root_id')->sortByDesc('id')->first();
        if ($latestRoot && $chat->type === ConversationType::Page && $chat->retired_at === null) {
            /** @var Organization $organization */
            $organization = $request->attributes->get('organization');
            app(MarkConversationRead::class)->handle($organization, $request->user(), $chat, $latestRoot->public_id);
        }

        return response()->json(['ok' => true]);
    }

    private function chat(Request $request, string $publicId): Conversation
    {
        return ConversationAccess::query($request->user())->where('public_id', $publicId)->firstOrFail();
    }

    /** @return array<string, mixed> */
    private function describe(Conversation $chat, User $user): array
    {
        $title = $chat->title;
        $canSend = $chat->retired_at === null;
        if ($chat->type === ConversationType::Direct) {
            $participants = DB::table('conversation_participants')->where('conversation_id', $chat->id)->pluck('user_id');
            $other = User::query()->whereIn('id', $participants)->where('id', '!=', $user->id)->first();
            $title = $other->name ?? 'Former coworker';
            $canSend = $canSend && OrganizationMembership::query()->active()->where('organization_id', $chat->organization_id)
                ->whereIn('user_id', $participants)->count() === 2;
        }

        return [
            'id' => $chat->public_id, 'title' => $title, 'type' => $chat->type->value,
            'can_send' => $canSend,
            'unread_attention' => MessageNotification::query()->where('user_id', $user->id)
                ->where('conversation_id', $chat->id)->whereNull('read_at')->count(),
            'linked_pages' => $chat->pageContexts->map(fn ($page): array => [
                'id' => $page->public_id, 'title' => $page->title,
                'url' => $page->source_url, 'host' => $page->source_host,
            ])->values(),
        ];
    }
}
