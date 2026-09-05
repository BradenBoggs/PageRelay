<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Activity\ConversationDiscovery;
use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationActivityResource;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ConversationDiscoveryController extends Controller
{
    public function index(Request $request, ConversationDiscovery $discovery): JsonResponse
    {
        $validated = $request->validate([
            'surface' => ['nullable', Rule::in(['activity', 'chats'])],
            'view' => ['nullable', Rule::in(['all', 'unread'])],
            'query' => ['nullable', 'string', 'max:100'],
            'app' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $surface = $validated['surface'] ?? 'activity';
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
            25,
        );

        return response()->json([
            'data' => $chats->getCollection()->map(
                fn ($chat) => (new ConversationActivityResource($chat))->resolve($request),
            )->values(),
            'meta' => [
                'apps' => $discovery->apps($organization, $request->user(), $surface),
                'current_page' => $chats->currentPage(),
                'next_page' => $chats->hasMorePages() ? $chats->currentPage() + 1 : null,
                'web_url' => route($surface === 'activity' ? 'activity.index' : 'chats.index'),
            ],
        ]);
    }
}
