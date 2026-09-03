<?php

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
}
