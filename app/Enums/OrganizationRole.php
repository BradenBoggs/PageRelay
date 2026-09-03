<?php

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
}
