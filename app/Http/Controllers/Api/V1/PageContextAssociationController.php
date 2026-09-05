<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Conversations\LinkPageContext;
use App\Domain\Conversations\UnlinkPageContext;
use App\Enums\ConversationType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LinkPageContextRequest;
use App\Http\Requests\Api\LinkPageRequest;
use App\Http\Requests\Api\UnlinkPageContextRequest;
use App\Http\Resources\PageContextResource;
use App\Models\Conversation;
use App\Models\Organization;
use App\Models\PageContext;

class PageContextAssociationController extends Controller
{
    public function store(
        LinkPageRequest $request,
        LinkPageContext $link,
    ): PageContextResource {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $workspace = $organization->defaultWorkspace()->firstOrFail();
        $destination = Conversation::query()
            ->where('organization_id', $organization->id)
            ->where('workspace_id', $workspace->id)
            ->where('type', ConversationType::Page)
            ->where('public_id', $request->validated('conversation_id'))
            ->firstOrFail();
        $context = $link->fromPage(
            $organization,
            $request->user(),
            $request->validated('page_url'),
            $request->validated('page_title'),
            $request->validated('favicon_url'),
            $destination,
        );

        return new PageContextResource($this->loadContext($context));
    }

    public function update(
        LinkPageContextRequest $request,
        string $pageContext,
        LinkPageContext $link,
    ): PageContextResource {
        [$organization, $context] = $this->scope($request, $pageContext);
        $this->authorize('updateAssociation', $context);
        $destination = Conversation::query()
            ->where('organization_id', $organization->id)
            ->where('workspace_id', $context->workspace_id)
            ->where('type', ConversationType::Page)
            ->where('public_id', $request->validated('conversation_id'))
            ->firstOrFail();

        return new PageContextResource($this->loadContext($link->handle(
            $organization,
            $request->user(),
            $context,
            $destination,
            $request->integer('expected_association_version'),
        )));
    }

    private function loadContext(PageContext $context): PageContext
    {
        return $context->load([
            'conversation.pageContexts',
            'conversation.messages' => fn ($query) => $query
                ->with(['author', 'sourcePageContext'])
                ->latest('id')
                ->limit(100),
        ]);
    }

    public function destroy(
        UnlinkPageContextRequest $request,
        string $pageContext,
        UnlinkPageContext $unlink,
    ): PageContextResource {
        [$organization, $context] = $this->scope($request, $pageContext);
        $this->authorize('updateAssociation', $context);

        return new PageContextResource($unlink->handle(
            $organization,
            $request->user(),
            $context,
            $request->integer('expected_association_version'),
        )->load('conversation'));
    }

    /** @return array{Organization, PageContext} */
    private function scope(LinkPageContextRequest|UnlinkPageContextRequest $request, string $publicId): array
    {
        /** @var Organization $organization */
        $organization = $request->attributes->get('organization');
        $context = PageContext::query()
            ->where('organization_id', $organization->id)
            ->where('public_id', $publicId)
            ->firstOrFail();

        return [$organization, $context];
    }
}
