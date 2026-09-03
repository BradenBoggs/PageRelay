<?php

namespace App\Models;

use Database\Factories\TeamFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable(['organization_id', 'name', 'slug', 'description'])]
class Team extends Model
{
    /** @use HasFactory<TeamFactory> */
    use HasFactory, SoftDeletes;

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Team $team): void {
            if (empty($team->slug)) {
                $team->slug = static::generateUniqueSlug(
                    $team->organization_id,
                    $team->name,
                );
            }
        });

        static::updating(function (Team $team): void {
            if ($team->isDirty('name')) {
                $team->slug = static::generateUniqueSlug(
                    $team->organization_id,
                    $team->name,
                    $team->id,
                );
            }
        });
    }

    /** @return BelongsTo<Organization, $this> */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /** @return HasMany<TeamMembership, $this> */
    public function memberships(): HasMany
    {
        return $this->hasMany(TeamMembership::class);
    }

    /** @return BelongsToMany<User, $this, TeamMembership, 'pivot'> */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_memberships')
            ->using(TeamMembership::class)
            ->withPivot(['organization_id', 'role'])
            ->withTimestamps();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    private static function generateUniqueSlug(
        int $organizationId,
        string $name,
        ?int $ignoreId = null,
    ): string {
        $base = Str::slug($name) ?: 'team';
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
