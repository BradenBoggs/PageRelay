<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('page_contexts', function (Blueprint $table): void {
            $table->json('url_match')->nullable();
            $table->index(['organization_id', 'workspace_id', 'source_host'], 'page_context_match_lookup');
        });
        Schema::table('messages', function (Blueprint $table): void {
            $table->text('source_url')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('messages', fn (Blueprint $table) => $table->dropColumn('source_url'));
        Schema::table('page_contexts', function (Blueprint $table): void {
            $table->dropIndex('page_context_match_lookup');
            $table->dropColumn('url_match');
        });
    }
};
