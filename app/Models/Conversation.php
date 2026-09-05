<?php

namespace App\Models;

use App\Enums\ConversationType;
use Database\Factories\ConversationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $public_id
 * @property int $organization_id
 * @property int $workspace_id
 * @property ConversationType $type
 * @property string $title
 * @property int|null $created_by
 * @property Carbon|null $retired_at
 * @property-read Collection<int, PageContext> $pageContexts
 * @property-read Collection<int, Message> $messages
 * @property-read Message|null $latestMessage
 * @property-read int|null $messages_count
 * @property-read int|string|null $unread_count
 * @property-read Collection<int, ConversationRead> $reads
 */
#[Fillable(['organization_id', 'workspace_id', 'type', 'title', 'created_by', 'retired_at'])]
class Conversation extends Model
{
    /** @use HasFactory<ConversationFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Conversation $conversation): void {
            $conversation->public_id ??= (string) Str::uuid();
        });
    }

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

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<PageContext, $this> */
    public function pageContexts(): HasMany
    {
        return $this->hasMany(PageContext::class);
    }

    /** @return HasMany<Message, $this> */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /** @return HasOne<Message, $this> */
    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany('id');
    }

    /** @return HasMany<ConversationRead, $this> */
    public function reads(): HasMany
    {
        return $this->hasMany(ConversationRead::class);
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => ConversationType::class,
            'retired_at' => 'immutable_datetime',
        ];
    }
}
