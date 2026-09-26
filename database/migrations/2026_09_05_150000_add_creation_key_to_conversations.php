<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table): void {
            $table->uuid('creation_key')->nullable()->after('created_by');
            $table->unique(
                ['organization_id', 'created_by', 'creation_key'],
                'conversations_creation_idempotency_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table): void {
            $table->dropUnique('conversations_creation_idempotency_unique');
            $table->dropColumn('creation_key');
        });
    }
};
