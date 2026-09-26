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

/**
 * Creates one durable organization work Chat independently of page context.
 *
 * @see docs/features/page-conversations.md
 */
class CreateWorkChat
{
    public function handle(
        Organization $organization,
        User $actor,
        string $title,
        string $idempotencyKey,
    ): Conversation {
        $title = preg_replace('/[\x00-\x1F\x7F]/u', '', trim($title)) ?? '';

        if ($title === '') {
            throw ValidationException::withMessages([
                'title' => 'Enter a Chat name.',
            ]);
        }

        return DB::transaction(function () use ($organization, $actor, $title, $idempotencyKey): Conversation {
            OrganizationMembership::query()
                ->active()
                ->where('organization_id', $organization->id)
                ->where('user_id', $actor->id)
                ->lockForUpdate()
                ->firstOrFail();

            $workspace = $organization->defaultWorkspace()->firstOrFail();
            $existing = $this->createdBy($organization, $actor, $idempotencyKey);

            if ($existing) {
                return $existing;
            }

            DB::table('conversations')->insertOrIgnore([
                'public_id' => (string) Str::uuid(),
                'organization_id' => $organization->id,
                'workspace_id' => $workspace->id,
                'type' => ConversationType::Page->value,
                'title' => trim($title),
                'created_by' => $actor->id,
                'creation_key' => $idempotencyKey,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $this->createdBy($organization, $actor, $idempotencyKey) ?? throw new \RuntimeException(
                'SideWire could not safely create the work Chat.',
            );
        }, 3);
    }

    private function createdBy(
        Organization $organization,
        User $actor,
        string $idempotencyKey,
    ): ?Conversation {
        return Conversation::query()
            ->where('organization_id', $organization->id)
            ->where('created_by', $actor->id)
            ->where('creation_key', $idempotencyKey)
            ->first();
    }
}
