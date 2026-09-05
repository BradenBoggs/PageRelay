<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->unique(
                ['id', 'organization_id', 'workspace_id', 'conversation_id'],
                'messages_id_organization_workspace_conversation_unique',
            );
        });

        Schema::create('conversation_reads', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('workspace_id');
            $table->unsignedBigInteger('conversation_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('last_read_message_id');
            $table->timestamps();

            $table->unique(
                ['organization_id', 'user_id', 'conversation_id'],
                'conversation_reads_member_conversation_unique',
            );
            $table->index(['user_id', 'conversation_id', 'last_read_message_id']);
            $table->foreign(
                ['conversation_id', 'organization_id', 'workspace_id'],
                'conversation_reads_conversation_scope_foreign',
            )->references(['id', 'organization_id', 'workspace_id'])
                ->on('conversations')
                ->cascadeOnDelete();
            $table->foreign(
                ['last_read_message_id', 'organization_id', 'workspace_id', 'conversation_id'],
                'conversation_reads_message_scope_foreign',
            )->references(['id', 'organization_id', 'workspace_id', 'conversation_id'])
                ->on('messages')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('conversation_reads') && DB::table('conversation_reads')->exists()) {
            throw new RuntimeException(
                'Conversation read positions contain member data; recover by rolling forward instead of dropping them.',
            );
        }

        Schema::dropIfExists('conversation_reads');

        Schema::table('messages', function (Blueprint $table): void {
            $table->dropUnique('messages_id_organization_workspace_conversation_unique');
        });
    }
};
