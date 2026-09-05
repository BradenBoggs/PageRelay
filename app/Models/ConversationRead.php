<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Stores one durable, monotonic read position for a member and chat.
 *
 * The position belongs to the chat rather than any linked page context, so
 * cross-App links cannot duplicate or reset unread state.
 *
 * @see docs/features/inbox-and-unread.md
 *
 * @property int $id
 * @property int $organization_id
 * @property int $workspace_id
 * @property int $conversation_id
 * @property int $user_id
 * @property int $last_read_message_id
 * @property-read Organization $organization
 * @property-read Workspace $workspace
 * @property-read Conversation $conversation
 * @property-read User $user
 * @property-read Message $lastReadMessage
 */
#[Fillable([
    'organization_id', 'workspace_id', 'conversation_id', 'user_id',
    'last_read_message_id',
])]
class ConversationRead extends Model
{
    /** @return BelongsTo<Organization, $this> */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<Conversation, $this> */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Message, $this> */
    public function lastReadMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'last_read_message_id');
    }
}
