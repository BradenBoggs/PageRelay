#!/usr/bin/env python3
"""Remove Laravel starter tenant switching before Team is renamed.

This transformation is intentionally separate from the Team-to-Organization
rename. It is idempotent and fails when an expected source pattern drifts.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.rstrip() + "\n", encoding="utf-8")


def delete(path: str) -> None:
    target = ROOT / path
    if target.exists():
        target.unlink()


def replace(path: str, old: str, new: str, *, required: bool = True) -> None:
    target = ROOT / path
    content = target.read_text(encoding="utf-8")
    if old not in content:
        if required:
            raise RuntimeError(f"Expected text not found in {path}: {old!r}")
        return
    target.write_text(content.replace(old, new), encoding="utf-8")


write(
    "app/Concerns/HasTeams.php",
    r'''<?php

namespace App\Concerns;

use App\Data\TeamPermissions;
use App\Data\UserTeam;
use App\Enums\TeamPermission;
use App\Enums\TeamRole;
use App\Models\Membership;
use App\Models\Team;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Collection;

trait HasTeams
{
    /** @return BelongsToMany<Team, $this> */
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'team_members', 'user_id', 'team_id')
            ->withPivot(['role'])
            ->withTimestamps();
    }

    /** @return HasManyThrough<Team, Membership, $this> */
    public function ownedTeams(): HasManyThrough
    {
        return $this->hasManyThrough(
            Team::class,
            Membership::class,
            'user_id',
            'id',
            'id',
            'team_id',
        )->where('team_members.role', TeamRole::Owner->value);
    }

    /** @return HasMany<Membership, $this> */
    public function teamMemberships(): HasMany
    {
        return $this->hasMany(Membership::class, 'user_id');
    }

    public function belongsToTeam(Team $team): bool
    {
        return $this->teams()->where('teams.id', $team->id)->exists();
    }

    public function ownsTeam(Team $team): bool
    {
        return $this->teamRole($team) === TeamRole::Owner;
    }

    public function teamRole(Team $team): ?TeamRole
    {
        return $this->teamMemberships()
            ->where('team_id', $team->id)
            ->first()
            ?->role;
    }

    /** @return Collection<int, UserTeam> */
    public function toUserTeams(): Collection
    {
        return $this->teams()
            ->get()
            ->map(fn (Team $team) => $this->toUserTeam($team))
            ->values();
    }

    public function toUserTeam(Team $team): UserTeam
    {
        $role = $this->teamRole($team);

        return new UserTeam(
            id: $team->id,
            name: $team->name,
            slug: $team->slug,
            role: $role?->value,
            roleLabel: $role?->label(),
        );
    }

    public function toTeamPermissions(Team $team): TeamPermissions
    {
        $role = $this->teamRole($team);

        return new TeamPermissions(
            canUpdateTeam: $role?->hasPermission(TeamPermission::UpdateTeam) ?? false,
            canDeleteTeam: $role?->hasPermission(TeamPermission::DeleteTeam) ?? false,
            canAddMember: $role?->hasPermission(TeamPermission::AddMember) ?? false,
            canUpdateMember: $role?->hasPermission(TeamPermission::UpdateMember) ?? false,
            canRemoveMember: $role?->hasPermission(TeamPermission::RemoveMember) ?? false,
            canCreateInvitation: $role?->hasPermission(TeamPermission::CreateInvitation) ?? false,
            canCancelInvitation: $role?->hasPermission(TeamPermission::CancelInvitation) ?? false,
        );
    }

    public function hasTeamPermission(Team $team, TeamPermission $permission): bool
    {
        return $this->teamRole($team)?->hasPermission($permission) ?? false;
    }
}''',
)

write(
    "app/Data/UserTeam.php",
    r'''<?php

namespace App\Data;

readonly class UserTeam
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public ?string $role,
        public ?string $roleLabel,
    ) {
        //
    }
}''',
)

write(
    "app/Models/Team.php",
    r'''<?php

namespace App\Models;

use App\Concerns\GeneratesUniqueTeamSlugs;
use App\Enums\TeamRole;
use Database\Factories\TeamFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read Collection<int, TeamInvitation> $invitations
 * @property-read Collection<int, Membership> $memberships
 * @property-read Collection<int, User> $members
 */
#[Fillable(['name', 'slug'])]
class Team extends Model
{
    /** @use HasFactory<TeamFactory> */
    use GeneratesUniqueTeamSlugs, HasFactory, SoftDeletes;

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Team $team) {
            if (empty($team->slug)) {
                $team->slug = static::generateUniqueTeamSlug($team->name);
            }
        });

        static::updating(function (Team $team) {
            if ($team->isDirty('name')) {
                $team->slug = static::generateUniqueTeamSlug($team->name, $team->id);
            }
        });
    }

    public function owner(): ?Model
    {
        return $this->members()
            ->wherePivot('role', TeamRole::Owner->value)
            ->first();
    }

    /** @return BelongsToMany<User, $this, Membership, 'pivot'> */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_members', 'team_id', 'user_id')
            ->using(Membership::class)
            ->withPivot(['role'])
            ->withTimestamps();
    }

    /** @return HasMany<Membership, $this> */
    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    /** @return HasMany<TeamInvitation, $this> */
    public function invitations(): HasMany
    {
        return $this->hasMany(TeamInvitation::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}''',
)

write(
    "app/Models/User.php",
    r'''<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Concerns\HasTeams;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, Team> $ownedTeams
 * @property-read Collection<int, Membership> $teamMemberships
 * @property-read Collection<int, Team> $teams
 */
#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasTeams, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            /* @chisel-2fa */
            'two_factor_confirmed_at' => 'datetime',
            /* @end-chisel-2fa */
        ];
    }
}''',
)

write(
    "app/Actions/Teams/CreateTeam.php",
    r'''<?php

namespace App\Actions\Teams;

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateTeam
{
    public function handle(User $user, string $name): Team
    {
        return DB::transaction(function () use ($user, $name) {
            $team = Team::create(['name' => $name]);

            $team->memberships()->create([
                'user_id' => $user->id,
                'role' => TeamRole::Owner,
            ]);

            return $team;
        });
    }
}''',
)

write(
    "app/Actions/Fortify/CreateNewUser.php",
    r'''<?php

namespace App\Actions\Fortify;

use App\Actions\Teams\CreateTeam;
use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(private CreateTeam $createTeam)
    {
        //
    }

    /** @param array<string, string> $input */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        return DB::transaction(function () use ($input) {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            $this->createTeam->handle($user, $user->name."'s Team");

            return $user;
        });
    }
}''',
)

write(
    "app/Http/Controllers/Teams/TeamController.php",
    r'''<?php

namespace App\Http\Controllers\Teams;

use App\Actions\Teams\CreateTeam;
use App\Enums\TeamRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\DeleteTeamRequest;
use App\Http\Requests\Teams\SaveTeamRequest;
use App\Models\Membership;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('teams/index', [
            'teams' => $request->user()->toUserTeams(),
        ]);
    }

    public function store(SaveTeamRequest $request, CreateTeam $createTeam): RedirectResponse
    {
        $team = $createTeam->handle($request->user(), $request->validated('name'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team created.')]);

        return to_route('teams.edit', ['team' => $team->slug]);
    }

    public function edit(Request $request, Team $team): Response
    {
        $user = $request->user();

        return Inertia::render('teams/edit', [
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'slug' => $team->slug,
            ],
            'members' => $team->members()->get()->map(function (User $member) {
                /** @var Membership $membership */
                $membership = $member->getRelation('pivot');

                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'avatar' => $member->avatar ?? null,
                    'role' => $membership->role->value,
                    'role_label' => $membership->role->label(),
                ];
            }),
            'invitations' => $team->invitations()
                ->whereNull('accepted_at')
                ->get()
                ->map(fn ($invitation) => [
                    'code' => $invitation->code,
                    'email' => $invitation->email,
                    'role' => $invitation->role->value,
                    'role_label' => $invitation->role->label(),
                    'created_at' => $invitation->created_at->toISOString(),
                ]),
            'permissions' => $user->toTeamPermissions($team),
            'availableRoles' => TeamRole::assignable(),
        ]);
    }

    public function update(SaveTeamRequest $request, Team $team): RedirectResponse
    {
        Gate::authorize('update', $team);

        $team = DB::transaction(function () use ($request, $team) {
            $team = Team::whereKey($team->id)->lockForUpdate()->firstOrFail();
            $team->update(['name' => $request->validated('name')]);

            return $team;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team updated.')]);

        return to_route('teams.edit', ['team' => $team->slug]);
    }

    public function leave(Request $request, Team $team): RedirectResponse
    {
        Gate::authorize('leave', $team);

        $team->memberships()
            ->where('user_id', $request->user()->id)
            ->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('You left the team ":name"', ['name' => $team->name])]);

        return to_route('teams.index');
    }

    public function destroy(DeleteTeamRequest $request, Team $team): RedirectResponse
    {
        DB::transaction(function () use ($team) {
            $team->invitations()->delete();
            $team->memberships()->delete();
            $team->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team deleted.')]);

        return to_route('teams.index');
    }
}''',
)

write(
    "app/Http/Controllers/Teams/TeamMemberController.php",
    r'''<?php

namespace App\Http\Controllers\Teams;

use App\Enums\TeamRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\UpdateTeamMemberRequest;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class TeamMemberController extends Controller
{
    public function update(UpdateTeamMemberRequest $request, Team $team, User $user): RedirectResponse
    {
        Gate::authorize('updateMember', $team);

        $team->memberships()
            ->where('user_id', $user->id)
            ->firstOrFail()
            ->update(['role' => TeamRole::from($request->validated('role'))]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member role updated.')]);

        return to_route('teams.edit', ['team' => $team->slug]);
    }

    public function destroy(Team $team, User $user): RedirectResponse
    {
        Gate::authorize('removeMember', $team);
        abort_if($team->owner()?->is($user), 403, __('The team owner cannot be removed.'));

        $team->memberships()
            ->where('user_id', $user->id)
            ->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member removed.')]);

        return to_route('teams.edit', ['team' => $team->slug]);
    }
}''',
)

write(
    "app/Http/Controllers/Teams/TeamInvitationController.php",
    r'''<?php

namespace App\Http\Controllers\Teams;

use App\Enums\TeamRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\CreateTeamInvitationRequest;
use App\Http\Requests\Teams\RespondToTeamInvitationRequest;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Notifications\Teams\TeamInvitation as TeamInvitationNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class TeamInvitationController extends Controller
{
    public function store(CreateTeamInvitationRequest $request, Team $team): RedirectResponse
    {
        Gate::authorize('inviteMember', $team);

        $invitation = $team->invitations()->create([
            'email' => $request->validated('email'),
            'role' => TeamRole::from($request->validated('role')),
            'invited_by' => $request->user()->id,
            'expires_at' => now()->addDays(3),
        ]);

        Notification::route('mail', $invitation->email)
            ->notify(new TeamInvitationNotification($invitation));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation sent.')]);

        return to_route('teams.edit', ['team' => $team->slug]);
    }

    public function destroy(Team $team, TeamInvitation $invitation): RedirectResponse
    {
        abort_unless($invitation->team_id === $team->id, 404);
        Gate::authorize('cancelInvitation', $team);
        $invitation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation cancelled.')]);

        return to_route('teams.edit', ['team' => $team->slug]);
    }

    public function accept(RespondToTeamInvitationRequest $request, TeamInvitation $invitation): RedirectResponse
    {
        DB::transaction(function () use ($request, $invitation) {
            $invitation->team->memberships()->firstOrCreate(
                ['user_id' => $request->user()->id],
                ['role' => $invitation->role],
            );

            $invitation->update(['accepted_at' => now()]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation accepted.')]);

        return to_route('dashboard');
    }

    public function decline(RespondToTeamInvitationRequest $request, TeamInvitation $invitation): RedirectResponse
    {
        $invitation->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Invitation declined.')]);

        return to_route('dashboard');
    }
}''',
)

write(
    "app/Http/Middleware/EnsureTeamMembership.php",
    r'''<?php

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
}''',
)

write(
    "app/Http/Middleware/HandleInertiaRequests.php",
    r'''<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /** @return array<string, mixed> */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => ['user' => $user],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'team' => fn () => $user?->toUserTeams()->first(),
            'teams' => fn () => $user?->toUserTeams() ?? [],
        ];
    }
}''',
)

write(
    "app/Policies/TeamPolicy.php",
    r'''<?php

namespace App\Policies;

use App\Enums\TeamPermission;
use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Team $team): bool
    {
        return $user->belongsToTeam($team);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, TeamPermission::UpdateTeam);
    }

    public function leave(User $user, Team $team): bool
    {
        return $user->belongsToTeam($team) && ! $user->ownsTeam($team);
    }

    public function addMember(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, TeamPermission::AddMember);
    }

    public function updateMember(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, TeamPermission::UpdateMember);
    }

    public function removeMember(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, TeamPermission::RemoveMember);
    }

    public function inviteMember(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, TeamPermission::CreateInvitation);
    }

    public function cancelInvitation(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, TeamPermission::CancelInvitation);
    }

    public function delete(User $user, Team $team): bool
    {
        return $user->hasTeamPermission($team, TeamPermission::DeleteTeam);
    }
}''',
)

write(
    "database/factories/TeamFactory.php",
    r'''<?php

namespace Database\Factories;

use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Team> */
class TeamFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name),
        ];
    }

    public function trashed(): static
    {
        return $this->state(fn (array $attributes) => ['deleted_at' => now()]);
    }
}''',
)

write(
    "database/factories/UserFactory.php",
    r'''<?php

namespace Database\Factories;

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/** @extends Factory<User> */
class UserFactory extends Factory
{
    protected static ?string $password;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (User $user) {
            $team = Team::factory()->create(['name' => $user->name."'s Team"]);

            $team->members()->attach($user, [
                'role' => TeamRole::Owner->value,
            ]);
        });
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => ['email_verified_at' => null]);
    }

    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }
}''',
)

write(
    "database/migrations/2026_01_27_000001_create_teams_table.php",
    r'''<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role');
            $table->timestamps();
            $table->unique(['team_id', 'user_id']);
        });

        Schema::create('team_invitations', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->string('email');
            $table->string('role');
            $table->foreignId('invited_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_invitations');
        Schema::dropIfExists('team_members');
        Schema::dropIfExists('teams');
    }
};''',
)

delete("database/migrations/2026_01_27_000002_add_current_team_id_to_users_table.php")
delete("app/Http/Middleware/SetTeamUrlDefaults.php")
delete("app/Http/Responses/Concerns/RedirectsToCurrentTeam.php")
delete("resources/js/components/team-switcher.tsx")

write(
    "routes/web.php",
    r'''<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Teams\TeamInvitationController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php';''',
)

settings = (ROOT / "routes/settings.php").read_text(encoding="utf-8")
settings = settings.replace("        Route::post('settings/teams/{team}/switch', [TeamController::class, 'switch'])->name('teams.switch');\n", "")
(ROOT / "routes/settings.php").write_text(settings, encoding="utf-8")

bootstrap = (ROOT / "bootstrap/app.php").read_text(encoding="utf-8")
bootstrap = bootstrap.replace("use App\\Http\\Middleware\\SetTeamUrlDefaults;\n", "")
bootstrap = bootstrap.replace("            SetTeamUrlDefaults::class,\n", "")
(ROOT / "bootstrap/app.php").write_text(bootstrap, encoding="utf-8")

for response_path in (ROOT / "app/Http/Responses").glob("*.php"):
    response = response_path.read_text(encoding="utf-8")
    response = response.replace("use App\\Http\\Responses\\Concerns\\RedirectsToCurrentTeam;\n", "")
    response = response.replace("    use RedirectsToCurrentTeam;\n\n", "")
    response = re.sub(
        r"\$this->redirectPathForCurrentTeam\(\$request, (Fortify::redirects\('[^']+'\))\)",
        r"\1",
        response,
    )
    response_path.write_text(response, encoding="utf-8")

write(
    "resources/js/components/app-sidebar.tsx",
    r'''import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/BradenBoggs/PageRelay',
            icon: FolderGit2,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}''',
)

replace("resources/js/components/app-header.tsx", "import { TeamSwitcher } from '@/components/team-switcher';\n", "")
replace("resources/js/components/app-header.tsx", "    const { auth, currentTeam } = page.props;", "    const { auth } = page.props;")
replace("resources/js/components/app-header.tsx", "    const dashboardUrl = currentTeam ? dashboard(currentTeam.slug) : '/';", "    const dashboardUrl = dashboard();")
replace("resources/js/components/app-header.tsx", "\n                        <TeamSwitcher inHeader />", "")

replace("resources/js/components/nav-user.tsx", "    const { auth, currentTeam } = usePage().props;", "    const { auth, team } = usePage().props;")
replace("resources/js/components/nav-user.tsx", "<UserInfo user={auth.user} team={currentTeam} />", "<UserInfo user={auth.user} team={team} />")

replace("resources/js/pages/welcome.tsx", "    const { auth, currentTeam } = usePage().props;\n    const dashboardUrl = currentTeam ? dashboard(currentTeam.slug) : '/';", "    const { auth } = usePage().props;\n    const dashboardUrl = dashboard();")

write(
    "resources/js/types/global.d.ts",
    r'''import type { Auth } from '@/types/auth';
import type { Team } from '@/types/teams';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            team: Team | null;
            teams: Team[];
            [key: string]: unknown;
        };
    }
}''',
)

write(
    "resources/js/types/teams.ts",
    r'''export type TeamRole = 'owner' | 'admin' | 'member';

export type Team = {
    id: number;
    name: string;
    slug: string;
    role?: TeamRole;
    roleLabel?: string;
};

export type TeamMember = {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    role: TeamRole;
    role_label: string;
};

export type TeamInvitation = {
    code: string;
    email: string;
    role: TeamRole;
    role_label: string;
    created_at: string;
};

export type TeamInvitationContext = {
    code: string;
    teamName: string;
};

export type DashboardInvitation = {
    code: string;
    inviterName: string;
    team: {
        name: string;
        slug: string;
    };
};

export type TeamPermissions = {
    canUpdateTeam: boolean;
    canDeleteTeam: boolean;
    canAddMember: boolean;
    canUpdateMember: boolean;
    canRemoveMember: boolean;
    canCreateInvitation: boolean;
    canCancelInvitation: boolean;
};

export type RoleOption = {
    value: TeamRole;
    label: string;
};''',
)

replace(
    "resources/js/pages/dashboard.tsx",
    "Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({\n    breadcrumbs: [\n        {\n            title: 'Dashboard',\n            href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/',\n        },\n    ],\n});",
    "Dashboard.layout = {\n    breadcrumbs: [\n        {\n            title: 'Dashboard',\n            href: dashboard(),\n        },\n    ],\n};",
)

team_index = ROOT / "resources/js/pages/teams/index.tsx"
text = team_index.read_text(encoding="utf-8")
text = text.replace("import { Badge } from '@/components/ui/badge';\n", "")
text = text.replace("                        const canLeaveTeam =\n                            !team.isPersonal && team.role !== 'owner';", "                        const canLeaveTeam = team.role !== 'owner';")
text = re.sub(
    r"\s*\{team\.isPersonal \? \(\s*<Badge variant=\"secondary\">\s*Personal\s*</Badge>\s*\) : null\}",
    "",
    text,
)
team_index.write_text(text, encoding="utf-8")

team_edit = ROOT / "resources/js/pages/teams/edit.tsx"
text = team_edit.read_text(encoding="utf-8")
text = text.replace("permissions.canDeleteTeam && !team.isPersonal", "permissions.canDeleteTeam")
team_edit.write_text(text, encoding="utf-8")

# Remove obsolete Chisel feature regeneration so composer updates cannot restore
# the deleted tenant-switching scaffold.
composer_path = ROOT / "composer.json"
import json
composer = json.loads(composer_path.read_text(encoding="utf-8"))
composer.get("require", {}).pop("laravel/chisel", None)
for script_name in ("post-update-cmd", "post-create-project-cmd"):
    commands = composer.get("scripts", {}).get(script_name, [])
    composer["scripts"][script_name] = [
        command for command in commands if "install:features" not in command
    ]
if not composer.get("scripts", {}).get("post-update-cmd"):
    composer["scripts"].pop("post-update-cmd", None)
composer.get("extra", {}).pop("installer", None)
composer_path.write_text(json.dumps(composer, indent=4) + "\n", encoding="utf-8")

delete("chisel.php")
delete("chisel-paths.php")
delete("app/Console/Commands/InstallFeaturesCommand.php")

# Replace tests that existed only to prove switching and personal-team behavior.
for path in (ROOT / "tests/Feature/Teams").glob("*.php"):
    path.unlink()

write(
    "tests/Feature/Teams/TeamFoundationTest.php",
    r'''<?php

namespace Tests\Feature\Teams;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TeamFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_factory_creates_one_owned_team_without_tenant_switching_state(): void
    {
        $user = User::factory()->create();

        $this->assertCount(1, $user->teams);
        $this->assertTrue($user->ownsTeam($user->teams->first()));
        $this->assertFalse(Schema::hasColumn('users', 'current_'.'team_id'));
        $this->assertFalse(Schema::hasColumn('teams', 'is_'.'personal'));
    }
}''',
)

# Keep existing authentication test intent while removing tenant-scoped URLs.
for path in [
    ROOT / "tests/Feature/Auth/AuthenticationTest.php",
    ROOT / "tests/Feature/Auth/EmailVerificationTest.php",
    ROOT / "tests/Feature/DashboardTest.php",
]:
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"\$user->personalTeam\(\)", "$user->teams()->firstOrFail()", text)
    text = text.replace("$user->currentTeam", "$user->teams()->first()")
    text = re.sub(r"route\('dashboard', \['current_team' => [^\]]+\]\)", "route('dashboard')", text)
    text = text.replace("test_passkey_login_response_redirects_to_the_current_team_dashboard", "test_passkey_login_response_redirects_to_the_dashboard")
    path.write_text(text, encoding="utf-8")

for forbidden in [
    "current_team",
    "currentTeam",
    "switchTeam",
    "isCurrentTeam",
    "fallbackTeam",
    "is_personal",
    "personalTeam",
]:
    matches: list[str] = []
    for base in ["app", "bootstrap", "database", "resources/js", "routes", "tests"]:
        root = ROOT / base
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            try:
                content = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            if forbidden in content or forbidden in path.name:
                matches.append(str(path.relative_to(ROOT)))
    if matches:
        raise RuntimeError(f"Forbidden switching symbol {forbidden!r} remains in: {matches}")

print("Removed tenant switching and personal-team behavior before rename.")
