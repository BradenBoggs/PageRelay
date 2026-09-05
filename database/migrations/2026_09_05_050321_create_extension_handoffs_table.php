<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('extension_handoffs', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->char('secret_hash', 64);
            $table->string('code_challenge', 128);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('authorized_at')->nullable();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('extension_handoffs');
    }
};
