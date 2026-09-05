<?php

namespace App\Models;

use Database\Factories\PageContextFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $public_id
 * @property int $organization_id
 * @property int $workspace_id
 * @property int|null $conversation_id
 * @property string $source_url
 * @property string $normalized_url
 * @property string $normalized_url_hash
 * @property int $normalization_version
 * @property string $source_host
 * @property string $title
 * @property string|null $favicon_url
 * @property int|null $created_by
 * @property int $association_version
 * @property string|null $association_reason
 * @property-read Conversation|null $conversation
 */
#[Fillable([
    'organization_id', 'workspace_id', 'conversation_id', 'source_url', 'normalized_url',
    'normalized_url_hash', 'normalization_version', 'source_host', 'title', 'favicon_url',
    'created_by', 'association_version', 'association_reason',
])]
class PageContext extends Model
{
    /** @use HasFactory<PageContextFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (PageContext $context): void {
            $context->public_id ??= (string) Str::uuid();
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

    /** @return BelongsTo<Conversation, $this> */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<Message, $this> */
    public function sourcedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'source_page_context_id');
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }
}
