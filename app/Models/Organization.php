<?php

namespace App\Models;

use App\Concerns\GeneratesUniqueOrganizationSlugs;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use Database\Factories\OrganizationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Cashier\Billable;

#[Fillable(['name', 'slug'])]
class Organization extends Model
{
    /** @use HasFactory<OrganizationFactory> */
    use Billable, GeneratesUniqueOrganizationSlugs, HasFactory, SoftDeletes;

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Organization $organization) {
            if (empty($organization->slug)) {
                $organization->slug = static::generateUniqueOrganizationSlug($organization->name);
            }
        });

        static::updating(function (Organization $organization) {
            if ($organization->isDirty('name')) {
                $organization->slug = static::generateUniqueOrganizationSlug(
                    $organization->name,
                    $organization->id,
                );
            }
        });
    }

    /** @return HasMany<OrganizationMembership, $this> */
    public function memberships(): HasMany
    {
        return $this->hasMany(OrganizationMembership::class);
    }

    /** @return BelongsToMany<User, $this, OrganizationMembership, 'pivot'> */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_memberships')
            ->using(OrganizationMembership::class)
            ->withPivot(['role', 'status', 'is_billable', 'joined_at', 'removed_at'])
            ->withTimestamps()
            ->wherePivot('status', OrganizationMembershipStatus::Active->value);
    }

    /** @return HasMany<OrganizationInvitation, $this> */
    public function invitations(): HasMany
    {
        return $this->hasMany(OrganizationInvitation::class);
    }

    /** @return HasMany<Workspace, $this> */
    public function workspaces(): HasMany
    {
        return $this->hasMany(Workspace::class);
    }

    /** @return HasOne<Workspace, $this> */
    public function defaultWorkspace(): HasOne
    {
        return $this->hasOne(Workspace::class)->where('is_default', true);
    }

    /** @return HasMany<Team, $this> */
    public function teams(): HasMany
    {
        return $this->hasMany(Team::class);
    }

    public function owner(): ?User
    {
        return $this->members()
            ->wherePivot('role', OrganizationRole::Owner->value)
            ->first();
    }

    public function isOwnedBy(User $user): bool
    {
        return $this->owner()?->is($user) ?? false;
    }

    public function billableSeatCount(): int
    {
        return $this->memberships()
            ->active()
            ->where('is_billable', true)
            ->count();
    }

    public function stripeEmail(): ?string
    {
        return $this->owner()?->email;
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
