<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_reads', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('read_at');
            $table->unique(['message_id', 'user_id']);
        });

        // Preserve established main-chat positions and previously acknowledged replies.
        DB::table('message_reads')->insertUsing(['message_id', 'user_id', 'read_at'],
            DB::table('conversation_reads as reads')->join('messages', 'messages.conversation_id', '=', 'reads.conversation_id')
                ->whereColumn('messages.organization_id', 'reads.organization_id')
                ->whereColumn('messages.workspace_id', 'reads.workspace_id')
                ->whereNull('messages.thread_root_id')->whereColumn('messages.id', '<=', 'reads.last_read_message_id')
                ->select('messages.id', 'reads.user_id', 'reads.updated_at'));
        DB::table('message_reads')->insertUsing(['message_id', 'user_id', 'read_at'],
            DB::table('message_notifications as notices')->join('messages', 'messages.id', '=', 'notices.message_id')
                ->whereNotNull('messages.thread_root_id')->whereNotNull('notices.read_at')
                ->select('messages.id', 'notices.user_id', 'notices.read_at'));
    }

    public function down(): void
    {
        Schema::dropIfExists('message_reads');
    }
};
