<?php

namespace App\Http\Controllers;

use App\Domain\Conversations\ConversationAccess;
use App\Domain\Todos\ManageTodo;
use App\Http\Resources\TodoResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TodoController extends Controller
{
    public function home(): Response
    {
        return Inertia::render('todos/index');
    }

    public function index(Request $request, ManageTodo $manage): JsonResponse
    {
        $input = $request->validate(['status' => ['nullable', Rule::in(['open', 'completed', 'all'])],
            'mine' => ['nullable', 'boolean'], 'page' => ['nullable', 'integer', 'min:1']]);
        $todos = $manage->visible($request->user())
            ->when(($input['status'] ?? 'open') === 'open', fn ($query) => $query->whereNull('completed_at'))
            ->when(($input['status'] ?? '') === 'completed', fn ($query) => $query->whereNotNull('completed_at'))
            ->when($input['mine'] ?? false, fn ($query) => $query->where('assignee_id', $request->user()->id))
            ->with(['message.conversation', 'message.threadRoot', 'assignee', 'completer'])
            ->latest('id')->paginate(30);

        return response()->json(['data' => $todos->getCollection()->map(fn ($todo) => (new TodoResource($todo))->resolve($request)),
            'next_page' => $todos->hasMorePages() ? $todos->currentPage() + 1 : null])
            ->header('Cache-Control', 'no-store, private');
    }

    public function show(Request $request, string $todo, ManageTodo $manage): JsonResponse
    {
        $item = $manage->visible($request->user())->where('public_id', $todo)
            ->with(['message.conversation', 'message.threadRoot', 'assignee', 'completer'])->firstOrFail();

        return response()->json(['data' => (new TodoResource($item))->resolve($request)])
            ->header('Cache-Control', 'no-store, private');
    }

    public function store(Request $request, string $conversation, string $message, ManageTodo $manage): JsonResponse
    {
        $chat = ConversationAccess::query($request->user())->where('public_id', $conversation)->firstOrFail();
        $item = $chat->messages()->where('public_id', $message)->firstOrFail();
        $input = $request->validate(['title' => ['required', 'string', 'max:200'], 'assignee_id' => ['nullable', 'integer', 'min:1']]);
        $todo = $manage->create($request->user(), $item, $input['title'], $input['assignee_id'] ?? null);

        return response()->json(['data' => (new TodoResource($todo->fresh()))->resolve($request)]);
    }

    public function update(Request $request, string $todo, ManageTodo $manage): JsonResponse
    {
        $item = $manage->visible($request->user())->where('public_id', $todo)->firstOrFail();
        $input = $request->validate(['title' => ['required', 'string', 'max:200'], 'assignee_id' => ['present', 'nullable', 'integer', 'min:1'],
            'completed' => ['required', 'boolean'], 'version' => ['required', 'integer', 'min:0']]);
        $updated = $manage->update($request->user(), $item, $input['title'], $input['assignee_id'], $input['completed'], $input['version']);

        return response()->json(['data' => (new TodoResource($updated->fresh()))->resolve($request)]);
    }
}
