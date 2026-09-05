<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('page_context_resolution_keys');
    }

    public function down(): void
    {
        Schema::create('page_context_resolution_keys', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('idempotency_key');
            $table->unsignedBigInteger('page_context_id');
            $table->timestamps();

            $table->unique(
                ['organization_id', 'user_id', 'idempotency_key'],
                'page_context_resolution_idempotency_unique',
            );
            $table->foreign(
                ['page_context_id', 'organization_id'],
                'page_context_resolution_context_organization_foreign',
            )->references(['id', 'organization_id'])->on('page_contexts')->cascadeOnDelete();
        });
    }
};
