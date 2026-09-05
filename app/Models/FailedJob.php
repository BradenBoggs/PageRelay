<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

/**
 * Read-only projection of Laravel's failed job store for internal operations.
 *
 * The raw payload and exception stay out of Filament so routine queue
 * inspection does not disclose request or organization data unnecessarily.
 */
class FailedJob extends Model
{
    protected $table = 'failed_jobs';

    public $timestamps = false;

    /** @return Attribute<string, never> */
    protected function jobName(): Attribute
    {
        return Attribute::get(function (): string {
            $payload = json_decode($this->getRawOriginal('payload'), true);
            $displayName = is_array($payload) ? ($payload['displayName'] ?? null) : null;

            return is_string($displayName) ? $displayName : 'Unknown job';
        });
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'failed_at' => 'datetime',
        ];
    }
}
