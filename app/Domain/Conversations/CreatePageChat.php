<?php

namespace App\Domain\Conversations;

use App\Domain\PageContexts\CreatePageContext;
use App\Enums\ConversationType;
use App\Models\Conversation;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\PageContext;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Atomically persists a page context and empty chat after explicit creation.
 *
 * @see docs/features/page-conversations.md
 */
class CreatePageChat
{
    public function __construct(private CreatePageContext $createContext)
    {
        //
    }

    public function handle(
        Organization $organization,
        User $actor,
        string $url,
        string $pageTitle,
        string $chatName,
        ?string $faviconUrl,
    ): PageContext {
        return DB::transaction(function () use (
            $organization,
            $actor,
            $url,
            $pageTitle,
            $chatName,
            $faviconUrl,
        ): PageContext {
            OrganizationMembership::query()
                ->active()
                ->where('organization_id', $organization->id)
                ->where('user_id', $actor->id)
                ->lockForUpdate()
                ->firstOrFail();

            $context = $this->createContext->handle(
                $organization,
                $actor,
                $url,
                $pageTitle,
                $faviconUrl,
            );
            $context = PageContext::query()
                ->where('organization_id', $organization->id)
                ->whereKey($context->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($context->conversation_id !== null) {
                return $context;
            }

            $conversation = Conversation::create([
                'organization_id' => $organization->id,
                'workspace_id' => $context->workspace_id,
                'type' => ConversationType::Page,
                'title' => trim($chatName),
                'created_by' => $actor->id,
            ]);

            $context->forceFill([
                'conversation_id' => $conversation->id,
                'association_version' => $context->association_version + 1,
                'association_reason' => 'created',
            ])->save();

            return $context->refresh();
        }, 3);
    }
}
