<?php

namespace App\Domain\Workspaces;

use App\Models\Organization;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

/**
 * Ensures one recoverable default workspace exists for an organization.
 *
 * The organization remains the tenant; this service never selects a tenant or
 * turns a workspace into an account boundary.
 *
 * @see docs/features/workspaces-and-teams.md
 */
class EnsureDefaultWorkspace
{
    public function handle(Organization $organization): Workspace
    {
        return DB::transaction(function () use ($organization): Workspace {
            Organization::query()
                ->whereKey($organization->id)
                ->lockForUpdate()
                ->firstOrFail();

            $workspace = Workspace::withTrashed()
                ->where('organization_id', $organization->id)
                ->where('is_default', true)
                ->first();

            if ($workspace) {
                if ($workspace->trashed()) {
                    $workspace->restore();
                }

                return $workspace;
            }

            return Workspace::create([
                'organization_id' => $organization->id,
                'name' => 'Main',
                'slug' => 'main',
                'is_default' => true,
            ]);
        });
    }
}
