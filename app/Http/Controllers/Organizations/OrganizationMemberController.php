<?php

namespace App\Http\Controllers\Organizations;

use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organizations\UpdateOrganizationMemberRequest;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class OrganizationMemberController extends Controller
{
    public function update(
        UpdateOrganizationMemberRequest $request,
        User $user,
    ): RedirectResponse {
        $organization = $this->organization($request);
        Gate::authorize('updateMember', $organization);

        $membership = $organization->memberships()
            ->active()
            ->where('user_id', $user->id)
            ->firstOrFail();

        abort_if($membership->role === OrganizationRole::Owner, 403);

        $membership->update([
            'role' => OrganizationRole::from($request->validated('role')),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Member role updated.'),
        ]);

        return to_route('organization.edit');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $organization = $this->organization($request);
        Gate::authorize('removeMember', $organization);

        $membership = $organization->memberships()
            ->active()
            ->where('user_id', $user->id)
            ->firstOrFail();

        abort_if($membership->role === OrganizationRole::Owner, 403);

        $membership->update([
            'status' => OrganizationMembershipStatus::Removed,
            'is_billable' => false,
            'removed_at' => now(),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Member removed.'),
        ]);

        return to_route('organization.edit');
    }

    private function organization(Request $request): Organization
    {
        return $request->user()->organization()->firstOrFail();
    }
}
