<?php

namespace App\Filament\Resources\FailedJobs\Tables;

use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class FailedJobsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('job_name')
                    ->label('Job')
                    ->wrap(),
                TextColumn::make('connection')
                    ->badge()
                    ->searchable(),
                TextColumn::make('queue')
                    ->badge()
                    ->searchable(),
                TextColumn::make('failed_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('uuid')
                    ->searchable()
                    ->copyable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('failed_at', 'desc');
    }
}
