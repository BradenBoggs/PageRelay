<?php

namespace App\Domain\Activity;

use App\Enums\ConversationType;
use App\Models\Conversation;
use App\Models\ConversationRead;
use App\Models\Message;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Advances a member's chat read position without allowing stale clients to
 * move it backward or cross an organization, workspace, or chat boundary.
 *
 * @see docs/features/inbox-and-unread.md
 */
class MarkConversationRead
{
    public function handle(
        Organization $organization,
        User $user,
        Conversation $conversation,
        string $messagePublicId,
    ): ConversationRead {
        return DB::transaction(function () use (
            $organization,
            $user,
            $conversation,
            $messagePublicId,
        ): ConversationRead {
            OrganizationMembership::query()
                ->active()
                ->where('organization_id', $organization->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();
            $workspace = $organization->defaultWorkspace()->firstOrFail();

            $chat = Conversation::query()
                ->where('organization_id', $organization->id)
                ->where('workspace_id', $workspace->id)
                ->where('type', ConversationType::Page)
                ->whereNull('retired_at')
                ->lockForUpdate()
                ->findOrFail($conversation->id);

            $message = Message::query()
                ->where('organization_id', $organization->id)
                ->where('workspace_id', $chat->workspace_id)
                ->where('conversation_id', $chat->id)
                ->where('public_id', $messagePublicId)
                ->firstOrFail();

            $read = ConversationRead::query()
                ->where('organization_id', $organization->id)
                ->where('user_id', $user->id)
                ->where('conversation_id', $chat->id)
                ->lockForUpdate()
                ->first();

            if (! $read) {
                return ConversationRead::query()->create([
                    'organization_id' => $organization->id,
                    'workspace_id' => $chat->workspace_id,
                    'conversation_id' => $chat->id,
                    'user_id' => $user->id,
                    'last_read_message_id' => $message->id,
                ]);
            }

            if ($message->id > $read->last_read_message_id) {
                $read->forceFill(['last_read_message_id' => $message->id])->save();
            }

            return $read;
        }, 3);
    }
}
