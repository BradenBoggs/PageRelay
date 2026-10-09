<?php

namespace App\Domain\Conversations;

use App\Data\SentMessage;
use App\Domain\Activity\RecordMessageAttention;
use App\Enums\ConversationType;
use App\Events\MessageCreated;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\PageContext;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Extends the existing page send transaction, rather than replacing URL/link safety.
 * MessageCreated dispatches after the outer commit, including reply/mention metadata.
 *
 * @see docs/features/threads.md
 */
class SendCollaborationMessage
{
    /** @param list<int> $mentions */
    public function handle(
        Organization $organization, User $actor, Conversation $chat,
        string $body, string $key, ?string $threadId = null, array $mentions = [],
        ?string $sourceId = null, ?int $sourceVersion = null,
    ): SentMessage {
        $body = trim($body);
        if ($body === '') {
            throw ValidationException::withMessages(['body' => 'Write a message.']);
        }
        $mentions = array_values(array_unique($mentions));
        sort($mentions);
        $fingerprint = hash('sha256', json_encode([$chat->public_id, $body, $threadId, $mentions, $sourceId, $sourceVersion], JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($organization, $actor, $chat, $body, $key, $threadId, $mentions, $sourceId, $sourceVersion, $fingerprint): SentMessage {
            OrganizationMembership::query()->active()->where('organization_id', $organization->id)
                ->where('user_id', $actor->id)->lockForUpdate()->firstOrFail();
            $authorized = ConversationAccess::query($actor)->whereNull('retired_at')->findOrFail($chat->id);
            $retry = Message::query()->where('organization_id', $organization->id)
                ->where('author_id', $actor->id)->where('idempotency_key', $key)->first();
            if ($retry) {
                if ($retry->request_fingerprint !== $fingerprint) {
                    throw ValidationException::withMessages(['idempotency_key' => 'This send was already used for a different draft. Reload the chat before trying again.']);
                }

                return new SentMessage($retry, false);
            }
            $root = $threadId === null ? null : $authorized->messages()
                ->whereNull('thread_root_id')->where('public_id', $threadId)->firstOrFail();
            $eligible = OrganizationMembership::query()->active()->where('organization_id', $organization->id)
                ->whereIn('user_id', $mentions)->pluck('user_id')->map(fn ($id): int => (int) $id)->all();
            if ($authorized->type === ConversationType::Direct) {
                if ($sourceId !== null || $sourceVersion !== null) {
                    throw ValidationException::withMessages(['source_context_id' => 'Direct messages cannot be linked to a page.']);
                }
                $participants = DB::table('conversation_participants')->where('conversation_id', $chat->id)->pluck('user_id')->map(fn ($id): int => (int) $id)->all();
                $active = OrganizationMembership::query()->active()->where('organization_id', $organization->id)->whereIn('user_id', $participants)->count();
                if ($active !== 2) {
                    throw ValidationException::withMessages(['body' => 'This coworker is no longer available. The conversation remains readable.']);
                }
                $eligible = array_values(array_intersect($eligible, $participants));
            }
            if (count($eligible) !== count($mentions)) {
                throw ValidationException::withMessages(['mentions' => 'Mention only active members who can access this chat.']);
            }
            if ($authorized->type === ConversationType::Page) {
                $source = $sourceId === null ? null : PageContext::query()->where('organization_id', $organization->id)->where('public_id', $sourceId)->firstOrFail();
                $sent = app(SendPageMessage::class)->toConversation($organization, $actor, $authorized, $body, $key, $source, $sourceVersion);
                $message = $sent->message;
                $message->forceFill(['thread_root_id' => $root?->id, 'request_fingerprint' => $fingerprint])->save();
            } else {
                Conversation::query()->whereKey($authorized->id)->lockForUpdate()->firstOrFail();
                $message = Message::create([
                    'organization_id' => $organization->id, 'workspace_id' => $authorized->workspace_id,
                    'conversation_id' => $authorized->id, 'author_id' => $actor->id,
                    'body' => $body, 'idempotency_key' => $key,
                    'thread_root_id' => $root?->id, 'request_fingerprint' => $fingerprint,
                ]);
                MessageCreated::dispatch($message);
            }
            $authorized->touch();
            $message->mentionedUsers()->sync($mentions);
            app(RecordMessageAttention::class)->handle($message);

            return new SentMessage($message, true);
        }, 3);
    }
}
