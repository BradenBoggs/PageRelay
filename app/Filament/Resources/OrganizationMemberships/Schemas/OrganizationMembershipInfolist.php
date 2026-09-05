<?php

namespace App\Filament\Resources\OrganizationMemberships\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class OrganizationMembershipInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextEntry::make('organization.name')
                    ->label('Organization'),
                TextEntry::make('user.name')
                    ->label('User'),
                TextEntry::make('role')
                    ->badge(),
                TextEntry::make('status')
                    ->badge(),
                IconEntry::make('is_billable')
                    ->boolean(),
                TextEntry::make('joined_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('removed_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('created_at')
                    ->dateTime()
                    ->placeholder('-'),
                TextEntry::make('updated_at')
                    ->dateTime()
                    ->placeholder('-'),
            ]);
    }
}
