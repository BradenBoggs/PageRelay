<?php

namespace App\Models;

use Database\Factories\WorkspaceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable(['organization_id', 'name', 'slug', 'is_default'])]
class Workspace extends Model
{
    /** @use HasFactory<WorkspaceFactory> */
    use HasFactory, SoftDeletes;

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Workspace $workspace): void {
            if (empty($workspace->slug)) {
                $workspace->slug = static::generateUniqueSlug(
                    $workspace->organization_id,
                    $workspace->name,
                );
            }
        });

        static::updating(function (Workspace $workspace): void {
            if ($workspace->isDirty('name')) {
                $workspace->slug = static::generateUniqueSlug(
                    $workspace->organization_id,
                    $workspace->name,
                    $workspace->id,
                );
            }
        });
    }

    /** @return BelongsTo<Organization, $this> */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    private static function generateUniqueSlug(
        int $organizationId,
        string $name,
        ?int $ignoreId = null,
    ): string {
        $base = Str::slug($name) ?: 'workspace';
        $slug = $base;
        $counter = 2;

        while (static::withTrashed()
            ->where('organization_id', $organizationId)
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
