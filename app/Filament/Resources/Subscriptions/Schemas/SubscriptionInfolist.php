<?php

namespace App\Filament\Resources\Subscriptions\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;

class SubscriptionInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            TextEntry::make('owner.name')
                ->label('Organization'),
            TextEntry::make('type'),
            TextEntry::make('stripe_id')
                ->label('Stripe subscription'),
            TextEntry::make('stripe_status')
                ->label('Status')
                ->badge(),
            TextEntry::make('stripe_price')
                ->label('Stripe price')
                ->placeholder('-'),
            TextEntry::make('quantity')
                ->label('Seat quantity')
                ->numeric()
                ->placeholder('-'),
            TextEntry::make('trial_ends_at')
                ->dateTime()
                ->placeholder('-'),
            TextEntry::make('ends_at')
                ->dateTime()
                ->placeholder('-'),
            TextEntry::make('created_at')
                ->dateTime(),
            TextEntry::make('updated_at')
                ->dateTime(),
        ]);
    }
}
