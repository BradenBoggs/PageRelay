<?php

namespace App\Http\Controllers\Organizations;

use App\Enums\OrganizationRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organizations\SaveOrganizationRequest;
use App\Models\Organization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    public function edit(Request $request): Response
    {
        $organization = $this->organization($request);
        $membership = $request->user()->organizationMembership()->firstOrFail();

        Gate::authorize('view', $organization);

        return Inertia::render('organizations/edit', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
                'role' => $membership->role->value,
                'roleLabel' => $membership->role->label(),
            ],
            'members' => $organization->memberships()
                ->active()
                ->with('user')
                ->get()
                ->map(fn ($member) => [
                    'id' => $member->user->id,
                    'name' => $member->user->name,
                    'email' => $member->user->email,
                    'role' => $member->role->value,
                    'roleLabel' => $member->role->label(),
                ]),
            'invitations' => $organization->invitations()
                ->whereNull('accepted_at')
                ->where(fn ($query) => $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', now()))
                ->latest()
                ->get()
                ->map(fn ($invitation) => [
                    'code' => $invitation->code,
                    'email' => $invitation->email,
                    'role' => $invitation->role->value,
                    'roleLabel' => $invitation->role->label(),
                    'createdAt' => $invitation->created_at->toISOString(),
                ]),
            'permissions' => $request->user()->toOrganizationPermissions(),
            'availableRoles' => OrganizationRole::assignable(),
        ]);
    }

    public function update(SaveOrganizationRequest $request): RedirectResponse
    {
        $organization = $this->organization($request);
        Gate::authorize('update', $organization);

        $organization->update(['name' => $request->validated('name')]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Organization updated.'),
        ]);

        return to_route('organization.edit');
    }

    private function organization(Request $request): Organization
    {
        return $request->user()->organization()->firstOrFail();
    }
}
