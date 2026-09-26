<?php

namespace App\Http\Controllers;

use App\Domain\PageContexts\NormalizePageUrl;
use App\Domain\PageContexts\ResolvePageContext;
use App\Domain\PageContexts\SavePageLink;
use App\Http\Requests\SavePageLinkRequest;
use App\Http\Resources\PageContextResource;
use App\Models\Organization;
use App\Models\PageContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageLinkController extends Controller
{
    public function preview(Request $request, ResolvePageContext $resolve): JsonResponse
    {
        $data = $request->validate(['url' => ['required', 'string', 'max:4096'], 'title' => ['nullable', 'string', 'max:255']]);
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $resolved = $resolve->handle($organization, $request->user(), $data['url'], $data['title'] ?? '', null);
        if ($resolved->context) {
            return (new PageContextResource($this->load($resolved->context), $resolved->url))->response();
        }

        return response()->json(['data' => [
            'persisted' => false, 'id' => null, 'title' => $resolved->title, 'host' => $resolved->host,
            'url' => $resolved->url, 'view_url' => $resolved->url, 'url_match' => null,
            'favicon_url' => null, 'association_version' => null, 'chat' => null,
        ]]);
    }

    public function store(SavePageLinkRequest $request, SavePageLink $save, NormalizePageUrl $normalizer): PageContextResource
    {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $context = $save->handle(
            $organization, $request->user(), $request->validated('url'), $request->validated('title'),
            $request->validated('matching'), $request->validated('conversation_id'), $request->validated('chat_name'),
            $request->validated('expected_context_id'), $request->validated('expected_association_version'),
        );

        return new PageContextResource($this->load($context), $normalizer->handle($request->validated('url'))->sourceUrl);
    }

    private function load(PageContext $context): PageContext
    {
        return $context->load(['conversation.pageContexts', 'conversation.messages' => fn ($q) => $q
            ->with(['author', 'sourcePageContext'])->latest('id')->limit(100)]);
    }
}
