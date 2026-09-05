<?php

namespace App\Policies;

use App\Enums\OrganizationRole;
use App\Models\PageContext;
use App\Models\User;

/** @see docs/features/page-conversations.md */
class PageContextPolicy
{
    public function view(User $user, PageContext $context): bool
    {
        return $user->organization()->whereKey($context->organization_id)->exists();
    }

    public function updateAssociation(User $user, PageContext $context): bool
    {
        return $this->view($user, $context)
            && ($user->organizationRole()?->isAtLeast(OrganizationRole::Administrator) ?? false);
    }
}
