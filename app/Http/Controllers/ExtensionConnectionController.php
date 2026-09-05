<?php

namespace App\Http\Controllers;

use App\Domain\Extension\AuthorizeExtensionHandoff;
use App\Models\ExtensionHandoff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExtensionConnectionController extends Controller
{
    public function show(Request $request, ExtensionHandoff $handoff): Response
    {
        abort_if(
            $handoff->user_id && $handoff->user_id !== $request->user()->id,
            404,
        );

        $organization = $request->attributes->get('organization');

        return Inertia::render('extension/connect', [
            'handoff' => [
                'id' => $handoff->public_id,
                'expiresAt' => $handoff->expires_at->toISOString(),
                'status' => match (true) {
                    $handoff->isExpired() => 'expired',
                    (bool) $handoff->authorized_at => 'connected',
                    default => 'ready',
                },
            ],
            'organization' => [
                'name' => $organization->name,
            ],
        ]);
    }

    public function store(
        Request $request,
        ExtensionHandoff $handoff,
        AuthorizeExtensionHandoff $authorize,
    ): RedirectResponse {
        $authorize->handle($handoff, $request->user());

        return to_route('extension.connect.show', $handoff);
    }
}
