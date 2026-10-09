<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table): void {
            $table->string('direct_pair', 100)->nullable();
            $table->unique(['organization_id', 'direct_pair']);
        });
        Schema::create('conversation_participants', function (Blueprint $table): void {
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['conversation_id', 'user_id']);
        });
        Schema::table('messages', function (Blueprint $table): void {
            $table->foreignId('thread_root_id')->nullable()->constrained('messages')->restrictOnDelete();
            $table->string('request_fingerprint', 64)->nullable();
            $table->index(['conversation_id', 'thread_root_id', 'id']);
        });
        Schema::create('message_mentions', function (Blueprint $table): void {
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['message_id', 'user_id']);
        });
        Schema::create('message_notifications', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 20);
            $table->timestamp('read_at')->nullable();
            $table->uuid('desktop_claim')->nullable();
            $table->timestamp('claim_expires_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'message_id']);
            $table->index(['user_id', 'read_at', 'id']);
        });
        Schema::create('notification_preferences', function (Blueprint $table): void {
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('enabled_at')->nullable();
            $table->primary(['organization_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('message_notifications');
        Schema::dropIfExists('message_mentions');
        Schema::table('messages', function (Blueprint $table): void {
            $table->dropIndex(['conversation_id', 'thread_root_id', 'id']);
            $table->dropConstrainedForeignId('thread_root_id');
            $table->dropColumn('request_fingerprint');
        });
        Schema::dropIfExists('conversation_participants');
        Schema::table('conversations', function (Blueprint $table): void {
            $table->dropUnique(['organization_id', 'direct_pair']);
            $table->dropColumn('direct_pair');
        });
    }
};
