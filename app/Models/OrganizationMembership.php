<?php

namespace App\Models;

use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $organization_id
 * @property int $user_id
 * @property OrganizationRole $role
 * @property OrganizationMembershipStatus $status
 * @property bool $is_billable
 * @property Carbon|null $joined_at
 * @property Carbon|null $removed_at
 * @property-read Organization $organization
 * @property-read User $user
 */
class OrganizationMembership extends Pivot
{
    protected $table = 'organization_memberships';

    public $incrementing = true;

    protected $fillable = [
        'organization_id',
        'user_id',
        'role',
        'status',
        'is_billable',
        'joined_at',
        'removed_at',
    ];

    /** @return BelongsTo<Organization, $this> */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param Builder<OrganizationMembership> $query
     * @return Builder<OrganizationMembership>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', OrganizationMembershipStatus::Active->value);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'role' => OrganizationRole::class,
            'status' => OrganizationMembershipStatus::class,
            'is_billable' => 'boolean',
            'joined_at' => 'datetime',
            'removed_at' => 'datetime',
        ];
    }
}
