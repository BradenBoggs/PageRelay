<?php

namespace App\Http\Middleware;

use App\Enums\ApiTokenAbility;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts the extension API to revocable, scoped bearer tokens.
 *
 * Browser-session cookies and general-purpose Sanctum tokens cannot cross
 * this boundary, even though Sanctum normally treats first-party sessions as
 * having every token ability.
 *
 * @see docs/features/browser-extension.md
 */
class EnsureExtensionAccessToken
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->user()?->currentAccessToken();

        abort_if(
            ! $token instanceof PersonalAccessToken
                || ! $token->can(ApiTokenAbility::ExtensionAccess->value),
            403,
        );

        return $next($request);
    }
}
