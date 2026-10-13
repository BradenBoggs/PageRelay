<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $public_id
 * @property int $message_id
 * @property string $title
 * @property int $created_by
 * @property int|null $assignee_id
 * @property int|null $completed_by
 * @property Carbon|null $completed_at
 * @property int $version
 * @property-read Message $message
 * @property-read User|null $assignee
 * @property-read User|null $completer
 */
class Todo extends Model
{
    protected $fillable = ['message_id', 'title', 'created_by', 'assignee_id'];

    protected static function booted(): void
    {
        static::creating(function (Todo $todo): void {
            $todo->public_id ??= (string) Str::uuid();
        });
    }

    protected function casts(): array
    {
        return ['completed_at' => 'datetime', 'version' => 'integer'];
    }

    /** @return BelongsTo<Message, $this> */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    /** @return BelongsTo<User, $this> */
    public function completer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
