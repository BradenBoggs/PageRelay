<?php

namespace App\Domain\Conversations;

use App\Enums\ConversationType;
use App\Enums\OrganizationRole;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** @see docs/features/page-conversations.md */
class RenameWorkChat
{
    public function handle(User $actor, Conversation $chat, string $title): Conversation
    {
        $title = preg_replace('/[\x00-\x1F\x7F]/u', '', trim($title)) ?? '';
        if ($title === '' || mb_strlen($title) > 255) {
            throw ValidationException::withMessages(['title' => 'Enter a Chat name of up to 255 characters.']);
        }

        return DB::transaction(function () use ($actor, $chat, $title): Conversation {
            $membership = $actor->organizationMembership()->lockForUpdate()->first();
            abort_unless($membership && $membership->organization_id === $chat->organization_id
                && $membership->role->isAtLeast(OrganizationRole::Administrator), 403);
            $locked = Conversation::query()->whereKey($chat->id)->lockForUpdate()->firstOrFail();
            $workspace = $membership->organization->defaultWorkspace()->firstOrFail();
            abort_unless($locked->organization_id === $membership->organization_id
                && $locked->workspace_id === $workspace->id && $locked->type === ConversationType::Page
                && $locked->retired_at === null, 403);
            $locked->forceFill(['title' => $title])->save();

            return $locked;
        }, 3);
    }
}
