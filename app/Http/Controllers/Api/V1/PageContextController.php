<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\PageContexts\ResolvePageContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ResolvePageContextRequest;
use App\Http\Resources\PageContextResource;
use App\Models\Message;
use App\Models\Organization;
use App\Models\PageContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageContextController extends Controller
{
    public function store(
        ResolvePageContextRequest $request,
        ResolvePageContext $resolve,
    ): JsonResponse {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $resolved = $resolve->handle(
            $organization,
            $request->user(),
            $request->validated('url'),
            $request->validated('title'),
            $request->validated('favicon_url'),
        );

        if ($resolved->context) {
            return (new PageContextResource($this->loadContext($resolved->context)))
                ->response();
        }

        return response()->json([
            'data' => [
                'persisted' => false,
                'id' => null,
                'title' => $resolved->title,
                'host' => $resolved->host,
                'url' => $resolved->url,
                'favicon_url' => $resolved->faviconUrl,
                'association_version' => null,
                'chat' => null,
            ],
        ]);
    }

    public function show(Request $request, string $pageContext): PageContextResource
    {
        $request->validate(['before' => ['nullable', 'uuid']]);
        $context = $this->scopedContext($request, $pageContext);
        $this->authorize('view', $context);

        return new PageContextResource($this->loadContext(
            $context,
            $request->string('before')->toString() ?: null,
        ));
    }

    private function scopedContext(Request $request, string $publicId): PageContext
    {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');

        return PageContext::query()
            ->where('organization_id', $organization->id)
            ->where('public_id', $publicId)
            ->firstOrFail();
    }

    private function loadContext(PageContext $context, ?string $before = null): PageContext
    {
        $context->load([
            'conversation.pageContexts' => fn ($query) => $query->orderBy('id'),
        ]);

        if (! $context->conversation) {
            return $context;
        }

        $query = Message::query()
            ->with(['author', 'sourcePageContext'])
            ->where('conversation_id', $context->conversation->id);

        if ($before !== null) {
            $beforeId = Message::query()
                ->where('conversation_id', $context->conversation->id)
                ->where('public_id', $before)
                ->value('id');
            abort_if($beforeId === null, 404);
            $query->where('id', '<', $beforeId);
        }

        $messages = $query->latest('id')->limit(101)->get();
        $hasMore = $messages->count() > 100;
        $page = $messages->take(100)->values();
        $context->conversation->setRelation('messages', $page);
        $context->conversation->setAttribute('messages_has_more', $hasMore);
        $context->conversation->setAttribute('messages_next_before', $page->last()?->public_id);

        return $context;
    }
}
