<?php

namespace App\Actions\Organizations;

use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateOrganization
{
    public function handle(User $user, string $name): Organization
    {
        return DB::transaction(function () use ($user, $name) {
            if (OrganizationMembership::where('user_id', $user->id)->exists()) {
                throw ValidationException::withMessages([
                    'organization' => __('This account already belongs to an organization.'),
                ]);
            }

            $organization = Organization::create(['name' => $name]);

            $organization->memberships()->create([
                'user_id' => $user->id,
                'role' => OrganizationRole::Owner,
                'status' => OrganizationMembershipStatus::Active,
                'is_billable' => true,
                'joined_at' => now(),
            ]);

            return $organization;
        });
    }
}
