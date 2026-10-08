<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $public_id
 * @property int $organization_id
 * @property int $conversation_id
 * @property int $message_id
 * @property int $user_id
 * @property string $reason
 * @property Carbon|null $read_at
 * @property Carbon|null $delivered_at
 * @property Carbon|null $claim_expires_at
 * @property string|null $desktop_claim
 * @property Carbon $created_at
 * @property-read Message $message
 * @property-read Conversation $conversation
 */
#[Fillable(['public_id', 'organization_id', 'conversation_id', 'message_id', 'user_id', 'reason'])]
class MessageNotification extends Model
{
    /** @return BelongsTo<Message, $this> */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /** @return BelongsTo<Conversation, $this> */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['read_at' => 'datetime', 'delivered_at' => 'datetime', 'claim_expires_at' => 'datetime'];
    }
}
