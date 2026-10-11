<?php

namespace App\Http\Controllers\Organizations;

use App\Http\Controllers\Controller;
use App\Models\OrganizationInvitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvitationRegistrationController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $code = $request->query('invitation');
        if (! $request->has('invitation')) {
            abort_unless(config('fortify.registration_enabled'), 404);

            return Inertia::render('auth/register', [
                'invitation' => null,
                'email' => '',
                'organizationName' => null,
            ]);
        }
        abort_unless(is_string($code) && strlen($code) === 64, 404);
        $invitation = OrganizationInvitation::query()->with('organization')
            ->where('code', $code)->whereHas('organization')->firstOrFail();
        abort_unless($invitation->isPending(), 404);

        if (User::query()->whereRaw('LOWER(email) = ?', [strtolower($invitation->email)])->exists()) {
            return to_route('login', ['invitation' => $code]);
        }

        return Inertia::render('auth/register', [
            'invitation' => $invitation->code,
            'email' => $invitation->email,
            'organizationName' => $invitation->organization->name,
        ]);
    }
}
