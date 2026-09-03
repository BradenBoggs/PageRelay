<?php

namespace App\Enums;

enum TeamRole: string
{
    case Manager = 'manager';
    case Member = 'member';

    public function label(): string
    {
        return match ($this) {
            self::Manager => 'Manager',
            self::Member => 'Member',
        };
    }
}
