<?php

namespace App\Filament\Resources\FailedJobs;

use App\Filament\Resources\FailedJobs\Pages\ListFailedJobs;
use App\Filament\Resources\FailedJobs\Tables\FailedJobsTable;
use App\Filament\Resources\ReadOnlyResource;
use App\Models\FailedJob;
use BackedEnum;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class FailedJobResource extends ReadOnlyResource
{
    protected static ?string $model = FailedJob::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedExclamationTriangle;

    protected static ?string $recordTitleAttribute = 'uuid';

    public static function table(Table $table): Table
    {
        return FailedJobsTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListFailedJobs::route('/'),
        ];
    }
}
