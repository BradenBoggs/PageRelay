<?php

namespace App\Domain\Conversations;

use App\Data\SentMessage;
use App\Enums\ConversationType;
use App\Events\MessageCreated;
use App\Exceptions\PageChatConflict;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\PageContext;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Persists one durable page-chat message while protecting draft attribution.
 *
 * A retry is resolved before the current association is interpreted, ensuring
 * a successful send can never be repeated into a newly linked chat.
 *
 * @see docs/features/page-conversations.md
 */
class SendPageMessage
{
    public function fromContext(
        Organization $organization,
        User $actor,
        PageContext $context,
        string $body,
        string $idempotencyKey,
        int $expectedAssociationVersion,
    ): SentMessage {
        return DB::transaction(function () use (
            $organization,
            $actor,
            $context,
            $body,
            $idempotencyKey,
            $expectedAssociationVersion,
        ): SentMessage {
            $this->lockActiveMembership($organization, $actor);
            $retry = $this->retry($organization, $actor, $idempotencyKey);

            if ($retry) {
                return new SentMessage($retry, false);
            }

            $lockedContext = PageContext::query()
                ->where('organization_id', $organization->id)
                ->whereKey($context->id)
                ->lockForUpdate()
                ->firstOrFail();

            $retry = $this->retry($organization, $actor, $idempotencyKey);

            if ($retry) {
                return new SentMessage($retry, false);
            }

            if ($lockedContext->association_version !== $expectedAssociationVersion) {
                throw new PageChatConflict(
                    'This page changed chats. Reload before sending your draft.',
                    'stale_association',
                );
            }

            if ($lockedContext->conversation_id === null) {
                throw new PageChatConflict(
                    'Create or link a chat for this page before sending a message.',
                    'chat_required',
                );
            }

            $conversation = Conversation::query()
                ->where('organization_id', $organization->id)
                ->where('workspace_id', $lockedContext->workspace_id)
                ->where('type', ConversationType::Page)
                ->whereNull('retired_at')
                ->findOrFail($lockedContext->conversation_id);

            return $this->persist(
                $organization,
                $actor,
                $conversation,
                $lockedContext,
                $body,
                $idempotencyKey,
            );
        }, 3);
    }

    public function toConversation(
        Organization $organization,
        User $actor,
        Conversation $conversation,
        string $body,
        string $idempotencyKey,
        ?PageContext $sourceContext = null,
        ?int $expectedAssociationVersion = null,
    ): SentMessage {
        return DB::transaction(function () use (
            $organization,
            $actor,
            $conversation,
            $body,
            $idempotencyKey,
            $sourceContext,
            $expectedAssociationVersion,
        ): SentMessage {
            $this->lockActiveMembership($organization, $actor);
            $retry = $this->retry($organization, $actor, $idempotencyKey);

            if ($retry) {
                return new SentMessage($retry, false);
            }

            $lockedSource = null;

            if ($sourceContext) {
                $lockedSource = PageContext::query()
                    ->where('organization_id', $organization->id)
                    ->lockForUpdate()
                    ->findOrFail($sourceContext->id);
            }

            $lockedConversation = Conversation::query()
                ->where('organization_id', $organization->id)
                ->where('type', ConversationType::Page)
                ->whereNull('retired_at')
                ->when($lockedSource, fn ($query) => $query->where('workspace_id', $lockedSource->workspace_id))
                ->lockForUpdate()
                ->findOrFail($conversation->id);

            $retry = $this->retry($organization, $actor, $idempotencyKey);

            if ($retry) {
                return new SentMessage($retry, false);
            }

            if ($lockedSource) {
                if ($lockedSource->conversation_id !== $lockedConversation->id
                    || $expectedAssociationVersion === null
                    || $lockedSource->association_version !== $expectedAssociationVersion) {
                    throw new PageChatConflict(
                        'The selected source page is no longer linked to this chat.',
                        'stale_source',
                    );
                }
            }

            return $this->persist(
                $organization,
                $actor,
                $lockedConversation,
                $lockedSource,
                $body,
                $idempotencyKey,
            );
        }, 3);
    }

    private function retry(Organization $organization, User $actor, string $idempotencyKey): ?Message
    {
        return Message::query()
            ->with(['author', 'sourcePageContext'])
            ->where('organization_id', $organization->id)
            ->where('author_id', $actor->id)
            ->where('idempotency_key', $idempotencyKey)
            ->first();
    }

    private function lockActiveMembership(Organization $organization, User $actor): void
    {
        OrganizationMembership::query()
            ->active()
            ->where('organization_id', $organization->id)
            ->where('user_id', $actor->id)
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function persist(
        Organization $organization,
        User $actor,
        Conversation $conversation,
        ?PageContext $sourceContext,
        string $body,
        string $idempotencyKey,
    ): SentMessage {
        $message = Message::create([
            'organization_id' => $organization->id,
            'workspace_id' => $conversation->workspace_id,
            'conversation_id' => $conversation->id,
            'author_id' => $actor->id,
            'source_page_context_id' => $sourceContext?->id,
            'idempotency_key' => $idempotencyKey,
            'body' => trim($body),
        ]);

        $message->load(['author', 'sourcePageContext']);
        MessageCreated::dispatch($message);

        return new SentMessage($message, true);
    }
}
