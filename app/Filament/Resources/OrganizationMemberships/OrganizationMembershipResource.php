<?php

namespace App\Filament\Resources\OrganizationMemberships;

use App\Filament\Resources\OrganizationMemberships\Pages\ListOrganizationMemberships;
use App\Filament\Resources\OrganizationMemberships\Pages\ViewOrganizationMembership;
use App\Filament\Resources\OrganizationMemberships\Schemas\OrganizationMembershipInfolist;
use App\Filament\Resources\OrganizationMemberships\Tables\OrganizationMembershipsTable;
use App\Filament\Resources\ReadOnlyResource;
use App\Models\OrganizationMembership;
use BackedEnum;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class OrganizationMembershipResource extends ReadOnlyResource
{
    protected static ?string $model = OrganizationMembership::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    public static function infolist(Schema $schema): Schema
    {
        return OrganizationMembershipInfolist::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return OrganizationMembershipsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListOrganizationMemberships::route('/'),
            'view' => ViewOrganizationMembership::route('/{record}'),
        ];
    }
}
