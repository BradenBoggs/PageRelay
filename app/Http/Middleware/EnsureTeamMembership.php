<?php

namespace App\Http\Middleware;

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTeamMembership
{
    /** @param Closure(Request): Response $next */
    public function handle(Request $request, Closure $next, ?string $minimumRole = null): Response
    {
        $user = $request->user();
        $team = $this->team($request);

        abort_if(! $user || ! $team || ! $user->belongsToTeam($team), 403);

        $this->ensureTeamMemberHasRequiredRole($user, $team, $minimumRole);

        return $next($request);
    }

    protected function ensureTeamMemberHasRequiredRole(User $user, Team $team, ?string $minimumRole): void
    {
        if ($minimumRole === null) {
            return;
        }

        $role = $user->teamRole($team);
        $requiredRole = TeamRole::tryFrom($minimumRole);

        abort_if(
            $requiredRole === null || $role === null || ! $role->isAtLeast($requiredRole),
            403,
        );
    }

    protected function team(Request $request): ?Team
    {
        $team = $request->route('team');

        if (is_string($team)) {
            return Team::where('slug', $team)->first();
        }

        return $team instanceof Team ? $team : null;
    }
}
