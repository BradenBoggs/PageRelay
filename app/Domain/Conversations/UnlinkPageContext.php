<?php

namespace App\Domain\Conversations;

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
 * Removes only the current association and never mutates chat history or source provenance.
 *
 * @see docs/features/page-conversations.md
 */
class UnlinkPageContext
{
    public function handle(
        Organization $organization,
        User $actor,
        PageContext $context,
        int $expectedAssociationVersion,
    ): PageContext {
        return DB::transaction(function () use (
            $organization,
            $actor,
            $context,
            $expectedAssociationVersion,
        ): PageContext {
            $this->lockManagerMembership($organization, $actor);
            $lockedContext = PageContext::query()
                ->where('organization_id', $organization->id)
                ->whereKey($context->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedContext->conversation_id === null) {
                return $lockedContext;
            }

            if ($lockedContext->association_version !== $expectedAssociationVersion) {
                throw new PageChatConflict(
                    'This page changed chats. Reload before unlinking it.',
                    'stale_association',
                );
            }

            $oldConversationId = $lockedContext->conversation_id;
            $lockedContext->forceFill([
                'conversation_id' => null,
                'association_version' => $lockedContext->association_version + 1,
                'association_reason' => 'unlinked',
            ])->save();

            Conversation::query()
                ->where('organization_id', $organization->id)
                ->whereKey($oldConversationId)
                ->whereDoesntHave('pageContexts')
                ->whereDoesntHave('messages')
                ->update(['retired_at' => now()]);

            activity('page-chat-associations')
                ->performedOn($lockedContext)
                ->causedBy($actor)
                ->event('unlinked')
                ->withProperties([
                    'context_public_id' => $lockedContext->public_id,
                    'old_conversation_id' => $oldConversationId,
                    'new_conversation_id' => null,
                ])
                ->tap(function (OrganizationActivity $activity) use ($organization): void {
                    $activity->organization_id = $organization->id;
                })
                ->log('Page context unlinked');

            return $lockedContext->refresh();
        }, 3);
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
}
