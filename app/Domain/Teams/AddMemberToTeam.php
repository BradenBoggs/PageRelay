<?php

namespace App\Domain\Teams;

use App\Enums\OrganizationMembershipStatus;
use App\Enums\TeamRole;
use App\Models\OrganizationMembership;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Adds an existing active organization member to an organization-owned team.
 *
 * Team membership is never tenant membership and never changes Stripe seats.
 *
 * @see docs/features/workspaces-and-teams.md
 */
class AddMemberToTeam
{
    public function handle(
        Team $team,
        User $user,
        TeamRole $role = TeamRole::Member,
    ): TeamMembership {
        return DB::transaction(function () use ($team, $user, $role): TeamMembership {
            OrganizationMembership::query()
                ->where('organization_id', $team->organization_id)
                ->where('user_id', $user->id)
                ->where('status', OrganizationMembershipStatus::Active->value)
                ->lockForUpdate()
                ->firstOrFail();

            return $team->memberships()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'organization_id' => $team->organization_id,
                    'role' => $role,
                ],
            );
        });
    }
}
