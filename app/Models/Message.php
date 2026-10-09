<?php

namespace App\Models;

use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $public_id
 * @property int $organization_id
 * @property int $workspace_id
 * @property int $conversation_id
 * @property int $author_id
 * @property int|null $source_page_context_id
 * @property int|null $thread_root_id
 * @property string|null $request_fingerprint
 * @property string $idempotency_key
 * @property string $body
 * @property Carbon $created_at
 * @property-read Conversation $conversation
 * @property-read User $author
 * @property-read PageContext|null $sourcePageContext
 * @property-read Message|null $threadRoot
 * @property-read Collection<int, Message> $replies
 * @property-read Collection<int, User> $mentionedUsers
 * @property-read int|null $replies_count
 */
#[Fillable([
    'organization_id', 'workspace_id', 'conversation_id', 'author_id',
    'source_page_context_id', 'idempotency_key', 'body', 'thread_root_id', 'request_fingerprint',
])]
class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Message $message): void {
            $message->public_id ??= (string) Str::uuid();
        });
    }

    /** @return BelongsTo<Conversation, $this> */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /** @return BelongsTo<PageContext, $this> */
    public function sourcePageContext(): BelongsTo
    {
        return $this->belongsTo(PageContext::class, 'source_page_context_id');
    }

    /** @return BelongsTo<Message, $this> */
    public function threadRoot(): BelongsTo
    {
        return $this->belongsTo(self::class, 'thread_root_id');
    }

    /** @return HasMany<Message, $this> */
    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'thread_root_id');
    }

    /** @return BelongsToMany<User, $this> */
    public function mentionedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'message_mentions');
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }
}
