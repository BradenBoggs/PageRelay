<?php

namespace App\Policies;

use App\Enums\OrganizationPermission;
use App\Models\Organization;
use App\Models\User;

class OrganizationPolicy
{
    public function view(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization);
    }

    public function update(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization)
            && $user->hasOrganizationPermission(OrganizationPermission::UpdateOrganization);
    }

    public function delete(User $user, Organization $organization): bool
    {
        return $organization->isOwnedBy($user)
            && $user->hasOrganizationPermission(OrganizationPermission::DeleteOrganization);
    }

    public function manageBilling(User $user, Organization $organization): bool
    {
        return $organization->isOwnedBy($user)
            && $user->hasOrganizationPermission(OrganizationPermission::ManageBilling);
    }

    public function addMember(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization)
            && $user->hasOrganizationPermission(OrganizationPermission::AddMember);
    }

    public function updateMember(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization)
            && $user->hasOrganizationPermission(OrganizationPermission::UpdateMember);
    }

    public function removeMember(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization)
            && $user->hasOrganizationPermission(OrganizationPermission::RemoveMember);
    }

    public function inviteMember(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization)
            && $user->hasOrganizationPermission(OrganizationPermission::CreateInvitation);
    }

    public function cancelInvitation(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization)
            && $user->hasOrganizationPermission(OrganizationPermission::CancelInvitation);
    }
}
