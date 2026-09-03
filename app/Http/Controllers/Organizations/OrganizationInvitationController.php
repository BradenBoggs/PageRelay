<?php

namespace App\Http\Controllers\Organizations;

use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organizations\CreateOrganizationInvitationRequest;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationMembership;
use App\Models\User;
use App\Notifications\Organizations\OrganizationInvitationNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class OrganizationInvitationController extends Controller
{
    public function store(CreateOrganizationInvitationRequest $request): RedirectResponse
    {
        $organization = $this->organization($request);
        Gate::authorize('inviteMember', $organization);

        $email = strtolower($request->validated('email'));

        if (User::query()->whereRaw('LOWER(email) = ?', [$email])->whereHas('organizationMembership')->exists()) {
            throw ValidationException::withMessages([
                'email' => __('This person already belongs to a SideWire organization.'),
            ]);
        }

        if ($organization->invitations()
            ->whereRaw('LOWER(email) = ?', [$email])
            ->whereNull('accepted_at')
            ->where(fn ($query) => $query
                ->whereNull('expires_at')
                ->orWhere('expires_at', '>=', now()))
            ->exists()) {
            throw ValidationException::withMessages([
                'email' => __('A pending invitation already exists for this email address.'),
            ]);
        }

        $invitation = $organization->invitations()->create([
            'email' => $email,
            'role' => OrganizationRole::from($request->validated('role')),
            'invited_by' => $request->user()->id,
            'expires_at' => now()->addDays(3),
        ]);

        Notification::route('mail', $invitation->email)
            ->notify(new OrganizationInvitationNotification($invitation));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Invitation sent.'),
        ]);

        return to_route('organization.edit');
    }

    public function destroy(Request $request, string $invitation): RedirectResponse
    {
        $organization = $this->organization($request);
        Gate::authorize('cancelInvitation', $organization);

        $organization->invitations()
            ->where('code', $invitation)
            ->whereNull('accepted_at')
            ->firstOrFail()
            ->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Invitation cancelled.'),
        ]);

        return to_route('organization.edit');
    }

    public function accept(Request $request, OrganizationInvitation $invitation): RedirectResponse
    {
        $user = $request->user();

        if (! $invitation->isPending() || strcasecmp($invitation->email, $user->email) !== 0) {
            abort(404);
        }

        if (OrganizationMembership::where('user_id', $user->id)->exists()) {
            abort(409, __('This account already belongs to an organization.'));
        }

        DB::transaction(function () use ($user, $invitation) {
            $invitation = OrganizationInvitation::query()
                ->whereKey($invitation->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($invitation->isPending(), 409);

            OrganizationMembership::create([
                'organization_id' => $invitation->organization_id,
                'user_id' => $user->id,
                'role' => $invitation->role,
                'status' => OrganizationMembershipStatus::Active,
                'is_billable' => true,
                'joined_at' => now(),
            ]);

            $invitation->update(['accepted_at' => now()]);
        });

        return to_route('dashboard');
    }

    public function decline(Request $request, OrganizationInvitation $invitation): RedirectResponse
    {
        abort_unless(
            $invitation->isPending()
                && strcasecmp($invitation->email, $request->user()->email) === 0,
            404,
        );

        $invitation->delete();

        return to_route('dashboard');
    }

    private function organization(Request $request): Organization
    {
        return $request->user()->organization()->firstOrFail();
    }
}
