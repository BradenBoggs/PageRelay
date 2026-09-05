<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table): void {
            $table->unique(['id', 'organization_id'], 'workspaces_id_organization_unique');
        });

        Schema::create('conversations', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('workspace_id');
            $table->string('type', 32);
            $table->string('title', 255);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('retired_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['id', 'organization_id', 'workspace_id'],
                'conversations_id_organization_workspace_unique',
            );
            $table->index(['organization_id', 'workspace_id', 'type']);
            $table->foreign(
                ['workspace_id', 'organization_id'],
                'conversations_workspace_organization_foreign',
            )->references(['id', 'organization_id'])->on('workspaces')->cascadeOnDelete();
        });

        Schema::create('page_contexts', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('workspace_id');
            $table->unsignedBigInteger('conversation_id')->nullable();
            $table->text('source_url');
            $table->text('normalized_url');
            $table->char('normalized_url_hash', 64);
            $table->unsignedSmallInteger('normalization_version');
            $table->string('source_host', 255);
            $table->string('title', 255);
            $table->text('favicon_url')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('association_version')->default(0);
            $table->string('association_reason', 32)->nullable();
            $table->timestamps();

            $table->unique(
                ['organization_id', 'workspace_id', 'normalization_version', 'normalized_url_hash'],
                'page_contexts_normalized_identity_unique',
            );
            $table->unique(
                ['id', 'organization_id', 'workspace_id'],
                'page_contexts_id_organization_workspace_unique',
            );
            $table->unique(['id', 'organization_id'], 'page_contexts_id_organization_unique');
            $table->index(['organization_id', 'workspace_id', 'conversation_id']);
            $table->index(['organization_id', 'source_host']);
            $table->foreign(
                ['workspace_id', 'organization_id'],
                'page_contexts_workspace_organization_foreign',
            )->references(['id', 'organization_id'])->on('workspaces')->cascadeOnDelete();
            $table->foreign(
                ['conversation_id', 'organization_id', 'workspace_id'],
                'page_contexts_conversation_scope_foreign',
            )->references(['id', 'organization_id', 'workspace_id'])->on('conversations')->restrictOnDelete();
        });

        Schema::create('messages', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('workspace_id');
            $table->unsignedBigInteger('conversation_id');
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->unsignedBigInteger('source_page_context_id')->nullable();
            $table->uuid('idempotency_key');
            $table->text('body');
            $table->timestamps();

            $table->unique(
                ['organization_id', 'author_id', 'idempotency_key'],
                'messages_author_idempotency_unique',
            );
            $table->index(['conversation_id', 'id']);
            $table->foreign(
                ['conversation_id', 'organization_id', 'workspace_id'],
                'messages_conversation_scope_foreign',
            )->references(['id', 'organization_id', 'workspace_id'])->on('conversations')->restrictOnDelete();
            $table->foreign(
                ['source_page_context_id', 'organization_id', 'workspace_id'],
                'messages_source_context_scope_foreign',
            )->references(['id', 'organization_id', 'workspace_id'])->on('page_contexts')->restrictOnDelete();
        });

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

        Schema::create('activity_log', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('log_name')->nullable();
            $table->text('description');
            $table->nullableMorphs('subject', 'subject');
            $table->nullableMorphs('causer', 'causer');
            $table->string('event')->nullable();
            $table->json('properties')->nullable();
            $table->uuid('batch_uuid')->nullable();
            $table->timestamps();

            $table->index('log_name');
            $table->index(['organization_id', 'created_at']);
        });
    }

    public function down(): void
    {
        foreach (['messages', 'page_contexts', 'conversations', 'activity_log'] as $table) {
            if (Schema::hasTable($table) && DB::table($table)->exists()) {
                throw new RuntimeException(
                    'Page-chat tables contain organization data; recover by rolling forward instead of dropping them.',
                );
            }
        }

        Schema::dropIfExists('activity_log');
        Schema::dropIfExists('page_context_resolution_keys');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('page_contexts');
        Schema::dropIfExists('conversations');

        Schema::table('workspaces', function (Blueprint $table): void {
            $table->dropUnique('workspaces_id_organization_unique');
        });
    }
};
