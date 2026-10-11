<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\OrganizationInvitation;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $pendingInvitations = collect();
        $user = $request->user();
        if ($user->hasVerifiedEmail() && ! $user->organizationMembership()->exists()) {
            $pendingInvitations = OrganizationInvitation::query()
                ->with(['inviter', 'organization'])
                ->whereRaw('LOWER(email) = ?', [strtolower($user->email)])
                ->whereNull('accepted_at')
                ->where(fn ($query) => $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', now()))
                ->latest()
                ->get()
                ->map(fn (OrganizationInvitation $invitation) => [
                    'code' => $invitation->code,
                    'inviterName' => $invitation->inviter->name,
                    'organizationName' => $invitation->organization->name,
                ]);
        }

        return Inertia::render('settings/profile', [
            'pendingInvitations' => $pendingInvitations,
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Profile updated.'),
        ]);

        return to_route('profile.edit');
    }
}
