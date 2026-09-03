<?php

namespace App\Enums;

enum OrganizationMembershipStatus: string
{
    case Invited = 'invited';
    case Active = 'active';
    case Removed = 'removed';
}
