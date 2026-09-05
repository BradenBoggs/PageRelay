<?php

namespace App\Filament\Resources\OrganizationMemberships\Pages;

use App\Filament\Resources\OrganizationMemberships\OrganizationMembershipResource;
use Filament\Resources\Pages\ListRecords;

class ListOrganizationMemberships extends ListRecords
{
    protected static string $resource = OrganizationMembershipResource::class;
}
