<?php

namespace App\Filament\Resources\Subscriptions\Tables;

use Filament\Actions\ViewAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class SubscriptionsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('owner.name')
                    ->label('Organization')
                    ->searchable(),
                TextColumn::make('stripe_status')
                    ->label('Status')
                    ->badge()
                    ->searchable(),
                TextColumn::make('quantity')
                    ->label('Seats')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('stripe_id')
                    ->label('Stripe subscription')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('stripe_price')
                    ->label('Stripe price')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('trial_ends_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('ends_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->recordActions([
                ViewAction::make(),
            ]);
    }
}
