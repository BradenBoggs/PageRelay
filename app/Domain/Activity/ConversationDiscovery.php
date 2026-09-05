<?php

namespace App\Domain\Activity;

use App\Enums\ConversationType;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Organization;
use App\Models\PageContext;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Builds organization/default-workspace-scoped chat discovery and Activity
 * without multiplying a chat through its linked page contexts.
 *
 * Activity relevance is explicit: a member must have opened the chat (and
 * therefore have a read marker) or authored a message in it. Chats remains
 * the broader authorized discovery surface.
 *
 * @see docs/features/inbox-and-unread.md
 */
class ConversationDiscovery
{
    /**
     * @return LengthAwarePaginator<int, Conversation>
     */
    public function paginate(
        Organization $organization,
        User $user,
        string $surface,
        string $view,
        ?string $search,
        ?string $app,
        int $perPage,
    ): LengthAwarePaginator {
        $workspace = $organization->defaultWorkspace()->firstOrFail();
        $query = Conversation::query()
            ->select('conversations.*')
            ->selectSub($this->unreadCount($user), 'unread_count')
            ->with([
                'latestMessage.author',
                'latestMessage.sourcePageContext',
                'pageContexts' => fn ($query) => $query->orderBy('id'),
            ])
            ->withCount('messages')
            ->where('organization_id', $organization->id)
            ->where('workspace_id', $workspace->id)
            ->where('type', ConversationType::Page)
            ->whereNull('retired_at')
            ->whereHas('messages');

        if ($surface === 'activity') {
            $this->whereRelevantTo($query, $user);
        }

        if ($view === 'unread') {
            $query->whereHas('messages', function (Builder $query) use ($user): void {
                $query->where('author_id', '!=', $user->id)
                    ->whereRaw(
                        'messages.id > COALESCE((SELECT current_read.last_read_message_id FROM conversation_reads AS current_read WHERE current_read.organization_id = conversations.organization_id AND current_read.conversation_id = conversations.id AND current_read.user_id = ?), 0)',
                        [$user->id],
                    );
            });
        }

        if ($search !== null && $search !== '') {
            $pattern = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function (Builder $query) use ($pattern): void {
                $query->whereLike('conversations.title', $pattern)
                    ->orWhereHas('pageContexts', function (Builder $query) use ($pattern): void {
                        $query->whereLike('title', $pattern)
                            ->orWhereLike('source_host', $pattern);
                    })
                    ->orWhereHas('messages', fn (Builder $query) => $query->whereLike('body', $pattern));
            });
        }

        if ($app !== null && $app !== '') {
            $query->whereHas(
                'pageContexts',
                fn (Builder $query) => $query->where('source_host', $app),
            );
        }

        return $query
            ->orderByDesc(
                Message::query()
                    ->select('id')
                    ->whereColumn('conversation_id', 'conversations.id')
                    ->latest('id')
                    ->limit(1),
            )
            ->orderByDesc('conversations.id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /** @return Collection<int, array{id: string, label: string}> */
    public function apps(
        Organization $organization,
        User $user,
        string $surface,
    ): Collection {
        $workspace = $organization->defaultWorkspace()->firstOrFail();

        return PageContext::query()
            ->where('organization_id', $organization->id)
            ->where('workspace_id', $workspace->id)
            ->whereHas('conversation', function (Builder $query) use ($surface, $user): void {
                $query->where('type', ConversationType::Page)
                    ->whereNull('retired_at')
                    ->whereHas('messages');

                if ($surface === 'activity') {
                    $query->where(function (Builder $query) use ($user): void {
                        $query->whereHas(
                            'messages',
                            fn (Builder $query) => $query->where('author_id', $user->id),
                        )->orWhereHas(
                            'reads',
                            fn (Builder $query) => $query->where('user_id', $user->id),
                        );
                    });
                }
            })
            ->select('source_host')
            ->distinct()
            ->orderBy('source_host')
            ->pluck('source_host')
            ->map(fn (string $host) => ['id' => $host, 'label' => $host])
            ->values();
    }

    /** @param Builder<Conversation> $query */
    private function whereRelevantTo(Builder $query, User $user): void
    {
        $query->where(function (Builder $query) use ($user): void {
            $query->whereHas(
                'messages',
                fn (Builder $query) => $query->where('author_id', $user->id),
            )->orWhereHas(
                'reads',
                fn (Builder $query) => $query->where('user_id', $user->id),
            );
        });
    }

    /** @return Builder<Message> */
    private function unreadCount(User $user): Builder
    {
        return Message::query()
            ->from('messages as unread_messages')
            ->selectRaw('count(*)')
            ->whereColumn('unread_messages.conversation_id', 'conversations.id')
            ->where('unread_messages.author_id', '!=', $user->id)
            ->whereRaw(
                'unread_messages.id > COALESCE((SELECT current_read.last_read_message_id FROM conversation_reads AS current_read WHERE current_read.organization_id = conversations.organization_id AND current_read.conversation_id = conversations.id AND current_read.user_id = ?), 0)',
                [$user->id],
            );
    }
}
