<?php

namespace App\Domain\Conversations;

use App\Domain\PageContexts\CreatePageContext;
use App\Enums\ConversationType;
use App\Enums\OrganizationRole;
use App\Exceptions\PageChatConflict;
use App\Models\Conversation;
use App\Models\Organization;
use App\Models\OrganizationActivity;
use App\Models\OrganizationMembership;
use App\Models\PageContext;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Creates or reassigns an eligible page context under one association lock.
 *
 * @see docs/features/page-conversations.md
 */
class LinkPageContext
{
    public function __construct(private CreatePageContext $createContext)
    {
        //
    }

    public function handle(
        Organization $organization,
        User $actor,
        PageContext $context,
        Conversation $destination,
        int $expectedAssociationVersion,
    ): PageContext {
        return DB::transaction(function () use (
            $organization,
            $actor,
            $context,
            $destination,
            $expectedAssociationVersion,
        ): PageContext {
            $this->lockManagerMembership($organization, $actor);
            $lockedContext = PageContext::query()
                ->where('organization_id', $organization->id)
                ->whereKey($context->id)
                ->lockForUpdate()
                ->firstOrFail();
            $lockedDestination = $this->lockDestination(
                $organization,
                $lockedContext->workspace_id,
                $destination->id,
            );

            return $this->linkLocked(
                $organization,
                $actor,
                $lockedContext,
                $lockedDestination,
                $expectedAssociationVersion,
            );
        }, 3);
    }

    public function fromPage(
        Organization $organization,
        User $actor,
        string $url,
        string $title,
        ?string $faviconUrl,
        Conversation $destination,
    ): PageContext {
        return DB::transaction(function () use (
            $organization,
            $actor,
            $url,
            $title,
            $faviconUrl,
            $destination,
        ): PageContext {
            $this->lockManagerMembership($organization, $actor);
            $context = $this->createContext->handle(
                $organization,
                $actor,
                $url,
                $title,
                $faviconUrl,
            );
            $lockedContext = PageContext::query()
                ->where('organization_id', $organization->id)
                ->whereKey($context->id)
                ->lockForUpdate()
                ->firstOrFail();
            $lockedDestination = $this->lockDestination(
                $organization,
                $lockedContext->workspace_id,
                $destination->id,
            );

            return $this->linkLocked(
                $organization,
                $actor,
                $lockedContext,
                $lockedDestination,
                $lockedContext->association_version,
            );
        }, 3);
    }

    private function linkLocked(
        Organization $organization,
        User $actor,
        PageContext $context,
        Conversation $destination,
        int $expectedAssociationVersion,
    ): PageContext {
        if ($context->conversation_id === $destination->id) {
            return $context;
        }

        if ($context->association_version !== $expectedAssociationVersion) {
            throw new PageChatConflict(
                'This page changed chats. Reload before linking it.',
                'stale_association',
            );
        }

        $oldConversationId = $context->conversation_id;

        if ($oldConversationId !== null) {
            $oldConversation = Conversation::query()
                ->where('organization_id', $organization->id)
                ->where('workspace_id', $context->workspace_id)
                ->lockForUpdate()
                ->findOrFail($oldConversationId);

            if ($oldConversation->messages()->exists()) {
                throw new PageChatConflict(
                    'This page already has a chat with message history and cannot be linked.',
                    'source_chat_not_empty',
                );
            }
        }

        $context->forceFill([
            'conversation_id' => $destination->id,
            'association_version' => $context->association_version + 1,
            'association_reason' => 'linked',
        ])->save();

        $this->retireOrphanedEmptyConversation($organization, $oldConversationId);
        $this->record($organization, $actor, $context, 'linked', $oldConversationId, $destination->id);

        return $context->refresh();
    }

    private function lockDestination(
        Organization $organization,
        int $workspaceId,
        int $destinationId,
    ): Conversation {
        return Conversation::query()
            ->where('organization_id', $organization->id)
            ->where('workspace_id', $workspaceId)
            ->where('type', ConversationType::Page)
            ->whereNull('retired_at')
            ->lockForUpdate()
            ->findOrFail($destinationId);
    }

    private function retireOrphanedEmptyConversation(
        Organization $organization,
        ?int $conversationId,
    ): void {
        if ($conversationId === null) {
            return;
        }

        Conversation::query()
            ->where('organization_id', $organization->id)
            ->whereKey($conversationId)
            ->whereDoesntHave('pageContexts')
            ->whereDoesntHave('messages')
            ->update(['retired_at' => now()]);
    }

    private function lockManagerMembership(Organization $organization, User $actor): void
    {
        $membership = OrganizationMembership::query()
            ->active()
            ->where('organization_id', $organization->id)
            ->where('user_id', $actor->id)
            ->lockForUpdate()
            ->first();

        abort_if(! $membership || ! $membership->role->isAtLeast(OrganizationRole::Administrator), 403);
    }

    private function record(
        Organization $organization,
        User $actor,
        PageContext $context,
        string $event,
        ?int $oldConversationId,
        ?int $newConversationId,
    ): void {
        activity('page-chat-associations')
            ->performedOn($context)
            ->causedBy($actor)
            ->event($event)
            ->withProperties([
                'context_public_id' => $context->public_id,
                'old_conversation_id' => $oldConversationId,
                'new_conversation_id' => $newConversationId,
            ])
            ->tap(function (OrganizationActivity $activity) use ($organization): void {
                $activity->organization_id = $organization->id;
            })
            ->log('Page context '.$event);
    }
}
