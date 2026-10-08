<?php

namespace App\Domain\Conversations;

use App\Enums\ConversationType;
use App\Models\Conversation;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** @see docs/features/direct-messages.md */
class CreateDirectChat
{
    public function handle(Organization $organization, User $actor, int $recipientId): Conversation
    {
        if ($recipientId === $actor->id) {
            throw ValidationException::withMessages(['recipient_id' => 'Choose a coworker.']);
        }

        return DB::transaction(function () use ($organization, $actor, $recipientId): Conversation {
            // Consistent member lock order and a unique pair prevent reciprocal-start duplicates.
            $ids = [$actor->id, $recipientId];
            sort($ids);
            $members = OrganizationMembership::query()->active()
                ->where('organization_id', $organization->id)->whereIn('user_id', $ids)
                ->orderBy('user_id')->lockForUpdate()->get();
            if ($members->count() !== 2) {
                throw ValidationException::withMessages(['recipient_id' => 'Choose an active coworker.']);
            }
            $pair = implode(':', $ids);
            $workspace = $organization->defaultWorkspace()->firstOrFail();
            DB::table('conversations')->insertOrIgnore([
                'public_id' => (string) Str::uuid(),
                'organization_id' => $organization->id,
                'workspace_id' => $workspace->id,
                'type' => ConversationType::Direct->value,
                'title' => 'Direct message',
                'created_by' => $actor->id,
                'direct_pair' => $pair,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $chat = Conversation::query()->where('organization_id', $organization->id)
                ->where('direct_pair', $pair)->firstOrFail();
            foreach ($ids as $id) {
                DB::table('conversation_participants')->insertOrIgnore([
                    'conversation_id' => $chat->id, 'user_id' => $id,
                ]);
            }

            return $chat;
        }, 3);
    }
}
