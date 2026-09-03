<?php

namespace App\Concerns;

use App\Data\OrganizationPermissions;
use App\Data\UserOrganization;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationPermission;
use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

trait HasOrganization
{
    /** @return HasOne<OrganizationMembership, $this> */
    public function organizationMembership(): HasOne
    {
        return $this->hasOne(OrganizationMembership::class, 'user_id')
            ->where('status', OrganizationMembershipStatus::Active->value);
    }

    /** @return HasOneThrough<Organization, OrganizationMembership, $this> */
    public function organization(): HasOneThrough
    {
        return $this->hasOneThrough(
            Organization::class,
            OrganizationMembership::class,
            'user_id',
            'id',
            'id',
            'organization_id',
        )->where('organization_memberships.status', OrganizationMembershipStatus::Active->value);
    }

    public function belongsToOrganization(Organization $organization): bool
    {
        return $this->organization()->whereKey($organization->id)->exists();
    }

    public function organizationRole(): ?OrganizationRole
    {
        return $this->organizationMembership()->first()?->role;
    }

    public function hasOrganizationPermission(OrganizationPermission $permission): bool
    {
        return $this->organizationRole()?->hasPermission($permission) ?? false;
    }

    public function toUserOrganization(): ?UserOrganization
    {
        $organization = $this->organization()->first();
        $role = $this->organizationRole();

        if (! $organization || ! $role) {
            return null;
        }

        return new UserOrganization(
            id: $organization->id,
            name: $organization->name,
            slug: $organization->slug,
            role: $role->value,
            roleLabel: $role->label(),
        );
    }

    public function toOrganizationPermissions(): OrganizationPermissions
    {
        $role = $this->organizationRole();

        return new OrganizationPermissions(
            canUpdateOrganization: $role?->hasPermission(OrganizationPermission::UpdateOrganization) ?? false,
            canDeleteOrganization: $role?->hasPermission(OrganizationPermission::DeleteOrganization) ?? false,
            canManageBilling: $role?->hasPermission(OrganizationPermission::ManageBilling) ?? false,
            canAddMember: $role?->hasPermission(OrganizationPermission::AddMember) ?? false,
            canUpdateMember: $role?->hasPermission(OrganizationPermission::UpdateMember) ?? false,
            canRemoveMember: $role?->hasPermission(OrganizationPermission::RemoveMember) ?? false,
            canCreateInvitation: $role?->hasPermission(OrganizationPermission::CreateInvitation) ?? false,
            canCancelInvitation: $role?->hasPermission(OrganizationPermission::CancelInvitation) ?? false,
        );
    }
}
