<?php

namespace App\Http\Middleware;

use App\Enums\OrganizationRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the one supported organization from authenticated membership.
 *
 * The request never selects an organization and no fallback or switch state is
 * permitted. Client identifiers remain untrusted.
 *
 * @see docs/features/accounts-and-organizations.md
 */
class EnsureOrganizationMembership
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next, ?string $minimumRole = null): Response
    {
        $user = $request->user();
        $membership = $user?->organizationMembership()->first();
        $organization = $user?->organization()->first();

        abort_if(! $user || ! $membership || ! $organization, 403);

        if ($minimumRole !== null) {
            $requiredRole = OrganizationRole::tryFrom($minimumRole);

            abort_if(
                ! $requiredRole || ! $membership->role->isAtLeast($requiredRole),
                403,
            );
        }

        $request->attributes->set('organization', $organization);

        return $next($request);
    }
}
