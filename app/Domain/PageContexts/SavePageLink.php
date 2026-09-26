<?php

namespace App\Domain\PageContexts;

use App\Domain\Conversations\CreatePageChat;
use App\Domain\Conversations\LinkPageContext;
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
 * Serializes routing changes with context creation; never merges identities/history.
 * Existing definitions and representative URLs remain independent.
 *
 * @phpstan-import-type Selection from PageUrlMatch
 *
 * @see docs/features/page-contexts.md
 */
class SavePageLink
{
    public function __construct(
        private ResolvePageContext $resolve,
        private CreatePageContext $createContext,
        private CreatePageChat $createChat,
        private LinkPageContext $link,
        private PageUrlMatch $matcher,
    ) {}

    /** @param Selection $selection */
    public function handle(
        Organization $organization,
        User $actor,
        string $url,
        string $title,
        array $selection,
        ?string $conversationId = null,
        ?string $chatName = null,
        ?string $expectedContextId = null,
        ?int $expectedVersion = null,
    ): PageContext {
        return DB::transaction(function () use ($organization, $actor, $url, $title, $selection,
            $conversationId, $chatName, $expectedContextId, $expectedVersion): PageContext {
            $membership = OrganizationMembership::query()->active()
                ->where('organization_id', $organization->id)->where('user_id', $actor->id)
                ->lockForUpdate()->firstOrFail();
            $manager = $membership->role->isAtLeast(OrganizationRole::Administrator);
            abort_if($conversationId !== null && ! $manager, 403);
            $workspace = $organization->defaultWorkspace()->lockForUpdate()->firstOrFail();
            $resolved = $this->resolve->handle($organization, $actor, $url, $title, null);
            $definition = $this->matcher->build($url, $selection);
            $context = $resolved->context ? PageContext::query()
                ->where('organization_id', $organization->id)->whereKey($resolved->context->id)
                ->lockForUpdate()->firstOrFail() : null;
            $destination = $conversationId === null ? null : Conversation::query()
                ->where('organization_id', $organization->id)->where('workspace_id', $workspace->id)
                ->where('type', ConversationType::Page)->whereNull('retired_at')
                ->where('public_id', $conversationId)->firstOrFail();

            if ($expectedContextId !== null && $context?->public_id !== $expectedContextId) {
                throw new PageChatConflict('This page mapping changed. Review the page again.', 'stale_mapping');
            }
            $sameRule = $context !== null && $context->url_match === $definition;
            $sameChat = $context !== null && $context->conversation_id !== null
                && ($destination === null || $context->conversation_id === $destination->id);
            // Retrying an already-completed save does not invalidate other drafts.
            if ($sameRule && $sameChat) {
                return $context;
            }
            if ($context !== null) {
                if (! $sameRule) {
                    abort_unless($manager, 403);
                }
                if ($expectedContextId !== $context->public_id || $expectedVersion !== $context->association_version) {
                    throw new PageChatConflict('This page already has a mapping. Review it before changing it.', 'stale_mapping');
                }
                if (! $this->matcher->matches($definition, $context->normalized_url, $context->source_url)) {
                    throw new PageChatConflict('The scope must still include the original linked page. Start from that link to edit matching.', 'representative_outside_scope');
                }
            }
            $others = PageContext::query()->where('organization_id', $organization->id)
                ->where('workspace_id', $workspace->id)->where('source_host', $resolved->host)
                ->when($context, fn ($q) => $q->where('id', '!=', $context->id))->get();
            foreach ($others as $other) {
                if ($this->matcher->overlaps($definition, $resolved->normalizedUrl, $other->url_match, $other->normalized_url)) {
                    throw new PageChatConflict('This selection overlaps another saved page. Choose a more specific scope; chats will not be merged.', 'overlapping_scope');
                }
            }
            if ($destination !== null) {
                $context ??= $this->createContext->handle($organization, $actor, $url, $title, null);
                $context = $this->link->handle($organization, $actor, $context, $destination, $context->association_version);
            } else {
                $context = $this->createChat->handle($organization, $actor, $url, $title, $chatName ?? $title, null);
            }
            if ($context->url_match !== $definition) {
                $context->forceFill([
                    'url_match' => $definition,
                    'association_version' => $context->association_version + 1,
                ])->save();
                activity('page-url-matching')->performedOn($context)->causedBy($actor)
                    ->event('matching_changed')->withProperties(['context_public_id' => $context->public_id])
                    ->tap(function (OrganizationActivity $activity) use ($organization): void {
                        $activity->organization_id = $organization->id;
                    })->log('Page matching changed');
            }

            return $context->refresh();
        }, 3);
    }
}
