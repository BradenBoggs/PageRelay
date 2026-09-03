#!/usr/bin/env python3
"""Rename the stripped Laravel tenant scaffold from Team to Organization.

The precondition is intentionally strict: the starter's tenant switching and
personal-team behavior must already be absent. This script does not create the
real SideWire Team model; that happens only after Organization is established.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CODE_ROOTS = [
    ROOT / "app",
    ROOT / "bootstrap",
    ROOT / "database",
    ROOT / "resources" / "js",
    ROOT / "routes",
    ROOT / "tests",
]


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.rstrip() + "\n", encoding="utf-8")


def delete(path: str) -> None:
    target = ROOT / path
    if target.is_dir():
        for child in sorted(target.rglob("*"), key=lambda item: len(item.parts), reverse=True):
            if child.is_file() or child.is_symlink():
                child.unlink()
            elif child.is_dir():
                child.rmdir()
        target.rmdir()
    elif target.exists():
        target.unlink()


def text_files() -> list[Path]:
    result: list[Path] = []
    for root in CODE_ROOTS:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.is_file():
                try:
                    path.read_text(encoding="utf-8")
                except UnicodeDecodeError:
                    continue
                result.append(path)
    return result


def assert_absent(tokens: list[str], roots: list[Path] | None = None) -> None:
    failures: dict[str, list[str]] = {}
    scan_roots = roots or CODE_ROOTS
    for token in tokens:
        matches: list[str] = []
        for root in scan_roots:
            if not root.exists():
                continue
            for path in root.rglob("*"):
                if not path.is_file():
                    continue
                try:
                    content = path.read_text(encoding="utf-8")
                except UnicodeDecodeError:
                    continue
                if token in content or token in path.name:
                    matches.append(str(path.relative_to(ROOT)))
        if matches:
            failures[token] = sorted(set(matches))

    if failures:
        details = "\n".join(f"{token}: {paths}" for token, paths in failures.items())
        raise RuntimeError(f"Unexpected source remains:\n{details}")


if not (ROOT / "app/Models/Team.php").exists():
    raise RuntimeError("Expected the stripped Team tenant model before rename.")
if (ROOT / "app/Models/Organization.php").exists():
    raise RuntimeError("Organization already exists; refusing to rerun the rename.")

assert_absent([
    "current_team",
    "currentTeam",
    "switchTeam",
    "isCurrentTeam",
    "fallbackTeam",
    "is_personal",
    "personalTeam",
])

# Rename the remaining tenant-oriented paths first. Documentation and foundation
# scripts are excluded so the historical removal evidence remains intact.
for root in [ROOT / "app", ROOT / "database", ROOT / "resources/js", ROOT / "tests"]:
    if not root.exists():
        continue
    for path in sorted(root.rglob("*"), key=lambda item: len(item.parts), reverse=True):
        name = path.name
        renamed = (
            name.replace("Teams", "Organizations")
            .replace("Team", "Organization")
            .replace("teams", "organizations")
            .replace("team", "organization")
        )
        if renamed == name:
            continue
        target = path.with_name(renamed)
        if target.exists():
            raise RuntimeError(f"Cannot rename {path} to existing path {target}")
        path.rename(target)

# Convert remaining tenant symbols and words. More specific forms are handled
# before standalone human-readable words.
replacements = [
    ("team_members", "organization_memberships"),
    ("team_invitations", "organization_invitations"),
    ("team_id", "organization_id"),
    ("teamMemberships", "organizationMemberships"),
    ("teamPermissions", "organizationPermissions"),
    ("teamPermission", "organizationPermission"),
    ("teamInvitation", "organizationInvitation"),
    ("teamRole", "organizationRole"),
    ("teamName", "organizationName"),
    ("teamId", "organizationId"),
    ("Team", "Organization"),
    ("Teams", "Organizations"),
]

for path in text_files():
    content = path.read_text(encoding="utf-8")
    for old, new in replacements:
        content = content.replace(old, new)
    content = re.sub(r"\bteams\b", "organizations", content)
    content = re.sub(r"\bteam\b", "organization", content)
    content = re.sub(r"\bTeams\b", "Organizations", content)
    content = re.sub(r"\bTeam\b", "Organization", content)
    path.write_text(content, encoding="utf-8")

# The generic rename intentionally creates HasOrganizations. The approved
# foundation exposes one organization relationship and no selector state.
delete("app/Concerns/HasOrganizations.php")
delete("app/Models/Membership.php")
delete("app/Http/Requests/Organizations/DeleteOrganizationRequest.php")
delete("app/Http/Requests/Organizations/RespondToOrganizationInvitationRequest.php")
delete("app/Rules/OrganizationName.php")
delete("app/Rules/UniqueOrganizationInvitation.php")
delete("app/Rules/ValidOrganizationInvitation.php")
delete("resources/js/pages/organizations/index.tsx")

for component in [
    "cancel-invitation-modal.tsx",
    "create-organization-modal.tsx",
    "delete-organization-modal.tsx",
    "invite-member-modal.tsx",
    "leave-organization-modal.tsx",
    "pending-invitations-modal.tsx",
    "remove-member-modal.tsx",
    "organization-invitation-alert.tsx",
    "delete-user.tsx",
]:
    delete(f"resources/js/components/{component}")

delete("app/Http/Requests/Settings/ProfileDeleteRequest.php")

write(
    "app/Enums/OrganizationPermission.php",
    r'''<?php

namespace App\Enums;

enum OrganizationPermission: string
{
    case UpdateOrganization = 'update-organization';
    case DeleteOrganization = 'delete-organization';
    case ManageBilling = 'manage-billing';
    case AddMember = 'add-member';
    case UpdateMember = 'update-member';
    case RemoveMember = 'remove-member';
    case CreateInvitation = 'create-invitation';
    case CancelInvitation = 'cancel-invitation';
}''',
)

write(
    "app/Enums/OrganizationRole.php",
    r'''<?php

namespace App\Enums;

enum OrganizationRole: string
{
    case Owner = 'owner';
    case Administrator = 'admin';
    case Member = 'member';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Owner',
            self::Administrator => 'Administrator',
            self::Member => 'Member',
        };
    }

    /** @return array<OrganizationPermission> */
    public function permissions(): array
    {
        return match ($this) {
            self::Owner => OrganizationPermission::cases(),
            self::Administrator => [
                OrganizationPermission::UpdateOrganization,
                OrganizationPermission::AddMember,
                OrganizationPermission::UpdateMember,
                OrganizationPermission::RemoveMember,
                OrganizationPermission::CreateInvitation,
                OrganizationPermission::CancelInvitation,
            ],
            self::Member => [],
        };
    }

    public function hasPermission(OrganizationPermission $permission): bool
    {
        return in_array($permission, $this->permissions(), true);
    }

    public function level(): int
    {
        return match ($this) {
            self::Owner => 3,
            self::Administrator => 2,
            self::Member => 1,
        };
    }

    public function isAtLeast(OrganizationRole $role): bool
    {
        return $this->level() >= $role->level();
    }

    /** @return array<int, array{value: string, label: string}> */
    public static function assignable(): array
    {
        return collect(self::cases())
            ->reject(fn (self $role) => $role === self::Owner)
            ->map(fn (self $role) => [
                'value' => $role->value,
                'label' => $role->label(),
            ])
            ->values()
            ->all();
    }
}''',
)

write(
    "app/Enums/OrganizationMembershipStatus.php",
    r'''<?php

namespace App\Enums;

enum OrganizationMembershipStatus: string
{
    case Invited = 'invited';
    case Active = 'active';
    case Removed = 'removed';
}''',
)

write(
    "app/Concerns/GeneratesUniqueOrganizationSlugs.php",
    r'''<?php

namespace App\Concerns;

use App\Models\Organization;
use Illuminate\Support\Str;

trait GeneratesUniqueOrganizationSlugs
{
    public static function generateUniqueOrganizationSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'organization';
        $slug = $base;
        $counter = 2;

        while (Organization::withTrashed()
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}''',
)

write(
    "app/Data/UserOrganization.php",
    r'''<?php

namespace App\Data;

readonly class UserOrganization
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
    "app/Data/OrganizationPermissions.php",
    r'''<?php

namespace App\Data;

readonly class OrganizationPermissions
{
    public function __construct(
        public bool $canUpdateOrganization,
        public bool $canDeleteOrganization,
        public bool $canManageBilling,
        public bool $canAddMember,
        public bool $canUpdateMember,
        public bool $canRemoveMember,
        public bool $canCreateInvitation,
        public bool $canCancelInvitation,
    ) {
        //
    }
}''',
)

write(
    "app/Models/OrganizationMembership.php",
    r'''<?php

namespace App\Models;

use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class OrganizationMembership extends Pivot
{
    protected $table = 'organization_memberships';

    public $incrementing = true;

    protected $fillable = [
        'organization_id',
        'user_id',
        'role',
        'status',
        'is_billable',
        'joined_at',
        'removed_at',
    ];

    /** @return BelongsTo<Organization, $this> */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', OrganizationMembershipStatus::Active->value);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'role' => OrganizationRole::class,
            'status' => OrganizationMembershipStatus::class,
            'is_billable' => 'boolean',
            'joined_at' => 'datetime',
            'removed_at' => 'datetime',
        ];
    }
}''',
)

write(
    "app/Models/Organization.php",
    r'''<?php

namespace App\Models;

use App\Concerns\GeneratesUniqueOrganizationSlugs;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use Database\Factories\OrganizationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'slug'])]
class Organization extends Model
{
    /** @use HasFactory<OrganizationFactory> */
    use GeneratesUniqueOrganizationSlugs, HasFactory, SoftDeletes;

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Organization $organization) {
            if (empty($organization->slug)) {
                $organization->slug = static::generateUniqueOrganizationSlug($organization->name);
            }
        });

        static::updating(function (Organization $organization) {
            if ($organization->isDirty('name')) {
                $organization->slug = static::generateUniqueOrganizationSlug(
                    $organization->name,
                    $organization->id,
                );
            }
        });
    }

    /** @return HasMany<OrganizationMembership, $this> */
    public function memberships(): HasMany
    {
        return $this->hasMany(OrganizationMembership::class);
    }

    /** @return BelongsToMany<User, $this, OrganizationMembership, 'pivot'> */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_memberships')
            ->using(OrganizationMembership::class)
            ->withPivot(['role', 'status', 'is_billable', 'joined_at', 'removed_at'])
            ->withTimestamps()
            ->wherePivot('status', OrganizationMembershipStatus::Active->value);
    }

    /** @return HasMany<OrganizationInvitation, $this> */
    public function invitations(): HasMany
    {
        return $this->hasMany(OrganizationInvitation::class);
    }

    public function owner(): ?User
    {
        return $this->members()
            ->wherePivot('role', OrganizationRole::Owner->value)
            ->first();
    }

    public function isOwnedBy(User $user): bool
    {
        return $this->owner()?->is($user) ?? false;
    }

    public function billableSeatCount(): int
    {
        return $this->memberships()
            ->active()
            ->where('is_billable', true)
            ->count();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}''',
)

write(
    "app/Models/OrganizationInvitation.php",
    r'''<?php

namespace App\Models;

use App\Enums\OrganizationRole;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable(['organization_id', 'email', 'role', 'invited_by', 'expires_at', 'accepted_at'])]
class OrganizationInvitation extends Model
{
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (OrganizationInvitation $invitation) {
            if (empty($invitation->code)) {
                $invitation->code = Str::random(64);
            }
        });
    }

    /** @return BelongsTo<Organization, $this> */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /** @return BelongsTo<User, $this> */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function isAccepted(): bool
    {
        return $this->accepted_at !== null;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isPending(): bool
    {
        return ! $this->isAccepted() && ! $this->isExpired();
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'role' => OrganizationRole::class,
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'code';
    }
}''',
)

write(
    "app/Concerns/HasOrganization.php",
    r'''<?php

namespace App\Concerns;

use App\Data\OrganizationPermissions;
use App\Data\UserOrganization;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationPermission;
use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

trait HasOrganization
{
    /** @return HasOne<OrganizationMembership, $this> */
    public function organizationMembership(): HasOne
    {
        return $this->hasOne(OrganizationMembership::class, 'user_id')
            ->where('status', OrganizationMembershipStatus::Active->value);
    }

    /** @return HasOneThrough<Organization, OrganizationMembership, $this> */
    public function organization(): HasOneThrough
    {
        return $this->hasOneThrough(
            Organization::class,
            OrganizationMembership::class,
            'user_id',
            'id',
            'id',
            'organization_id',
        )->where('organization_memberships.status', OrganizationMembershipStatus::Active->value);
    }

    public function belongsToOrganization(Organization $organization): bool
    {
        return $this->organization()->whereKey($organization->id)->exists();
    }

    public function organizationRole(): ?OrganizationRole
    {
        return $this->organizationMembership()->first()?->role;
    }

    public function hasOrganizationPermission(OrganizationPermission $permission): bool
    {
        return $this->organizationRole()?->hasPermission($permission) ?? false;
    }

    public function toUserOrganization(): ?UserOrganization
    {
        $organization = $this->organization()->first();
        $role = $this->organizationRole();

        if (! $organization || ! $role) {
            return null;
        }

        return new UserOrganization(
            id: $organization->id,
            name: $organization->name,
            slug: $organization->slug,
            role: $role->value,
            roleLabel: $role->label(),
        );
    }

    public function toOrganizationPermissions(): OrganizationPermissions
    {
        $role = $this->organizationRole();

        return new OrganizationPermissions(
            canUpdateOrganization: $role?->hasPermission(OrganizationPermission::UpdateOrganization) ?? false,
            canDeleteOrganization: $role?->hasPermission(OrganizationPermission::DeleteOrganization) ?? false,
            canManageBilling: $role?->hasPermission(OrganizationPermission::ManageBilling) ?? false,
            canAddMember: $role?->hasPermission(OrganizationPermission::AddMember) ?? false,
            canUpdateMember: $role?->hasPermission(OrganizationPermission::UpdateMember) ?? false,
            canRemoveMember: $role?->hasPermission(OrganizationPermission::RemoveMember) ?? false,
            canCreateInvitation: $role?->hasPermission(OrganizationPermission::CreateInvitation) ?? false,
            canCancelInvitation: $role?->hasPermission(OrganizationPermission::CancelInvitation) ?? false,
        );
    }
}''',
)

write(
    "app/Models/User.php",
    r'''<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Concerns\HasOrganization;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasOrganization, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
}''',
)

write(
    "app/Actions/Organizations/CreateOrganization.php",
    r'''<?php

namespace App\Actions\Organizations;

use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateOrganization
{
    public function handle(User $user, string $name): Organization
    {
        return DB::transaction(function () use ($user, $name) {
            if (OrganizationMembership::where('user_id', $user->id)->exists()) {
                throw ValidationException::withMessages([
                    'organization' => __('This account already belongs to an organization.'),
                ]);
            }

            $organization = Organization::create(['name' => $name]);

            $organization->memberships()->create([
                'user_id' => $user->id,
                'role' => OrganizationRole::Owner,
                'status' => OrganizationMembershipStatus::Active,
                'is_billable' => true,
                'joined_at' => now(),
            ]);

            return $organization;
        });
    }
}''',
)

write(
    "app/Actions/Fortify/CreateNewUser.php",
    r'''<?php

namespace App\Actions\Fortify;

use App\Actions\Organizations\CreateOrganization;
use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\OrganizationMembershipStatus;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(private CreateOrganization $createOrganization)
    {
        //
    }

    /** @param array<string, string> $input */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
            'invitation' => ['nullable', 'string', 'size:64'],
        ])->validate();

        return DB::transaction(function () use ($input) {
            $invitation = $this->pendingInvitation($input);

            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            if ($invitation) {
                OrganizationMembership::create([
                    'organization_id' => $invitation->organization_id,
                    'user_id' => $user->id,
                    'role' => $invitation->role,
                    'status' => OrganizationMembershipStatus::Active,
                    'is_billable' => true,
                    'joined_at' => now(),
                ]);

                $invitation->update(['accepted_at' => now()]);
            } else {
                $this->createOrganization->handle($user, $user->name.' Company');
            }

            return $user;
        });
    }

    /** @param array<string, string> $input */
    private function pendingInvitation(array $input): ?OrganizationInvitation
    {
        $code = $input['invitation'] ?? null;

        if (! is_string($code) || $code === '') {
            return null;
        }

        $invitation = OrganizationInvitation::query()
            ->where('code', $code)
            ->whereNull('accepted_at')
            ->where(fn ($query) => $query
                ->whereNull('expires_at')
                ->orWhere('expires_at', '>=', now()))
            ->lockForUpdate()
            ->first();

        if (! $invitation || strcasecmp($invitation->email, $input['email']) !== 0) {
            throw ValidationException::withMessages([
                'email' => __('This invitation is invalid, expired, or belongs to another email address.'),
            ]);
        }

        return $invitation;
    }
}''',
)

write(
    "app/Http/Middleware/EnsureOrganizationMembership.php",
    r'''<?php

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
}''',
)

write(
    "app/Http/Requests/Organizations/SaveOrganizationRequest.php",
    r'''<?php

namespace App\Http\Requests\Organizations;

use Illuminate\Foundation\Http\FormRequest;

class SaveOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
        ];
    }
}''',
)

write(
    "app/Http/Requests/Organizations/CreateOrganizationInvitationRequest.php",
    r'''<?php

namespace App\Http\Requests\Organizations;

use App\Enums\OrganizationRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateOrganizationInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'role' => [
                'required',
                Rule::enum(OrganizationRole::class)->only([
                    OrganizationRole::Administrator,
                    OrganizationRole::Member,
                ]),
            ],
        ];
    }
}''',
)

write(
    "app/Http/Requests/Organizations/UpdateOrganizationMemberRequest.php",
    r'''<?php

namespace App\Http\Requests\Organizations;

use App\Enums\OrganizationRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrganizationMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'role' => [
                'required',
                Rule::enum(OrganizationRole::class)->only([
                    OrganizationRole::Administrator,
                    OrganizationRole::Member,
                ]),
            ],
        ];
    }
}''',
)

write(
    "app/Policies/OrganizationPolicy.php",
    r'''<?php

namespace App\Policies;

use App\Enums\OrganizationPermission;
use App\Models\Organization;
use App\Models\User;

class OrganizationPolicy
{
    public function view(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization);
    }

    public function update(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization)
            && $user->hasOrganizationPermission(OrganizationPermission::UpdateOrganization);
    }

    public function delete(User $user, Organization $organization): bool
    {
        return $organization->isOwnedBy($user)
            && $user->hasOrganizationPermission(OrganizationPermission::DeleteOrganization);
    }

    public function manageBilling(User $user, Organization $organization): bool
    {
        return $organization->isOwnedBy($user)
            && $user->hasOrganizationPermission(OrganizationPermission::ManageBilling);
    }

    public function addMember(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization)
            && $user->hasOrganizationPermission(OrganizationPermission::AddMember);
    }

    public function updateMember(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization)
            && $user->hasOrganizationPermission(OrganizationPermission::UpdateMember);
    }

    public function removeMember(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization)
            && $user->hasOrganizationPermission(OrganizationPermission::RemoveMember);
    }

    public function inviteMember(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization)
            && $user->hasOrganizationPermission(OrganizationPermission::CreateInvitation);
    }

    public function cancelInvitation(User $user, Organization $organization): bool
    {
        return $user->belongsToOrganization($organization)
            && $user->hasOrganizationPermission(OrganizationPermission::CancelInvitation);
    }
}''',
)

write(
    "app/Http/Controllers/Organizations/OrganizationController.php",
    r'''<?php

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
}''',
)

write(
    "app/Http/Controllers/Organizations/OrganizationMemberController.php",
    r'''<?php

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
}''',
)

write(
    "app/Http/Controllers/Organizations/OrganizationInvitationController.php",
    r'''<?php

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
}''',
)

write(
    "app/Notifications/Organizations/OrganizationInvitationNotification.php",
    r'''<?php

namespace App\Notifications\Organizations;

use App\Models\OrganizationInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrganizationInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public OrganizationInvitation $invitation)
    {
        //
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(__("You've been invited to join :organization", [
                'organization' => $this->invitation->organization->name,
            ]))
            ->line(__(':inviter invited you to join :organization on SideWire.', [
                'inviter' => $this->invitation->inviter->name,
                'organization' => $this->invitation->organization->name,
            ]))
            ->action(
                __('Create your SideWire account'),
                route('register', ['invitation' => $this->invitation->code]),
            );
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'invitation_id' => $this->invitation->id,
            'organization_id' => $this->invitation->organization_id,
            'organization_name' => $this->invitation->organization->name,
            'role' => $this->invitation->role->value,
        ];
    }
}''',
)

write(
    "app/Http/Controllers/DashboardController.php",
    r'''<?php

namespace App\Http\Controllers;

use App\Models\OrganizationInvitation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $pendingInvitations = collect();

        if (! $request->user()->organizationMembership()->exists()) {
            $email = strtolower($request->user()->email);

            $pendingInvitations = OrganizationInvitation::query()
                ->with(['inviter', 'organization'])
                ->whereRaw('LOWER(email) = ?', [$email])
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

        return Inertia::render('dashboard', [
            'pendingInvitations' => $pendingInvitations,
        ]);
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
            'organization' => fn () => $user?->toUserOrganization(),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state')
                || $request->cookie('sidebar_state') === 'true',
        ];
    }
}''',
)

write(
    "app/Http/Controllers/Settings/ProfileController.php",
    r'''<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
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
}''',
)

write(
    "routes/settings.php",
    r'''<?php

use App\Http\Controllers\Organizations\OrganizationController;
use App\Http\Controllers\Organizations\OrganizationInvitationController;
use App\Http\Controllers\Organizations\OrganizationMemberController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Middleware\EnsureOrganizationMembership;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    Route::middleware(EnsureOrganizationMembership::class)->group(function () {
        Route::get('settings/organization', [OrganizationController::class, 'edit'])
            ->name('organization.edit');
        Route::patch('settings/organization', [OrganizationController::class, 'update'])
            ->name('organization.update');

        Route::patch('settings/organization/members/{user}', [OrganizationMemberController::class, 'update'])
            ->name('organization.members.update');
        Route::delete('settings/organization/members/{user}', [OrganizationMemberController::class, 'destroy'])
            ->name('organization.members.destroy');

        Route::post('settings/organization/invitations', [OrganizationInvitationController::class, 'store'])
            ->name('organization.invitations.store');
        Route::delete('settings/organization/invitations/{invitation}', [OrganizationInvitationController::class, 'destroy'])
            ->name('organization.invitations.destroy');
    });
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');''',
)

write(
    "routes/web.php",
    r'''<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Organizations\OrganizationInvitationController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [OrganizationInvitationController::class, 'accept'])
        ->name('invitations.accept');
    Route::delete('invitations/{invitation}', [OrganizationInvitationController::class, 'decline'])
        ->name('invitations.decline');
});

require __DIR__.'/settings.php';''',
)

write(
    "bootstrap/app.php",
    r'''<?php

use App\Http\Middleware\EnsureOrganizationMembership;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'organization.member' => EnsureOrganizationMembership::class,
        ]);

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();''',
)

write(
    "database/factories/OrganizationFactory.php",
    r'''<?php

namespace Database\Factories;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Organization> */
class OrganizationFactory extends Factory
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
}''',
)

delete("database/factories/OrganizationInvitationFactory.php")

write(
    "database/factories/UserFactory.php",
    r'''<?php

namespace Database\Factories;

use App\Actions\Organizations\CreateOrganization;
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
            app(CreateOrganization::class)->handle($user, $user->name.' Company');
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
    "database/migrations/2026_01_27_000001_create_organizations_table.php",
    r'''<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 160)->unique();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('organization_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 32);
            $table->string('status', 32)->default('active');
            $table->boolean('is_billable')->default(true);
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('removed_at')->nullable();
            $table->timestamps();

            $table->unique('user_id');
            $table->unique(['organization_id', 'user_id']);
            $table->index(['organization_id', 'status']);
        });

        Schema::create('organization_invitations', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('email');
            $table->string('role', 32);
            $table->foreignId('invited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_invitations');
        Schema::dropIfExists('organization_memberships');
        Schema::dropIfExists('organizations');
    }
};''',
)

# Remove the old generic-renamed migration if its filename did not exactly match.
for migration in (ROOT / "database/migrations").glob("*create_organizations_table.php"):
    if migration.name != "2026_01_27_000001_create_organizations_table.php":
        migration.unlink()

write(
    "database/seeders/DatabaseSeeder.php",
    r'''<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Production-safe by default. Create local users explicitly when needed.
    }
}''',
)

# Update Fortify's auth-page invitation context after the generic rename.
fortify = ROOT / "app/Providers/FortifyServiceProvider.php"
content = fortify.read_text(encoding="utf-8")
content = content.replace("private function organizationInvitation", "private function organizationInvitation")
content = content.replace("organizationInvitation' => $this->organizationInvitation", "organizationInvitation' => $this->organizationInvitation")
fortify.write_text(content, encoding="utf-8")

write(
    "resources/js/types/organizations.ts",
    r'''export type OrganizationRole = 'owner' | 'admin' | 'member';

export type Organization = {
    id: number;
    name: string;
    slug: string;
    role?: OrganizationRole;
    roleLabel?: string;
};

export type OrganizationMember = {
    id: number;
    name: string;
    email: string;
    role: OrganizationRole;
    roleLabel: string;
};

export type OrganizationInvitation = {
    code: string;
    email: string;
    role: OrganizationRole;
    roleLabel: string;
    createdAt: string;
};

export type OrganizationInvitationContext = {
    code: string;
    organizationName: string;
};

export type DashboardInvitation = {
    code: string;
    inviterName: string;
    organizationName: string;
};

export type OrganizationPermissions = {
    canUpdateOrganization: boolean;
    canDeleteOrganization: boolean;
    canManageBilling: boolean;
    canAddMember: boolean;
    canUpdateMember: boolean;
    canRemoveMember: boolean;
    canCreateInvitation: boolean;
    canCancelInvitation: boolean;
};

export type RoleOption = {
    value: Exclude<OrganizationRole, 'owner'>;
    label: string;
};''',
)

write(
    "resources/js/types/global.d.ts",
    r'''import type { Auth } from '@/types/auth';
import type { Organization } from '@/types/organizations';

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
            organization: Organization | null;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}''',
)

# Ensure the central type barrel exports the renamed file.
types_index = ROOT / "resources/js/types/index.ts"
if types_index.exists():
    content = types_index.read_text(encoding="utf-8")
    content = content.replace("./organizations", "./organizations")
    if "./organizations" not in content:
        content = content.rstrip() + "\nexport * from './organizations';\n"
    types_index.write_text(content, encoding="utf-8")

write(
    "resources/js/components/organization-invitation-alert.tsx",
    r'''import type { OrganizationInvitationContext } from '@/types';

type Props = {
    invitation: OrganizationInvitationContext;
    action: 'Log in' | 'Register';
};

export default function OrganizationInvitationAlert({ invitation, action }: Props) {
    return (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="font-medium">Invitation to {invitation.organizationName}</p>
            <p className="mt-1 text-muted-foreground">
                {action} with the invited email address to join this SideWire organization.
            </p>
        </div>
    );
}''',
)

# Auth pages were mechanically renamed. Normalize the component import and add
# the invitation code to registration so an invited user joins instead of
# silently receiving a second organization.
for auth_page in [ROOT / "resources/js/pages/auth/login.tsx", ROOT / "resources/js/pages/auth/register.tsx"]:
    content = auth_page.read_text(encoding="utf-8")
    content = content.replace(
        "@/components/organization-invitation-alert",
        "@/components/organization-invitation-alert",
    )
    auth_page.write_text(content, encoding="utf-8")

register = ROOT / "resources/js/pages/auth/register.tsx"
content = register.read_text(encoding="utf-8")
needle = "{organizationInvitation && (\n                            <OrganizationInvitationAlert"
if needle not in content:
    raise RuntimeError("Renamed registration invitation block was not found.")
content = content.replace(
    needle,
    "{organizationInvitation && (\n                            <>\n                                <input type=\"hidden\" name=\"invitation\" value={organizationInvitation.code} />\n                                <OrganizationInvitationAlert",
)
content = content.replace(
    "                                action=\"Register\"\n                            />\n                        )}",
    "                                    action=\"Register\"\n                                />\n                            </>\n                        )}",
)
content = content.replace("data-test=\"organization-invitation-login-link\"", "data-test=\"organization-invitation-login-link\"")
register.write_text(content, encoding="utf-8")

write(
    "resources/js/components/user-info.tsx",
    r'''import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { Organization, User } from '@/types';

export function UserInfo({
    user,
    organization,
    showEmail = false,
}: {
    user: User;
    organization?: Organization | null;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                    {showEmail ? user.email : organization?.name ?? user.email}
                </span>
            </div>
        </>
    );
}''',
)

write(
    "resources/js/components/nav-user.tsx",
    r'''import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';
import { UserMenuContent } from '@/components/user-menu-content';
import { UserInfo } from '@/components/user-info';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';

export function NavUser() {
    const { isMobile } = useSidebar();
    const { auth, organization } = usePage().props;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            data-test="sidebar-menu-button"
                        >
                            <UserInfo user={auth.user} organization={organization} />
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}''',
)

write(
    "resources/js/layouts/settings/layout.tsx",
    r'''import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    { title: 'Profile', href: edit(), icon: null },
    { title: 'Security', href: editSecurity(), icon: null },
    { title: 'Organization', href: '/settings/organization', icon: null },
    { title: 'Appearance', href: editAppearance(), icon: null },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="px-4 py-6">
            <Heading
                title="Settings"
                description="Manage your profile, organization, and account settings"
            />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1" aria-label="Settings">
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': isCurrentOrParentUrl(item.href),
                                })}
                            >
                                <Link href={item.href}>{item.title}</Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}''',
)

write(
    "resources/js/pages/organizations/edit.tsx",
    r'''import { Form, Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
    Organization,
    OrganizationInvitation,
    OrganizationMember,
    OrganizationPermissions,
    RoleOption,
} from '@/types';

type Props = {
    organization: Organization;
    members: OrganizationMember[];
    invitations: OrganizationInvitation[];
    permissions: OrganizationPermissions;
    availableRoles: RoleOption[];
};

export default function OrganizationSettings({
    organization,
    members,
    invitations,
    permissions,
    availableRoles,
}: Props) {
    return (
        <>
            <Head title="Organization settings" />
            <h1 className="sr-only">Organization settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Organization"
                    description="Your company account, membership boundary, and billing owner"
                />

                <Form
                    action="/settings/organization"
                    method="patch"
                    options={{ preserveScroll: true }}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="organization-name">Organization name</Label>
                                <Input
                                    id="organization-name"
                                    name="name"
                                    defaultValue={organization.name}
                                    disabled={!permissions.canUpdateOrganization}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            {permissions.canUpdateOrganization && (
                                <Button disabled={processing}>Save organization</Button>
                            )}
                        </>
                    )}
                </Form>
            </div>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Members"
                    description="Each active organization member consumes one billable seat"
                />

                <div className="divide-y rounded-lg border">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-4">
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{member.name}</p>
                                <p className="truncate text-sm text-muted-foreground">
                                    {member.email} · {member.roleLabel}
                                </p>
                            </div>

                            {member.role !== 'owner' && permissions.canUpdateMember && (
                                <Form
                                    action={`/settings/organization/members/${member.id}`}
                                    method="patch"
                                    options={{ preserveScroll: true }}
                                    className="flex items-center gap-2"
                                >
                                    {({ processing }) => (
                                        <>
                                            <select
                                                name="role"
                                                defaultValue={member.role}
                                                className="h-9 rounded-md border bg-background px-3 text-sm"
                                            >
                                                {availableRoles.map((role) => (
                                                    <option key={role.value} value={role.value}>
                                                        {role.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <Button size="sm" variant="outline" disabled={processing}>
                                                Update
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            )}

                            {member.role !== 'owner' && permissions.canRemoveMember && (
                                <Form
                                    action={`/settings/organization/members/${member.id}`}
                                    method="delete"
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <Button size="sm" variant="destructive" disabled={processing}>
                                            Remove
                                        </Button>
                                    )}
                                </Form>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {permissions.canCreateInvitation && (
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Invite a member"
                        description="Pending invitations are not billed until the person joins"
                    />

                    <Form
                        action="/settings/organization/invitations"
                        method="post"
                        options={{ preserveScroll: true }}
                        resetOnSuccess
                        className="grid gap-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="invite-email">Email address</Label>
                                    <Input
                                        id="invite-email"
                                        name="email"
                                        type="email"
                                        placeholder="teammate@example.com"
                                        required
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="invite-role">Organization role</Label>
                                    <select
                                        id="invite-role"
                                        name="role"
                                        defaultValue="member"
                                        className="h-10 rounded-md border bg-background px-3 text-sm"
                                    >
                                        {availableRoles.map((role) => (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.role} />
                                </div>
                                <Button disabled={processing}>Send invitation</Button>
                            </>
                        )}
                    </Form>
                </div>
            )}

            {invitations.length > 0 && (
                <div className="space-y-4">
                    <Heading
                        variant="small"
                        title="Pending invitations"
                        description="These invitations do not count as seats yet"
                    />
                    <div className="divide-y rounded-lg border">
                        {invitations.map((invitation) => (
                            <div key={invitation.code} className="flex items-center gap-3 p-4">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{invitation.email}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {invitation.roleLabel}
                                    </p>
                                </div>
                                {permissions.canCancelInvitation && (
                                    <Form
                                        action={`/settings/organization/invitations/${invitation.code}`}
                                        method="delete"
                                        options={{ preserveScroll: true }}
                                    >
                                        {({ processing }) => (
                                            <Button size="sm" variant="outline" disabled={processing}>
                                                Cancel
                                            </Button>
                                        )}
                                    </Form>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

OrganizationSettings.layout = {
    breadcrumbs: [
        { title: 'Organization settings', href: '/settings/organization' },
    ],
};''',
)

write(
    "resources/js/pages/dashboard.tsx",
    r'''import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { DashboardInvitation } from '@/types';

export default function Dashboard({
    pendingInvitations = [],
}: {
    pendingInvitations?: DashboardInvitation[];
}) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-semibold">SideWire</h1>
                    <p className="mt-1 text-muted-foreground">
                        The Laravel and organization foundation is ready for the page-aware collaboration workflow.
                    </p>
                </div>

                {pendingInvitations.map((invitation) => (
                    <div key={invitation.code} className="rounded-xl border p-4">
                        <p className="font-medium">
                            {invitation.inviterName} invited you to {invitation.organizationName}
                        </p>
                        <div className="mt-4 flex gap-2">
                            <Form action={`/invitations/${invitation.code}/accept`} method="post">
                                {({ processing }) => (
                                    <Button disabled={processing}>Accept</Button>
                                )}
                            </Form>
                            <Form action={`/invitations/${invitation.code}`} method="delete">
                                {({ processing }) => (
                                    <Button variant="outline" disabled={processing}>Decline</Button>
                                )}
                            </Form>
                        </div>
                    </div>
                ))}

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="aspect-video rounded-xl border bg-muted/30" />
                    <div className="aspect-video rounded-xl border bg-muted/30" />
                    <div className="aspect-video rounded-xl border bg-muted/30" />
                </div>
                <div className="min-h-[60vh] flex-1 rounded-xl border bg-muted/20" />
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }],
};''',
)

# Remove the intentionally unapproved account-deletion UI from profile settings.
profile = ROOT / "resources/js/pages/settings/profile.tsx"
content = profile.read_text(encoding="utf-8")
content = content.replace("import DeleteUser from '@/components/delete-user';\n", "")
content = content.replace("\n            <DeleteUser />", "")
profile.write_text(content, encoding="utf-8")

# App layout recognizes the renamed organization settings page.
app = ROOT / "resources/js/app.tsx"
content = app.read_text(encoding="utf-8")
content = content.replace("case name.startsWith('organizations/'):", "case name.startsWith('organizations/'):")
content = content.replace("const appName = import.meta.env.VITE_APP_NAME || 'Laravel';", "const appName = import.meta.env.VITE_APP_NAME || 'SideWire';")
app.write_text(content, encoding="utf-8")

# Normalize auth-page imports/types after mechanical rename.
for path in [ROOT / "resources/js/pages/auth/login.tsx", ROOT / "resources/js/pages/auth/register.tsx"]:
    content = path.read_text(encoding="utf-8")
    content = content.replace("OrganizationInvitationAlert", "OrganizationInvitationAlert")
    content = content.replace("OrganizationInvitationContext", "OrganizationInvitationContext")
    path.write_text(content, encoding="utf-8")

# Authentication tests keep the official starter coverage but use the singular
# organization model and normal dashboard URL.
write(
    "tests/Feature/Auth/AuthenticationTest.php",
    r'''<?php

namespace Tests\Feature\Auth;

use App\Enums\OrganizationRole;
use App\Models\OrganizationInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Fortify\Features;
use Laravel\Passkeys\Contracts\PasskeyLoginResponse;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $this->get(route('login'))->assertOk();
    }

    public function test_login_screen_includes_organization_invitation_context(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();

        $invitation = OrganizationInvitation::create([
            'organization_id' => $organization->id,
            'email' => 'invited@example.com',
            'role' => OrganizationRole::Member,
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(3),
        ]);

        $this->get(route('login', ['invitation' => $invitation->code]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/login')
                ->where('organizationInvitation.code', $invitation->code)
                ->where('organizationInvitation.organizationName', $organization->name));
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard'));
    }

    public function test_passkey_login_response_redirects_to_the_dashboard(): void
    {
        $user = User::factory()->create();
        $request = Request::create(route('login', absolute: false), 'GET', server: [
            'HTTP_ACCEPT' => 'application/json',
        ]);
        $request->setLaravelSession($this->app['session.store']);
        $request->setUserResolver(fn () => $user);

        $jsonResponse = app(PasskeyLoginResponse::class)->toResponse($request);

        $this->assertSame(route('dashboard'), $jsonResponse->getData()->redirect);
    }

    public function test_users_with_two_factor_enabled_are_redirected_to_two_factor_challenge(): void
    {
        if (! Features::canManageTwoFactorAuthentication()) {
            $this->markTestSkipped('Two-factor authentication is not enabled.');
        }

        Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true]);
        $user = User::factory()->withTwoFactor()->create();

        $this->post(route('login'), [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect(route('two-factor.login'));

        $this->assertGuest();
    }

    public function test_users_cannot_authenticate_with_an_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('logout'))
            ->assertRedirect(route('home'));

        $this->assertGuest();
    }

    public function test_users_are_rate_limited(): void
    {
        $user = User::factory()->create();
        RateLimiter::increment(md5('login'.implode('|', [$user->email, '127.0.0.1'])), amount: 5);

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertTooManyRequests();
    }
}''',
)

write(
    "tests/Feature/Auth/RegistrationTest.php",
    r'''<?php

namespace Tests\Feature\Auth;

use App\Enums\OrganizationRole;
use App\Models\OrganizationInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->get(route('register'))->assertOk();
    }

    public function test_registration_screen_includes_organization_invitation_context(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $invitation = OrganizationInvitation::create([
            'organization_id' => $organization->id,
            'email' => 'invited@example.com',
            'role' => OrganizationRole::Member,
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(3),
        ]);

        $this->get(route('register', ['invitation' => $invitation->code]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/register')
                ->where('organizationInvitation.code', $invitation->code)
                ->where('organizationInvitation.organizationName', $organization->name));
    }

    public function test_new_users_register_with_one_owned_organization(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard'));

        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertSame(OrganizationRole::Owner, $user->organizationRole());
        $this->assertNotNull($user->organization()->first());
    }

    public function test_invited_user_joins_the_inviting_organization_without_creating_another(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization()->firstOrFail();
        $invitation = OrganizationInvitation::create([
            'organization_id' => $organization->id,
            'email' => 'invited@example.com',
            'role' => OrganizationRole::Member,
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(3),
        ]);

        $this->post(route('register.store'), [
            'name' => 'Invited User',
            'email' => 'invited@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'invitation' => $invitation->code,
        ])->assertRedirect(route('dashboard'));

        $user = User::where('email', 'invited@example.com')->firstOrFail();
        $this->assertTrue($user->belongsToOrganization($organization));
        $this->assertSame(OrganizationRole::Member, $user->organizationRole());
        $this->assertDatabaseCount('organizations', 1);
        $this->assertNotNull($invitation->fresh()->accepted_at);
    }
}''',
)

write(
    "tests/Feature/Auth/EmailVerificationTest.php",
    r'''<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_verification_screen_can_be_rendered(): void
    {
        $user = User::factory()->unverified()->create();
        $this->actingAs($user)->get(route('verification.notice'))->assertOk();
    }

    public function test_email_can_be_verified(): void
    {
        $user = User::factory()->unverified()->create();
        Event::fake();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );

        $this->actingAs($user)->get($verificationUrl)
            ->assertRedirect('/dashboard?verified=1');

        Event::assertDispatched(Verified::class);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_is_not_verified_with_invalid_hash(): void
    {
        $user = User::factory()->unverified()->create();
        Event::fake();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1('wrong-email')],
        );

        $this->actingAs($user)->get($verificationUrl);

        Event::assertNotDispatched(Verified::class);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_verified_user_is_redirected_to_dashboard_from_verification_prompt(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->get(route('verification.notice'))
            ->assertRedirect('/dashboard');
    }
}''',
)

write(
    "tests/Feature/DashboardTest.php",
    r'''<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_authenticated_verified_members_can_view_the_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('dashboard'))->assertOk();
    }
}''',
)

write(
    "tests/Feature/Organizations/OrganizationFoundationTest.php",
    r'''<?php

namespace Tests\Feature\Organizations;

use App\Actions\Organizations\CreateOrganization;
use App\Enums\OrganizationMembershipStatus;
use App\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class OrganizationFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_has_one_owned_organization_without_selector_state(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization()->firstOrFail();

        $this->assertSame(OrganizationRole::Owner, $user->organizationRole());
        $this->assertTrue($organization->isOwnedBy($user));
        $this->assertSame(1, $organization->billableSeatCount());
        $this->assertNotContains('current_'.'organization_id', Schema::getColumnListing('users'));
    }

    public function test_the_database_prevents_a_second_organization_membership(): void
    {
        $user = User::factory()->create();
        $other = Organization::factory()->create();

        $this->expectException(QueryException::class);

        OrganizationMembership::create([
            'organization_id' => $other->id,
            'user_id' => $user->id,
            'role' => OrganizationRole::Member,
            'status' => OrganizationMembershipStatus::Active,
            'is_billable' => true,
            'joined_at' => now(),
        ]);
    }

    public function test_the_create_action_rejects_a_second_organization(): void
    {
        $user = User::factory()->create();

        $this->expectException(\Illuminate\Validation\ValidationException::class);

        app(CreateOrganization::class)->handle($user, 'Another Organization');
    }

    public function test_organization_settings_are_not_public(): void
    {
        $this->get(route('organization.edit'))->assertRedirect(route('login'));
    }
}''',
)

write(
    "tests/Feature/Settings/ProfileUpdateTest.php",
    r'''<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->get(route('profile.edit'))->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('profile.edit'));

        $user->refresh();
        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }
}''',
)

# Remove mechanically renamed obsolete tenant tests and retain only the explicit
# organization foundation tests above.
organizations_tests = ROOT / "tests/Feature/Organizations"
for path in organizations_tests.glob("*.php"):
    if path.name != "OrganizationFoundationTest.php":
        path.unlink()

# Verify the old tenant identity did not survive the rename and that no new
# organization switching concept was introduced.
assert_absent([
    "App\\Models\\Team",
    "TeamRole",
    "TeamPermission",
    "team_members",
    "team_invitations",
    "current_organization",
    "currentOrganization",
    "switchOrganization",
    "personalOrganization",
    "is_personal",
])

for required in [
    "app/Models/Organization.php",
    "app/Models/OrganizationMembership.php",
    "app/Http/Middleware/EnsureOrganizationMembership.php",
    "resources/js/pages/organizations/edit.tsx",
    "database/migrations/2026_01_27_000001_create_organizations_table.php",
]:
    if not (ROOT / required).exists():
        raise RuntimeError(f"Required organization foundation file missing: {required}")

if (ROOT / "app/Models/Team.php").exists():
    raise RuntimeError("The old tenant Team model survived the Organization rename.")

print("Renamed the stripped tenant to Organization without adding switch state.")
